// Paste this in console to check current state
console.log('\n=== CURRENT STATE ===');
const currentVideoId = new URLSearchParams(window.location.search).get('v');
console.log('✅ Current Video ID:', currentVideoId);

// Check meta tags
const metaTags = Array.from(document.querySelectorAll('meta[property="og:video:tag"]')).map(t => t.content);
console.log(`📋 Meta tags (${metaTags.length}):`, metaTags.slice(0, 5));

// Check overlay
const overlays = document.querySelectorAll('#yt-analytics-overlay');
console.log(`\n📦 Overlays found: ${overlays.length}`);
overlays.forEach((o, i) => {
  const overlayVideoId = o.getAttribute('data-video-id');
  const match = overlayVideoId === currentVideoId ? '✅ MATCH' : '❌ MISMATCH';
  console.log(`  Overlay ${i}: ${overlayVideoId} ${match}`);
  
  // Check displayed tags
  const displayedTags = Array.from(o.querySelectorAll('.tag')).map(t => t.textContent);
  console.log(`  Tags shown (${displayedTags.length}):`, displayedTags.slice(0, 3));
});

if (overlays.length === 0) {
  console.log('⚠️ No overlay found - extension might be loading');
}

console.log('\n=====================\n');
