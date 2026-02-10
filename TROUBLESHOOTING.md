# 🔧 Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: Same Tags Showing on All Videos

**Problem**: Extension showing identical tags for different videos

**Possible Causes**:
1. Browser cache issue
2. YouTube meta tags not updating
3. Extension not re-extracting data on page change

**Solutions**:

#### Solution A: Hard Refresh
```bash
1. Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. This clears page cache and reloads
```

#### Solution B: Clear Browser Cache
```bash
1. chrome://settings/clearBrowserData
2. Select "Cached images and files"
3. Time range: "Last hour"
4. Click "Clear data"
```

#### Solution C: Reload Extension
```bash
1. chrome://extensions/
2. Find "YouTube Analytics Vision"
3. Click reload icon (🔄)
4. Go back to YouTube and refresh page
```

#### Solution D: Test Tag Extraction
```javascript
// Run this in Console (F12) on YouTube video page:

// Quick test
const metaTags = document.querySelectorAll('meta[property="og:video:tag"]');
console.log('Tags found:', metaTags.length);
metaTags.forEach(tag => console.log(tag.content));

// If showing 0 or wrong tags, meta tags aren't loading properly
```

#### Solution E: Use Debug Script
```bash
1. Open test-tags.js file
2. Copy all content
3. Open YouTube video page
4. Press F12 → Console
5. Paste and run
6. Check which method finds tags
```

---

### Issue 2: Panel Not Showing

**Problem**: Analytics panel doesn't appear on video pages

**Solutions**:

#### Check URL
```bash
✅ Correct: youtube.com/watch?v=VIDEO_ID
❌ Wrong: youtube.com/shorts/VIDEO_ID
❌ Wrong: youtube.com (home page)
❌ Wrong: youtube.com/channel/...
```

#### Check Console
```bash
1. Press F12
2. Go to Console tab
3. Look for "YouTube Analytics Vision" messages
4. If errors shown, take screenshot
```

#### Reinstall Extension
```bash
1. chrome://extensions/
2. Remove extension
3. Restart browser
4. Reinstall from folder
```

---

### Issue 3: Wrong Data Showing

**Problem**: Views, likes, or other metrics incorrect

**Solutions**:

#### Verify Selectors
```javascript
// Run in Console to check selectors:

console.log('Title:', document.querySelector('h1 yt-formatted-string')?.textContent);
console.log('Views:', document.querySelector('ytd-video-view-count-renderer')?.textContent);
console.log('Channel:', document.querySelector('ytd-channel-name')?.textContent);
```

#### Wait for Page Load
```bash
- Extension waits 2 seconds after page load
- If slow internet, increase delay
- Or manually refresh panel (coming soon)
```

---

### Issue 4: Monetization Status Wrong

**Problem**: Shows "Not Monetized" for monetized channel

**Causes**:
1. Ad blockers hiding ads
2. YouTube Premium account (no ads shown)
3. Below 1000 subscribers

**Solutions**:

#### Check Actual Status
```bash
Only creators can see exact status in:
YouTube Studio → Monetization
```

#### Disable Ad Blocker
```bash
Test with ad blocker OFF to see if ads appear
```

#### Manual Verification
```bash
- Check subscriber count (needs 1000+)
- Look for ads in video player
- Check if verification badge present
```

---

### Issue 5: Earnings Estimate Too High/Low

**Problem**: Estimated earnings seem unrealistic

**Explanation**:
```
Estimates are based on:
- Industry average CPM ($2-$10)
- 50% monetization rate (typical)
- 55% creator share (YouTube's split)

Actual earnings vary based on:
- Geographic location of viewers
- Video niche/category
- Season (Q4 highest)
- Ad types shown
- Viewer demographics
```

**Not an Issue**:
```
Extension cannot know exact earnings
Only creator sees actual revenue in Studio
Estimates are for comparison only
```

---

### Issue 6: YouTube Studio Assistant Not Showing

**Problem**: No assistant on upload page

**Check URL**:
```bash
✅ Should work: studio.youtube.com/video/*/edit
✅ Should work: studio.youtube.com/video/*/details
❌ Won't work: studio.youtube.com/channel/...
❌ Won't work: studio.youtube.com/analytics
```

**Solutions**:

#### Wait for Form Load
```bash
- Studio takes 3-5 seconds to load form
- Extension waits 2 seconds
- If slow, manually refresh page
```

#### Check Console
```bash
Look for: "YouTube Studio Analytics: Panel injected"
If not there, form selectors may have changed
```

---

### Issue 7: Subscriber Growth Estimate Wrong

**Problem**: New subs estimate seems off

**Explanation**:
```
Conversion rate based on engagement:
- 8%+ engagement → 5% conversion (viral)
- 5-8% engagement → 3% conversion (excellent)
- 3-5% engagement → 2% conversion (good)
- 1-3% engagement → 1% conversion (average)
- <1% engagement → 0.5% conversion (poor)

Formula:
New Subs = Views × Conversion Rate

Example:
100,000 views × 2% = 2,000 new subscribers
```

**YouTube Doesn't Show**:
```
Per-video subscriber count is not publicly available
Only total channel subscribers shown
Extension estimates based on industry standards
```

---

### Issue 8: Performance/Slow Loading

**Problem**: Extension making YouTube slow

**Solutions**:

#### Check Other Extensions
```bash
1. Disable other extensions temporarily
2. Test if YouTube loads faster
3. Re-enable one by one to find conflict
```

