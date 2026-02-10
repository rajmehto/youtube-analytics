// YouTube Analytics API Service
// Handles all YouTube Data API v3 interactions

class YouTubeAPIService {
  constructor() {
    this.API_KEY = null;
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
    this.loadAPIKey();
  }

  async loadAPIKey() {
    // Load API key from storage
    const result = await chrome.storage.sync.get(['youtubeApiKey']);
    this.API_KEY = result.youtubeApiKey || null;
  }

  async setAPIKey(key) {
    this.API_KEY = key;
    await chrome.storage.sync.set({ youtubeApiKey: key });
  }

  isConfigured() {
    return this.API_KEY !== null && this.API_KEY !== '';
  }

  // Fetch detailed video statistics
  async getVideoStats(videoId) {
    if (!this.isConfigured()) {
      return { error: 'API key not configured' };
    }

    try {
      const url = `${this.baseURL}/videos?part=statistics,contentDetails,snippet,topicDetails&id=${videoId}&key=${this.API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return { error: data.error.message };
      }

      if (data.items && data.items.length > 0) {
        const video = data.items[0];
        return {
          statistics: video.statistics,
          contentDetails: video.contentDetails,
          snippet: video.snippet,
          topicDetails: video.topicDetails,
          success: true
        };
      }

      return { error: 'Video not found' };
    } catch (error) {
      console.error('API Error:', error);
      return { error: error.message };
    }
  }

  // Fetch channel statistics
  async getChannelStats(channelId) {
    if (!this.isConfigured()) {
      return { error: 'API key not configured' };
    }

    try {
      const url = `${this.baseURL}/channels?part=statistics,snippet,contentDetails,brandingSettings&id=${channelId}&key=${this.API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return { error: data.error.message };
      }

      if (data.items && data.items.length > 0) {
        const channel = data.items[0];
        return {
          statistics: channel.statistics,
          snippet: channel.snippet,
          contentDetails: channel.contentDetails,
          brandingSettings: channel.brandingSettings,
          success: true
        };
      }

      return { error: 'Channel not found' };
    } catch (error) {
      console.error('API Error:', error);
      return { error: error.message };
    }
  }

  // Search for similar/competitor videos
  async searchSimilarVideos(query, maxResults = 10) {
    if (!this.isConfigured()) {
      return { error: 'API key not configured' };
    }

    try {
      const url = `${this.baseURL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&order=viewCount&key=${this.API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return { error: data.error.message };
      }

      return {
        videos: data.items || [],
        success: true
      };
    } catch (error) {
      console.error('API Error:', error);
      return { error: error.message };
    }
  }

  // Fetch video comments for sentiment analysis
  async getVideoComments(videoId, maxResults = 100) {
    if (!this.isConfigured()) {
      return { error: 'API key not configured' };
    }

    try {
      const url = `${this.baseURL}/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults}&order=relevance&key=${this.API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return { error: data.error.message };
      }

      const comments = data.items.map(item => ({
        text: item.snippet.topLevelComment.snippet.textDisplay,
        author: item.snippet.topLevelComment.snippet.authorDisplayName,
        likeCount: item.snippet.topLevelComment.snippet.likeCount,
        publishedAt: item.snippet.topLevelComment.snippet.publishedAt
      }));

      return {
        comments,
        success: true
      };
    } catch (error) {
      console.error('API Error:', error);
      return { error: error.message };
    }
  }

  // Fetch channel's recent videos
  async getChannelVideos(channelId, maxResults = 50) {
    if (!this.isConfigured()) {
      return { error: 'API key not configured' };
    }

    try {
      const url = `${this.baseURL}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${maxResults}&key=${this.API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        return { error: data.error.message };
      }

      // Fetch detailed stats for each video
      const videoIds = data.items.map(item => item.id.videoId).join(',');
      const statsUrl = `${this.baseURL}/videos?part=statistics,contentDetails&id=${videoIds}&key=${this.API_KEY}`;
      const statsResponse = await fetch(statsUrl);
      const statsData = await statsResponse.json();

      return {
        videos: statsData.items || [],
        success: true
      };
    } catch (error) {
      console.error('API Error:', error);
      return { error: error.message };
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = YouTubeAPIService;
}
