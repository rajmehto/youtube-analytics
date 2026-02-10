// Popup script for YouTube Analytics Vision

document.getElementById('openYouTube').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://www.youtube.com' });
});

// Check if current tab is YouTube
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];
  const statusElement = document.querySelector('.status');
  
  if (currentTab.url && currentTab.url.includes('youtube.com')) {
    statusElement.classList.add('active');
    statusElement.querySelector('.status-text').textContent = '✓ Extension Active on YouTube';
  } else {
    statusElement.classList.remove('active');
    statusElement.querySelector('.status-text').textContent = '⚠ Navigate to YouTube to use';
  }
});
