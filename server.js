const http = require("http");
const https = require("https");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const PUBLIC_DIR = path.join(ROOT, "public");
const TRACKS_FILE = path.join(DATA_DIR, "tracks.json");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");
const DOWNLOADS_FILE = path.join(DATA_DIR, "downloads.json");
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const MAX_DOWNLOAD_REDIRECTS = 4;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(req, res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.end(JSON.stringify(data, null, 2));
}

function sendError(req, res, status, message, details) {
  sendJson(req, res, status, { error: message, details });
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tempFile = `${file}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tempFile, file);
}

async function readBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) {
      throw Object.assign(new Error("Request body is too large."), { statusCode: 413 });
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Body must be valid JSON."), { statusCode: 400 });
  }
}

function cleanText(value, maxLength = 120) {
  return String(value || "").trim().slice(0, maxLength);
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function findPublishedTrack(tracks, trackId) {
  return tracks.find((track) => track.id === trackId && track.status === "published");
}

function makeFileName(track) {
  return `${track.artist}-${track.title}.mp3`.replace(/[^\w.-]+/g, "-");
}

function filterTracks(tracks, params) {
  const q = cleanText(params.get("q"), 80).toLowerCase();
  const genre = cleanText(params.get("genre"), 40).toLowerCase();

  return tracks
    .filter((track) => track.status === "published")
    .filter((track) => !genre || genre === "all" || String(track.genre || "").toLowerCase() === genre)
    .filter((track) => {
      if (!q) return true;
      const haystack = [
        track.title,
        track.artist,
        track.genre,
        track.mood,
        track.license,
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
}

function searchYouTube(query) {
  return new Promise((resolve, reject) => {
    if (!YOUTUBE_API_KEY) {
      reject(Object.assign(new Error("Set YOUTUBE_API_KEY to enable YouTube discovery."), { statusCode: 503 }));
      return;
    }

    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: "10",
      key: YOUTUBE_API_KEY,
    });
    const requestUrl = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;

    const request = https.get(requestUrl, { headers: { Accept: "application/json" }, timeout: 8000 }, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (response.statusCode !== 200) {
            const message = parsed.error?.message || `YouTube API returned ${response.statusCode}`;
            reject(Object.assign(new Error(message), { statusCode: response.statusCode || 502 }));
            return;
          }

          resolve((parsed.items || []).map((item) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            genre: "YouTube",
            license: "Preview only",
            preview: "",
            canDownload: false,
            colorA: "#ef4444",
            colorB: "#b91c1c",
          })));
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on("timeout", () => {
      request.destroy(Object.assign(new Error("YouTube API request timed out."), { statusCode: 504 }));
    });
    request.on("error", reject);
  });
}

function streamRemoteFile(sourceUrl, res, fileName, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const remoteUrl = new URL(sourceUrl);
    const client = remoteUrl.protocol === "http:" ? http : https;
    const request = client.get(remoteUrl, { headers: { Accept: "audio/mpeg,*/*" }, timeout: 15000 }, (response) => {
      const location = response.headers.location;
      const isRedirect = response.statusCode >= 300 && response.statusCode < 400 && location;

      if (isRedirect) {
        response.resume();
        if (redirectCount >= MAX_DOWNLOAD_REDIRECTS) {
          reject(Object.assign(new Error("Too many redirects while downloading this track."), { statusCode: 502 }));
          return;
        }
        const redirectedUrl = new URL(location, remoteUrl).toString();
        streamRemoteFile(redirectedUrl, res, fileName, redirectCount + 1).then(resolve, reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(Object.assign(new Error(`Track host returned ${response.statusCode}.`), { statusCode: 502 }));
        return;
      }

      const headers = {
        "Content-Type": response.headers["content-type"] || "audio/mpeg",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      };
      if (response.headers["content-length"]) {
        headers["Content-Length"] = response.headers["content-length"];
      }

      res.writeHead(200, headers);
      response.pipe(res);
      response.on("end", resolve);
    });

    request.on("timeout", () => {
      request.destroy(Object.assign(new Error("Track download timed out."), { statusCode: 504 }));
    });
    request.on("error", reject);
  });
}

async function recordDownload(req, trackId, quality) {
  const downloads = await readJson(DOWNLOADS_FILE, []);
  downloads.unshift({
    id: crypto.randomUUID(),
    trackId,
    quality,
    createdAt: new Date().toISOString(),
    userAgent: cleanText(req.headers["user-agent"], 240),
  });
  await writeJson(DOWNLOADS_FILE, downloads.slice(0, 5000));
}

async function handleApi(req, res, url) {
  if ((req.method === "GET" || req.method === "HEAD") && url.pathname === "/api/health") {
    return sendJson(req, res, 200, {
      ok: true,
      name: "Chi and Chi MP3 API",
      youtubeDiscovery: Boolean(YOUTUBE_API_KEY),
    });
  }

  if ((req.method === "GET" || req.method === "HEAD") && url.pathname === "/api/youtube") {
    const query = cleanText(url.searchParams.get("q"), 80);
    if (!query) return sendError(req, res, 400, "Search query 'q' is required.");

    try {
      const tracks = await searchYouTube(query);
      return sendJson(req, res, 200, { tracks });
    } catch (error) {
      return sendError(req, res, error.statusCode || 502, "YouTube discovery is unavailable.", error.message);
    }
  }

  if ((req.method === "GET" || req.method === "HEAD") && url.pathname === "/api/tracks") {
    const tracks = await readJson(TRACKS_FILE, []);
    return sendJson(req, res, 200, { tracks: filterTracks(tracks, url.searchParams) });
  }

  if ((req.method === "GET" || req.method === "HEAD") && url.pathname === "/api/stream") {
    const trackId = cleanText(url.searchParams.get("id"), 80);
    if (!trackId) return sendError(req, res, 400, "Track ID is required.");

    const tracks = await readJson(TRACKS_FILE, []);
    const track = findPublishedTrack(tracks, trackId);
    if (!track || !isHttpUrl(track.preview)) {
      return sendError(req, res, 404, "Preview is not available for this track.");
    }

    res.writeHead(302, { Location: track.preview });
    res.end();
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/submissions") {
    const body = await readBody(req);
    const title = cleanText(body.title);
    const artist = cleanText(body.artist);
    const genre = cleanText(body.genre, 40).toLowerCase();

    if (!title || !artist || !genre) {
      return sendError(req, res, 400, "Title, artist, and genre are required.");
    }

    const submissions = await readJson(SUBMISSIONS_FILE, []);
    const savedSubmission = {
      id: crypto.randomUUID(),
      title,
      artist,
      genre,
      createdAt: new Date().toISOString(),
    };
    submissions.unshift(savedSubmission);
    await writeJson(SUBMISSIONS_FILE, submissions.slice(0, 1000));
    return sendJson(req, res, 201, { submission: savedSubmission, message: "Track submitted." });
  }

  if (req.method === "POST" && url.pathname === "/api/downloads") {
    const body = await readBody(req);
    const trackId = cleanText(body.trackId, 80);
    const quality = cleanText(body.quality, 12) || "320";

    if (!trackId) return sendError(req, res, 400, "Track ID is required.");

    const tracks = await readJson(TRACKS_FILE, []);
    const track = findPublishedTrack(tracks, trackId);

    if (!track) {
      return sendError(req, res, 404, "Track not found.");
    }
    if (!isHttpUrl(track.downloadUrl)) {
      return sendError(req, res, 409, "This track does not have a downloadable MP3 file.");
    }

    await recordDownload(req, trackId, quality);

    return sendJson(req, res, 200, {
      downloadUrl: `/api/download-file?id=${encodeURIComponent(track.id)}&quality=${encodeURIComponent(quality)}`,
      fileName: makeFileName(track),
    });
  }

  if ((req.method === "GET" || req.method === "HEAD") && url.pathname === "/api/download-file") {
    const trackId = cleanText(url.searchParams.get("id"), 80);
    const quality = cleanText(url.searchParams.get("quality"), 12) || "320";
    if (!trackId) return sendError(req, res, 400, "Track ID is required.");

    const tracks = await readJson(TRACKS_FILE, []);
    const track = findPublishedTrack(tracks, trackId);

    if (!track) {
      return sendError(req, res, 404, "Track not found.");
    }
    if (!isHttpUrl(track.downloadUrl)) {
      return sendError(req, res, 409, "This track does not have a downloadable MP3 file.");
    }

    if (req.method === "HEAD") {
      res.writeHead(200, {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${makeFileName(track)}"`,
      });
      res.end();
      return;
    }

    await streamRemoteFile(track.downloadUrl, res, makeFileName(track));
    return;
  }

  sendError(req, res, 404, "API route not found.");
}

