// Monetization & Earnings Analysis Module
// Estimates earnings and analyzes monetization status

class MonetizationAnalyzer {
  constructor() {
    // CPM ranges (Cost Per Mille - per 1000 views)
    this.cpmRanges = {
      low: { min: 0.5, max: 2 },      // Developing countries, non-monetized niches
      medium: { min: 2, max: 5 },     // Average content
      high: { min: 5, max: 10 },      // Premium content, developed countries
      premium: { min: 10, max: 30 }   // Finance, tech, business content
    };

    // Niche-based CPM multipliers
    this.nicheMultipliers = {
      'finance': 2.5,
      'technology': 2.0,
      'business': 2.0,
      'education': 1.5,
      'gaming': 1.0,
      'entertainment': 0.8,
      'music': 0.7,
      'comedy': 0.8,
      'vlog': 0.9,
      'kids': 0.6
    };
  }

  // Detect if channel is monetized
  async detectMonetization(channelData, videoData) {
    const indicators = {
      hasAds: this.checkForAds(),
      hasYouTubePremium: this.checkYouTubePremium(),
      subscriberCount: this.parseCount(channelData?.subscribers),
      videoCount: this.parseCount(channelData?.videos),
      watchHours: null, // Can't detect directly
      isVerified: this.checkVerification()
    };

    // Monetization criteria check
    const meetsSubscriberRequirement = indicators.subscriberCount >= 1000;
    const meetsVideoRequirement = indicators.videoCount >= 10; // Rough estimate

    let status = 'unknown';
    let confidence = 'low';
    let reasons = [];

    if (indicators.hasAds) {
      status = 'monetized';
      confidence = 'high';
      reasons.push('Ads detected on video');
    } else if (meetsSubscriberRequirement) {
      status = 'likely_monetized';
      confidence = 'medium';
      reasons.push('Meets subscriber requirement (1000+)');
    } else {
      status = 'not_monetized';
      confidence = 'medium';
      reasons.push(`Below 1000 subscribers (${indicators.subscriberCount})`);
    }

    return {
      status,
      confidence,
      indicators,
      reasons,
      requirements: {
        subscribers: { required: 1000, current: indicators.subscriberCount, met: meetsSubscriberRequirement },
        watchHours: { required: 4000, current: 'unknown', met: 'unknown' },
        policies: { met: 'unknown' }
      }
    };
  }

  // Check if ads are running on the video
  checkForAds() {
    // Check for ad-related elements
    const adIndicators = [
      document.querySelector('.ytp-ad-player-overlay'),
      document.querySelector('.ytp-ad-module'),
      document.querySelector('.video-ads'),
      document.querySelector('ytd-display-ad-renderer')
    ];

    return adIndicators.some(indicator => indicator !== null);
  }

  // Check if YouTube Premium is active
  checkYouTubePremium() {
    // Check for premium indicators
    const premiumIndicators = document.querySelector('ytd-browse[page-subtype="premium"]');
    return premiumIndicators !== null;
  }

  // Check verification badge
  checkVerification() {
    const verificationBadge = document.querySelector('ytd-badge-supported-renderer[aria-label*="Verified"]') ||
                             document.querySelector('.yt-channel-title-icon-badge');
    return verificationBadge !== null;
  }

  // Estimate earnings from a video
  estimateEarnings(videoData, channelData) {
    const views = this.parseCount(videoData.views);
    
    if (views === 0) {
      return {
        error: 'View count not available',
        estimated: { min: 0, max: 0 }
      };
    }

    // Determine CPM based on content category
    const cpmCategory = this.determineCPMCategory(videoData, channelData);
    const cpmRange = this.cpmRanges[cpmCategory];

    // Calculate estimated earnings
    // Formula: (Views / 1000) * CPM * Monetized_View_Percentage
    // Typically 40-60% of views are monetized
    const monetizedViewPercentage = 0.5; // 50% average
    const youtubeRevShare = 0.55; // YouTube takes 45%, creator gets 55%

    const minEarnings = (views / 1000) * cpmRange.min * monetizedViewPercentage * youtubeRevShare;
    const maxEarnings = (views / 1000) * cpmRange.max * monetizedViewPercentage * youtubeRevShare;
    const avgEarnings = (minEarnings + maxEarnings) / 2;

    return {
      estimated: {
        min: minEarnings.toFixed(2),
        max: maxEarnings.toFixed(2),
        average: avgEarnings.toFixed(2)
      },
      cpmCategory,
      cpmRange,
      assumptions: {
        monetizedViewPercentage: `${monetizedViewPercentage * 100}%`,
        youtubeRevShare: `${youtubeRevShare * 100}%`,
        note: 'Estimates based on industry averages. Actual earnings may vary.'
      },
      breakdown: {
        totalViews: views.toLocaleString(),
        monetizedViews: Math.round(views * monetizedViewPercentage).toLocaleString(),
        cpm: `$${cpmRange.min} - $${cpmRange.max}`,
        creatorShare: '55%'
      }
    };
  }

