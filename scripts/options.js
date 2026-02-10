// Options page script

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const clearApiKeyBtn = document.getElementById('clearApiKey');
  const clearStorageBtn = document.getElementById('clearStorage');
  const successMessage = document.getElementById('successMessage');
  const errorMessage = document.getElementById('errorMessage');
  const apiStatus = document.getElementById('apiStatus');

  // Load existing API key
  const loadApiKey = async () => {
    const result = await chrome.storage.sync.get(['youtubeApiKey']);
    if (result.youtubeApiKey) {
      apiKeyInput.value = result.youtubeApiKey;
      apiStatus.classList.add('active');
      apiStatus.classList.remove('inactive');
    } else {
      apiStatus.classList.add('inactive');
      apiStatus.classList.remove('active');
    }
  };

  // Show message
  const showMessage = (message, type = 'success') => {
    const messageEl = type === 'success' ? successMessage : errorMessage;
    messageEl.textContent = message;
    messageEl.style.display = 'block';

    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 3000);
  };

  // Save API key
  saveApiKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showMessage('Please enter an API key', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({ youtubeApiKey: apiKey });
      apiStatus.classList.add('active');
      apiStatus.classList.remove('inactive');
      showMessage('✓ API key saved successfully!', 'success');
    } catch (error) {
      showMessage('Failed to save API key: ' + error.message, 'error');
    }
  });

  // Clear API key
  clearApiKeyBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to remove your API key? Advanced features will be disabled.')) {
      try {
        await chrome.storage.sync.remove(['youtubeApiKey']);
        apiKeyInput.value = '';
        apiStatus.classList.add('inactive');
        apiStatus.classList.remove('active');
        showMessage('✓ API key removed', 'success');
      } catch (error) {
        showMessage('Failed to remove API key: ' + error.message, 'error');
      }
    }
  });

  // Clear all storage
  clearStorageBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete all stored analytics data? This cannot be undone.')) {
      try {
        // Clear IndexedDB
        const dbName = 'YouTubeAnalyticsDB';
        const deleteRequest = indexedDB.deleteDatabase(dbName);

        deleteRequest.onsuccess = () => {
          showMessage('✓ All stored data cleared successfully', 'success');
        };

        deleteRequest.onerror = () => {
          showMessage('Failed to clear storage', 'error');
        };

        deleteRequest.onblocked = () => {
          showMessage('Database is in use. Please close all YouTube tabs and try again.', 'error');
        };
      } catch (error) {
        showMessage('Failed to clear storage: ' + error.message, 'error');
      }
    }
  });

  // Load API key on page load
  await loadApiKey();
});
