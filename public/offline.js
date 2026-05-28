class OfflineDB {
  constructor() {
    this.dbName = "ChiMP3Downloads";
    this.version = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("downloads")) {
          const downloadStore = db.createObjectStore("downloads", { keyPath: "id" });
          downloadStore.createIndex("trackId", "trackId", { unique: false });
          downloadStore.createIndex("downloadedAt", "downloadedAt", { unique: false });
        }

        if (!db.objectStoreNames.contains("tracks")) {
          const trackStore = db.createObjectStore("tracks", { keyPath: "id" });
          trackStore.createIndex("genre", "genre", { unique: false });
        }
      };
    });
  }

  async addDownload(trackData, blob) {
    if (!this.db) await this.init();

    const download = {
      id: `${trackData.id}-${Date.now()}`,
      trackId: trackData.id,
      title: trackData.title,
      artist: trackData.artist,
      genre: trackData.genre,
      downloadedAt: new Date().toISOString(),
      fileSize: blob.size,
      blobUrl: URL.createObjectURL(blob),
      metadata: trackData
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["downloads"], "readwrite");
      const store = transaction.objectStore("downloads");
      const request = store.add(download);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(download);
    });
  }

  async getAllDownloads() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["downloads"], "readonly");
      const store = transaction.objectStore("downloads");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getDownload(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["downloads"], "readonly");
      const store = transaction.objectStore("downloads");
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteDownload(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["downloads"], "readwrite");
      const store = transaction.objectStore("downloads");
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const download = getRequest.result;
        if (download && download.blobUrl) {
          URL.revokeObjectURL(download.blobUrl);
        }
        const deleteRequest = store.delete(id);
        deleteRequest.onerror = () => reject(deleteRequest.error);
        deleteRequest.onsuccess = () => resolve(true);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async isDownloaded(trackId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["downloads"], "readonly");
      const store = transaction.objectStore("downloads");
      const index = store.index("trackId");
      const request = index.getAll(trackId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.length > 0);
    });
  }

  async getDownloadsByGenre(genre) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["downloads"], "readonly");
      const store = transaction.objectStore("downloads");
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const filtered = request.result.filter((d) => d.genre === genre || genre === "all");
        resolve(filtered);
      };
    });
  }

  async clearAllDownloads() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["downloads"], "readwrite");
      const store = transaction.objectStore("downloads");
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  }

  async getStorageStats() {
    if (!this.db) await this.init();

    const downloads = await this.getAllDownloads();
    let totalSize = 0;
    downloads.forEach((d) => {
      totalSize += d.fileSize || 0;
    });

    return {
      downloadCount: downloads.length,
      totalSize: totalSize,
      formatted: this.formatBytes(totalSize)
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}

const offlineDB = new OfflineDB();
