// Sentiment Analysis Module
// Analyzes comment sentiment using lexicon-based approach

class SentimentAnalyzer {
  constructor() {
    // Positive words lexicon
    this.positiveWords = new Set([
      'good', 'great', 'awesome', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'love', 'perfect', 'best', 'brilliant', 'outstanding', 'superb', 'incredible',
      'helpful', 'useful', 'informative', 'clear', 'nice', 'beautiful', 'cool',
      'thanks', 'thank', 'appreciate', 'enjoyed', 'enjoying', 'impressive', 'epic',
      'wow', 'masterpiece', 'genius', 'legendary', 'inspiring', 'motivating',
      'comprehensive', 'detailed', 'thorough', 'quality', 'valuable', 'recommended'
    ]);

    // Negative words lexicon
    this.negativeWords = new Set([
      'bad', 'terrible', 'awful', 'horrible', 'poor', 'worst', 'disappointing',
      'hate', 'sucks', 'boring', 'useless', 'waste', 'misleading', 'clickbait',
      'confusing', 'unclear', 'complicated', 'difficult', 'wrong', 'incorrect',
      'dislike', 'annoying', 'irritating', 'frustrating', 'pathetic', 'garbage',
      'trash', 'crap', 'stupid', 'dumb', 'fake', 'scam', 'spam'
    ]);

    // Emoji sentiment mapping
    this.positiveEmojis = ['😊', '😃', '😄', '🙂', '😁', '👍', '❤️', '💖', '🔥', '✨', '🎉', '👏', '🙌', '💯'];
    this.negativeEmojis = ['😞', '😢', '😠', '😡', '👎', '💔', '😤', '😒'];
  }

  // Analyze single comment
  analyzeSentiment(text) {
    if (!text || text.trim() === '') {
      return { sentiment: 'neutral', score: 0 };
    }

    const cleanText = text.toLowerCase();
    const words = cleanText.match(/\b\w+\b/g) || [];
    
    let positiveScore = 0;
    let negativeScore = 0;

    // Count positive/negative words
    words.forEach(word => {
      if (this.positiveWords.has(word)) positiveScore++;
      if (this.negativeWords.has(word)) negativeScore++;
    });

    // Check emojis
    this.positiveEmojis.forEach(emoji => {
      if (text.includes(emoji)) positiveScore += 0.5;
    });

    this.negativeEmojis.forEach(emoji => {
      if (text.includes(emoji)) negativeScore += 0.5;
    });

    // Calculate final sentiment
    const totalScore = positiveScore - negativeScore;
    
    let sentiment = 'neutral';
    if (totalScore > 0.5) sentiment = 'positive';
    else if (totalScore < -0.5) sentiment = 'negative';

    return {
      sentiment: sentiment,
      score: totalScore,
      positiveCount: positiveScore,
      negativeCount: negativeScore
    };
  }

  // Analyze batch of comments
  analyzeComments(comments) {
    const results = {
      positive: 0,
      negative: 0,
      neutral: 0,
      totalScore: 0,
      distribution: [],
      topPositive: [],
      topNegative: []
    };

    const analyzed = comments.map(comment => {
      const analysis = this.analyzeSentiment(comment.text);
      return {
        ...comment,
        sentiment: analysis.sentiment,
        sentimentScore: analysis.score
      };
    });

    // Count sentiments
    analyzed.forEach(comment => {
      results[comment.sentiment]++;
      results.totalScore += comment.sentimentScore;
    });

    // Calculate percentages
    const total = comments.length;
    results.distribution = [
      { label: 'Positive', count: results.positive, percentage: ((results.positive / total) * 100).toFixed(1) },
      { label: 'Neutral', count: results.neutral, percentage: ((results.neutral / total) * 100).toFixed(1) },
      { label: 'Negative', count: results.negative, percentage: ((results.negative / total) * 100).toFixed(1) }
    ];

    // Get top positive/negative comments
    const sortedByScore = [...analyzed].sort((a, b) => b.sentimentScore - a.sentimentScore);
    results.topPositive = sortedByScore.slice(0, 5).filter(c => c.sentiment === 'positive');
    results.topNegative = sortedByScore.slice(-5).filter(c => c.sentiment === 'negative');

    // Overall sentiment
    const avgScore = results.totalScore / total;
    results.overall = avgScore > 0.3 ? 'positive' : avgScore < -0.3 ? 'negative' : 'neutral';
    results.averageScore = avgScore.toFixed(2);

    return results;
  }

  // Get sentiment emoji
  getSentimentEmoji(sentiment) {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      default: return '😐';
    }
  }

  // Get sentiment color
  getSentimentColor(sentiment) {
    switch (sentiment) {
      case 'positive': return '#2ba640';
      case 'negative': return '#f44336';
      default: return '#ff9800';
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SentimentAnalyzer;
}