#### Clear Extension Data
```bash
1. Right-click extension icon
2. Options → Clear All Stored Data
3. This removes cached analytics
```

#### Reduce Feature Usage
```bash
Coming soon: Option to disable specific features
- Monetization analysis
- Historical tracking
- Auto-updates
```

---

### Issue 9: Tags Not Updating on Navigation

**Problem**: Navigate to new video, old tags still show

**Current Behavior**:
```
Extension detects page change via URL
Waits 2 seconds for YouTube to load
Re-extracts all data including tags
```

**If Not Working**:

#### Manual Workaround
```bash
Hard refresh page (Cmd+Shift+R)
This forces complete reload
```

#### Check Console
```bash
Should see:
"YouTube Analytics Vision: Page changed"
"YouTube Analytics Vision: Extracting data after page change..."
```

#### Debug
```bash
If tags still same:
1. Check meta tags in page source (Cmd+U)
2. Search for "og:video:tag"
3. If all same → YouTube caching issue
4. If different → Extension not re-reading
```

---

### Issue 10: Extension Permissions Error

**Problem**: "Extension requires additional permissions"

**Solutions**:

#### Grant Permissions
```bash
1. Click extension icon
2. "Grant permissions" button
3. Accept YouTube access
```

#### Reinstall
```bash
If persist:
1. Remove extension
2. Restart browser
3. Reinstall
4. Accept all permissions
```

---

## Advanced Debugging

### Enable Verbose Logging

Add to console:
```javascript
localStorage.setItem('YT_ANALYTICS_DEBUG', 'true');
```

This will show detailed logs of:
- Data extraction process
- Tag detection methods
- Monetization analysis
- Score calculations

### Disable
```javascript
localStorage.removeItem('YT_ANALYTICS_DEBUG');
```

---

### Export Debug Report

Run in console:
```javascript
const report = {
  url: location.href,
  videoId: new URLSearchParams(location.search).get('v'),
  metaTags: Array.from(document.querySelectorAll('meta[property="og:video:tag"]')).map(t => t.content),
  extensionVersion: '1.2.0',
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString()
};

console.log('=== DEBUG REPORT ===');
console.log(JSON.stringify(report, null, 2));
console.log('=== END REPORT ===');

// Copy and share this output
```

---

### Check Extension State

```javascript
// Check if extension loaded
console.log('Extension loaded:', typeof YouTubeAnalytics !== 'undefined');

// Check if panel exists
console.log('Panel exists:', !!document.querySelector('#yt-analytics-overlay'));

// Check video data
if (window.youtubeAnalytics) {
  console.log('Video data:', window.youtubeAnalytics.videoData);
}
```

---

## Browser-Specific Issues

### Chrome
```
✅ Fully supported
Version required: 88+
Manifest V3 compatible
```

### Edge
```
✅ Should work (Chromium-based)
Install same as Chrome
Report if issues
```

### Firefox
```
❌ Not currently supported
Manifest V3 format
Requires adaptation
Coming in future
```

### Safari
```
❌ Not supported
Different extension format
No plans currently
```

---

## Reporting Issues

### Before Reporting

Check:
1. ✅ Extension is latest version
2. ✅ Tried hard refresh
3. ✅ Cleared cache
4. ✅ Checked console for errors
5. ✅ Tested on different video

### What to Include

```
1. Browser & Version
   Example: Chrome 118.0.5993.88

2. Operating System
   Example: macOS Ventura 13.4

3. Video URL
   Example: youtube.com/watch?v=...

4. Issue Description
   Example: Tags showing same on all videos

5. Console Output
   Screenshot of Console (F12)

6. Steps to Reproduce
   1. Open video A
   2. Note tags
   3. Navigate to video B
   4. Tags still show video A's tags

7. Expected Behavior
   Should show video B's tags
```

---

## Known Limitations

### 1. YouTube UI Changes
```
YouTube updates UI frequently
Selectors may break
Extension updated regularly
```

### 2. Rate Limiting
```
Too many API calls → quota exceeded
Wait 24 hours to reset
Or get new API key
```

### 3. Private Videos
```
Limited data available
Can't extract tags
Basic info only
```

### 4. Live Streams
```
Some metrics inaccurate
Concurrent viewers not tracked
Post-stream data better
```

### 5. Shorts
```
Different URL structure
Not currently supported
Regular videos only
```

---

## Performance Tips

### Reduce Memory Usage
```bash
1. Options → Clear old data (>90 days)
2. Disable historical tracking
3. Close unused tabs
```

### Speed Up Loading
```bash
1. Disable other extensions
2. Clear browser cache regularly
3. Use fewer browser tabs
```

### Optimize Database
```javascript
// Run in console to optimize:
indexedDB.deleteDatabase('YouTubeAnalyticsDB');
// Then refresh page
```

---

## Getting Help

### Resources
- `README.md` - Basic usage
- `FEATURES.md` - Complete feature list
- `MONETIZATION_FEATURES.md` - Earnings info
- `STUDIO_FEATURES.md` - Studio guide
- This file - Troubleshooting

### Community
- GitHub Issues (coming soon)
- Discord (coming soon)
- Email support (coming soon)

### Self-Help
- Check Console (F12)
- Run debug scripts
- Read documentation
- Try on different video

---

**Last Updated**: February 8, 2026  
**Version**: 1.2.0
