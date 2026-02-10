// QUICK CHECK - One line command
// Copy-paste this in Console (F12) to check if tags are correct

(() => {
  const urlId = new URLSearchParams(location.search).get('v');
  const panelTags = Array.from(document.querySelectorAll('#yt-analytics-overlay .tag')).map(t => t.textContent);
  const metaTags = Array.from(document.querySelectorAll('meta[property="og:video:tag"]')).map(t => t.content);
  
  console.log('\n🔍 QUICK CHECK:');
  console.log('Video ID:', urlId);
  console.log('Panel shows:', panelTags.length, 'tags →', panelTags.slice(0, 3));
  console.log('Page has:', metaTags.length, 'tags →', metaTags.slice(0, 3));
  console.log('Match?', panelTags[0] === metaTags[0] ? '✅ YES' : '❌ NO - STALE DATA!');
})();
