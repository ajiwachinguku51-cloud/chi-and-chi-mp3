/* ─── ELEMENT REFS ─── */
const els = {
  form:              document.querySelector("#searchForm"),
  search:            document.querySelector("#searchInput"),
  list:              document.querySelector("#tracksList"),
  count:             document.querySelector("#resultCount"),
  template:          document.querySelector("#trackTemplate"),
  langSelect:        document.querySelector("#langSelect"),
  playerArt:         document.querySelector("#playerArt"),
  playerGenre:       document.querySelector("#playerGenre"),
  playerName:        document.querySelector("#playerName"),
  playerArtist:      document.querySelector("#playerArtist"),
  audio:             document.querySelector("#audioPlayer"),
  quality:           document.querySelector("#qualitySelect"),
  downloadSelected:  document.querySelector("#downloadSelected"),
  themeToggle:       document.querySelector("#themeToggle"),
  a11yToggle:        document.querySelector("#a11yToggle"),
  appNotice:         document.querySelector("#appNotice"),
  offlineIndicator:  document.querySelector("#offlineIndicator"),
  downloadsSection:  document.querySelector("#downloads"),
  librarySection:    document.querySelector("#library"),
  downloadsList:     document.querySelector("#downloadsList"),
  downloadCount:     document.querySelector("#downloadCount"),
  clearAllDownloads: document.querySelector("#clearAllDownloads"),
};

/* ─── STATE ─── */
let activeFilter   = "all";
let tracks         = [];
let selectedTrack  = null;
let searchTimer;
let currentLang    = localStorage.getItem("chi-lang") ||
                     (navigator.language?.startsWith("sw") ? "sw" : "en");
let isOnline       = navigator.onLine;

/* ─── i18n ─── */
const locales = {
  en: {
    loading:              "Loading tracks…",
    couldNotLoad:         "Could not load tracks",
    noTracksFound:        "No tracks found. Try a different search.",
    selectTrack:          "Select a track",
    readyWhenYouAre:      "Ready when you are",
    previewNote:          "Preview tracks before downloading.",
    downloadCouldNotStart:"Download could not be started. Please try again.",
    downloadUnavailable:  "Download unavailable",
    usingFallbackNotice:  "Using local data — API unavailable.",
    usingApiNotice:       "",
    searchPlaceholder:    "Artist, song, genre, mood…",
    searchButton:         "Search",
    downloadSelected:     "Download selected",
    trackSingular:        "track",
    trackPlural:          "tracks",
    downloading:          "Downloading…",
    downloaded:           "Downloaded",
    play:                 "Play",
    delete:               "Delete",
    noDownloads:          "No downloads yet. Start by downloading a track!",
    downloadedTracks:     "Downloaded tracks",
    storageUsed:          "Storage used",
    clearDownloads:       "Clear all downloads",
  },
  sw: {
    loading:              "Inapakia…",
    couldNotLoad:         "Haiwezi kupakia nyimbo",
    noTracksFound:        "Hakuna nyimbo. Jaribu tafuta tofauti.",
    selectTrack:          "Chagua wimbo",
    readyWhenYouAre:      "Niko tayari",
    previewNote:          "Sikiliza awali kabla ya kupakua.",
    downloadCouldNotStart:"Kupakua kulishindwa. Jaribu tena.",
    downloadUnavailable:  "Haiwezi kupakuliwa",
    usingFallbackNotice:  "Inatumia faili ya ndani — API haipatikani.",
    usingApiNotice:       "",
    searchPlaceholder:    "Msanii, wimbo, aina, hisia…",
    searchButton:         "Tafuta",
    downloadSelected:     "Pakua iliyochaguliwa",
    trackSingular:        "wimbo",
    trackPlural:          "nyimbo",
    downloading:          "Inapakua…",
    downloaded:           "Imepakuwa",
    play:                 "Cheza",
    delete:               "Futa",
    noDownloads:          "Hakuna mipakua. Anza kupakua wimbo!",
    downloadedTracks:     "Nyimbo zilizopakuwa",
    storageUsed:          "Hifadhi iliyotumiwa",
    clearDownloads:       "Futa mipakua yote",
  },
};

