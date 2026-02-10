// YouTube Analytics Vision - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Analytics Vision installed successfully!');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchAnalytics') {
    // Here you can add API calls to external analytics services
    // For now, we'll just acknowledge the message
    sendResponse({ status: 'success' });
  }
  return true;
});

// Optional: Add context menu items
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyzeVideo',
    title: 'Analyze this video',
    contexts: ['page'],
    documentUrlPatterns: ['*://*.youtube.com/watch?v=*']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyzeVideo') {
    chrome.tabs.sendMessage(tab.id, { action: 'analyzeVideo' });
  }
});
