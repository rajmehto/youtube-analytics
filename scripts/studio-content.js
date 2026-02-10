// YouTube Studio Content Script
// Provides insights on upload page and analytics dashboard

class YouTubeStudioAnalytics {
  constructor() {
    this.isStudioPage = false;
    this.isUploadPage = false;
    this.isAnalyticsPage = false;
    this.assistantPanel = null;
    this.init();
  }

  init() {
    console.log('YouTube Studio Analytics: Initializing...');
    this.detectPageType();
    this.observePageChanges();
    
    if (this.isUploadPage) {
      // Delay to allow YouTube Studio to fully load
      setTimeout(() => this.enhanceUploadPage(), 3000);
    } else if (this.isAnalyticsPage) {
      this.enhanceAnalyticsPage();
    }
  }

  detectPageType() {
    const url = window.location.href;
    this.isStudioPage = url.includes('studio.youtube.com');
    this.isUploadPage = url.includes('/video/') && (url.includes('/edit') || url.includes('/details'));
    this.isAnalyticsPage = url.includes('/analytics');
  }

  observePageChanges() {
    let lastUrl = location.href;
    
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        this.handlePageChange();
      }
    }).observe(document, { subtree: true, childList: true });
  }

  handlePageChange() {
    this.detectPageType();
    console.log('YouTube Studio Analytics: Page changed');
    
    if (this.isUploadPage) {
      this.removeAssistant();
      setTimeout(() => this.enhanceUploadPage(), 4000);
    } else if (this.isAnalyticsPage) {
      this.removeAssistant();
      setTimeout(() => this.enhanceAnalyticsPage(), 2000);
    } else {
      this.removeAssistant();
    }
  }

  enhanceUploadPage() {
    console.log('YouTube Studio Analytics: Enhancing upload page...');
    
    // First try to expand "Show more" sections
    this.expandMoreOptions();
    
    // Wait a bit for DOM to update after expansion, then extract
    setTimeout(() => {
      const videoData = this.extractUploadFormData();
      
      if (!videoData) {
        console.log('Could not extract video data from form');
        return;
      }

      // Analyze and create assistant panel
      const analysis = this.analyzeVideoForUpload(videoData);
      this.createStudioAssistant(analysis);
      
      // Inject SEO scores directly on tag chips
      this.injectTagSEOBadges(videoData);
      
      // Re-check tags after another delay (in case DOM was slow to update)
      if (videoData.tagCount === 0) {
        setTimeout(() => {
          const recheck = this.extractUploadFormData();
          if (recheck && recheck.tagCount > 0) {
            console.log('Tags found on recheck:', recheck.tagCount);
            const newAnalysis = this.analyzeVideoForUpload(recheck);
            this.createStudioAssistant(newAnalysis);
            this.injectTagSEOBadges(recheck);
          }
        }, 2000);
      }
    }, 500);
  }

  enhanceAnalyticsPage() {
    console.log('YouTube Studio Analytics: Enhancing analytics page...');
    // Future: Add insights to analytics dashboard
  }

  // Inject SEO score badges directly on tag chips in the page
  injectTagSEOBadges(videoData) {
    console.log('Injecting SEO badges on tags...');
    
    // Remove existing badges first
    document.querySelectorAll('.yt-seo-tag-badge').forEach(el => el.remove());
    
    // Find all tag chips
    const tagChips = document.querySelectorAll('ytcp-chip-bar ytcp-chip, ytcp-video-metadata-editor-advanced ytcp-chip');
    
    tagChips.forEach((chip, index) => {
      // Get tag text
      const textSpan = chip.querySelector('#chip-text') || chip.querySelector('[id*="text"]');
      let tagText = textSpan?.textContent?.trim() || '';
      if (!tagText) {
        tagText = chip.textContent?.replace(/close|remove|×|✕/gi, '').trim();
      }
      
      if (!tagText || tagText.length === 0) return;
      
      // Calculate SEO score for this tag
      const tagAnalysis = this.analyzeTagSEO(
        tagText,
        videoData.title,
        videoData.description,
        index === 0
      );
      
      // Create badge element
      const badge = document.createElement('span');
      badge.className = 'yt-seo-tag-badge';
      badge.textContent = tagAnalysis.score;
      
      // Set color based on score
      let bgColor, textColor;
      if (tagAnalysis.score >= 70) {
        bgColor = '#2ba640';
        textColor = '#fff';
      } else if (tagAnalysis.score >= 50) {
        bgColor = '#ff9800';
        textColor = '#fff';
      } else if (tagAnalysis.score >= 30) {
        bgColor = '#f57c00';
        textColor = '#fff';
      } else {
        bgColor = '#f44336';
        textColor = '#fff';
      }
      
      badge.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        height: 18px;
        padding: 0 5px;
        margin-left: 6px;
        background: ${bgColor};
        color: ${textColor};
        font-size: 10px;
        font-weight: 700;
        border-radius: 9px;
        font-family: 'Roboto', sans-serif;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      `;
      
      // Add tooltip with reasons
      if (tagAnalysis.reasons.length > 0) {
        badge.title = `SEO: ${tagAnalysis.score}/100\n${tagAnalysis.reasons.join(', ')}`;
      } else {
        badge.title = `SEO: ${tagAnalysis.score}/100\nNeeds improvement`;
      }
      
      // Insert badge into chip (after the text, before the close button)
      const closeBtn = chip.querySelector('iron-icon, [icon="close"], button, .remove-button');
      if (closeBtn) {
        closeBtn.parentNode.insertBefore(badge, closeBtn);
      } else {
        // Fallback: append to chip
        const chipContent = chip.querySelector('#chip-content') || chip;
        chipContent.appendChild(badge);
      }
    });
    
    console.log(`Injected SEO badges on ${tagChips.length} tags`);
    
    // Set up observer to re-inject badges when tags change
    this.observeTagChanges(videoData);
  }
  
  observeTagChanges(videoData) {
    // Avoid multiple observers
    if (this.tagObserver) {
      this.tagObserver.disconnect();
    }
    
    // Find the tag container
    const tagContainer = document.querySelector('ytcp-chip-bar') || 
                        document.querySelector('ytcp-video-metadata-editor-advanced');
    
    if (!tagContainer) return;
    
    this.tagObserver = new MutationObserver((mutations) => {
      // Debounce to avoid too many updates
      clearTimeout(this.tagUpdateTimeout);
      this.tagUpdateTimeout = setTimeout(() => {
        // Re-extract data and update badges
        const newVideoData = this.extractUploadFormData();
        if (newVideoData) {
          this.injectTagSEOBadges(newVideoData);
        }
      }, 300);
    });
    
    this.tagObserver.observe(tagContainer, {
      childList: true,
      subtree: true
    });
    
    console.log('Tag change observer set up');
  }

  expandMoreOptions() {
    // Try to expand "Show more" / "More options" section to reveal tags
    const expandButtons = [
      // "Show more" button
      ...document.querySelectorAll('ytcp-button[id*="toggle"], ytcp-button[id*="expand"]'),
      // "SHOW MORE" text button
      ...Array.from(document.querySelectorAll('ytcp-button, button')).filter(
        btn => btn.textContent?.toLowerCase().includes('show more') || 
               btn.textContent?.toLowerCase().includes('more options')
      ),
      // Expansion panel toggle
      ...document.querySelectorAll('ytcp-video-metadata-editor-basics #toggle-button, #basics #toggle-button'),
      // Advanced section collapse button
      ...document.querySelectorAll('[aria-label*="more"], [aria-label*="expand"]')
    ];
    
    expandButtons.forEach(btn => {
      const isCollapsed = btn.getAttribute('aria-expanded') === 'false' || 
                         btn.closest('[collapsed]') !== null ||
                         btn.textContent?.toLowerCase().includes('show more');
      if (isCollapsed) {
        console.log('Expanding section:', btn.textContent?.substring(0, 30));
        btn.click();
      }
    });
  }

  extractUploadFormData() {
    try {
      // First, try to expand "Show more" section to reveal tags
      this.expandMoreOptions();
      
      // Title
      const titleInput = document.querySelector('#textbox[aria-label*="Title"]') ||
                        document.querySelector('ytcp-social-suggestions-textbox[label="Title"] #textbox') ||
                        document.querySelector('#title-textarea');
      const title = titleInput?.textContent?.trim() || titleInput?.value || '';

      // Description
      const descInput = document.querySelector('#textbox[aria-label*="Description"]') ||
                       document.querySelector('ytcp-social-suggestions-textbox[label="Description"] #textbox') ||
                       document.querySelector('#description-textarea');
      const description = descInput?.textContent?.trim() || descInput?.value || '';

      // Tags - Find tag chips by looking for chip elements
      let tags = [];
      
      // Method 1: Try ytcp-chip-bar ytcp-chip selector (tags section)
      const tagsSection = document.querySelector('ytcp-video-metadata-editor-advanced');
      if (tagsSection) {
        tagsSection.querySelectorAll('ytcp-chip-bar ytcp-chip, ytcp-chip').forEach(chip => {
          const textSpan = chip.querySelector('#chip-text') || chip.querySelector('[id*="text"]') || chip.querySelector('.chip-text');
          let text = textSpan?.textContent?.trim() || '';
          if (!text) {
            text = chip.textContent?.replace(/close/gi, '').replace(/×/g, '').replace(/✕/g, '').replace(/remove/gi, '').trim();
          }
          if (text && text.length > 0 && text.length < 80 && !tags.includes(text)) {
            tags.push(text);
          }
        });
        console.log('Method 1 (advanced section chips):', tags.length, 'tags');
      }
      
      // Method 2: Look for tags in form field with "Tags" label
      if (tags.length === 0) {
        const allFormFields = document.querySelectorAll('ytcp-form-input-container, ytcp-ve');
        allFormFields.forEach(field => {
          const label = field.querySelector('label, .label, [slot="label"]');
          if (label && label.textContent?.toLowerCase().includes('tag')) {
            field.querySelectorAll('ytcp-chip, [class*="chip"]').forEach(chip => {
              const textSpan = chip.querySelector('#chip-text, .chip-text, [class*="text"]');
              let text = textSpan?.textContent?.trim() || chip.textContent?.replace(/close|remove|×|✕/gi, '').trim();
              if (text && text.length > 0 && text.length < 80 && !tags.includes(text)) {
                tags.push(text);
              }
            });
          }
        });
        console.log('Method 2 (tags form field):', tags.length, 'tags');
      }
      
      // Method 3: Try finding chips near "Tags" text
      if (tags.length === 0) {
        const allText = document.body.innerText;
        const tagsTextElement = Array.from(document.querySelectorAll('*')).find(
          el => el.childNodes.length === 1 && el.textContent?.trim() === 'Tags'
        );
        if (tagsTextElement) {
          const container = tagsTextElement.closest('ytcp-form-input-container, ytcp-ve, [class*="form"]');
          if (container) {
            container.querySelectorAll('ytcp-chip, [class*="chip"]').forEach(chip => {
              let text = chip.textContent?.replace(/close|remove|×|✕/gi, '').trim();
              if (text && text.length > 0 && text.length < 80 && !tags.includes(text)) {
                tags.push(text);
              }
            });
          }
        }
        console.log('Method 3 (near Tags label):', tags.length, 'tags');
      }
      
      // Method 4: Try generic chip selectors across page
      if (tags.length === 0) {
        document.querySelectorAll('ytcp-chip-bar ytcp-chip, ytcp-chip').forEach(chip => {
          const textSpan = chip.querySelector('#chip-text, .chip-text');
          let text = textSpan?.textContent?.trim() || '';
          if (!text) {
            text = chip.textContent?.replace(/close|remove|×|✕/gi, '').trim();
          }
          if (text && text.length > 0 && text.length < 80 && !tags.includes(text)) {
            tags.push(text);
          }
        });
        console.log('Method 4 (generic ytcp-chip):', tags.length, 'tags');
      }
      
      // Method 5: Look for iron-chips (older YouTube Studio)
      if (tags.length === 0) {
        document.querySelectorAll('iron-chip, paper-chip, .tag-chip').forEach(chip => {
          let text = chip.textContent?.replace(/close|remove|×|✕/gi, '').trim();
          if (text && text.length > 0 && text.length < 80 && !tags.includes(text)) {
            tags.push(text);
          }
        });
        console.log('Method 5 (iron/paper chips):', tags.length, 'tags');
      }
      
      // Debug logging
      const chipElements = document.querySelectorAll('[class*="chip"], ytcp-chip');
      console.log('Total chip elements found:', chipElements.length);
      
      // Remove duplicates
      tags = [...new Set(tags)];
      
      console.log('Final tags found:', tags, 'Count:', tags.length);

      // Thumbnail
      const thumbnailPreview = document.querySelector('ytcp-uploads-still-image-renderer img') ||
                              document.querySelector('#still-image img');
      const hasThumbnail = thumbnailPreview !== null;

      // Category - try multiple methods to find selected category
      let category = 'Not set';
      
      // Method 1: Look for dropdown with "Category" label
      const categoryDropdowns = document.querySelectorAll('ytcp-dropdown-trigger, ytcp-text-dropdown-trigger');
      categoryDropdowns.forEach(dropdown => {
        const label = dropdown.closest('ytcp-form-select, ytcp-form-dropdown')?.querySelector('label, .label');
        const parentLabel = dropdown.parentElement?.previousElementSibling;
        const nearbyText = dropdown.closest('.style-scope')?.textContent || '';
        
        if (label?.textContent?.toLowerCase().includes('category') ||
            parentLabel?.textContent?.toLowerCase().includes('category') ||
            nearbyText.toLowerCase().includes('category')) {
          const selectedText = dropdown.querySelector('.ytcp-dropdown-trigger-text, .text, [slot="text"]')?.textContent?.trim() ||
                              dropdown.textContent?.replace(/arrow_drop_down|expand_more/gi, '').trim();
          if (selectedText && selectedText !== 'Select' && selectedText.length > 0) {
            category = selectedText;
          }
        }
      });
      
      // Method 2: Try ytcp-video-metadata-category-select
      if (category === 'Not set') {
        const categorySelect = document.querySelector('ytcp-video-metadata-category-select');
        if (categorySelect) {
          const selectedText = categorySelect.querySelector('.ytcp-dropdown-trigger-text, .text')?.textContent?.trim() ||
                              categorySelect.querySelector('ytcp-dropdown-trigger')?.textContent?.replace(/arrow_drop_down/gi, '').trim();
          if (selectedText && selectedText !== 'Select' && selectedText.length > 0) {
            category = selectedText;
          }
        }
      }
      
      // Method 3: Look for any dropdown near "Category" heading
      if (category === 'Not set') {
        const categoryHeading = Array.from(document.querySelectorAll('h3, h4, .label, label')).find(
          el => el.textContent?.trim().toLowerCase() === 'category'
        );
        if (categoryHeading) {
          const container = categoryHeading.closest('.form-input-container, ytcp-form-select, [class*="category"]') ||
                           categoryHeading.parentElement;
          const dropdown = container?.querySelector('ytcp-dropdown-trigger, button, [role="listbox"]');
          const selectedText = dropdown?.textContent?.replace(/arrow_drop_down|expand_more|Category/gi, '').trim();
          if (selectedText && selectedText.length > 0 && selectedText !== 'Select') {
            category = selectedText;
          }
        }
      }
      
      // Method 4: Direct search for Entertainment or common categories
      if (category === 'Not set') {
        const commonCategories = ['Entertainment', 'Gaming', 'Music', 'Education', 'Comedy', 'Sports', 'News', 'Film', 'Science', 'Tech', 'Howto', 'People', 'Pets', 'Autos', 'Travel'];
        document.querySelectorAll('ytcp-dropdown-trigger .text, .ytcp-dropdown-trigger-text').forEach(el => {
          const text = el.textContent?.trim();
          if (commonCategories.some(cat => text?.toLowerCase().includes(cat.toLowerCase()))) {
            category = text;
          }
        });
      }
      
      console.log('Detected category:', category);

      // Audience (Made for Kids)
      const kidsRadio = document.querySelector('ytcp-badge[label="Made for kids"]');
      const isForKids = kidsRadio !== null;

      console.log('Extracted video data:', { title, description: description.substring(0, 50), tags });

      return {
        title,
        description,
        tags,
        hasThumbnail,
        category,
        isForKids,
        titleLength: title.length,
        descriptionLength: description.length,
        tagCount: tags.length
      };
    } catch (error) {
      console.error('Error extracting upload form data:', error);
      return null;
    }
  }

  analyzeVideoForUpload(videoData) {
    const analysis = {
      score: 0,
      maxScore: 100,
      issues: [],
      warnings: [],
      suggestions: [],
      strengths: []
    };

    // Title Analysis (30 points)
    if (videoData.titleLength === 0) {
      analysis.issues.push({
        type: 'critical',
        category: 'Title',
        message: 'Title is empty',
        fix: 'Add a compelling title (50-70 characters recommended)'
      });
    } else if (videoData.titleLength < 30) {
      analysis.warnings.push({
        type: 'warning',
        category: 'Title',
        message: `Title is too short (${videoData.titleLength} chars)`,
        fix: 'Expand to 50-70 characters for better SEO'
      });
      analysis.score += 15;
    } else if (videoData.titleLength >= 50 && videoData.titleLength <= 70) {
      analysis.strengths.push({
        category: 'Title',
        message: 'Title length is optimal (50-70 chars)'
      });
      analysis.score += 30;
    } else if (videoData.titleLength <= 100) {
      analysis.score += 25;
    } else {
      analysis.warnings.push({
        type: 'warning',
        category: 'Title',
        message: 'Title is too long (might get truncated)',
        fix: 'Keep it under 70 characters'
      });
      analysis.score += 20;
    }

    // Description Analysis (25 points)
    if (videoData.descriptionLength === 0) {
      analysis.issues.push({
        type: 'critical',
        category: 'Description',
        message: 'Description is empty',
        fix: 'Add detailed description (250+ characters)'
      });
    } else if (videoData.descriptionLength < 100) {
      analysis.warnings.push({
        type: 'warning',
        category: 'Description',
        message: 'Description is too short',
        fix: 'Expand to at least 250 characters'
      });
      analysis.score += 10;
    } else if (videoData.descriptionLength >= 250) {
      analysis.strengths.push({
        category: 'Description',
        message: 'Description is detailed and comprehensive'
      });
      analysis.score += 25;
    } else {
      analysis.score += 15;
    }

    // Tags Analysis (20 points)
    // YouTube recommends 5-15 tags, but allows up to 500 chars total
    if (videoData.tagCount === 0) {
      analysis.issues.push({
        type: 'critical',
        category: 'Tags',
        message: 'No tags added',
        fix: 'Add 5-15 relevant tags for better discovery'
      });
    } else if (videoData.tagCount < 5) {
      analysis.warnings.push({
        type: 'warning',
        category: 'Tags',
        message: `Only ${videoData.tagCount} tags added`,
        fix: 'Add more tags (recommended: 8-15)'
      });
      analysis.score += 10;
    } else if (videoData.tagCount >= 5 && videoData.tagCount <= 20) {
      // 5-20 tags is good range
      analysis.strengths.push({
        category: 'Tags',
        message: `Good number of tags (${videoData.tagCount})`
      });
      analysis.score += 20;
    } else {
      // More than 20 tags
      analysis.warnings.push({
        type: 'info',
        category: 'Tags',
        message: `${videoData.tagCount} tags - consider focusing on most relevant`,
        fix: 'Quality over quantity - keep best 10-15 tags'
      });
      analysis.score += 15;
    }

    // Thumbnail Analysis (15 points)
    if (!videoData.hasThumbnail) {
      analysis.issues.push({
        type: 'critical',
        category: 'Thumbnail',
        message: 'No custom thumbnail uploaded',
        fix: 'Upload custom thumbnail (1280x720, under 2MB)'
      });
    } else {
      analysis.strengths.push({
        category: 'Thumbnail',
        message: 'Custom thumbnail uploaded'
      });
      analysis.score += 15;
    }

    // Category Analysis (10 points)
    const categoryNotSet = !videoData.category || 
                          videoData.category === 'Not set' || 
                          videoData.category === '' ||
                          videoData.category === 'Select' ||
                          videoData.category.toLowerCase() === 'select';
    
    if (categoryNotSet) {
      analysis.warnings.push({
        type: 'warning',
        category: 'Category',
        message: 'Video category not selected',
        fix: 'Select appropriate category'
      });
      analysis.score += 5;
    } else {
      analysis.strengths.push({
        category: 'Category',
        message: `Category set: ${videoData.category}`
      });
      analysis.score += 10;
    }

    // Overall Suggestions
    this.addGeneralSuggestions(analysis, videoData);
    
    // Analyze individual tags for SEO scores
    analysis.tagScores = [];
    if (videoData.tags && videoData.tags.length > 0) {
      videoData.tags.forEach((tag, index) => {
        const tagAnalysis = this.analyzeTagSEO(
          tag, 
          videoData.title, 
          videoData.description,
          index === 0
        );
        analysis.tagScores.push(tagAnalysis);
      });
      // Sort by score (highest first) for display
      analysis.tagScores.sort((a, b) => b.score - a.score);
    }

    return {
      videoData,
      analysis,
      timestamp: Date.now()
    };
  }

  // Calculate SEO score for individual tag
  analyzeTagSEO(tag, title, description, isFirstTag = false) {
    let score = 0;
    const reasons = [];
    const tagLower = tag.toLowerCase();
    const titleLower = (title || '').toLowerCase();
    const descLower = (description || '').toLowerCase();
    
    // 1. Tag appears in title (+30 points) - very important
    if (titleLower.includes(tagLower)) {
      score += 30;
      reasons.push('In title');
    }
    
    // 2. Tag appears in description (+15 points)
    if (descLower.includes(tagLower)) {
      score += 15;
      reasons.push('In desc');
    }
    
    // 3. Long-tail keyword (3+ words = more specific = better) (+20 points)
    const wordCount = tag.split(/\s+/).length;
    if (wordCount >= 3) {
      score += 20;
      reasons.push('Long-tail');
    } else if (wordCount === 2) {
      score += 10;
      reasons.push('2 words');
    }
    
    // 4. Good length (10-30 chars optimal) (+15 points)
    if (tag.length >= 10 && tag.length <= 30) {
      score += 15;
      reasons.push('Good length');
    } else if (tag.length >= 5 && tag.length <= 40) {
      score += 8;
    }
    
    // 5. First tag bonus (+10 points) - YouTube prioritizes first tag
    if (isFirstTag) {
      score += 10;
      reasons.push('Primary');
    }
    
    // 6. Contains year (trending signal) (+5 points)
    if (/20\d{2}/.test(tag)) {
      score += 5;
      reasons.push('Has year');
    }
    
    // 7. Not too generic (penalize very short single words)
    if (wordCount === 1 && tag.length < 5) {
      score -= 10;
      reasons.push('Too generic');
    }
    
    // Cap score at 100
    score = Math.min(Math.max(score, 0), 100);
    
    return {
      tag,
      score,
      reasons,
      grade: score >= 70 ? 'A' : score >= 50 ? 'B' : score >= 30 ? 'C' : 'D'
    };
  }

  addGeneralSuggestions(analysis, videoData) {
    // SEO Tips
    analysis.suggestions.push({
      category: 'SEO',
      icon: '🔍',
      title: 'Add keywords in first 3 lines of description',
      description: 'YouTube algorithm prioritizes early keywords'
    });

    // Engagement Tips
    analysis.suggestions.push({
      category: 'Engagement',
      icon: '💬',
      title: 'Include call-to-action',
      description: 'Ask viewers to like, comment, subscribe'
    });

    // Links
    analysis.suggestions.push({
      category: 'Links',
      icon: '🔗',
      title: 'Add relevant links',
      description: 'Social media, website, related videos'
    });

    // Timestamps
    if (videoData.descriptionLength > 0) {
      analysis.suggestions.push({
        category: 'Timestamps',
        icon: '⏰',
        title: 'Add video timestamps',
        description: 'Improves user experience and watch time'
      });
    }
  }

  createStudioAssistant(data) {
    if (this.assistantPanel) {
      this.assistantPanel.remove();
    }

    const { videoData, analysis } = data;

    this.assistantPanel = document.createElement('div');
    this.assistantPanel.id = 'yt-studio-assistant';
    this.assistantPanel.className = 'yt-studio-assistant-panel';

    // Calculate score color
    let scoreColor = '#f44336'; // Red
    if (analysis.score >= 80) scoreColor = '#2ba640'; // Green
    else if (analysis.score >= 60) scoreColor = '#ff9800'; // Orange

    this.assistantPanel.innerHTML = `
      <div class="assistant-header">
        <h3>📊 Upload Assistant</h3>
        <button class="assistant-toggle">−</button>
      </div>
      
      <div class="assistant-content">
        <!-- SEO Score -->
        <div class="assistant-section">
          <div class="score-circle" style="border-color: ${scoreColor};">
            <span class="score-value" style="color: ${scoreColor};">${analysis.score}</span>
            <span class="score-label">SEO Score</span>
          </div>
        </div>

        <!-- Critical Issues -->
        ${analysis.issues.length > 0 ? `
          <div class="assistant-section">
            <h4 style="color: #f44336;">🚨 Critical Issues (${analysis.issues.length})</h4>
            ${analysis.issues.map(issue => `
              <div class="issue-card critical">
                <div class="issue-header">
                  <strong>${issue.category}</strong>
                </div>
                <p class="issue-message">${issue.message}</p>
                <p class="issue-fix">💡 ${issue.fix}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Warnings -->
        ${analysis.warnings.length > 0 ? `
          <div class="assistant-section">
            <h4 style="color: #ff9800;">⚠️ Warnings (${analysis.warnings.length})</h4>
            ${analysis.warnings.map(warning => `
              <div class="issue-card warning">
                <div class="issue-header">
                  <strong>${warning.category}</strong>
                </div>
                <p class="issue-message">${warning.message}</p>
                <p class="issue-fix">💡 ${warning.fix}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Strengths -->
        ${analysis.strengths.length > 0 ? `
          <div class="assistant-section">
            <h4 style="color: #2ba640;">✅ Strengths (${analysis.strengths.length})</h4>
            ${analysis.strengths.map(strength => `
              <div class="strength-item">
                <span class="strength-icon">✓</span>
                <strong>${strength.category}:</strong> ${strength.message}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Suggestions -->
        <div class="assistant-section">
          <h4>💡 Pro Tips</h4>
          ${analysis.suggestions.map(tip => `
            <div class="tip-card">
              <div class="tip-header">
                <span class="tip-icon">${tip.icon}</span>
                <strong>${tip.title}</strong>
              </div>
              <p class="tip-description">${tip.description}</p>
            </div>
          `).join('')}
        </div>

        <!-- Tags with SEO Scores -->
        ${analysis.tagScores && analysis.tagScores.length > 0 ? `
          <div class="assistant-section">
            <h4>🏷️ Tag SEO Analysis</h4>
            <div class="tags-seo-container">
              ${analysis.tagScores.map(t => {
                const scoreColor = t.score >= 70 ? '#2ba640' : t.score >= 50 ? '#ff9800' : t.score >= 30 ? '#f57c00' : '#f44336';
                const bgColor = t.score >= 70 ? 'rgba(43,166,64,0.15)' : t.score >= 50 ? 'rgba(255,152,0,0.15)' : t.score >= 30 ? 'rgba(245,124,0,0.15)' : 'rgba(244,67,54,0.15)';
                return `
                  <div class="tag-seo-item" style="background: ${bgColor}; border-left: 3px solid ${scoreColor};">
                    <div class="tag-main">
                      <span class="tag-name">${t.tag}</span>
                      <span class="tag-score" style="background: ${scoreColor};">${t.score}</span>
                    </div>
                    ${t.reasons.length > 0 ? `<div class="tag-reasons">${t.reasons.join(' • ')}</div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
            <div class="tag-legend">
              <span><span class="legend-dot" style="background:#2ba640"></span>70+ Excellent</span>
              <span><span class="legend-dot" style="background:#ff9800"></span>50-69 Good</span>
              <span><span class="legend-dot" style="background:#f44336"></span>&lt;50 Improve</span>
            </div>
          </div>
        ` : ''}

        <!-- Quick Stats -->
        <div class="assistant-section">
          <h4>📈 Quick Stats</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Title Length</span>
              <span class="stat-value">${videoData.titleLength} chars</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Description</span>
              <span class="stat-value">${videoData.descriptionLength} chars</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Tags</span>
              <span class="stat-value">${videoData.tagCount} tags</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Thumbnail</span>
              <span class="stat-value">${videoData.hasThumbnail ? '✓ Added' : '✗ Missing'}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add toggle functionality
    const toggleBtn = this.assistantPanel.querySelector('.assistant-toggle');
    const content = this.assistantPanel.querySelector('.assistant-content');
    
    toggleBtn.addEventListener('click', () => {
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
      toggleBtn.textContent = content.style.display === 'none' ? '+' : '−';
    });

    // Inject into page
    this.injectAssistantPanel();
  }

  injectAssistantPanel() {
    // Remove any existing panel and wrapper
    const existingPanel = document.querySelector('#yt-studio-assistant');
    if (existingPanel) existingPanel.remove();
    const existingWrapper = document.querySelector('#yt-assistant-wrapper');
    if (existingWrapper) existingWrapper.remove();

    // Create wrapper - fixed position next to YouTube sidebar
    const wrapper = document.createElement('div');
    wrapper.id = 'yt-assistant-wrapper';
    wrapper.style.cssText = `
      position: fixed !important;
      right: 4px !important;
      top: 95px !important;
      width: 355px !important;
      max-height: calc(100vh - 110px) !important;
      overflow-y: auto !important;
      z-index: 9999 !important;
      scrollbar-width: thin !important;
    `;

    // Style the panel
    this.assistantPanel.style.cssText = `
      width: 355px !important;
      min-width: 355px !important;
      background: #282828 !important;
      border: 1px solid #3f3f3f !important;
      border-radius: 12px !important;
      padding: 14px !important;
      box-sizing: border-box !important;
      font-size: 13px !important;
    `;

    wrapper.appendChild(this.assistantPanel);
    document.body.appendChild(wrapper);
    console.log('YouTube Studio Assistant: Panel on far right!');
  }

  removeAssistant() {
    if (this.assistantPanel) {
      this.assistantPanel.remove();
      this.assistantPanel = null;
    }
    // Also remove any orphaned panels and wrappers
    const orphaned = document.querySelector('#yt-studio-assistant');
    if (orphaned) orphaned.remove();
    const wrapper = document.querySelector('#yt-assistant-wrapper');
    if (wrapper) wrapper.remove();
    
    // Remove tag SEO badges
    document.querySelectorAll('.yt-seo-tag-badge').forEach(el => el.remove());
    
    // Disconnect tag observer
    if (this.tagObserver) {
      this.tagObserver.disconnect();
      this.tagObserver = null;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new YouTubeStudioAnalytics();
  });
} else {
  new YouTubeStudioAnalytics();
}