function t(key) {
  return (locales[currentLang]?.[key]) || locales.en[key] || key;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });
  if (els.search) els.search.placeholder = t("searchPlaceholder");
}

/* ─── ARTWORK ─── */
function setArtwork(element, track) {
  if (!element) return;
  const a = track?.colorA || "#10b981";
  const b = track?.colorB || "#f59e0b";
  element.style.background = `linear-gradient(135deg, ${a}, ${b})`;
}

/* ─── API HELPER ─── */
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Request failed.");
    err.details = data.details;
    throw err;
  }
  return data;
}

/* ─── LOCAL FILTER (fallback) ─── */
function localFilter(allTracks, query, genre) {
  const q  = query.toLowerCase();
  const g  = genre.toLowerCase();
  return allTracks
    .filter((tr) => tr.status === "published")
    .filter((tr) => !g || g === "all" || String(tr.genre || "").toLowerCase() === g)
    .filter((tr) => {
      if (!q) return true;
      const hay = [tr.title, tr.artist, tr.genre, tr.mood, tr.license].join(" ").toLowerCase();
      return hay.includes(q);
    });
}

/* ─── LOAD TRACKS ─── */
async function loadTracks() {
  const query = els.search?.value.trim() || "";
  if (els.count) els.count.textContent = t("loading");
  if (els.appNotice) els.appNotice.textContent = "";

  try {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (activeFilter !== "all") params.set("genre", activeFilter);

    const data = await api(`/api/tracks?${params.toString()}`);
    tracks = data.tracks || [];
    renderTracks();
    if (els.appNotice) els.appNotice.textContent = t("usingApiNotice");
  } catch {
    try {
      const resp = await fetch("/data/tracks.json");
      if (!resp.ok) throw new Error("No fallback");
      tracks = localFilter(await resp.json(), query, activeFilter);
      renderTracks();
      if (els.appNotice) els.appNotice.textContent = t("usingFallbackNotice");
    } catch {
      tracks = [];
      renderTracks();
      if (els.count) els.count.textContent = t("couldNotLoad");
    }
  }
}

/* ─── TRACK SELECTION ─── */
function trackCanDownload(track) {
  return Boolean(track?.downloadUrl);
}

function selectTrack(track, shouldPlay = false) {
  selectedTrack = track;

  if (!track) {
    if (els.downloadSelected) els.downloadSelected.disabled = true;
    if (els.playerGenre)  els.playerGenre.textContent = t("selectTrack");
    if (els.playerName)   els.playerName.textContent  = t("readyWhenYouAre");
    if (els.playerArtist) els.playerArtist.textContent = t("previewNote");
    if (els.audio)        els.audio.removeAttribute("src");
    setArtwork(els.playerArt, null);
    return;
  }

  const canDl = trackCanDownload(track);
  if (els.downloadSelected) {
    els.downloadSelected.disabled = !canDl;
    els.downloadSelected.textContent = canDl ? t("downloadSelected") : t("downloadUnavailable");
  }

  if (els.playerGenre)  els.playerGenre.textContent  = String(track.genre || "music").toUpperCase();
  if (els.playerName)   els.playerName.textContent   = track.title;
  if (els.playerArtist) els.playerArtist.textContent = `${track.artist} · ${track.license || "Licensed"}`;

  if (els.audio) {
    if (track.preview) {
      els.audio.src = `/api/stream?id=${encodeURIComponent(track.id)}`;
    } else {
      els.audio.removeAttribute("src");
    }
  }

  setArtwork(els.playerArt, track);

  document.querySelectorAll(".track-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.id === track.id);
  });

  if (shouldPlay && els.audio?.src) {
    els.audio.play().catch(() => {});
  }
}

