const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");

const frontendFiles = ["index.html", "app.js", "styles.css"];
const dataFiles = {
  "tracks.json": JSON.stringify([
    { id: "bongo-track-1",        title: "Salama",             artist: "Chi & Chi Band",     genre: "bongo",        mood: "happy",      license: "CC BY 4.0", duration: "3:45", bpm: "125", preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",  downloadUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",  status: "published", colorA: "#10b981", colorB: "#3b82f6" },
    { id: "bongo-track-2",        title: "Kilimanjaro Sunrise", artist: "Taarab Masters",     genre: "bongo",        mood: "uplifting",  license: "CC BY 4.0", duration: "4:12", bpm: "110", preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",  downloadUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",  status: "published", colorA: "#f59e0b", colorB: "#ef4444" },
    { id: "bongo-track-3",        title: "Dansi Za Asili",      artist: "Traditional Fire",   genre: "bongo",        mood: "energetic",  license: "CC BY 4.0", duration: "3:58", bpm: "132", preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",  downloadUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",  status: "published", colorA: "#dc2626", colorB: "#ea580c" },
    { id: "afrobeats-track-1",    title: "Groove Time",         artist: "Afro Vibes",         genre: "afrobeats",    mood: "danceable",  license: "CC BY 4.0", duration: "3:32", bpm: "128", preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",  downloadUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",  status: "published", colorA: "#7c3aed", colorB: "#db2777" },
    { id: "afrobeats-track-2",    title: "Night Moves",         artist: "Urban Groove",       genre: "afrobeats",    mood: "chill",      license: "CC BY 4.0", duration: "4:05", bpm: "95",  preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",  downloadUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",  status: "published", colorA: "#1d4ed8", colorB: "#7c3aed" },
    { id: "afrobeats-track-3",    title: "Sunset Vibes",        artist: "Beach Beats",        genre: "afrobeats",    mood: "relaxed",    license: "CC BY 4.0", duration: "3:48", bpm: "105", preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",  downloadUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",  status: "published", colorA: "#f97316", colorB: "#facc15" },
    { id: "gospel-track-1",       title: "Amazing Grace",       artist: "Gospel Choir",       genre: "gospel",       mood: "spiritual",  license: "CC BY 4.0", duration: "5:10", bpm: "80",  preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",  downloadUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",  status: "published", colorA: "#0891b2", colorB: "#6366f1" },
    { id: "gospel-track-2",       title: "Joy Unending",        artist: "Eternal Voices",     genre: "gospel",       mood: "joyful",     license: "CC BY 4.0", duration: "4:22", bpm: "88",  preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",  downloadUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",  status: "published", colorA: "#059669", colorB: "#0891b2" },
    { id: "instrumental-track-1", title: "Ambient Flow",        artist: "Zen Beats",          genre: "instrumental", mood: "calm",       license: "CC BY 4.0", duration: "6:00", bpm: "70",  preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",  downloadUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",  status: "published", colorA: "#0f766e", colorB: "#0369a1" },
    { id: "instrumental-track-2", title: "Digital Dreams",      artist: "Synth Wave",         genre: "instrumental", mood: "focused",    license: "CC BY 4.0", duration: "4:44", bpm: "115", preview: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", downloadUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", status: "published", colorA: "#4f46e5", colorB: "#0891b2" },
  ], null, 2),
  "submissions.json": "[]",
  "downloads.json": "[]",
};

async function runSetup() {
  console.log("Starting project setup...");

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(DATA_DIR, { recursive: true });

  frontendFiles.forEach((file) => {
    const oldPath = path.join(ROOT, file);
    const newPath = path.join(PUBLIC_DIR, file);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`Moved ${file} to public/${file}`);
    } else if (fs.existsSync(newPath)) {
      console.log(`${file} is already inside public/`);
    } else {
      console.warn(`Warning: ${file} was not found.`);
    }
  });

  Object.entries(dataFiles).forEach(([file, contents]) => {
    const filePath = path.join(DATA_DIR, file);
    const shouldWrite = !fs.existsSync(filePath) || fs.readFileSync(filePath, "utf8").trim() === "";

    if (shouldWrite) {
      fs.writeFileSync(filePath, `${contents}\n`, "utf8");
      console.log(`Initialized data/${file}`);
    } else {
      console.log(`data/${file} already has content. Skipping.`);
    }
  });

  console.log("Setup complete. Run npm start to launch the app.");
}

runSetup().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
