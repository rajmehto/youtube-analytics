// YouTube Analytics Vision - Content Script
// This script runs on YouTube pages and extracts video data

class YouTubeAnalytics {
  constructor() {
    this.videoData = {};
    this.overlayContainer = null;
    this.isVideoPage = false;
    this.currentVideoId = null; // Track current video to prevent stale data
    this.pendingTimeout = null; // Track pending extraction timeout
    this.isExtracting = false; // Track if extraction is in progress
    this.isCreatingOverlay = false; // Lock to prevent concurrent overlay creation
    this.monetizationAnalyzer = new MonetizationAnalyzer();
    this.seoAnalyzer = new YouTubeSEOAnalyzer(); // YouTube algorithm-aligned SEO analyzer
    this.injectPageScript();
    this.init();
  }
  
  // Inject external script to access YouTube's internal data (bypasses CSP)
  injectPageScript() {
    // Create a data container element for communication
    if (!document.getElementById('yt-analytics-data')) {
      const dataContainer = document.createElement('div');
      dataContainer.id = 'yt-analytics-data';
      dataContainer.style.display = 'none';
      document.body.appendChild(dataContainer);
    }
    
    // Inject external script file (bypasses CSP because it's from extension)
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('scripts/extractor.js');
    script.onload = function() {
      console.log('📦 Extractor script loaded successfully');
    };
    script.onerror = function() {
      console.error('❌ Failed to load extractor script');
    };
    (document.head || document.documentElement).appendChild(script);
    console.log('📦 Injecting extractor.js from extension');
  }
  
  // Trigger extraction from page context
  triggerPageContextExtraction() {
    // Dispatch a custom event that the extractor script listens for
    window.dispatchEvent(new CustomEvent('yt-analytics-extract-tags'));
  }
  
  // Get tags from page context via DOM element with retry
  async getTagsFromPageContextWithRetry(videoId, maxRetries = 12) {
    const delays = [100, 200, 400, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000]; // More retries with faster initial checks
    
    for (let i = 0; i < maxRetries; i++) {
      // Verify we're still on the same video
      const currentUrlVideoId = new URLSearchParams(window.location.search).get('v');
      if (currentUrlVideoId !== videoId) {
        console.log(`⚠️ Video changed during retry (${videoId} -> ${currentUrlVideoId}), stopping`);
        return null;
      }
      
      // Trigger extraction
      this.triggerPageContextExtraction();
      
      // Wait with increasing delay
      const delay = delays[i] || 4000;
      await new Promise(r => setTimeout(r, delay));
      
      // Try to read
      const result = this.getTagsFromPageContext(videoId);
      if (result && result.tags && result.tags.length > 0) {
        console.log(`✅ Got tags on attempt ${i + 1} (after ${delay}ms)`);
        return result;
      }
      
      console.log(`⏳ Retry ${i + 1}/${maxRetries} - no tags yet for ${videoId} (waited ${delay}ms)`);
    }
    
    return null;
  }
  
  // Get tags from page context via DOM element
  getTagsFromPageContext(videoId) {
    const container = document.getElementById('yt-analytics-data');
    if (!container) return null;
    
    const dataVideoId = container.getAttribute('data-video-id');
    if (dataVideoId !== videoId) {
      console.log(`⚠️ Page context has different video (${dataVideoId} vs ${videoId})`);
      return null;
    }
    
    try {
      const tags = JSON.parse(container.getAttribute('data-tags') || '[]');
      const source = container.getAttribute('data-source') || 'none';
      if (tags.length > 0) {
        console.log(`📨 Got ${tags.length} tags from page context (${source})`);
      }
      return { tags, source };
    } catch(e) {
      return null;
    }
  }

  init() {
    console.log('YouTube Analytics Vision: Initializing...');
    this.detectPageType();
    this.observePageChanges();
    
    if (this.isVideoPage) {
      // Wait for YouTube to load - increased to 3 seconds
      const initialVideoId = new URLSearchParams(window.location.search).get('v');
      this.currentVideoId = initialVideoId;
      
      this.pendingTimeout = setTimeout(() => {
        this.pendingTimeout = null;
        
        // Verify still same video
        const verifyVideoId = new URLSearchParams(window.location.search).get('v');
        if (verifyVideoId !== initialVideoId) {
          console.log(`❌ Initial load cancelled, video changed`);
          return;
        }
        
        console.log(`▶️ YouTube Analytics Vision: Initial load for video ${initialVideoId}...`);
        this.isExtracting = true;
        this.extractVideoDataAsync().then(() => {
          this.createOverlay();
          this.isExtracting = false;
        });
      }, 3000); // Increased from 2000 to 3000ms
    }
  }

  detectPageType() {
    const url = window.location.href;
    this.isVideoPage = url.includes('/watch?v=');
  }

