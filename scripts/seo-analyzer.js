// YouTube SEO Analyzer - Algorithm-Aligned Analysis
// Based on actual YouTube ranking factors

class YouTubeSEOAnalyzer {
  constructor() {
    // Power words that increase CTR
    this.powerWords = [
      'best', 'top', 'amazing', 'ultimate', 'complete', 'guide', 'tutorial',
      'how to', 'easy', 'fast', 'quick', 'secret', 'free', 'new', 'official',
      'review', 'vs', 'tips', 'tricks', 'hacks', 'must watch', 'warning',
      'shocking', 'revealed', 'exclusive', 'latest', '2024', '2025', '2026'
    ];
    
    // Emotional triggers
    this.emotionalTriggers = [
      'unbelievable', 'incredible', 'insane', 'crazy', 'mind-blowing',
      'heartbreaking', 'hilarious', 'emotional', 'inspiring', 'shocking'
    ];
    
    // YouTube algorithm weights (based on publicly known factors)
    this.weights = {
      watchTime: 0.30,        // Most important
      ctr: 0.25,              // Click-through rate
      engagement: 0.20,       // Likes, comments, shares
      seoOptimization: 0.15,  // Title, desc, tags
      freshness: 0.10         // Upload recency
    };
  }

  // Main analysis function
  analyzeVideo(videoData) {
    const analysis = {
      overallScore: 0,
      breakdown: {},
      recommendations: [],
      warnings: [],
      strengths: []
    };

    // Analyze each component
    analysis.breakdown.title = this.analyzeTitle(videoData.title, videoData.tags);
    analysis.breakdown.description = this.analyzeDescription(videoData.description);
    analysis.breakdown.tags = this.analyzeTags(videoData.tags, videoData.title, videoData.description);
    analysis.breakdown.engagement = this.analyzeEngagement(videoData);
    analysis.breakdown.ctrPotential = this.analyzeCTRPotential(videoData.title);
    analysis.breakdown.watchTimeFactors = this.analyzeWatchTimeFactors(videoData);

    // Calculate overall score
    analysis.overallScore = this.calculateOverallScore(analysis.breakdown);
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis.breakdown, videoData);
    
    // Identify strengths and warnings
    this.identifyStrengthsAndWarnings(analysis, videoData);