/* ─── RENDER TRACKS ─── */
function renderTracks() {
  if (!els.list) return;
  els.list.replaceChildren();

  if (els.count) {
    els.count.textContent = `${tracks.length} ${tracks.length === 1 ? t("trackSingular") : t("trackPlural")}`;
  }

  if (!tracks.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = t("noTracksFound");
    els.list.append(empty);
    selectTrack(null);
    return;
  }

  tracks.forEach((track) => {
    if (!els.template) return;
    const card = els.template.content.firstElementChild.cloneNode(true);

    card.dataset.id = track.id;
    card.querySelector(".track-genre").textContent  = String(track.genre || "music").toUpperCase();
    card.querySelector(".track-title").textContent  = track.title;
    card.querySelector(".track-artist").textContent = track.artist;

    const meta = card.querySelector(".track-meta");
    if (meta) {
      meta.replaceChildren(
        mkMeta(track.duration || "3:30"),
        mkMeta(`${track.bpm || "120"} BPM`),
        mkMeta(track.license || "Licensed"),
      );
    }

    setArtwork(card.querySelector(".cover-art"), track);

    const coverBtn = card.querySelector(".cover-btn");
    coverBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      selectTrack(track, true);
    });

    card.addEventListener("click", (e) => {
      if (!e.target.closest("button")) selectTrack(track);
    });

    const dlBtn = card.querySelector(".dl-btn");
    const canDl = trackCanDownload(track);
    if (dlBtn) {
      dlBtn.disabled = !canDl;
      dlBtn.title    = canDl ? "Download MP3" : t("downloadUnavailable");
      const label    = dlBtn.querySelector(".dl-label");
      if (label) label.textContent = canDl ? "MP3" : "–";
      dlBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        downloadTrack(track);
      });
    }

    els.list.append(card);
  });

  const next = selectedTrack && tracks.find((tr) => tr.id === selectedTrack.id);
  selectTrack(next || tracks[0]);
}

function mkMeta(text) {
  const s = document.createElement("span");
  s.textContent = text;
  return s;
}

/* ─── DOWNLOAD ─── */
async function downloadTrack(track) {
  if (!track || !trackCanDownload(track)) return;
  try {
    const quality = els.quality?.value || "320";
    const data = await api("/api/downloads", {
      method: "POST",
      body: JSON.stringify({ trackId: track.id, quality }),
    });

    /* FIX: create anchor, click, then remove — safe cross-browser */
    const a = document.createElement("a");
    a.href     = data.downloadUrl;
    a.download = data.fileName || `${track.artist}-${track.title}.mp3`;
    a.rel      = "noopener";
    document.body.append(a);
    a.click();
    /* Small delay before removal ensures click is processed */
    setTimeout(() => a.remove(), 200);
  } catch (err) {
    console.error("Download error:", err);
    alert(t("downloadCouldNotStart"));
  }
}

/* ─── DOWNLOADS SECTION ─── */
async function renderDownloads() {
  if (!els.downloadsList) return;

  /* Guard: offlineDB may not be available in all environments */
  if (typeof offlineDB === "undefined") {
    els.downloadsList.replaceChildren();
    const p = document.createElement("p");
    p.className   = "empty-state";
    p.textContent = t("noDownloads");
    els.downloadsList.append(p);
    return;
  }

  const downloads = await offlineDB.getAllDownloads();
  els.downloadsList.replaceChildren();

  if (els.downloadCount) {
    const stats = await offlineDB.getStorageStats();
    els.downloadCount.textContent = `${downloads.length} saved · ${stats.formatted}`;
  }

  if (!downloads.length) {
    const p = document.createElement("p");
    p.className   = "empty-state";
    p.textContent = t("noDownloads");
    els.downloadsList.append(p);
    if (els.clearAllDownloads) els.clearAllDownloads.style.display = "none";
    return;
  }

  if (els.clearAllDownloads) els.clearAllDownloads.style.display = "block";

  downloads.forEach((dl) => els.downloadsList.append(createDownloadCard(dl)));
}

