// Competitor Analysis Module
// Compares current video with similar/competitor videos

class CompetitorAnalyzer {
  constructor(apiService) {
    this.apiService = apiService;
  }

  // Find and analyze competitor videos
  async analyzeCompetitors(currentVideo) {
    if (!this.apiService.isConfigured()) {
      return { error: 'API key required for competitor analysis' };
    }

    // Extract search query from title
    const searchQuery = this.extractSearchQuery(currentVideo.title);

    // Search for similar videos
    const searchResults = await this.apiService.searchSimilarVideos(searchQuery, 20);
    
    if (searchResults.error) {
      return { error: searchResults.error };
    }

    // Get detailed stats for competitor videos
    const competitors = [];
    for (const video of searchResults.videos) {
      if (video.id.videoId === currentVideo.videoId) continue; // Skip current video
      
      const stats = await this.apiService.getVideoStats(video.id.videoId);
      if (stats.success) {
        competitors.push({
          videoId: video.id.videoId,
          title: video.snippet.title,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          views: parseInt(stats.statistics.viewCount),
          likes: parseInt(stats.statistics.likeCount),
          comments: parseInt(stats.statistics.commentCount || 0),
          thumbnail: video.snippet.thumbnails.medium.url
        });
      }
    }

    // Calculate performance metrics
    const analysis = this.calculatePerformanceMetrics(currentVideo, competitors);

    return {
      success: true,
      competitors: competitors.slice(0, 10), // Top 10 competitors
      analysis: analysis
    };
  }

  extractSearchQuery(title) {
    // Remove common words and extract key terms
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'how', 'what', 'when', 'where', 'why', 'which', 'who', 'this', 'that'
    ]);

    const words = title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => !commonWords.has(word) && word.length > 3);

    // Take first 3-5 important words
    return words.slice(0, 5).join(' ');
  }

  calculatePerformanceMetrics(currentVideo, competitors) {
    if (competitors.length === 0) {
      return {
        ranking: 'N/A',
        viewsPercentile: 50,
        likesPercentile: 50,
        engagementPercentile: 50,
        message: 'Not enough competitor data'
      };
    }

    // Add current video to comparison
    const allVideos = [...competitors, {
      views: currentVideo.views,
      likes: currentVideo.likes,
      comments: currentVideo.comments || 0
    }];

    // Calculate engagement rates
    allVideos.forEach(video => {
      video.engagementRate = video.views > 0 ? ((video.likes + video.comments) / video.views) * 100 : 0;
    });

    // Sort by views
    const sortedByViews = [...allVideos].sort((a, b) => b.views - a.views);
    const viewsRank = sortedByViews.findIndex(v => v.views === currentVideo.views) + 1;
    const viewsPercentile = ((allVideos.length - viewsRank + 1) / allVideos.length) * 100;

    // Sort by likes
    const sortedByLikes = [...allVideos].sort((a, b) => b.likes - a.likes);
    const likesRank = sortedByLikes.findIndex(v => v.likes === currentVideo.likes) + 1;
    const likesPercentile = ((allVideos.length - likesRank + 1) / allVideos.length) * 100;

    // Sort by engagement
    const currentEngagement = currentVideo.views > 0 ? 
      ((currentVideo.likes + (currentVideo.comments || 0)) / currentVideo.views) * 100 : 0;
    const sortedByEngagement = [...allVideos].sort((a, b) => b.engagementRate - a.engagementRate);
    const engagementRank = sortedByEngagement.findIndex(v => 
      Math.abs(v.engagementRate - currentEngagement) < 0.01
    ) + 1;
    const engagementPercentile = ((allVideos.length - engagementRank + 1) / allVideos.length) * 100;

    // Calculate averages
    const avgViews = allVideos.reduce((sum, v) => sum + v.views, 0) / allVideos.length;
    const avgLikes = allVideos.reduce((sum, v) => sum + v.likes, 0) / allVideos.length;
    const avgEngagement = allVideos.reduce((sum, v) => sum + v.engagementRate, 0) / allVideos.length;

    // Performance message
    let performanceLevel = 'Average';
    const avgPercentile = (viewsPercentile + likesPercentile + engagementPercentile) / 3;
    
    if (avgPercentile >= 75) performanceLevel = 'Excellent';
    else if (avgPercentile >= 50) performanceLevel = 'Good';
    else if (avgPercentile >= 25) performanceLevel = 'Below Average';
    else performanceLevel = 'Needs Improvement';

    return {
      totalCompetitors: competitors.length,
      
      views: {
        current: currentVideo.views,
        average: Math.round(avgViews),
        rank: viewsRank,
        percentile: Math.round(viewsPercentile),
        status: viewsPercentile >= 50 ? 'above' : 'below'
      },
      
      likes: {
        current: currentVideo.likes,
        average: Math.round(avgLikes),
        rank: likesRank,
        percentile: Math.round(likesPercentile),
        status: likesPercentile >= 50 ? 'above' : 'below'
      },
      
      engagement: {
        current: currentEngagement.toFixed(2),
        average: avgEngagement.toFixed(2),
        rank: engagementRank,
        percentile: Math.round(engagementPercentile),
        status: engagementPercentile >= 50 ? 'above' : 'below'
      },
      
      overall: {
        percentile: Math.round(avgPercentile),
        performanceLevel: performanceLevel,
        message: this.getPerformanceMessage(performanceLevel, avgPercentile)
      }
    };
  }

  getPerformanceMessage(level, percentile) {
    switch (level) {
      case 'Excellent':
        return `🏆 Outstanding! Your video is in the top ${100 - percentile}% of similar content.`;
      case 'Good':
        return `✅ Good performance! Better than ${percentile}% of similar videos.`;
      case 'Below Average':
        return `⚠️ Room for improvement. Consider optimizing title, tags, and thumbnail.`;
      case 'Needs Improvement':
        return `📉 Underperforming compared to similar content. Focus on SEO and promotion.`;
      default:
        return 'Performance metrics calculated.';
    }
  }

  // Find top performing competitor
  getTopPerformer(competitors) {
    if (competitors.length === 0) return null;

    return competitors.reduce((top, current) => {
      const topEngagement = (top.likes + top.comments) / top.views;
      const currentEngagement = (current.likes + current.comments) / current.views;
      return currentEngagement > topEngagement ? current : top;
    });
  }

  // Get insights and recommendations
  getRecommendations(analysis, currentVideo) {
    const recommendations = [];

    // Views recommendation
    if (analysis.views.status === 'below') {
      recommendations.push({
        type: 'views',
        priority: 'high',
        title: 'Increase View Count',
        suggestion: 'Your views are below average. Focus on SEO optimization, better thumbnail, and promote on social media.'
      });
    }

    // Likes recommendation
    if (analysis.likes.status === 'below') {
      recommendations.push({
        type: 'engagement',
        priority: 'medium',
        title: 'Improve Engagement',
        suggestion: 'Ask viewers to like and comment. Add engaging CTAs throughout the video.'
      });
    }

    // Title length
    if (currentVideo.title.length < 40) {
      recommendations.push({
        type: 'seo',
        priority: 'medium',
        title: 'Optimize Title Length',
        suggestion: 'Your title is short. Aim for 50-70 characters for better SEO.'
      });
    }

    // Tags
    if (currentVideo.tags.length < 10) {
      recommendations.push({
        type: 'seo',
        priority: 'high',
        title: 'Add More Tags',
        suggestion: 'Add more relevant tags (10-15) to improve discoverability.'
      });
    }

    return recommendations;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CompetitorAnalyzer;
}
