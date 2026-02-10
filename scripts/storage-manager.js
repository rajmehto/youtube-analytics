// Storage Manager for Historical Data
// Handles IndexedDB storage for tracking analytics over time

class StorageManager {
  constructor() {
    this.dbName = 'YouTubeAnalyticsDB';
    this.dbVersion = 1;
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Video analytics store
        if (!db.objectStoreNames.contains('videoAnalytics')) {
          const videoStore = db.createObjectStore('videoAnalytics', { keyPath: 'id', autoIncrement: true });
          videoStore.createIndex('videoId', 'videoId', { unique: false });
          videoStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Channel analytics store
        if (!db.objectStoreNames.contains('channelAnalytics')) {
          const channelStore = db.createObjectStore('channelAnalytics', { keyPath: 'id', autoIncrement: true });
          channelStore.createIndex('channelId', 'channelId', { unique: false });
          channelStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Keyword tracking store
        if (!db.objectStoreNames.contains('keywordTracking')) {
          const keywordStore = db.createObjectStore('keywordTracking', { keyPath: 'id', autoIncrement: true });
          keywordStore.createIndex('keyword', 'keyword', { unique: false });
          keywordStore.createIndex('videoId', 'videoId', { unique: false });
          keywordStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // User settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  // Save video analytics snapshot
  async saveVideoSnapshot(videoId, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['videoAnalytics'], 'readwrite');
      const store = transaction.objectStore('videoAnalytics');

      const snapshot = {
        videoId: videoId,
        timestamp: Date.now(),
        views: data.views,
        likes: data.likes,
        comments: data.comments,
        engagementRate: data.engagementRate,
        seoScore: data.seoScore,
        metadata: data.metadata
      };

      const request = store.add(snapshot);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get video history
  async getVideoHistory(videoId, days = 30) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['videoAnalytics'], 'readonly');
      const store = transaction.objectStore('videoAnalytics');
      const index = store.index('videoId');

      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      const results = [];

      index.openCursor(IDBKeyRange.only(videoId)).onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.timestamp >= cutoffTime) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  }

  // Save channel analytics snapshot
  async saveChannelSnapshot(channelId, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['channelAnalytics'], 'readwrite');
      const store = transaction.objectStore('channelAnalytics');

      const snapshot = {
        channelId: channelId,
        timestamp: Date.now(),
        subscribers: data.subscribers,
        views: data.views,
        videos: data.videos,
        metadata: data.metadata
      };

      const request = store.add(snapshot);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get channel history
  async getChannelHistory(channelId, days = 30) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['channelAnalytics'], 'readonly');
      const store = transaction.objectStore('channelAnalytics');
      const index = store.index('channelId');

      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      const results = [];

      index.openCursor(IDBKeyRange.only(channelId)).onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.timestamp >= cutoffTime) {
            results.push(cursor.value);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  }

  // Track keyword ranking
  async saveKeywordRanking(videoId, keyword, position) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['keywordTracking'], 'readwrite');
      const store = transaction.objectStore('keywordTracking');

      const tracking = {
        videoId: videoId,
        keyword: keyword,
        position: position,
        timestamp: Date.now()
      };

      const request = store.add(tracking);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get keyword ranking history
  async getKeywordHistory(videoId, keyword, days = 30) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['keywordTracking'], 'readonly');
      const store = transaction.objectStore('keywordTracking');

      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      const results = [];

      store.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const record = cursor.value;
          if (record.videoId === videoId && 
              record.keyword === keyword && 
              record.timestamp >= cutoffTime) {
            results.push(record);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  }

  // Save/get settings
  async saveSetting(key, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');

      const request = store.put({ key: key, value: value });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');

      const request = store.get(key);

      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear old data
  async clearOldData(days = 90) {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const stores = ['videoAnalytics', 'channelAnalytics', 'keywordTracking'];

    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore([storeName]);
      const index = store.index('timestamp');

      index.openCursor(IDBKeyRange.upperBound(cutoffTime)).onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}
