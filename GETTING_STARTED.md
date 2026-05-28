# 🎵 Chi and Chi MP3 - Getting Started Guide

## What You Can Do

This is a **fully functional music downloader web app** that lets you:
- ✅ **Search** 10+ royalty-free music tracks
- ✅ **Preview** songs before downloading
- ✅ **Download** MP3 files at 320/192/128 kbps
- ✅ **Save offline** - Access downloads without internet
- ✅ **Manage downloads** - View, play, and delete saved tracks
- ✅ **Filter by genre** - Bongo, Afrobeats, Gospel, Instrumental
- ✅ **Toggle themes** - Light/dark mode
- ✅ **Larger text** - A+ button for accessibility
- ✅ **Bilingual** - English and Kiswahili

## Quick Start (2 Steps)

### Step 1: Start the Server
```bash
npm start
```
You'll see: `Chi and Chi MP3 is running at http://127.0.0.1:3000`

### Step 2: Open in Browser
Go to: **http://127.0.0.1:3000**

That's it! The app is ready to use. 🎉

## Main Features Explained

### 🔍 Searching & Filtering
1. **Search Box**: Type artist name, song title, genre, or mood
2. **Genre Chips**: Click Bongo, Afrobeats, Gospel, or Instrumental
3. **Results appear instantly** with 10 sample tracks

### 🎧 Preview Music
1. **Click any track cover** to select it
2. **Audio player** appears on the left side
3. **Press play** to hear the preview
4. Previews are **streamed, not downloaded**

### ⬇️ Download & Save Offline

#### How to Download:
1. Select a **quality** (320/192/128 kbps)
2. Click **"Download selected"** button
3. File saves to your **browser storage** automatically
4. Green notification appears: **"✓ saved offline!"**

#### Access Downloads Anytime:
1. Click **"Downloads"** in top navigation
2. See all your **saved tracks**
3. Click cover to **play offline**
4. Click **X** to delete individual tracks
5. Use **"Clear all"** button to remove everything

### 🌐 Offline Mode

**First Load**: 
- App downloads and caches all files
- Internet required (just once)

**After First Load**:
- App works **without internet**
- Downloaded tracks **always playable**
- Blue banner shows: **"📡 Offline Mode - Downloads available"**

### 🎨 Customize Experience
- **Dark Mode**: Click **T** button (top right)
- **Larger Text**: Click **A+** button for accessibility
- **Language**: Switch between **English** and **Kiswahili**

## Available Tracks

The app comes with **10 sample tracks** across 4 genres:

**Bongo** (3 tracks)
- Salama - Chi & Chi Band
- Kilimanjaro Sunrise - Taarab Masters  
- Dansi Za Asili - Traditional Fire

**Afrobeats** (3 tracks)
- Groove Time - Afro Vibes
- Night Moves - Urban Groove
- Sunset Vibes - Beach Beats

**Gospel** (2 tracks)
- Amazing Grace - Gospel Choir
- Joy Unending - Eternal Voices

**Instrumental** (2 tracks)
- Ambient Flow - Zen Beats
- Digital Dreams - Synth Wave

All tracks are **royalty-free** and **CC BY 4.0 licensed**.

## Where Your Downloads Go

Downloads are stored in your **browser** (IndexedDB), not your device's hard drive.

### To Export Downloads:
1. Go to **Downloads** section
2. Right-click on any track cover
3. Select **"Save video as..."** to export to device
4. Choose location and filename

### Storage Space:
- Each download uses **~4-8 MB** of browser storage
- Browser typically allows **50+ GB** for offline storage
- Click **"Storage used"** to see total size

## Technical Details

### Files Included
```
server.js          ← Backend API server (Node.js)
offline.js         ← Offline storage manager
service-worker.js  ← Offline caching
app.js             ← Main app logic
styles.css         ← Styling
index.html         ← Main page
data/tracks.json   ← 10 sample tracks
```

### How Offline Works
1. **Service Worker** caches all static files on first visit
2. **IndexedDB** stores downloaded MP3 files
3. **App works without internet** after caching complete
4. **Fallback data** loads from cache if API unavailable

## Advanced Usage

### Adding More Tracks
Edit `data/tracks.json` and add tracks with format:
```json
{
  "id": "unique-id",
  "title": "Song Name",
  "artist": "Artist Name",
  "genre": "genre",
  "preview": "https://url-to-mp3",
  "downloadUrl": "https://url-to-mp3",
  "status": "published"
}
```

### YouTube Discovery (Optional)
If you have a **YouTube API key**, set it:
```bash
YOUTUBE_API_KEY=your_key npm start
```
Then YouTube search will work (blue results).

### Production Deployment
See README.md for:
- Database setup (PostgreSQL/MongoDB)
- Secure authentication
- Admin dashboard
- CDN integration
- DRM/watermarking

## Troubleshooting

### App Won't Load?
1. Check if server is running: `npm start`
2. Try: **http://localhost:3000**
3. Clear browser cache (Ctrl+Shift+Delete)

### No Tracks Showing?
1. Check `data/tracks.json` exists
2. Try refreshing (Ctrl+F5)
3. Open DevTools console for errors (F12)

### Can't Download Tracks?
1. Ensure browser allows IndexedDB
2. Check browser storage limit isn't exceeded
3. Try a different track first
4. Clear browser cache and try again

### Downloads Not Persistent?
1. Clear browser cookies/cache will delete downloads
2. Use "Incognito/Private" mode to test
3. Some browsers limit offline storage - check settings

### Still Offline After Internet Returns?
1. Refresh page (F5)
2. Manual offline mode - close DevTools offline mode
3. Restart browser

## Features to Know

### Privacy
- ✅ No user tracking
- ✅ No ads
- ✅ No external connections (except music URLs)
- ✅ All data stored locally in browser

### Accessibility
- ✅ Keyboard navigation
- ✅ Large text mode (A+)
- ✅ Screen reader support
- ✅ Dark/light modes
- ✅ Bilingual interface

### Performance
- ✅ Instant search (350ms delay)
- ✅ Lightweight CSS (no frameworks)
- ✅ Zero dependencies frontend
- ✅ Service Worker caching

## Support & Legal

⚠️ **Important**: 
- Only use **royalty-free or licensed music**
- Do not connect to **unauthorized sources**
- Respect **copyright laws** in your region
- All sample music is **CC BY 4.0 licensed**

## What's Next?

After testing:
1. **Add more tracks** to `data/tracks.json`
2. **Deploy to server** (Heroku, Railway, Render)
3. **Add database** for user accounts
4. **Create admin panel** for track management
5. **Build mobile app** using React Native

---

## Quick Command Reference

```bash
# Start app
npm start

# Stop app
Ctrl+C

# Clear all offline data
# → Go to DevTools (F12) → Application → Storage → Clear All

# View downloads
# → Click "Downloads" in top nav
```

## One More Thing 🎵

The app is **production-ready** for:
- Personal music library
- Artist portfolio
- Royalty-free music platform
- Offline media consumption
- Accessibility-focused music app

Enjoy your music downloads! 🎉

---

**Built with ❤️ by Ajiwa Chinguku**  
**Open source · Lightweight · No dependencies (frontend) · Offline-first**
