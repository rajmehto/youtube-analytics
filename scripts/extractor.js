// This script runs in the PAGE context (injected via src, not inline)
// It can access YouTube's internal data objects

(function() {
  if (window.__ytAnalyticsExtractorLoaded) return;
  window.__ytAnalyticsExtractorLoaded = true;
  
  console.log('[YT-Extractor] Script loaded in page context');
  
  // Create data container if not exists
  if (!document.getElementById('yt-analytics-data')) {
    const container = document.createElement('div');
    container.id = 'yt-analytics-data';
    container.style.display = 'none';
    document.body.appendChild(container);
  }
  
  window.extractYTTags = function() {
    const videoId = new URLSearchParams(window.location.search).get('v');
    if (!videoId) {
      console.log('[YT-Extractor] No video ID in URL');
      return { tags: [], source: 'none', videoId: null };
    }
    
    let tags = [];
    let source = 'none';
    
    console.log('[YT-Extractor] Extracting for video:', videoId);
    
    try {
      // Method 0: movie_player.getPlayerResponse() - MOST RELIABLE for SPA navigation
      const moviePlayer = document.getElementById('movie_player');
      if (moviePlayer?.getPlayerResponse) {
        try {
          const playerResponse = moviePlayer.getPlayerResponse();
          if (playerResponse?.videoDetails?.videoId === videoId) {
            console.log('[YT-Extractor] movie_player matches current video');
            if (playerResponse.videoDetails.keywords?.length > 0) {
              tags = playerResponse.videoDetails.keywords;
              source = 'movie_player.getPlayerResponse()';
              console.log('[YT-Extractor] Got', tags.length, 'tags from movie_player');
            } else {
              console.log('[YT-Extractor] Video has no keywords in movie_player');
            }
          } else {
            console.log('[YT-Extractor] movie_player has different video:', 
              playerResponse?.videoDetails?.videoId, 'vs', videoId);
          }
        } catch(e) {
          console.log('[YT-Extractor] movie_player.getPlayerResponse() failed:', e.message);
        }
      }
      
      // Method 1: Try ytd-watch-flexy's internal data (fallback)
      if (tags.length === 0) {
        const watchFlexy = document.querySelector('ytd-watch-flexy');
        if (watchFlexy) {
          console.log('[YT-Extractor] watchFlexy found, checking internal data...');
          
          // Try ALL possible paths to get playerResponse
          const possibleSources = [
            { path: 'watchFlexy.__data?.playerResponse', data: watchFlexy.__data?.playerResponse },
            { path: 'watchFlexy.playerResponse', data: watchFlexy.playerResponse },
            { path: 'watchFlexy.__data?.player?.playerResponse', data: watchFlexy.__data?.player?.playerResponse },
          ];
          
          // Try ytd-page-manager
          const pageManager = document.querySelector('ytd-page-manager');
          if (pageManager) {
            possibleSources.push({ 
              path: 'pageManager.__data?.data?.playerResponse', 
              data: pageManager.__data?.data?.playerResponse 
            });
          }
          
          for (const { path, data } of possibleSources) {
            if (data?.videoDetails?.videoId === videoId) {
              console.log('[YT-Extractor] Found matching playerResponse at:', path);
              if (data.videoDetails.keywords?.length > 0) {
                tags = data.videoDetails.keywords;
                source = path;
                console.log('[YT-Extractor] Got', tags.length, 'tags');
                break;
              } else {
                console.log('[YT-Extractor] Video has no keywords in this source');
              }
            }
          }
        }
      }
      
      // Method 2: Try ytInitialPlayerResponse global (for fresh page loads)
      if (tags.length === 0 && typeof ytInitialPlayerResponse !== 'undefined') {
        console.log('[YT-Extractor] Checking ytInitialPlayerResponse...');
        if (ytInitialPlayerResponse?.videoDetails?.videoId === videoId) {
          if (ytInitialPlayerResponse.videoDetails.keywords?.length > 0) {
            tags = ytInitialPlayerResponse.videoDetails.keywords;
            source = 'ytInitialPlayerResponse';
            console.log('[YT-Extractor] Got', tags.length, 'tags from global');
          }
        } else {
          console.log('[YT-Extractor] ytInitialPlayerResponse is for different video:', 
            ytInitialPlayerResponse?.videoDetails?.videoId);
        }
      }
      
    } catch(e) {
      console.error('[YT-Extractor] Error:', e);
    }
    
    // Store in DOM element
    const container = document.getElementById('yt-analytics-data');
    if (container) {
      container.setAttribute('data-video-id', videoId);
      container.setAttribute('data-tags', JSON.stringify(tags));
      container.setAttribute('data-source', source);
      container.setAttribute('data-timestamp', Date.now().toString());
      console.log('[YT-Extractor] Saved to DOM:', videoId, tags.length, 'tags');
    }
    
    return { tags, source, videoId };
  };
  
  // Extract on YouTube navigation events - more aggressive retries
  document.addEventListener('yt-navigate-finish', () => {
    console.log('[YT-Extractor] yt-navigate-finish event');
    // More frequent retries at the start when data is most likely to appear
    setTimeout(window.extractYTTags, 100);
    setTimeout(window.extractYTTags, 300);
    setTimeout(window.extractYTTags, 600);
    setTimeout(window.extractYTTags, 1000);
    setTimeout(window.extractYTTags, 1500);
    setTimeout(window.extractYTTags, 2000);
    setTimeout(window.extractYTTags, 3000);
  });
  
  // Extract on page data update
  document.addEventListener('yt-page-data-updated', () => {
    console.log('[YT-Extractor] yt-page-data-updated event');
    setTimeout(window.extractYTTags, 100);
  });
  
  // Listen for trigger from content script
  window.addEventListener('yt-analytics-extract-tags', () => {
    console.log('[YT-Extractor] Triggered by content script');
    window.extractYTTags();
  });
  
  // Extract immediately
  window.extractYTTags();
  setTimeout(window.extractYTTags, 500);
  setTimeout(window.extractYTTags, 1500);
  
  console.log('[YT-Extractor] Setup complete');
})();
