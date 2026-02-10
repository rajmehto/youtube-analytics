// Test Tags Extraction - Run in Console on YouTube Video Page

console.log('=== Tag Extraction Test ===\n');

// Method 1: Meta Tags
console.log('Method 1: Meta Tags');
const metaTags = Array.from(document.querySelectorAll('meta[property="og:video:tag"]'));
console.log(`Found ${metaTags.length} meta tags`);
console.log('Tags:', metaTags.map(t => t.content));

// Method 2: ytInitialPlayerResponse
console.log('\nMethod 2: ytInitialPlayerResponse');
try {
  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    if (script.textContent.includes('ytInitialPlayerResponse')) {
      const match = script.textContent.match(/var ytInitialPlayerResponse\s*=\s*({.+?});/s);
      if (match) {
        const data = JSON.parse(match[1]);
        console.log('Keywords found:', data.videoDetails?.keywords?.length || 0);
        console.log('Tags:', data.videoDetails?.keywords?.slice(0, 10));
        break;
      }
    }
  }
} catch (e) {
  console.error('Error:', e);
}

// Method 3: ytInitialData
console.log('\nMethod 3: ytInitialData');
try {
  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    if (script.textContent.includes('var ytInitialData')) {
      const match = script.textContent.match(/var ytInitialData\s*=\s*({.+?});/s);
      if (match) {
        const data = JSON.parse(match[1]);
        const videoInfo = data?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.[1];
        const metadataRows = videoInfo?.videoSecondaryInfoRenderer?.metadataRowContainer?.metadataRowContainerRenderer?.rows;
        
        if (metadataRows) {
          console.log('Found metadata rows:', metadataRows.length);
          for (const row of metadataRows) {
            const title = row.metadataRowRenderer?.title?.simpleText;
            if (title) {
              console.log(`  Row: ${title}`);
              if (title.toLowerCase().includes('tag')) {
                const contents = row.metadataRowRenderer?.contents?.[0]?.runs || [];
                console.log('  Tags from row:', contents.map(r => r.text));
              }
            }
          }
        } else {
          console.log('No metadata rows found');
        }
        break;
      }
    }
  }
} catch (e) {
  console.error('Error:', e);
}

// Method 4: Check current video ID
console.log('\nCurrent Video:');
const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('v');
console.log('Video ID:', videoId);

// Method 4: Check description hashtags
console.log('\nMethod 4: Description Hashtags');
const descElement = document.querySelector('ytd-text-inline-expander#description-inline-expander');
if (descElement) {
  const descText = descElement.textContent;
  const hashtags = descText.match(/#[\w]+/g);
  if (hashtags) {
    console.log('Found hashtags:', hashtags.length);
    console.log('Hashtags:', hashtags.slice(0, 10));
  } else {
    console.log('No hashtags in description');
  }
} else {
  console.log('Description not found');
}

// Method 5: Generate from title
console.log('\nMethod 5: Generate from Title');
const titleElement = document.querySelector('h1 yt-formatted-string');
if (titleElement) {
  const titleText = titleElement.textContent;
  console.log('Title:', titleText);
  
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'full', 'movie', 'video']);
  const titleWords = titleText.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))
    .slice(0, 8);
  
  console.log('Generated tags from title:', titleWords);
} else {
  console.log('Title not found');
}

console.log('\n=== Test Complete ===');
console.log('\n💡 Recommendation:');
if (metaTags.length > 0) {
  console.log('✅ Use Method 1 (Meta tags) - Most reliable');
} else {
  console.log('⚠️ Meta tags not available');
  console.log('Extension will use fallback methods (hashtags or title keywords)');
}
