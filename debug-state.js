// Debug Current State - Run in Console (F12)
// This shows what video extension thinks it's displaying

console.log('=== Extension State Debug ===\n');

// Current URL
const urlVideoId = new URLSearchParams(window.location.search).get('v');
console.log('1. Current URL Video ID:', urlVideoId);

// Check if overlay exists
const overlay = document.querySelector('#yt-analytics-overlay');
console.log('2. Overlay exists:', overlay ? 'YES' : 'NO');

if (overlay) {
  // Check what tags are displayed
  const tagElements = overlay.querySelectorAll('.tag');
  const displayedTags = Array.from(tagElements).map(el => el.textContent);
  console.log('3. Displayed tags:', displayedTags.length);
  console.log('   Tags:', displayedTags.slice(0, 5));
}

// Check actual meta tags on page
const metaTags = Array.from(document.querySelectorAll('meta[property="og:video:tag"]'));
const actualTags = metaTags.map(t => t.content);
console.log('4. Actual page meta tags:', actualTags.length);
console.log('   Tags:', actualTags.slice(0, 5));

// Check if they match
if (overlay && actualTags.length > 0) {
  const tagElements = overlay.querySelectorAll('.tag');
  const displayedTags = Array.from(tagElements).map(el => el.textContent);
  const firstDisplayed = displayedTags[0];
  const firstActual = actualTags[0];
  
  if (firstDisplayed === firstActual) {
    console.log('\n✅ CORRECT: Tags match!');
  } else {
    console.log('\n❌ ERROR: Tags DO NOT match!');
    console.log('   Displayed first tag:', firstDisplayed);
    console.log('   Actual first tag:', firstActual);
    console.log('   → Extension showing STALE data');
  }
}

// Video title check
const titleElement = document.querySelector('h1 yt-formatted-string');
console.log('\n5. Video Title:', titleElement?.textContent?.trim().substring(0, 50));

console.log('\n=== End Debug ===');
