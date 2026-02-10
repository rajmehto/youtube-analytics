// Test script to check YouTube selectors
// Open YouTube video page and run this in console

console.log('=== YouTube Analytics Vision - Selector Test ===');

// Test video detection
const isVideoPage = window.location.href.includes('/watch?v=');
console.log('1. Is Video Page:', isVideoPage);

// Test title selectors
console.log('\n2. Title Selectors:');
console.log('  - h1.ytd-watch-metadata yt-formatted-string:', document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent?.trim());
console.log('  - h1 yt-formatted-string:', document.querySelector('h1 yt-formatted-string')?.textContent?.trim());

// Test channel selectors
console.log('\n3. Channel Selectors:');
console.log('  - ytd-channel-name yt-formatted-string:', document.querySelector('ytd-channel-name yt-formatted-string')?.textContent?.trim());
console.log('  - #channel-name:', document.querySelector('#channel-name')?.textContent?.trim());

// Test view count selectors
console.log('\n4. View Count Selectors:');
console.log('  - .view-count:', document.querySelector('.view-count')?.textContent?.trim());
console.log('  - ytd-video-view-count-renderer:', document.querySelector('ytd-video-view-count-renderer')?.textContent?.trim());

// Test like button selectors
console.log('\n5. Like Button Selectors:');
const likeBtn1 = document.querySelector('like-button-view-model button[aria-label]');
const likeBtn2 = document.querySelector('ytd-toggle-button-renderer button[aria-label*="like"]');
const likeBtn3 = document.querySelector('#segmented-like-button button[aria-label]');
console.log('  - like-button-view-model:', likeBtn1?.getAttribute('aria-label'));
console.log('  - ytd-toggle-button-renderer:', likeBtn2?.getAttribute('aria-label'));
console.log('  - #segmented-like-button:', likeBtn3?.getAttribute('aria-label'));

// Test description selectors
console.log('\n6. Description Selectors:');
const desc1 = document.querySelector('ytd-text-inline-expander#description-inline-expander');
const desc2 = document.querySelector('#description');
console.log('  - ytd-text-inline-expander:', desc1?.textContent?.trim().substring(0, 100));
console.log('  - #description:', desc2?.textContent?.trim().substring(0, 100));

// Test secondary column (where panel should appear)
console.log('\n7. Secondary Column (Injection Point):');
const secondary1 = document.querySelector('#secondary.style-scope.ytd-watch-flexy');
const secondary2 = document.querySelector('#secondary');
console.log('  - #secondary.style-scope.ytd-watch-flexy:', secondary1 ? 'Found ✓' : 'Not found ✗');
console.log('  - #secondary:', secondary2 ? 'Found ✓' : 'Not found ✗');

// Test tags
console.log('\n8. Video Tags:');
const tags = Array.from(document.querySelectorAll('meta[property="og:video:tag"]')).map(tag => tag.content);
console.log('  - Found', tags.length, 'tags:', tags.slice(0, 3));

console.log('\n=== Test Complete ===');
