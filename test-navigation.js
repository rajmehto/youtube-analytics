// Test Navigation - Run in Console
// This tests if quick navigation properly cancels old extractions

console.log('=== Navigation Test ===\n');
console.log('Instructions:');
console.log('1. Open this console');
console.log('2. Go to Video A');
console.log('3. QUICKLY (within 3 seconds) click Video B');
console.log('4. Watch console logs\n');

console.log('Expected behavior:');
console.log('✅ "⏹️ Cancelling pending extraction"');
console.log('✅ "🔄 URL/Video changed: A -> B"');
console.log('✅ Only Video B overlay appears');
console.log('❌ Should NOT see Video A overlay\n');

console.log('Current video:', new URLSearchParams(location.search).get('v'));
console.log('Overlay exists:', !!document.querySelector('#yt-analytics-overlay'));

if (document.querySelector('#yt-analytics-overlay')) {
  const tags = Array.from(document.querySelectorAll('#yt-analytics-overlay .tag'));
  console.log('Showing tags:', tags.slice(0, 3).map(t => t.textContent));
}

console.log('\n👉 Now click another video and watch the logs!');
