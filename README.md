# 📊 YouTube Studio SEO Assistant

<p align="center">
  <img src="https://img.shields.io/github/stars/rajmehto/youtube-analytics?style=for-the-badge&color=yellow" alt="Stars">
  <img src="https://img.shields.io/github/forks/rajmehto/youtube-analytics?style=for-the-badge&color=blue" alt="Forks">
  <img src="https://img.shields.io/badge/VERSION-1.0-green?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/LICENSE-MIT-red?style=for-the-badge" alt="License">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/DEVELOPER-RAJ%20MEHTO-purple?style=for-the-badge&logo=github" alt="Developer">
  <img src="https://img.shields.io/badge/SPONSOR-💖-pink?style=for-the-badge" alt="Sponsor">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/CHROME-Extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white" alt="Chrome">
  <img src="https://img.shields.io/badge/MANIFEST-V3-orange?style=flat-square" alt="Manifest V3">
  <img src="https://img.shields.io/badge/PLATFORM-MACOS%20%7C%20WINDOWS%20%7C%20LINUX-green?style=flat-square" alt="Platform">
</p>

<p align="center">
  <b>Real-time SEO analysis & optimization for YouTube Studio with inline tag scoring</b>
</p>

---

## 🎯 What is This?

**YouTube Studio SEO Assistant** provides powerful tools to optimize your videos:

- 📊 **SEO Score Analysis** - Real-time scoring (0-100) for your video
- 🏷️ **Tag SEO Scoring** - Individual SEO scores for each tag with inline badges
- ⚠️ **Issue Detection** - Identifies missing thumbnails, short descriptions, etc.
- 💡 **Pro Tips** - Actionable suggestions to improve discoverability

---

## 📈 Features Comparison

```mermaid
graph TD
    A[🎬 YouTube Studio SEO Assistant] --> B[📊 Upload Assistant]
    A --> C[🏷️ Tag Analysis]
    
    B --> D[✅ SEO Score 0-100]
    B --> E[⚠️ Warnings & Issues]
    B --> F[💡 Pro Tips]
    
    C --> G[🔢 Individual Tag Scores]
    C --> H[🎨 Color-coded Badges]
    C --> I[📝 Scoring Reasons]
```

| Feature | Description | Points |
|---------|-------------|--------|
| 🏷️ **Tag in Title** | Tag appears in video title | +30 |
| 📝 **Tag in Description** | Tag appears in description | +15 |
| 🎯 **Long-tail Keyword** | 3+ words (more specific) | +20 |
| 📏 **Good Length** | 10-30 characters optimal | +15 |
| ⭐ **Primary Tag** | First tag bonus | +10 |
| 📅 **Has Year** | Contains 2024/2025/2026 | +5 |

---

## 🎨 Color Coding

| Score | Color | Status |
|-------|-------|--------|
| 70-100 | 🟢 Green | Excellent SEO |
| 50-69 | 🟠 Orange | Good, can improve |
| 30-49 | 🟠 Dark Orange | Needs work |
| 0-29 | 🔴 Red | Poor SEO |

---

## 📦 Installation

### Quick Start

```bash
# Clone the repository
git clone https://github.com/rajmehto/youtube-analytics.git

# Navigate to folder
cd youtube-analytics
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `youtube-analytics` folder
5. Done! Go to YouTube Studio 🎉

---

## 🖥️ Screenshots

### Upload Assistant Panel
```
┌─────────────────────────────┐
│  📊 Upload Assistant    [-] │
├─────────────────────────────┤
│         ╭───────╮           │
│         │  75   │           │
│         │ Score │           │
│         ╰───────╯           │
├─────────────────────────────┤
│ 🚨 CRITICAL ISSUES (1)      │
│ ┌─────────────────────────┐ │
│ │ Thumbnail               │ │
│ │ No custom thumbnail     │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ✅ STRENGTHS (2)            │
│ • Category: Entertainment   │
│ • Good number of tags (12)  │
└─────────────────────────────┘
```

### Inline Tag Badges
```
[gaming tutorial 75] [minecraft tips 2024 85] [how to build 60]
```

---

## 🛠️ Tech Stack

| Technology | Usage |
|------------|-------|
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) | Core Logic |
| ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) | Styling |
| ![Chrome](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white) | Platform |
| ![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange?style=flat-square) | Extension Format |

---

## 📁 Project Structure

```
youtube-analytics/
├── 📄 manifest.json          # Extension config
├── 📄 popup.html             # Popup UI
├── 📁 scripts/
│   ├── 📄 studio-content.js  # Main YouTube Studio script
│   ├── 📄 seo-analyzer.js    # SEO analysis logic
│   ├── 📄 content.js         # Watch page script
│   └── 📄 background.js      # Service worker
├── 📁 styles/
│   ├── 📄 studio-assistant.css
│   └── 📄 overlay.css
└── 📁 icons/
    └── 🖼️ icon16/48/128.png
```

---

## 🚀 Roadmap

- [x] Real-time SEO scoring
- [x] Tag SEO analysis with badges
- [x] Category detection
- [x] Thumbnail detection
- [ ] Competitor analysis
- [ ] Trend suggestions
- [ ] A/B title testing
- [ ] Export analytics

---

## 🤝 Contributing

Contributions welcome! Feel free to:

- 🐛 Report bugs
- 💡 Suggest features  
- 🔧 Submit PRs

---

## 📄 License

```
MIT License - Feel free to use and modify
```

---

<p align="center">
  <b>Made with ❤️ for YouTube Creators</b>
</p>

<p align="center">
  <a href="https://github.com/rajmehto">⭐ Star this repo if it helped you!</a>
</p>