  // Determine CPM category based on content
  determineCPMCategory(videoData, channelData) {
    const title = (videoData.title || '').toLowerCase();
    const description = (videoData.description || '').toLowerCase();
    const tags = videoData.tags || [];
    const category = (videoData.category || '').toLowerCase();

    // Check for premium keywords
    const premiumKeywords = ['finance', 'investing', 'stock', 'business', 'saas', 'startup', 'real estate'];
    const highKeywords = ['technology', 'coding', 'programming', 'tutorial', 'education', 'course'];
    const mediumKeywords = ['review', 'unboxing', 'how to', 'tips', 'guide'];

    const allText = `${title} ${description} ${tags.join(' ')} ${category}`;

    if (premiumKeywords.some(kw => allText.includes(kw))) {
      return 'premium';
    } else if (highKeywords.some(kw => allText.includes(kw))) {
      return 'high';
    } else if (mediumKeywords.some(kw => allText.includes(kw))) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  // Estimate subscriber growth from a video
  estimateSubscriberGrowth(videoData, channelData) {
    const views = this.parseCount(videoData.views);
    const currentSubscribers = this.parseCount(channelData?.subscribers);
    
    if (views === 0) {
      return {
        error: 'View count not available',
        estimated: 0
      };
    }

    // Industry averages: 
    // - Viral videos: 5-10% conversion
    // - Good videos: 1-3% conversion
    // - Average videos: 0.5-1% conversion
    // - Poor videos: 0.1-0.5% conversion

    const engagementRate = parseFloat(videoData.engagementRate) || 0;
    
    let conversionRate = 0.005; // 0.5% default
    
    if (engagementRate > 8) {
      conversionRate = 0.05; // 5% - viral
    } else if (engagementRate > 5) {
      conversionRate = 0.03; // 3% - excellent
    } else if (engagementRate > 3) {
      conversionRate = 0.02; // 2% - good
    } else if (engagementRate > 1) {
      conversionRate = 0.01; // 1% - average
    }

    const estimatedNewSubscribers = Math.round(views * conversionRate);
    const percentageGrowth = currentSubscribers > 0 
      ? ((estimatedNewSubscribers / currentSubscribers) * 100).toFixed(2)
      : 'N/A';

    return {
      estimated: estimatedNewSubscribers,
      conversionRate: `${(conversionRate * 100).toFixed(2)}%`,
      percentageGrowth: percentageGrowth !== 'N/A' ? `${percentageGrowth}%` : 'N/A',
      quality: this.getVideoQuality(engagementRate),
      breakdown: {
        totalViews: views.toLocaleString(),
        conversionRate: `${(conversionRate * 100).toFixed(2)}%`,
        estimatedNewSubs: estimatedNewSubscribers.toLocaleString(),
        currentSubs: currentSubscribers.toLocaleString()
      },
      note: 'Estimation based on engagement rate and industry averages'
    };
  }

  // Get video quality assessment
  getVideoQuality(engagementRate) {
    if (engagementRate > 8) return 'Viral 🔥';
    if (engagementRate > 5) return 'Excellent ⭐';
    if (engagementRate > 3) return 'Good ✅';
    if (engagementRate > 1) return 'Average 👍';
    return 'Below Average 👎';
  }

  // Estimate total channel earnings
  estimateChannelEarnings(channelData, recentVideos = []) {
    if (!channelData || !channelData.views) {
      return { error: 'Channel data not available' };
    }

    const totalViews = this.parseCount(channelData.views);
    const videoCount = this.parseCount(channelData.videos);
    
    // Calculate average CPM for channel
    const avgCPM = 3; // Conservative average
    const monetizedViewPercentage = 0.5;
    const youtubeRevShare = 0.55;

    // Lifetime earnings estimate
    const lifetimeEarnings = (totalViews / 1000) * avgCPM * monetizedViewPercentage * youtubeRevShare;

    // Monthly earnings estimate (based on recent 30 days)
    // This would require historical data from storage
    const avgViewsPerVideo = totalViews / videoCount;
    const estimatedMonthlyViews = avgViewsPerVideo * 4; // Assume 4 videos per month
    const monthlyEarnings = (estimatedMonthlyViews / 1000) * avgCPM * monetizedViewPercentage * youtubeRevShare;

    return {
      lifetime: {
        estimated: lifetimeEarnings.toFixed(2),
        views: totalViews.toLocaleString()
      },
      monthly: {
        estimated: monthlyEarnings.toFixed(2),
        basedOn: 'Average of 4 videos/month'
      },
      perVideo: {
        estimated: (lifetimeEarnings / videoCount).toFixed(2),
        avgViews: avgViewsPerVideo.toLocaleString()
      },
      note: 'Estimates based on average CPM of $3. Actual earnings vary greatly.'
    };
  }

  // Parse count strings (e.g., "1.2M" to 1200000)
  parseCount(countStr) {
    if (!countStr || countStr === 'N/A') return 0;
    
    const str = String(countStr).toLowerCase().replace(/,/g, '');
    const match = str.match(/([\d.]+)([kmb])?/);
    
    if (!match) return 0;
    
    const num = parseFloat(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'k': return Math.round(num * 1000);
      case 'm': return Math.round(num * 1000000);
      case 'b': return Math.round(num * 1000000000);
      default: return Math.round(num);
    }
  }

  // Format currency
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MonetizationAnalyzer;
}