  observePageChanges() {
    // YouTube is a SPA, so we need to watch for navigation changes
    let lastUrl = location.href;
    let lastVideoId = new URLSearchParams(location.search).get('v');
    
    // Method 1: Listen for YouTube's native navigation events (MOST RELIABLE)
    window.addEventListener('yt-navigate-finish', () => {
      const currentVideoId = new URLSearchParams(location.search).get('v');
      console.log(`🎯 yt-navigate-finish event: ${lastVideoId} -> ${currentVideoId}`);
      
      // Always trigger extraction on navigation
      this.triggerPageContextExtraction();
      setTimeout(() => this.triggerPageContextExtraction(), 500);
      setTimeout(() => this.triggerPageContextExtraction(), 1500);
      
      if (currentVideoId && currentVideoId !== lastVideoId) {
        this.onVideoChange(lastVideoId, currentVideoId);
        lastVideoId = currentVideoId;
        lastUrl = location.href;
      }
    });
    
    // Method 1b: Listen for page data update (fires when YouTube's internal data is ready)
    document.addEventListener('yt-page-data-updated', () => {
      const currentVideoId = new URLSearchParams(location.search).get('v');
      console.log(`📝 yt-page-data-updated: checking for video ${currentVideoId}`);
      
      // Trigger extraction in page context
      this.triggerPageContextExtraction();
      
      // If we're waiting for data and overlay isn't created yet, try now
      if (this.isVideoPage && currentVideoId && !this.overlayContainer && !this.isCreatingOverlay) {
        console.log(`📝 Data ready, extracting for ${currentVideoId}`);
        this.currentVideoId = currentVideoId;
        this.videoData = {};
        this.extractVideoDataAsync().then(() => {
          this.createOverlay();
        });
      }
    });
    
    // Method 2: Fallback MutationObserver for edge cases
    new MutationObserver(() => {
      const url = location.href;
      const currentVideoId = new URLSearchParams(location.search).get('v');
      
      // Check if URL or video ID changed
      if (url !== lastUrl || currentVideoId !== lastVideoId) {
        console.log(`🔄 URL/Video changed (MutationObserver): ${lastVideoId} -> ${currentVideoId}`);
        
        this.onVideoChange(lastVideoId, currentVideoId);
        lastUrl = url;
        lastVideoId = currentVideoId;
      }
    }).observe(document, { subtree: true, childList: true });
  }
  
