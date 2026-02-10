// Data Export Module
// Exports analytics data to CSV, JSON formats

class DataExporter {
  constructor() {
    this.filename = '';
  }

  // Export video analytics to JSON
  exportToJSON(data, filename = 'youtube-analytics') {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    this.downloadFile(blob, `${filename}.json`);
  }

  // Export video analytics to CSV
  exportToCSV(data, filename = 'youtube-analytics') {
    let csv = '';

    if (Array.isArray(data)) {
      // Array of objects - convert to CSV table
      if (data.length === 0) return;

      // Headers
      const headers = Object.keys(data[0]);
      csv += headers.join(',') + '\n';

      // Rows
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csv += values.join(',') + '\n';
      });
    } else {
      // Single object - convert to key-value pairs
      csv = 'Metric,Value\n';
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          csv += `${key},${JSON.stringify(value)}\n`;
        } else {
          csv += `${key},${value}\n`;
        }
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    this.downloadFile(blob, `${filename}.csv`);
  }

  // Export historical trend data
  exportHistoricalData(history, filename = 'video-history') {
    const formattedData = history.map(snapshot => ({
      date: new Date(snapshot.timestamp).toISOString().split('T')[0],
      time: new Date(snapshot.timestamp).toTimeString().split(' ')[0],
      views: snapshot.views,
      likes: snapshot.likes,
      comments: snapshot.comments || 0,
      engagementRate: snapshot.engagementRate,
      seoScore: snapshot.seoScore
    }));

    this.exportToCSV(formattedData, filename);
  }

  // Export competitor comparison
  exportCompetitorAnalysis(current, competitors, filename = 'competitor-analysis') {
    const data = [
      {
        video: 'Current Video',
        title: current.title,
        views: current.views,
        likes: current.likes,
        comments: current.comments || 0,
        engagementRate: current.engagementRate
      },
      ...competitors.map(comp => ({
        video: 'Competitor',
        title: comp.title,
        views: comp.views,
        likes: comp.likes,
        comments: comp.comments || 0,
        engagementRate: ((comp.likes + comp.comments) / comp.views * 100).toFixed(2)
      }))
    ];

    this.exportToCSV(data, filename);
  }

  // Export sentiment analysis results
  exportSentimentAnalysis(sentimentData, filename = 'sentiment-analysis') {
    const data = {
      overall_sentiment: sentimentData.overall,
      average_score: sentimentData.averageScore,
      positive_count: sentimentData.positive,
      neutral_count: sentimentData.neutral,
      negative_count: sentimentData.negative,
      positive_percentage: sentimentData.distribution[0].percentage,
      neutral_percentage: sentimentData.distribution[1].percentage,
      negative_percentage: sentimentData.distribution[2].percentage
    };

    this.exportToJSON(data, filename);
  }

  // Generate comprehensive report
  generateReport(allData) {
    const report = {
      generated_at: new Date().toISOString(),
      video_info: {
        video_id: allData.videoId,
        title: allData.title,
        channel: allData.channelName,
        upload_date: allData.uploadDate,
        category: allData.category,
        duration: allData.duration
      },
      engagement_metrics: {
        views: allData.views,
        likes: allData.likes,
        comments: allData.comments,
        engagement_rate: allData.engagementRate
      },
      seo_metrics: {
        seo_score: allData.seoScore,
        tags_count: allData.tags.length,
        tags: allData.tags,
        keywords: allData.keywords,
        title_length: allData.title.length,
        description_length: allData.description.length
      }
    };

    if (allData.sentiment) {
      report.sentiment_analysis = allData.sentiment;
    }

    if (allData.competitors) {
      report.competitor_analysis = allData.competitors;
    }

    if (allData.history) {
      report.historical_data = allData.history;
    }

    this.exportToJSON(report, `full-report-${allData.videoId}`);
  }

  // Download file helper
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Copy data to clipboard
  copyToClipboard(data, format = 'json') {
    let text = '';
    
    if (format === 'json') {
      text = JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // Simple CSV format
      if (Array.isArray(data)) {
        const headers = Object.keys(data[0]);
        text = headers.join(',') + '\n';
        data.forEach(row => {
          text += headers.map(h => row[h]).join(',') + '\n';
        });
      } else {
        text = 'Metric,Value\n';
        Object.entries(data).forEach(([key, value]) => {
          text += `${key},${value}\n`;
        });
      }
    }

    navigator.clipboard.writeText(text).then(() => {
      console.log('Data copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataExporter;
}