async function serveStatic(req, res, url) {
  const requestedPath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\//, "");
  const isDataRequest = url.pathname.startsWith("/data/");

  // Only allow public access to tracks.json; submissions and downloads are private
  if (isDataRequest) {
    const allowedDataFiles = ["tracks.json"];
    const basename = path.basename(requestedPath);
    if (!allowedDataFiles.includes(basename)) {
      return sendError(req, res, 403, "Forbidden.");
    }
  }

  const rootDir = isDataRequest ? DATA_DIR : PUBLIC_DIR;
  const relativePath = isDataRequest ? requestedPath.replace(/^data\//, "") : requestedPath;
  const filePath = path.join(rootDir, relativePath);
  const normalizedRoot = path.resolve(rootDir) + path.sep;
  const normalizedFile = path.resolve(filePath);

  if (!normalizedFile.startsWith(normalizedRoot)) {
    return sendError(req, res, 403, "Forbidden.");
  }

  try {
    const data = await fs.readFile(filePath);
    const type = contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    res.end(data);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      return sendError(req, res, 404, "File not found.");
    }
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  req.on("error", (error) => console.error("Request error:", error));

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  } 
  try {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendError(req, res, 405, "Method not allowed.");
    }

    await serveStatic(req, res, url);
  } catch (error) {
    console.error("Server error:", error);
    sendError(req, res, error.statusCode || 500, error.message || "Server error.");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Chi and Chi MP3 is running at http://${HOST}:${PORT}`);
});