    return analysis;
  }

  // Title Analysis (Critical for CTR)
  analyzeTitle(title, tags = []) {
    const result = {
      score: 0,
      length: title.length,
      issues: [],
      suggestions: []
    };

    // Length check (optimal: 50-70 chars, max display: ~60)
    if (title.length >= 50 && title.length <= 70) {
      result.score += 25;
      result.lengthStatus = 'optimal';
    } else if (title.length >= 40 && title.length <= 80) {
      result.score += 15;
      result.lengthStatus = 'acceptable';
    } else if (title.length < 40) {
      result.score += 5;
      result.lengthStatus = 'too_short';
      result.issues.push('Title too short - missing SEO opportunity');
      result.suggestions.push('Add more descriptive keywords (aim for 50-70 chars)');
    } else {
      result.score += 10;
      result.lengthStatus = 'too_long';
      result.issues.push('Title may get truncated in search results');
    }

    // Power words check
    const titleLower = title.toLowerCase();
    const foundPowerWords = this.powerWords.filter(word => titleLower.includes(word));
    result.powerWords = foundPowerWords;
    
    if (foundPowerWords.length >= 2) {
      result.score += 20;
    } else if (foundPowerWords.length === 1) {
      result.score += 10;
    } else {
      result.suggestions.push('Add power words like "Best", "Ultimate", "Guide", "How to"');
    }

    // Number in title (increases CTR by 36%)
    const hasNumber = /\d+/.test(title);
    result.hasNumber = hasNumber;
    if (hasNumber) {
      result.score += 15;
    } else {
      result.suggestions.push('Add a number (e.g., "5 Tips", "Top 10") - increases CTR by 36%');
    }

    // Brackets/Parentheses (increases CTR by 38%)
    const hasBrackets = /[\[\]\(\)]/.test(title);
    result.hasBrackets = hasBrackets;
    if (hasBrackets) {
      result.score += 10;
    } else {
      result.suggestions.push('Add brackets like [2026] or (Complete Guide) - increases CTR by 38%');
    }

    // Emotional trigger words
    const foundEmotional = this.emotionalTriggers.filter(word => titleLower.includes(word));
    result.emotionalTriggers = foundEmotional;
    if (foundEmotional.length > 0) {
      result.score += 10;
    }

    // Keyword at beginning (first 60 chars are most important)
    const first60 = title.substring(0, 60).toLowerCase();
    const keywordAtStart = tags.length > 0 && tags.some(tag => first60.includes(tag.toLowerCase()));
    result.keywordAtStart = keywordAtStart;
    if (keywordAtStart) {
      result.score += 15;
    } else if (tags.length > 0) {
      result.suggestions.push('Put main keyword at the beginning of title');
    }

    // Question format (good for search)
    const isQuestion = /^(how|what|why|when|where|which|who|can|does|is|are|will)\s/i.test(title) || title.includes('?');
    result.isQuestion = isQuestion;
    if (isQuestion) {
      result.score += 5;
    }

    result.score = Math.min(result.score, 100);
    return result;
  }

  // Description Analysis
  analyzeDescription(description) {
    const result = {
      score: 0,
      length: description?.length || 0,
      issues: [],
      suggestions: []
    };

    if (!description || description === 'N/A') {
      result.score = 0;
      result.issues.push('No description found');
      result.suggestions.push('Add a detailed description (minimum 250 words recommended)');
      return result;
    }

    // Length check
    const wordCount = description.split(/\s+/).length;
    result.wordCount = wordCount;

    if (wordCount >= 250) {
      result.score += 25;
      result.lengthStatus = 'optimal';
    } else if (wordCount >= 150) {
      result.score += 15;
      result.lengthStatus = 'acceptable';
      result.suggestions.push('Expand description to 250+ words for better SEO');
    } else if (wordCount >= 50) {
      result.score += 8;
      result.lengthStatus = 'short';
      result.issues.push('Description too short for optimal SEO');
    } else {
      result.score += 3;
      result.lengthStatus = 'very_short';
      result.issues.push('Description critically short');
    }

    // First 150 chars (shown in search) - should contain keywords
    const first150 = description.substring(0, 150);
    result.first150Chars = first150;

    // Links check
    const hasLinks = /https?:\/\/[^\s]+/.test(description);
    result.hasLinks = hasLinks;
    if (hasLinks) {
      result.score += 10;
    } else {
      result.suggestions.push('Add relevant links (website, social media, related videos)');
    }

    // Timestamps/Chapters check (improves watch time)
    const hasTimestamps = /\d{1,2}:\d{2}/.test(description);
    result.hasTimestamps = hasTimestamps;
    if (hasTimestamps) {
      result.score += 20;
    } else {
      result.suggestions.push('Add timestamps/chapters - improves watch time and appears in Google search');
    }

    // Hashtags check
    const hashtags = description.match(/#[\w]+/g) || [];
    result.hashtags = hashtags;
    if (hashtags.length >= 3 && hashtags.length <= 15) {
      result.score += 15;
    } else if (hashtags.length > 0) {
      result.score += 8;
    } else {
      result.suggestions.push('Add 3-5 relevant hashtags (shown above video title)');
    }

    // CTA check
    const ctaKeywords = ['subscribe', 'like', 'comment', 'share', 'follow', 'click', 'watch'];
    const hasCTA = ctaKeywords.some(cta => description.toLowerCase().includes(cta));
    result.hasCTA = hasCTA;
    if (hasCTA) {
      result.score += 10;
    } else {
      result.suggestions.push('Add call-to-action (subscribe, like, comment)');
    }

    // Keyword density in first 2-3 lines
    const firstLines = description.split('\n').slice(0, 3).join(' ');
    result.firstLines = firstLines;

    result.score = Math.min(result.score, 100);
    return result;
  }

  // Tags Analysis
  analyzeTags(tags, title, description) {
    const result = {
      score: 0,
      count: tags?.length || 0,
      issues: [],
      suggestions: [],
      tagAnalysis: []
    };

    if (!tags || tags.length === 0) {
      result.score = 0;
      result.issues.push('No tags found');
      result.suggestions.push('Add 10-15 relevant tags mixing broad and specific keywords');
      return result;
    }

    // Tag count (optimal: 8-15)
    if (tags.length >= 8 && tags.length <= 15) {
      result.score += 25;
      result.countStatus = 'optimal';
    } else if (tags.length >= 5 && tags.length <= 20) {
      result.score += 15;
      result.countStatus = 'acceptable';
    } else if (tags.length < 5) {
      result.score += 5;
      result.countStatus = 'too_few';
      result.suggestions.push('Add more tags (aim for 10-15)');
    } else {
      result.score += 10;
      result.countStatus = 'too_many';
      result.issues.push('Too many tags may dilute relevance');
    }

    // Analyze tag types
    const titleLower = title.toLowerCase();
    const descLower = (description || '').toLowerCase();
    
    let broadTags = 0;
    let specificTags = 0;
    let titleMatchTags = 0;
    let descMatchTags = 0;

    tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      const analysis = {
        tag: tag,
        type: tag.split(' ').length > 2 ? 'long-tail' : 'broad',
        inTitle: titleLower.includes(tagLower),
        inDescription: descLower.includes(tagLower)
      };
      
      if (analysis.type === 'long-tail') specificTags++;
      else broadTags++;
      
      if (analysis.inTitle) titleMatchTags++;
      if (analysis.inDescription) descMatchTags++;
      
      result.tagAnalysis.push(analysis);
    });

    result.broadTags = broadTags;
    result.specificTags = specificTags;
    result.titleMatchTags = titleMatchTags;
    result.descMatchTags = descMatchTags;

    // Tag diversity (mix of broad and specific)
    const hasGoodMix = broadTags >= 3 && specificTags >= 3;
    if (hasGoodMix) {
      result.score += 20;
    } else {
      result.suggestions.push('Mix broad tags (e.g., "gaming") with specific long-tail tags (e.g., "minecraft survival tips 2026")');
    }

    // Tags matching title
    if (titleMatchTags >= 2) {
      result.score += 20;
    } else {
      result.suggestions.push('Ensure main tags appear in your title');
    }

    // First tag importance (most important tag should match video topic)
    const firstTag = tags[0];
    if (titleLower.includes(firstTag.toLowerCase())) {
      result.score += 15;
    } else {
      result.suggestions.push('Put your main keyword as the first tag');
    }

    // Character count (total tag chars, max ~500)
    const totalChars = tags.join('').length;
    result.totalTagChars = totalChars;
    if (totalChars < 400) {
      result.suggestions.push('You can add more tag characters (aim for 400-500 total)');
    }

    result.score = Math.min(result.score, 100);
    return result;
  }

  // Engagement Analysis
  analyzeEngagement(videoData) {
    const result = {
      score: 0,
      metrics: {},
      issues: [],
      suggestions: []
    };

    const views = videoData.views || 0;
    const likes = videoData.likes || 0;
    const engagementRate = parseFloat(videoData.engagementRate) || 0;

    result.metrics = {
      views,
      likes,
      engagementRate
    };

    // Engagement rate benchmarks
    // Average: 2-4%, Good: 4-6%, Excellent: 6%+
    if (engagementRate >= 6) {
      result.score += 40;
      result.status = 'excellent';
    } else if (engagementRate >= 4) {
      result.score += 30;
      result.status = 'good';
    } else if (engagementRate >= 2) {
      result.score += 20;
      result.status = 'average';
    } else if (engagementRate >= 1) {
      result.score += 10;
      result.status = 'below_average';
      result.suggestions.push('Engagement below average - add stronger CTAs');
    } else {
      result.score += 5;
      result.status = 'low';
      result.issues.push('Very low engagement rate');
    }

    // Views milestone check
    if (views >= 1000000) {
      result.score += 30;
      result.viewsStatus = 'viral';
    } else if (views >= 100000) {
      result.score += 25;
      result.viewsStatus = 'high';
    } else if (views >= 10000) {
      result.score += 20;
      result.viewsStatus = 'good';
    } else if (views >= 1000) {
      result.score += 15;
      result.viewsStatus = 'moderate';
    } else {
      result.score += 5;
      result.viewsStatus = 'low';
    }

    // Like ratio
    const likeRatio = views > 0 ? (likes / views) * 100 : 0;
    result.metrics.likeRatio = likeRatio.toFixed(2);

    result.score = Math.min(result.score, 100);
    return result;
  }

  // CTR Potential Analysis
  analyzeCTRPotential(title) {
    const result = {
      score: 0,
      predictedCTR: 'average',
      factors: []
    };

    const titleLower = title.toLowerCase();
    let ctrBoost = 0;

    // Factors that increase CTR (based on YouTube data)

    // Numbers (+36% CTR)
    if (/\d+/.test(title)) {
      ctrBoost += 36;
      result.factors.push({ factor: 'Contains number', impact: '+36%' });
    }

    // Brackets (+38% CTR)
    if (/[\[\]\(\)]/.test(title)) {
      ctrBoost += 38;
      result.factors.push({ factor: 'Uses brackets', impact: '+38%' });
    }

    // Question words (+14% CTR)
    if (/^(how|what|why|when|where|which|who)\s/i.test(title)) {
      ctrBoost += 14;
      result.factors.push({ factor: 'Question format', impact: '+14%' });
    }

    // Power words (+20% average)
    const powerWordCount = this.powerWords.filter(w => titleLower.includes(w)).length;
    if (powerWordCount >= 2) {
      ctrBoost += 25;
      result.factors.push({ factor: 'Multiple power words', impact: '+25%' });
    } else if (powerWordCount === 1) {
      ctrBoost += 15;
      result.factors.push({ factor: 'Power word used', impact: '+15%' });
    }

    // Emotional triggers (+20%)
    if (this.emotionalTriggers.some(w => titleLower.includes(w))) {
      ctrBoost += 20;
      result.factors.push({ factor: 'Emotional trigger', impact: '+20%' });
    }

    // Year in title (+10%)
    if (/20\d{2}/.test(title)) {
      ctrBoost += 10;
      result.factors.push({ factor: 'Current year', impact: '+10%' });
    }

    // All caps words (1-2 is good, more is spammy)
    const capsWords = title.match(/\b[A-Z]{2,}\b/g) || [];
    if (capsWords.length >= 1 && capsWords.length <= 2) {
      ctrBoost += 8;
      result.factors.push({ factor: 'Strategic CAPS', impact: '+8%' });
    } else if (capsWords.length > 3) {
      ctrBoost -= 10;
      result.factors.push({ factor: 'Too many CAPS (spammy)', impact: '-10%' });
    }

    // Calculate predicted CTR category
    result.ctrBoostPercent = ctrBoost;
    
    if (ctrBoost >= 80) {
      result.predictedCTR = 'excellent';
      result.score = 95;
    } else if (ctrBoost >= 50) {
      result.predictedCTR = 'high';
      result.score = 80;
    } else if (ctrBoost >= 30) {
      result.predictedCTR = 'above_average';
      result.score = 65;
    } else if (ctrBoost >= 15) {
      result.predictedCTR = 'average';
      result.score = 50;
    } else {
      result.predictedCTR = 'below_average';
      result.score = 30;
    }

    return result;
  }

  // Watch Time Factors
  analyzeWatchTimeFactors(videoData) {
    const result = {
      score: 0,
      factors: [],
      suggestions: []
    };

    // Duration analysis
    const duration = videoData.duration;
    if (duration && duration !== 'N/A') {
      const parts = duration.split(':').map(Number);
      let totalSeconds = 0;
      
      if (parts.length === 3) {
        totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        totalSeconds = parts[0] * 60 + parts[1];
      }

      result.durationSeconds = totalSeconds;

      // Optimal duration depends on content type
      // General: 8-15 mins for algorithm, but quality matters more
      if (totalSeconds >= 480 && totalSeconds <= 900) {
        result.score += 30;
        result.factors.push({ factor: 'Optimal duration (8-15 min)', status: 'good' });
      } else if (totalSeconds >= 300 && totalSeconds <= 1200) {
        result.score += 20;
        result.factors.push({ factor: 'Acceptable duration', status: 'ok' });
      } else if (totalSeconds < 60) {
        result.score += 5;
        result.factors.push({ factor: 'Very short video (Shorts?)', status: 'note' });
      } else if (totalSeconds > 1800) {
        result.score += 15;
        result.factors.push({ factor: 'Long-form content (30+ min)', status: 'ok' });
        result.suggestions.push('Long videos work well if retention is high');
      }
    }

    // Description timestamps (improves retention)
    if (videoData.description && /\d{1,2}:\d{2}/.test(videoData.description)) {
      result.score += 25;
      result.factors.push({ factor: 'Has chapters/timestamps', status: 'excellent' });
    } else {
      result.suggestions.push('Add timestamps in description to improve retention');
    }

    // Title clarity (affects expectation match = retention)
    const titleLength = videoData.title?.length || 0;
    if (titleLength >= 50 && titleLength <= 70) {
      result.score += 20;
      result.factors.push({ factor: 'Clear, descriptive title', status: 'good' });
    }

    // Tags relevance affects suggested videos = more watch time
    if (videoData.tags?.length >= 8) {
      result.score += 15;
      result.factors.push({ factor: 'Good tag coverage', status: 'good' });
    }

    result.score = Math.min(result.score, 100);
    return result;
  }

  // Calculate Overall Score
  calculateOverallScore(breakdown) {
    const scores = {
      title: breakdown.title.score * 0.25,
      description: breakdown.description.score * 0.20,
      tags: breakdown.tags.score * 0.20,
      ctr: breakdown.ctrPotential.score * 0.20,
      engagement: breakdown.engagement.score * 0.10,
      watchTime: breakdown.watchTimeFactors.score * 0.05
    };

    const total = Object.values(scores).reduce((sum, val) => sum + val, 0);
    return Math.round(total);
  }

  // Generate Prioritized Recommendations
  generateRecommendations(breakdown, videoData) {
    const recommendations = [];

    // Collect all suggestions with priority
    const addRec = (category, priority, title, suggestion) => {
      recommendations.push({ category, priority, title, suggestion });
    };

    // Title recommendations (HIGH priority - affects CTR most)
    if (breakdown.title.score < 60) {
      breakdown.title.suggestions.forEach(s => {
        addRec('title', 'high', '📝 Title Optimization', s);
      });
    }

    // Description recommendations
    if (breakdown.description.score < 50) {
      breakdown.description.suggestions.slice(0, 2).forEach(s => {
        addRec('description', 'high', '📄 Description', s);
      });
    } else {
      breakdown.description.suggestions.forEach(s => {
        addRec('description', 'medium', '📄 Description', s);
      });
    }

    // Tag recommendations
    if (breakdown.tags.score < 50) {
      breakdown.tags.suggestions.forEach(s => {
        addRec('tags', 'high', '🏷️ Tags', s);
      });
    } else {
      breakdown.tags.suggestions.forEach(s => {
        addRec('tags', 'medium', '🏷️ Tags', s);
      });
    }

    // CTR recommendations
    if (breakdown.ctrPotential.score < 50) {
      addRec('ctr', 'high', '🎯 CTR Improvement', 'Optimize title for higher click-through rate');
    }

    // Watch time recommendations
    breakdown.watchTimeFactors.suggestions.forEach(s => {
      addRec('watchTime', 'medium', '⏱️ Watch Time', s);
    });

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations.slice(0, 8); // Top 8 recommendations
  }

  // Identify Strengths and Warnings
  identifyStrengthsAndWarnings(analysis, videoData) {
    const { breakdown } = analysis;

    // Strengths
    if (breakdown.title.score >= 70) {
      analysis.strengths.push('✅ Well-optimized title');
    }
    if (breakdown.description.score >= 70) {
      analysis.strengths.push('✅ Strong description');
    }
    if (breakdown.tags.score >= 70) {
      analysis.strengths.push('✅ Good tag strategy');
    }
    if (breakdown.ctrPotential.predictedCTR === 'excellent' || breakdown.ctrPotential.predictedCTR === 'high') {
      analysis.strengths.push('✅ High CTR potential');
    }
    if (breakdown.engagement.status === 'excellent' || breakdown.engagement.status === 'good') {
      analysis.strengths.push('✅ Strong engagement');
    }

    // Warnings
    if (breakdown.title.score < 40) {
      analysis.warnings.push('⚠️ Title needs significant improvement');
    }
    if (breakdown.tags.count === 0) {
      analysis.warnings.push('⚠️ No tags - major SEO issue');
    }
    if (breakdown.description.wordCount < 50) {
      analysis.warnings.push('⚠️ Description too short');
    }
    if (breakdown.engagement.status === 'low') {
      analysis.warnings.push('⚠️ Very low engagement');
    }
  }

  // Get SEO Grade (A-F)
  getGrade(score) {
    if (score >= 90) return { grade: 'A+', color: '#00c853' };
    if (score >= 80) return { grade: 'A', color: '#00c853' };
    if (score >= 70) return { grade: 'B', color: '#64dd17' };
    if (score >= 60) return { grade: 'C', color: '#ffab00' };
    if (score >= 50) return { grade: 'D', color: '#ff6d00' };
    return { grade: 'F', color: '#ff1744' };
  }

  // Generate keyword suggestions based on current tags
  suggestKeywords(tags, title) {
    const suggestions = [];
    const titleWords = title.toLowerCase().split(/\s+/);
    
    // Suggest long-tail variations
    if (tags.length > 0) {
      const mainTag = tags[0];
      suggestions.push(`${mainTag} tutorial`);
      suggestions.push(`${mainTag} 2026`);
      suggestions.push(`best ${mainTag}`);
      suggestions.push(`${mainTag} for beginners`);
      suggestions.push(`how to ${mainTag}`);
    }

    return suggestions.slice(0, 5);
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = YouTubeSEOAnalyzer;
}