function createDownloadCard(dl) {
  const card  = document.createElement("article");
  card.className  = "track-card";
  card.dataset.id = dl.id;

  const meta  = dl.metadata || {};
  const a     = meta.colorA || "#10b981";
  const b     = meta.colorB || "#3b82f6";
  const safeTitle  = escapeHtml(dl.title);
  const safeArtist = escapeHtml(dl.artist);
  const safeGenre  = escapeHtml(String(meta.genre || "music").toUpperCase());
  const safeDate   = new Date(dl.downloadedAt).toLocaleDateString();
  const safeSize   = (typeof offlineDB !== "undefined") ? offlineDB.formatBytes(dl.fileSize) : "";

  card.innerHTML = `
    <button class="cover-btn play-btn" type="button" aria-label="Play track">
      <span class="cover-art" style="background: linear-gradient(135deg, ${a}, ${b})" aria-hidden="true"></span>
      <span class="play-ring" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </span>
    </button>
    <div class="track-info">
      <span class="track-genre">${safeGenre}</span>
      <h3 class="track-title">${safeTitle}</h3>
      <p class="track-artist">${safeArtist}</p>
      <div class="track-meta">
        <span>${safeDate}</span>
        <span>${safeSize}</span>
      </div>
    </div>
    <button class="dl-btn delete-btn" type="button" aria-label="Delete download" title="Delete">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
    </button>
  `;

  card.querySelector(".play-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    if (dl.blobUrl && els.audio) {
      els.audio.src = dl.blobUrl;
      els.audio.play().catch(() => {});
    }
  });

  card.querySelector(".delete-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    if (confirm(`Delete "${dl.title}"?`)) {
      offlineDB.deleteDownload(dl.id).then(() => {
        card.remove();
        renderDownloads();
      });
    }
  });

  return card;
}

/* Simple HTML escape to prevent XSS in innerHTML */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ─── CLEAR ALL DOWNLOADS ─── */
if (els.clearAllDownloads) {
  els.clearAllDownloads.addEventListener("click", async () => {
    if (confirm("Delete all downloaded tracks? This cannot be undone.")) {
      if (typeof offlineDB !== "undefined") await offlineDB.clearAllDownloads();
      renderDownloads();
    }
  });
}

/* ─── NAV SWITCHING ─── */
function switchView(view) {
  const isDownloads = view === "downloads";
  if (els.downloadsSection) els.downloadsSection.style.display = isDownloads ? "block" : "none";
  if (els.librarySection)   els.librarySection.style.display   = isDownloads ? "none"  : "block";

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.view === view);
  });

  if (isDownloads) renderDownloads().catch(console.error);
}

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    switchView(link.dataset.view);
  });
});

/* ─── SEARCH ─── */
if (els.form) {
  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    loadTracks().catch(console.error);
  });
}

if (els.search) {
  els.search.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadTracks().catch(console.error), 350);
  });
}

document.querySelectorAll(".chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
    btn.classList.add("is-active");
    activeFilter = btn.dataset.filter || "all";
    loadTracks().catch(console.error);
  });
});

/* ─── DOWNLOAD SELECTED ─── */
if (els.downloadSelected) {
  els.downloadSelected.disabled = true;
  els.downloadSelected.addEventListener("click", () => {
    if (selectedTrack) downloadTrack(selectedTrack).catch(console.error);
  });
}

/* ─── LANGUAGE ─── */
if (els.langSelect) {
  els.langSelect.value = currentLang;
  els.langSelect.addEventListener("change", (e) => {
    currentLang = e.target.value;
    localStorage.setItem("chi-lang", currentLang);
    applyTranslations();
    renderTracks();
  });
}

/* ─── THEME TOGGLE ─── */
/* FIX: was toggling "dark" but CSS is dark-first; toggle "light" class instead */
const savedTheme = localStorage.getItem("chi-theme");
if (savedTheme === "light") document.body.classList.add("light");

if (els.themeToggle) {
  els.themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("chi-theme", document.body.classList.contains("light") ? "light" : "dark");
  });
}

/* ─── ACCESSIBILITY ─── */
const savedA11y = localStorage.getItem("chi-a11y");
if (savedA11y === "large") document.body.classList.add("large-text");

if (els.a11yToggle) {
  els.a11yToggle.addEventListener("click", () => {
    document.body.classList.toggle("large-text");
    localStorage.setItem("chi-a11y", document.body.classList.contains("large-text") ? "large" : "normal");
  });
}

/* ─── ONLINE / OFFLINE ─── */
function updateOnlineStatus() {
  isOnline = navigator.onLine;
  if (els.offlineIndicator) {
    els.offlineIndicator.style.display = isOnline ? "none" : "flex";
  }
}

window.addEventListener("online",  updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

/* ─── SERVICE WORKER ─── */
async function initServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("service-worker.js");
    } catch (err) {
      console.warn("Service Worker registration failed:", err);
    }
  }
}

/* ─── INIT ─── */
applyTranslations();
updateOnlineStatus();
initServiceWorker();
loadTracks().catch(console.error);