  onVideoChange(oldVideoId, newVideoId) {
    // CANCEL any pending extraction
    if (this.pendingTimeout) {
      console.log('⏹️ Cancelling pending extraction');
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
    
    // Mark extraction as cancelled
    this.isExtracting = false;
    this.isCreatingOverlay = false;
    
    // IMMEDIATELY remove overlay and clear ALL data including cached tags
    this.removeOverlay();
    this.videoData = {};
    this.channelData = {};
    
    // Clear the data container for fresh extraction
    const container = document.getElementById('yt-analytics-data');
    if (container) {
      container.removeAttribute('data-video-id');
      container.removeAttribute('data-tags');
      container.removeAttribute('data-source');
    }
    
    // Re-inject the extraction script to ensure it's fresh
    this.reinjectExtractor();
    
    this.handlePageChange();
  }
  
  // Re-inject extractor and trigger extraction
  reinjectExtractor() {
    // Re-inject the extractor script in case it's not loaded
    const existingScript = document.querySelector('script[src*="extractor.js"]');
    if (!existingScript) {
      this.injectPageScript();
    }
    
    // Trigger extraction multiple times with delays
    this.triggerPageContextExtraction();
    setTimeout(() => this.triggerPageContextExtraction(), 500);
    setTimeout(() => this.triggerPageContextExtraction(), 1000);
    setTimeout(() => this.triggerPageContextExtraction(), 2000);
    console.log('🔄 Triggered multiple extractions');
  }

  handlePageChange() {
    this.detectPageType();
    console.log('YouTube Analytics Vision: Page changed, isVideoPage:', this.isVideoPage);
    
    if (this.isVideoPage) {
      // Get new video ID immediately
      const newVideoId = new URLSearchParams(window.location.search).get('v');
      
      // Only process if video actually changed
      if (this.currentVideoId === newVideoId) {
        console.log(`Same video (${newVideoId}), skipping reload`);
        return;
      }
      
      console.log(`Video changed: ${this.currentVideoId} → ${newVideoId}`);
      console.log(`📦 Before clear - videoData.videoId: ${this.videoData.videoId}, tags: ${this.videoData.tags?.length || 0}`);
      
      // CRITICAL: Clear ALL data IMMEDIATELY before starting new extraction
      this.videoData = {};
      this.channelData = {};
      this.currentVideoId = newVideoId;
      this.removeOverlay();
      
      console.log(`🧹 After clear - videoData: ${JSON.stringify(this.videoData)}, currentVideoId: ${this.currentVideoId}`);
      
      // Increase delay to 3 seconds for YouTube to fully load and meta tags to update
      this.pendingTimeout = setTimeout(() => {
        this.pendingTimeout = null;
        
        // Check if extraction was cancelled
        if (!this.isExtracting && this.currentVideoId !== newVideoId) {
          console.log(`❌ Extraction cancelled for ${newVideoId}`);
          return;
        }
        
        // Double-check video hasn't changed again during wait
        const verifyVideoId = new URLSearchParams(window.location.search).get('v');
        if (verifyVideoId !== newVideoId) {
          console.log(`Video changed again during load (${newVideoId} → ${verifyVideoId}), cancelling`);
          return;
        }
        
        console.log(`▶️ YouTube Analytics Vision: Extracting data for video ${newVideoId}...`);
        this.isExtracting = true;
        this.extractVideoDataAsync().then(() => {
          this.createOverlay();
          this.isExtracting = false;
        });
      }, 3000); // Increased from 2000 to 3000ms
    } else {
      this.removeOverlay();
      this.videoData = {};
      this.channelData = {};
    }
  }

  async extractVideoDataAsync() {
    try {
      // Extract video ID
      const urlParams = new URLSearchParams(window.location.search);
      const videoId = urlParams.get('v');
      
      console.log(`🔍 extractVideoData START - URL videoId: ${videoId}, this.currentVideoId: ${this.currentVideoId}`);
      
      // Verify this is still the current video (prevent race conditions)
      if (this.currentVideoId && this.currentVideoId !== videoId) {
        console.log(`Video changed during extraction (${this.currentVideoId} → ${videoId}), skipping stale data`);
        this.videoData = {};
        this.channelData = {};
        return;
      }
      
      this.currentVideoId = videoId;

      // Trigger page context extraction first
      this.triggerPageContextExtraction();

      // Extract data from YouTube's page data (pass videoId to verify data is fresh)
      const ytInitialData = this.getYouTubeData('ytInitialData', videoId);
      const ytInitialPlayerResponse = this.getYouTubeData('ytInitialPlayerResponse', videoId);

      // Extract basic info - Updated selectors for 2026
      const title = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent?.trim() || 
                    document.querySelector('h1 yt-formatted-string')?.textContent?.trim() ||
                    document.querySelector('h1.style-scope.ytd-watch-metadata')?.textContent?.trim() || 
                    'N/A';
      
      const channelName = document.querySelector('ytd-channel-name yt-formatted-string')?.textContent?.trim() || 
                         document.querySelector('#channel-name yt-formatted-string')?.textContent?.trim() ||
                         document.querySelector('ytd-video-owner-renderer .ytd-channel-name a')?.textContent?.trim() || 
                         'N/A';

      // Extract view count - Updated selector
      const viewCountElement = document.querySelector('.view-count') || 
                               document.querySelector('ytd-video-view-count-renderer span.style-scope') ||
                               document.querySelector('#info span.style-scope');
      const viewCount = viewCountElement?.textContent?.trim() || 'N/A';

      // Extract like count - Updated selector
      const likeButton = document.querySelector('like-button-view-model button[aria-label]') ||
                        document.querySelector('ytd-toggle-button-renderer button[aria-label*="like"]') ||
                        document.querySelector('#segmented-like-button button[aria-label]');
      const likeCount = likeButton?.getAttribute('aria-label') || 'N/A';

      // Extract description - Updated selector
      const description = document.querySelector('ytd-text-inline-expander#description-inline-expander yt-formatted-string')?.textContent?.trim() || 
                         document.querySelector('#description yt-formatted-string')?.textContent?.trim() || 
                         document.querySelector('ytd-video-secondary-info-renderer #description')?.textContent?.trim() ||
                         'N/A';

      // Extract upload date - Updated selector
      const uploadDate = document.querySelector('#info-container #info-strings yt-formatted-string')?.textContent?.trim() || 
                        document.querySelector('#info span.style-scope:not(.view-count)')?.textContent?.trim() ||
                        document.querySelector('ytd-video-primary-info-renderer #info-strings')?.textContent?.trim() || 
                        'N/A';

      // Extract tags from multiple sources with retry
      let tags = [];
      let tagsSource = 'none';
      
      // Method 0: Get tags from page context with retry - BEST for SPA
      const pageContextTags = await this.getTagsFromPageContextWithRetry(videoId, 5);
      if (pageContextTags && pageContextTags.tags?.length > 0) {
        tags = pageContextTags.tags;
        tagsSource = pageContextTags.source;
        console.log(`[${videoId}] ✅ Got ${tags.length} tags from page context (${tagsSource})`);
      }
      
      // Method 1: Try ytInitialPlayerResponse (only if video ID matches)
      if (tags.length === 0 && ytInitialPlayerResponse?.videoDetails?.keywords) {
        const apiVideoId = ytInitialPlayerResponse.videoDetails.videoId;
        if (apiVideoId === videoId) {
          tags = ytInitialPlayerResponse.videoDetails.keywords;
          tagsSource = 'api';
          console.log(`[${videoId}] ✅ Got tags from ytInitialPlayerResponse`);
        } else {
          console.log(`⚠️ ytInitialPlayerResponse is stale (${apiVideoId} vs ${videoId})`);
        }
      }
      
      // Method 2: Fallback to meta tags (verify they're fresh first)
      if (tags.length === 0) {
        const ogUrl = document.querySelector('meta[property="og:url"]')?.content || '';
        const metaVideoIdMatch = ogUrl.match(/[?&]v=([^&]+)/);
        const metaVideoId = metaVideoIdMatch ? metaVideoIdMatch[1] : null;
        
        if (metaVideoId === videoId) {
          const metaTags = Array.from(document.querySelectorAll('meta[property="og:video:tag"]'))
            .map(tag => tag.content);
          if (metaTags.length > 0) {
            tags = metaTags;
            tagsSource = 'meta';
            console.log(`[${videoId}] ✅ Got tags from meta tags`);
          }
        } else {
          console.log(`⚠️ Meta tags are stale (${metaVideoId} vs ${videoId}), skipping...`);
        }
      }
      
      // Method 3: Extract hashtags from description as fallback
      if (tags.length === 0 && description && description !== 'N/A') {
        const hashtags = description.match(/#[\w]+/g);
        if (hashtags && hashtags.length > 0) {
          tags = hashtags.map(tag => tag.substring(1)); // Remove # symbol
          tagsSource = 'hashtags';
          console.log(`[${videoId}] Extracted ${tags.length} hashtags from description`);
        }
      }
      
      // Final logging
      if (tags.length > 0) {
        console.log(`[Video: ${videoId}] ✅ Found ${tags.length} tags from ${tagsSource}`);
      } else {
        console.log(`[Video: ${videoId}] ⚠️ No tags found`);
      }

      // Extract category
      const category = document.querySelector('meta[itemprop="genre"]')?.content || 'N/A';

      // Extract duration
      const duration = ytInitialPlayerResponse?.videoDetails?.lengthSeconds || 'N/A';

      // Calculate engagement metrics
      const views = this.parseViewCount(viewCount);
      const likes = this.parseLikeCount(likeCount);
      const engagementRate = views > 0 ? ((likes / views) * 100).toFixed(2) : 'N/A';

      this.videoData = {
        videoId,
        title,
        channelName,
        viewCount,
        views,
        likeCount,
        likes,
        engagementRate,
        description,
        uploadDate,
        tags: tags.length > 0 ? tags : [],
        tagsSource: tagsSource,
        category,
        duration: this.formatDuration(duration),
        keywords: this.extractKeywords(title, description),
        seoScore: 0 // Will be calculated
      };
      
      // Calculate SEO score
      this.videoData.seoScore = this.calculateSEOScore();
      
      // Get channel data for monetization analysis
      this.extractChannelData();

      console.log('Extracted video data:', this.videoData);
    } catch (error) {
      console.error('Error extracting video data:', error);
    }
  }

  getYouTubeData(variableName, expectedVideoId = null) {
    try {
      const scriptTags = document.querySelectorAll('script');
      for (const script of scriptTags) {
        const content = script.textContent;
        if (content.includes(variableName)) {
          const match = content.match(new RegExp(`var ${variableName}\\s*=\\s*({.+?});`, 's'));
          if (match) {
            const data = JSON.parse(match[1]);
            
            // Verify video ID matches to prevent stale data in SPA navigation
            if (expectedVideoId) {
              let dataVideoId = null;
              
              if (variableName === 'ytInitialPlayerResponse') {
                dataVideoId = data?.videoDetails?.videoId;
              } else if (variableName === 'ytInitialData') {
                dataVideoId = data?.currentVideoEndpoint?.watchEndpoint?.videoId;
              }
              
              if (dataVideoId && dataVideoId !== expectedVideoId) {
                console.log(`⚠️ ${variableName} has stale data (${dataVideoId} vs expected ${expectedVideoId}), skipping...`);
                continue; // Try next script tag
              }
            }
            
            return data;
          }
        }
      }
    } catch (error) {
      console.error(`Error extracting ${variableName}:`, error);
    }
    return null;
  }

  parseViewCount(viewCountStr) {
    if (!viewCountStr || viewCountStr === 'N/A') return 0;
    
    const match = viewCountStr.match(/[\d,]+/);
    if (match) {
      return parseInt(match[0].replace(/,/g, ''));
    }
    return 0;
  }

  parseLikeCount(likeStr) {
    if (!likeStr || likeStr === 'N/A') return 0;
    
    // Extract number from string like "like this video along with 1,234 other people"
    const match = likeStr.match(/[\d,]+/);
    if (match) {
      return parseInt(match[0].replace(/,/g, ''));
    }
    return 0;
  }

  formatDuration(seconds) {
    if (!seconds || seconds === 'N/A') return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  extractKeywords(title, description) {
    // Simple keyword extraction (you can enhance this with NLP)
    const text = `${title} ${description}`.toLowerCase();
    const words = text.match(/\b\w{4,}\b/g) || [];
    
    // Count frequency
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Get top keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  async createOverlay() {
    // Prevent concurrent overlay creation
    if (this.isCreatingOverlay) {
      console.log('⚠️ Overlay creation already in progress, skipping...');
      return;
    }
    
    this.isCreatingOverlay = true;
    
    try {
      // First, aggressively remove ANY existing overlays
      const existingOverlays = document.querySelectorAll('#yt-analytics-overlay');
      if (existingOverlays.length > 0) {
        console.log(`Found ${existingOverlays.length} existing overlay(s), removing all...`);
        existingOverlays.forEach(o => o.remove());
        this.overlayContainer = null;
      }
      
      if (this.overlayContainer) {
        console.log('Overlay container still exists, removing...');
        this.overlayContainer.remove();
        this.overlayContainer = null;
      }
      
      // Verify we have valid video data for current video
      const currentUrlVideoId = new URLSearchParams(window.location.search).get('v');
      console.log(`🔍 createOverlay - videoData.videoId: ${this.videoData.videoId}, URL videoId: ${currentUrlVideoId}, currentVideoId: ${this.currentVideoId}`);
      console.log(`🏷️ videoData.tags (${this.videoData.tags?.length || 0}):`, this.videoData.tags?.slice(0, 3));
      
      if (!this.videoData.videoId || this.videoData.videoId !== currentUrlVideoId) {
        console.log(`❌ Overlay creation cancelled: videoData.videoId (${this.videoData.videoId}) doesn't match current video (${currentUrlVideoId})`);
        return;
      }
    
      console.log(`✅ Creating overlay for video ${this.videoData.videoId} with ${this.videoData.tags?.length || 0} tags`);
      console.log(`Tags preview:`, this.videoData.tags?.slice(0, 3));

    // Analyze monetization
    const monetizationData = await this.analyzeMonetization();

    this.overlayContainer = document.createElement('div');
    this.overlayContainer.id = 'yt-analytics-overlay';
    this.overlayContainer.className = 'yt-analytics-container';
    this.overlayContainer.setAttribute('data-video-id', this.videoData.videoId);

    this.overlayContainer.innerHTML = `
      <div class="yt-analytics-header">
        <h3>📊 Video Analytics</h3>
        <button class="yt-analytics-toggle">−</button>
      </div>
      <div class="yt-analytics-content">
        <div class="yt-analytics-section">
          <h4>📈 Engagement Metrics</h4>
          <div class="yt-analytics-metric">
            <span class="label">Views:</span>
            <span class="value">${this.videoData.viewCount}</span>
          </div>
          <div class="yt-analytics-metric">
            <span class="label">Likes:</span>
            <span class="value">${this.videoData.likeCount}</span>
          </div>
          <div class="yt-analytics-metric">
            <span class="label">Engagement Rate:</span>
            <span class="value ${this.getEngagementClass(this.videoData.engagementRate)}">${this.videoData.engagementRate}%</span>
          </div>
          <div class="yt-analytics-metric">
            <span class="label">Duration:</span>
            <span class="value">${this.videoData.duration}</span>
          </div>
        </div>

        <div class="yt-analytics-section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="margin: 0;">🏷️ Tags ${this.videoData.tags.length > 0 ? `(${this.videoData.tags.length})` : ''}</h4>
            ${this.videoData.tags.length > 0 ? `
              <button class="copy-tags-btn" style="background: #3ea6ff; color: white; border: none; padding: 4px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: all 0.2s;" title="Copy all tags">
                📋 Copy Tags
              </button>
            ` : ''}
          </div>
          ${this.videoData.tags.length > 0 ? `
            <div class="yt-analytics-tags">
              ${this.videoData.tags.map(tag => `<span class="tag" style="cursor: pointer;" title="Click to copy">${tag}</span>`).join('')}
            </div>
            ${this.videoData.tagsSource === 'extracted' ? '<p style="font-size: 10px; color: #888; margin-top: 8px;">* Extracted from title/description</p>' : ''}
          ` : `
            <div style="padding: 12px; background: rgba(244, 67, 54, 0.1); border: 1px solid #f44336; border-radius: 8px; margin-top: 8px;">
              <p style="color: #f44336; font-size: 12px; margin: 0;">⚠️ No tags found</p>
              <p style="color: #888; font-size: 11px; margin: 8px 0 0 0;">Video creator hasn't added any tags or hashtags</p>
            </div>
          `}
        </div>

        <div class="yt-analytics-section">
          <h4>🔑 Top Keywords</h4>
          <div class="yt-analytics-keywords">
            ${this.videoData.keywords.map(kw => `<span class="keyword">${kw}</span>`).join('')}
          </div>
        </div>

        <div class="yt-analytics-section">
          <h4>📋 Video Info</h4>
          <div class="yt-analytics-metric">
            <span class="label">Category:</span>
            <span class="value">${this.videoData.category}</span>
          </div>
          <div class="yt-analytics-metric">
            <span class="label">Upload Date:</span>
            <span class="value">${this.videoData.uploadDate}</span>
          </div>
        </div>

        ${this.renderAdvancedSEOSection()}
        
        ${this.renderMonetizationSection(monetizationData)}
      </div>
    `;

    // Insert overlay into the page - Try multiple selectors
    const secondaryColumn = document.querySelector('#secondary.style-scope.ytd-watch-flexy') ||
                           document.querySelector('#secondary') ||
                           document.querySelector('ytd-watch-flexy #secondary');
    
    if (secondaryColumn) {
      secondaryColumn.insertBefore(this.overlayContainer, secondaryColumn.firstChild);
      console.log('YouTube Analytics Vision: Overlay injected successfully!');
    } else {
      console.error('YouTube Analytics Vision: Could not find secondary column to inject overlay');
      // Fallback: Try to create our own container
      const player = document.querySelector('#player');
      if (player && player.parentElement) {
        const fallbackContainer = document.createElement('div');
        fallbackContainer.style.cssText = 'margin: 16px 0;';
        fallbackContainer.appendChild(this.overlayContainer);
        player.parentElement.insertBefore(fallbackContainer, player.nextSibling);
        console.log('YouTube Analytics Vision: Overlay injected using fallback method!');
      }
    }

    // Add toggle functionality
    const toggleBtn = this.overlayContainer.querySelector('.yt-analytics-toggle');
    const content = this.overlayContainer.querySelector('.yt-analytics-content');
    
    toggleBtn.addEventListener('click', () => {
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
      toggleBtn.textContent = content.style.display === 'none' ? '+' : '−';
    });
    
    // Add copy all tags functionality
    const copyAllBtn = this.overlayContainer.querySelector('.copy-tags-btn');
    if (copyAllBtn) {
      copyAllBtn.addEventListener('click', () => {
        const tagsText = this.videoData.tags.join(', ');
        navigator.clipboard.writeText(tagsText).then(() => {
          const originalText = copyAllBtn.textContent;
          copyAllBtn.textContent = '✅ Copied!';
          copyAllBtn.style.background = '#2ba640';
          setTimeout(() => {
            copyAllBtn.textContent = originalText;
            copyAllBtn.style.background = '#3ea6ff';
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy tags:', err);
          copyAllBtn.textContent = '❌ Failed';
          setTimeout(() => {
            copyAllBtn.textContent = '📋 Copy Tags';
          }, 2000);
        });
      });
    }
    
    // Add click to copy individual tags
    const tagElements = this.overlayContainer.querySelectorAll('.tag');
    tagElements.forEach((tagEl, index) => {
      tagEl.addEventListener('click', () => {
        const tagText = this.videoData.tags[index];
        navigator.clipboard.writeText(tagText).then(() => {
          const originalBg = tagEl.style.background;
          tagEl.style.background = '#2ba640';
          tagEl.style.transform = 'scale(1.05)';
          setTimeout(() => {
            tagEl.style.background = originalBg;
            tagEl.style.transform = 'scale(1)';
          }, 500);
        }).catch(err => {
          console.error('Failed to copy tag:', err);
        });
      });
      
      // Add hover effect
      tagEl.addEventListener('mouseenter', () => {
        tagEl.style.transform = 'scale(1.05)';
      });
      tagEl.addEventListener('mouseleave', () => {
        tagEl.style.transform = 'scale(1)';
      });
    });
    } finally {
      this.isCreatingOverlay = false;
    }
  }

  getEngagementClass(rate) {
    if (rate === 'N/A') return '';
    const numRate = parseFloat(rate);
    if (numRate >= 5) return 'high';
    if (numRate >= 2) return 'medium';
    return 'low';
  }

  calculateSEOScore() {
    let score = 0;
    
    // Title length (optimal: 50-70 chars)
    if (this.videoData.title.length >= 50 && this.videoData.title.length <= 70) {
      score += 20;
    } else if (this.videoData.title.length >= 30) {
      score += 10;
    }
    
    // Has tags
    if (this.videoData.tags.length > 5) {
      score += 25;
    } else if (this.videoData.tags.length > 0) {
      score += 15;
    }
    
    // Description length (optimal: >250 chars)
    if (this.videoData.description.length > 250) {
      score += 25;
    } else if (this.videoData.description.length > 100) {
      score += 15;
    }
    
    // Engagement rate
    const engRate = parseFloat(this.videoData.engagementRate);
    if (!isNaN(engRate)) {
      if (engRate >= 5) score += 30;
      else if (engRate >= 2) score += 20;
      else if (engRate >= 1) score += 10;
    }
    
    return Math.min(score, 100);
  }

  // Render Advanced SEO Analysis Section (YouTube Algorithm Aligned)
  renderAdvancedSEOSection() {
    if (!this.seoAnalyzer) {
      return `
        <div class="yt-analytics-section">
          <h4>🎯 SEO Analysis</h4>
          <p style="color: #888; font-size: 12px;">Loading...</p>
        </div>
      `;
    }

    const analysis = this.seoAnalyzer.analyzeVideo(this.videoData);
    const grade = this.seoAnalyzer.getGrade(analysis.overallScore);
    const { breakdown } = analysis;

    // CTR factors HTML
    const ctrFactorsHtml = breakdown.ctrPotential.factors.length > 0 
      ? breakdown.ctrPotential.factors.map(f => 
          `<span style="display: inline-block; background: ${f.impact.startsWith('+') ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'}; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin: 2px;">${f.factor}: ${f.impact}</span>`
        ).join('')
      : '<span style="color: #888; font-size: 11px;">No CTR boosting factors found</span>';

    // Recommendations HTML (top 5)
    const recsHtml = analysis.recommendations.slice(0, 5).map(rec => `
      <div style="background: ${rec.priority === 'high' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(241, 196, 15, 0.1)'}; padding: 8px; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid ${rec.priority === 'high' ? '#e74c3c' : '#f1c40f'};">
        <span style="font-size: 11px; color: ${rec.priority === 'high' ? '#e74c3c' : '#f1c40f'}; font-weight: bold;">${rec.priority.toUpperCase()}</span>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #ccc;">${rec.suggestion}</p>
      </div>
    `).join('');

    // Strengths HTML
    const strengthsHtml = analysis.strengths.length > 0 
      ? analysis.strengths.map(s => `<div style="font-size: 11px; color: #2ecc71; margin: 2px 0;">${s}</div>`).join('')
      : '';

    // Warnings HTML  
    const warningsHtml = analysis.warnings.length > 0
      ? analysis.warnings.map(w => `<div style="font-size: 11px; color: #e74c3c; margin: 2px 0;">${w}</div>`).join('')
      : '';

    return `
      <div class="yt-analytics-section">
        <h4>🎯 YouTube SEO Analysis</h4>
        
        <!-- Overall Score with Grade -->
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="background: ${grade.color}; color: white; width: 50px; height: 50px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold;">
            ${grade.grade}
          </div>
          <div style="flex: 1;">
            <div style="font-size: 14px; font-weight: bold; color: #fff;">${analysis.overallScore}/100</div>
            <div class="score-bar" style="margin-top: 4px;">
              <div class="score-fill" style="width: ${analysis.overallScore}%; background: ${grade.color};"></div>
            </div>
          </div>
        </div>

        <!-- Breakdown Scores -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px;">
            <div style="font-size: 10px; color: #888;">📝 Title</div>
            <div style="font-size: 14px; font-weight: bold; color: ${breakdown.title.score >= 60 ? '#2ecc71' : '#e74c3c'};">${breakdown.title.score}/100</div>
          </div>
          <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px;">
            <div style="font-size: 10px; color: #888;">📄 Description</div>
            <div style="font-size: 14px; font-weight: bold; color: ${breakdown.description.score >= 60 ? '#2ecc71' : '#e74c3c'};">${breakdown.description.score}/100</div>
          </div>
          <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px;">
            <div style="font-size: 10px; color: #888;">🏷️ Tags</div>
            <div style="font-size: 14px; font-weight: bold; color: ${breakdown.tags.score >= 60 ? '#2ecc71' : '#e74c3c'};">${breakdown.tags.score}/100</div>
          </div>
          <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px;">
            <div style="font-size: 10px; color: #888;">🎯 CTR Potential</div>
            <div style="font-size: 14px; font-weight: bold; color: ${breakdown.ctrPotential.score >= 60 ? '#2ecc71' : '#e74c3c'};">${breakdown.ctrPotential.score}/100</div>
          </div>
        </div>

        ${strengthsHtml ? `<div style="margin-bottom: 8px;">${strengthsHtml}</div>` : ''}
        ${warningsHtml ? `<div style="margin-bottom: 8px;">${warningsHtml}</div>` : ''}
      </div>

      <div class="yt-analytics-section">
        <h4>🎯 CTR Boost Factors</h4>
        <div style="margin-bottom: 8px;">
          ${ctrFactorsHtml}
        </div>
        <div style="font-size: 10px; color: #888; margin-top: 8px;">
          Predicted CTR: <span style="color: ${breakdown.ctrPotential.predictedCTR === 'excellent' || breakdown.ctrPotential.predictedCTR === 'high' ? '#2ecc71' : '#f1c40f'}; font-weight: bold;">${breakdown.ctrPotential.predictedCTR.replace('_', ' ').toUpperCase()}</span>
        </div>
      </div>

      <div class="yt-analytics-section">
        <h4>💡 SEO Recommendations</h4>
        ${recsHtml || '<p style="color: #888; font-size: 12px;">Great job! No major issues found.</p>'}
      </div>

      <div class="yt-analytics-section">
        <h4>📊 Quick Stats</h4>
        <div class="yt-analytics-metric">
          <span class="label">Title Length:</span>
          <span class="value" style="color: ${breakdown.title.lengthStatus === 'optimal' ? '#2ecc71' : '#f1c40f'};">${breakdown.title.length} chars ${breakdown.title.lengthStatus === 'optimal' ? '✓' : ''}</span>
        </div>
        <div class="yt-analytics-metric">
          <span class="label">Desc Words:</span>
          <span class="value" style="color: ${breakdown.description.wordCount >= 250 ? '#2ecc71' : '#f1c40f'};">${breakdown.description.wordCount || 0}</span>
        </div>
        <div class="yt-analytics-metric">
          <span class="label">Tags Count:</span>
          <span class="value" style="color: ${breakdown.tags.count >= 8 ? '#2ecc71' : '#f1c40f'};">${breakdown.tags.count} ${breakdown.tags.countStatus === 'optimal' ? '✓' : ''}</span>
        </div>
        <div class="yt-analytics-metric">
          <span class="label">Has Timestamps:</span>
          <span class="value" style="color: ${breakdown.description.hasTimestamps ? '#2ecc71' : '#e74c3c'};">${breakdown.description.hasTimestamps ? 'Yes ✓' : 'No ✗'}</span>
        </div>
        <div class="yt-analytics-metric">
          <span class="label">Has Hashtags:</span>
          <span class="value" style="color: ${breakdown.description.hashtags?.length > 0 ? '#2ecc71' : '#f1c40f'};">${breakdown.description.hashtags?.length || 0}</span>
        </div>
      </div>
    `;
  }

  removeOverlay() {
    if (this.overlayContainer) {
      console.log('Removing overlay...');
      this.overlayContainer.remove();
      this.overlayContainer = null;
    }
    
    // Also remove any orphaned overlays (safety check)
    const orphanedOverlays = document.querySelectorAll('#yt-analytics-overlay');
    orphanedOverlays.forEach(overlay => {
      console.log('Removing orphaned overlay');
      overlay.remove();
    });
  }
  
  extractChannelData() {
    try {
      // Extract subscriber count
      const subscriberElement = document.querySelector('#owner-sub-count') ||
                                document.querySelector('ytd-video-owner-renderer #subscriber-count');
      const subscribers = subscriberElement?.textContent?.trim() || 'N/A';
      
      this.channelData = {
        subscribers: subscribers
      };
      
      console.log('Channel data extracted:', this.channelData);
    } catch (error) {
      console.error('Error extracting channel data:', error);
      this.channelData = {};
    }
  }
  
  async analyzeMonetization() {
    if (!this.monetizationAnalyzer) return null;
    
    try {
      // Detect monetization status
      const monetizationStatus = await this.monetizationAnalyzer.detectMonetization(
        this.channelData, 
        this.videoData
      );
      
      // Estimate earnings
      const earnings = this.monetizationAnalyzer.estimateEarnings(
        this.videoData,
        this.channelData
      );
      
      // Estimate subscriber growth
      const subscriberGrowth = this.monetizationAnalyzer.estimateSubscriberGrowth(
        this.videoData,
        this.channelData
      );
      
      return {
        monetizationStatus,
        earnings,
        subscriberGrowth
      };
    } catch (error) {
      console.error('Error analyzing monetization:', error);
      return null;
    }
  }
  
  renderMonetizationSection(data) {
    if (!data) {
      return `
        <div class="yt-analytics-section">
          <h4>💰 Monetization Analysis</h4>
          <p style="color: #888; font-size: 12px;">Analysis in progress...</p>
        </div>
      `;
    }
    
    const { monetizationStatus, earnings, subscriberGrowth } = data;
    
    // Status badge
    let statusBadge = '';
    if (monetizationStatus.status === 'monetized') {
      statusBadge = '<span style="background: #2ba640; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">✓ Monetized</span>';
    } else if (monetizationStatus.status === 'likely_monetized') {
      statusBadge = '<span style="background: #ff9800; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">⚠ Likely Monetized</span>';
    } else {
      statusBadge = '<span style="background: #f44336; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">✗ Not Monetized</span>';
    }
    
    return `
      <div class="yt-analytics-section">
        <h4>💰 Monetization Status</h4>
        <div style="margin-bottom: 12px;">
          ${statusBadge}
          <p style="color: #888; font-size: 11px; margin-top: 6px;">${monetizationStatus.reasons[0]}</p>
        </div>
        
        <div class="yt-analytics-metric">
          <span class="label">Subs Required:</span>
          <span class="value">${monetizationStatus.requirements.subscribers.current} / 1,000</span>
        </div>
      </div>
      
      <div class="yt-analytics-section">
        <h4>💵 Estimated Earnings</h4>
        ${earnings.error ? `
          <p style="color: #888; font-size: 12px;">${earnings.error}</p>
        ` : `
          <div class="yt-analytics-metric">
            <span class="label">Est. Range:</span>
            <span class="value" style="color: #2ba640;">$${earnings.estimated.min} - $${earnings.estimated.max}</span>
          </div>
          <div class="yt-analytics-metric">
            <span class="label">Est. Average:</span>
            <span class="value" style="color: #2ba640; font-weight: bold;">$${earnings.estimated.average}</span>
          </div>
          <div class="yt-analytics-metric">
            <span class="label">CPM Category:</span>
            <span class="value">${earnings.cpmCategory}</span>
          </div>
          <p style="color: #666; font-size: 10px; margin-top: 8px; font-style: italic;">
            * Based on ${earnings.breakdown.monetizedViews} monetized views at $${earnings.cpmRange.min}-$${earnings.cpmRange.max} CPM
          </p>
        `}
      </div>
      
      <div class="yt-analytics-section">
        <h4>📈 Est. Subscriber Growth</h4>
        ${subscriberGrowth.error ? `
          <p style="color: #888; font-size: 12px;">${subscriberGrowth.error}</p>
        ` : `
          <div class="yt-analytics-metric">
            <span class="label">New Subscribers:</span>
            <span class="value" style="color: #3ea6ff; font-weight: bold;">+${subscriberGrowth.estimated.toLocaleString()}</span>
          </div>
          <div class="yt-analytics-metric">
            <span class="label">Conversion Rate:</span>
            <span class="value">${subscriberGrowth.conversionRate}</span>
          </div>
          <div class="yt-analytics-metric">
            <span class="label">Video Quality:</span>
            <span class="value">${subscriberGrowth.quality}</span>
          </div>
          <p style="color: #666; font-size: 10px; margin-top: 8px; font-style: italic;">
            * ${subscriberGrowth.note}
          </p>
        `}
      </div>
    `;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new YouTubeAnalytics();
  });
} else {
  new YouTubeAnalytics();
}
