# YouTube Analytics Vision - Chrome Extension

A powerful Chrome extension similar to VidIQ Vision that provides real-time analytics, SEO insights, tags, engagement metrics, and competitor analysis directly on YouTube video pages.

## 🚀 Features

### Core Features (No API Required)
- **📈 Real-time Engagement Metrics**: View counts, likes, engagement rates
- **🏷️ Tag Extraction**: See all video tags (even hidden ones)
- **🔑 Keyword Analysis**: Automatically extract top keywords from title and description
- **💡 SEO Score**: Get instant SEO score for video optimization
- **📊 Video Analytics**: Duration, category, upload date, and more
- **🎨 Beautiful UI**: Clean, modern interface that matches YouTube's design
- **⚡ Auto-detection**: Automatically loads on video pages and updates on navigation

### 🆕 Monetization Features (v1.1)
- **💰 Monetization Status**: Detect if channel is monetized
- **💵 Earnings Estimation**: Estimate video earnings based on CPM and views
- **📈 Subscriber Growth**: Estimate new subscribers from each video
- **🎯 CPM Analysis**: Automatic CPM category detection (Premium/High/Medium/Low)
- **📊 Conversion Tracking**: View-to-subscriber conversion rates

## 📦 Installation

### Method 1: Load Unpacked (Development)

1. **Open Chrome Extensions page**:
   - Go to `chrome://extensions/`
   - Or click Menu → Extensions → Manage Extensions

2. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top right

3. **Load the extension**:
   - Click "Load unpacked"
   - Navigate to the `youtube-analytics-extension` folder
   - Click "Select"

4. **Verify installation**:
   - You should see "YouTube Analytics Vision" in your extensions list
   - The extension icon should appear in your toolbar

### Method 2: Pack and Install (Production)

1. Go to `chrome://extensions/`
2. Enable Developer Mode
3. Click "Pack extension"
4. Select the extension directory
5. Install the generated `.crx` file

## 🎯 Usage

1. **Navigate to YouTube**: Open any YouTube video
2. **View Analytics**: The analytics panel appears automatically on the right side
3. **Toggle Panel**: Click the "−" button to collapse/expand the panel
4. **Analyze Video**: View engagement metrics, tags, keywords, and SEO score

### What You'll See

- **Engagement Metrics**: Views, likes, engagement rate (color-coded)
- **Tags**: All video tags including hidden ones
- **Keywords**: Top 10 keywords extracted from content
- **Video Info**: Category, upload date, duration
- **SEO Score**: 0-100 score based on optimization factors

## 📊 SEO Score Breakdown

The SEO score (0-100) is calculated based on:

- **Title Length** (20 points): Optimal 50-70 characters
- **Tags** (25 points): More than 5 tags
- **Description** (25 points): More than 250 characters
- **Engagement Rate** (30 points): Higher is better

## 🛠️ Technical Stack

- **Manifest V3**: Latest Chrome extension format
- **Vanilla JavaScript**: No external dependencies
- **CSS3**: Modern styling with gradients and animations
- **YouTube Data Extraction**: Parses YouTube's page data

## 📁 Project Structure

```
youtube-analytics-extension/
├── manifest.json           # Extension configuration
├── popup.html             # Extension popup UI
├── README.md              # Documentation
├── icons/                 # Extension icons (16x16, 48x48, 128x128)
├── scripts/
│   ├── content.js         # Main content script (runs on YouTube)
│   ├── background.js      # Background service worker
│   └── popup.js           # Popup functionality
└── styles/
    └── overlay.css        # Analytics overlay styles
```

## 🔧 Development

### Adding New Features

1. **Edit content.js**: Add data extraction logic
2. **Update overlay.css**: Style new UI components
3. **Modify manifest.json**: Add new permissions if needed
4. **Test**: Reload extension in `chrome://extensions/`

### Debugging

- Open Chrome DevTools on YouTube page
- Check Console for logs (search for "YouTube Analytics Vision")
- Use `chrome://extensions/` to view errors
- Enable "Developer mode" for detailed error messages

## 🚀 Future Enhancements

- [ ] Competitor video comparison
- [ ] Historical trend analysis
- [ ] Export analytics to CSV/JSON
- [ ] Integration with YouTube Analytics API
- [ ] Channel-level analytics
- [ ] Comment sentiment analysis
- [ ] Thumbnail A/B testing suggestions
- [ ] Best posting time recommendations
- [ ] Keyword rank tracking
- [ ] Video performance predictions

## 📝 Notes

- **Privacy**: This extension only reads publicly available data from YouTube pages
- **Permissions**: Requires access to YouTube domains only
- **Performance**: Minimal impact on page load times
- **Compatibility**: Works with YouTube's current UI (2026)

## 🐛 Troubleshooting

**Panel not showing?**
- Refresh the YouTube page
- Check if extension is enabled in `chrome://extensions/`
- Ensure you're on a video page (`/watch?v=...`)

**Data not accurate?**
- YouTube's UI changes frequently; some selectors may need updates
- Engagement rate requires visible like counts

**Extension not loading?**
- Check for errors in `chrome://extensions/`
- Ensure all files are in correct locations
- Verify manifest.json syntax

## 📄 License

This project is for educational purposes. YouTube and VidIQ are trademarks of their respective owners.

## 🤝 Contributing

Feel free to enhance this extension with:
- Better data extraction algorithms
- More analytics features
- UI/UX improvements
- Bug fixes

---

**Made with ❤️ for YouTube creators**
