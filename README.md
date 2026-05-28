# Chi and Chi MP3

A clean, modern music discovery and download platform with offline support, built with Node.js and vanilla JavaScript.

## ✨ Features

### 🎵 Music Discovery
- **Search & Filter**: Find tracks by artist, song name, genre, or mood
- **10+ Curated Tracks**: Diverse catalog across Bongo, Afrobeats, Gospel, and Instrumental genres
- **Live Preview**: Stream previews directly in the browser before downloading
- **Genre Filters**: Quick access to specific music categories
- **Bilingual Support**: English and Kiswahili interface

### 📥 Download & Offline Storage
- **One-Click Downloads**: Save MP3 files with selectable quality (320, 192, 128 kbps)
- **IndexedDB Storage**: Downloaded tracks persist in browser storage
- **Offline Access**: Play downloaded tracks without internet connection
- **Download Manager**: View all downloaded tracks with metadata
- **Storage Tracker**: See how much storage your downloads use
- **Delete Management**: Remove individual downloads or clear all at once

### 🌐 Offline Support
- **Service Worker**: Caches static assets for instant loading
- **Offline Mode**: App works completely offline after initial load
- **Offline Indicator**: Visual notification when offline
- **Fallback API**: Falls back to local data when API is unavailable

### 🎨 User Experience
- **Light/Dark Mode**: Toggle between themes for comfortable viewing
- **Accessibility**: Large text mode (A+) for better readability
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **No Ads**: Clean, distraction-free interface
- **Quality Selection**: Download at your preferred bitrate

### 🎛️ Advanced Features
- **Track Submission Form**: Users can suggest new tracks for the catalog
- **Download Logging**: Server tracks download analytics
- **YouTube Discovery**: Optional YouTube search integration (requires API key)
- **Automatic Caching**: Smart caching strategy for optimal performance

## 🚀 Quick Start

### Installation

```bash
# Clone or navigate to project directory
cd "path/to/All mp3 music downloader web"

# Start the server (dependencies already included)
npm start
```

### Access the App

Open your browser and navigate to:
```
http://127.0.0.1:3000
```

## 📁 Project Structure

```
project/
├── server.js                 # Node.js backend API server
├── package.json             # Project configuration
├── public/
│   ├── index.html          # Main HTML template
│   ├── app.js              # Frontend application logic
│   ├── offline.js          # IndexedDB manager for downloads
│   ├── service-worker.js   # Service Worker for offline support
│   └── styles.css          # Styling and responsive design
├── data/
│   ├── tracks.json         # Published music catalog
│   ├── submissions.json    # User track submissions
│   └── downloads.json      # Download analytics log
└── README.md               # This file
```

## 🔌 API Endpoints

### Public Endpoints
- `GET /` - Main application
- `GET /api/health` - API health check
- `GET /api/tracks?q=query&genre=genre` - Search/filter tracks
- `GET /api/youtube?q=query` - YouTube discovery (requires API key)
- `GET /api/stream?id=trackId` - Stream track preview
- `POST /api/downloads` - Log download and get download URL
- `POST /api/submissions` - Submit new track suggestion

### Data Endpoints
- `GET /data/tracks.json` - Published tracks catalog
- `GET /data/submissions.json` - All submissions (for admin review)
- `GET /data/downloads.json` - Download logs (for analytics)

## 🎵 Track Catalog

The app includes 10 high-quality royalty-free sample tracks:

### Bongo (3 tracks)
- Salama - Chi & Chi Band
- Kilimanjaro Sunrise - Taarab Masters
- Dansi Za Asili - Traditional Fire

### Afrobeats (3 tracks)
- Groove Time - Afro Vibes
- Night Moves - Urban Groove
- Sunset Vibes - Beach Beats

### Gospel (2 tracks)
- Amazing Grace - Gospel Choir
- Joy Unending - Eternal Voices

### Instrumental (2 tracks)
- Ambient Flow - Zen Beats
- Digital Dreams - Synth Wave

All tracks use royalty-free sources (SoundHelix examples) and are licensed under CC BY 4.0.

## 🛠️ How It Works

### Frontend Features

**App.js** - Main application
- Search and filter tracks
- Preview playback
- Download management
- Multi-language support
- Offline status tracking

**offline.js** - IndexedDB Manager
- Store downloaded MP3 files
- Track download metadata
- Manage local storage
- Calculate storage usage
- Enable offline playback

**service-worker.js** - Offline Support
- Cache static assets on install
- Network-first strategy for API calls
- Cache-first strategy for static files
- Fallback responses for offline mode

**styles.css** - Responsive Design
- Mobile-first CSS
- Dark/light theme support
- Large text accessibility option
- Smooth animations
- Professional color scheme

### Backend Features

**server.js** - Node.js API
- Static file serving
- Track management and filtering
- Download request logging
- User submission handling
- Health check endpoint

**data/tracks.json** - Music Catalog
- Published tracks with metadata
- Genre, mood, and license info
- Preview and download URLs
- Color scheme for UI branding

## 📱 Usage Guide

### Searching for Music
1. Type in the search box (artist, song name, genre, mood)
2. Press Enter or click Search
3. Results appear instantly with filtering

### Using Genre Filters
- Click any genre chip (Bongo, Afrobeats, Gospel, Instrumental)
- View all tracks of that genre
- Click "All" to reset filter

### Previewing Tracks
1. Click the cover art or play button on any track
2. Click track name to select it (shows in preview panel)
3. Click play button to hear the preview
4. Use audio player controls to pause/skip

### Downloading Tracks
1. Select quality (320/192/128 kbps) from dropdown
2. Click "Download selected" button or download button on card
3. Track saves to browser storage automatically
4. Download completes instantly

### Accessing Downloaded Tracks
1. Click "Downloads" in top navigation
2. View all saved tracks with download date and file size
3. Click cover to play saved track
4. Click X button to delete individual download
5. Click "Clear all downloads" to remove everything

### Offline Mode
- App works without internet after first visit
- Downloaded tracks always available offline
- Blue banner shows "Offline Mode" status
- Search uses cached data when offline

## 🌍 Environment Variables (Optional)

```bash
PORT=3000              # Server port (default: 3000)
HOST=127.0.0.1         # Server host (default: 127.0.0.1)
YOUTUBE_API_KEY=...    # Optional YouTube discovery API key
```

## 📊 Data Storage

### Browser Storage
- **Service Worker Cache**: ~2-5 MB for static assets
- **IndexedDB**: Unlimited storage for downloaded MP3s (up to device storage)
- **LocalStorage**: 5 KB for language/theme preferences

### Server Storage
- **data/tracks.json**: Published music catalog
- **data/submissions.json**: User track suggestions
- **data/downloads.json**: Download analytics (for tracking usage)

## 🔒 Security & Legal

⚠️ **Important**: 
- Only use royalty-free, licensed, or original music
- Do not connect to unauthorized download sources
- Respect copyright and licensing agreements
- All sample tracks are CC BY 4.0 licensed

## 📝 Track Submission

Users can submit new tracks via the web form. Submissions are logged and can be reviewed by administrators for potential addition to the catalog.

**Submission Fields:**
- Track title
- Artist name
- Genre
- Submitted via web interface with timestamp

## 🎯 Production Considerations

For a production deployment, consider adding:

1. **User Accounts**
   - Authentication & authorization
   - User playlists and favorites
   - Download history

2. **Admin Dashboard**
   - Track management interface
   - Submission review and approval
   - Analytics dashboard
   - User moderation

3. **Backend Enhancements**
   - Database (PostgreSQL/MongoDB)
   - Secure file storage (S3/GCS)
   - MP3 transcoding pipeline
   - Search indexing (Elasticsearch)
   - CDN for content delivery

4. **Security**
   - HTTPS/SSL encryption
   - API rate limiting
   - Content verification
   - Copyright compliance checks
   - DRM/watermarking (if needed)

5. **Performance**
   - Redis caching
   - Database optimization
   - Image optimization
   - Compression (gzip, brotli)

## 📞 Support

For issues or questions:
- Check server logs: `server.out.log` and `server.err.log`
- Verify tracks.json is valid JSON
- Ensure service worker is registered (browser DevTools)
- Check IndexedDB in browser DevTools (Application tab)

## 👨‍💻 Built By

**Ajiwa Chinguku** - Original creator and maintainer

## 📄 License

ISC License - See package.json

## 🎉 Features Summary

| Feature | Status |
|---------|--------|
| Search & Filter | ✅ Implemented |
| Music Preview | ✅ Implemented |
| MP3 Download | ✅ Implemented |
| Offline Storage | ✅ Implemented (IndexedDB) |
| Offline Mode | ✅ Implemented (Service Worker) |
| Download Manager | ✅ Implemented |
| Dark/Light Theme | ✅ Implemented |
| Large Text Mode | ✅ Implemented |
| Bilingual (EN/SW) | ✅ Implemented |
| Genre Filters | ✅ Implemented |
| Download Analytics | ✅ Implemented |
| Track Submission | ✅ Implemented |
| YouTube Discovery | ✅ Optional (API key needed) |

## 🚀 Next Steps

To further enhance the app:
- Add user accounts and authentication
- Implement playlist creation
- Add favorites/bookmarking
- Create admin review interface
- Build mobile apps (React Native/Flutter)
- Add social sharing features
- Implement recommendations engine

---

**Ready to download music and enjoy offline!** 🎵
