/**
 * Analytics and Accuracy Tracking Service
 * Monitors chatbot performance and user engagement metrics
 */

interface QueryMetrics {
  id: string;
  query: string;
  intent: string;
  confidence: number;
  responseTime: number;
  userFeedback?: 'positive' | 'negative' | 'neutral';
  language: string;
  timestamp: string;
  userId?: string;
  location?: string;
}

interface EngagementMetrics {
  userId: string;
  sessionId: string;
  totalQueries: number;
  successfulQueries: number;
  averageConfidence: number;
  sessionDuration: number;
  communicationChannel: 'web' | 'whatsapp' | 'sms';
  language: string;
  location: string;
  timestamp: string;
}

interface AccuracyReport {
  overallAccuracy: number;
  accuracyByIntent: Record<string, number>;
  accuracyByLanguage: Record<string, number>;
  totalQueries: number;
  timeRange: { start: string; end: string };
  improvementSuggestions: string[];
}

interface AwarenessMetrics {
  region: string;
  baselineAwareness: number;
  currentAwareness: number;
  improvement: number;
  surveysCompleted: number;
  educationContentViewed: number;
  preventionActionsReported: number;
}

class AnalyticsService {
  private queryMetrics: QueryMetrics[] = [];
  private engagementMetrics: EngagementMetrics[] = [];
  private awarenessData: Map<string, AwarenessMetrics> = new Map();
  private performanceTargets = {
    accuracyTarget: 80, // 80% accuracy target
    awarenessImprovementTarget: 20, // 20% awareness improvement target
    responseTimeTarget: 2000 // 2 seconds response time target
  };

  constructor() {
    this.initializeMockAwarenessData();
  }

  /**
   * Initialize mock awareness data for demonstration
   */
  private initializeMockAwarenessData(): void {
    const regions = [
      { name: 'Rural Maharashtra', baseline: 45, current: 58 },
      { name: 'Rural Karnataka', baseline: 52, current: 67 },
      { name: 'Rural Uttar Pradesh', baseline: 38, current: 48 },
      { name: 'Rural Bihar', baseline: 35, current: 44 },
      { name: 'Rural Rajasthan', baseline: 41, current: 53 }
    ];

    regions.forEach(region => {
      this.awarenessData.set(region.name, {
        region: region.name,
        baselineAwareness: region.baseline,
        currentAwareness: region.current,
        improvement: ((region.current - region.baseline) / region.baseline) * 100,
        surveysCompleted: Math.floor(Math.random() * 500) + 100,
        educationContentViewed: Math.floor(Math.random() * 1000) + 200,
        preventionActionsReported: Math.floor(Math.random() * 300) + 50
      });
    });
  }

  /**
   * Track query performance
   */
  trackQuery(metrics: Omit<QueryMetrics, 'id' | 'timestamp'>): string {
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queryMetric: QueryMetrics = {
      id: queryId,
      timestamp: new Date().toISOString(),
      ...metrics
    };

    this.queryMetrics.push(queryMetric);
    
    // Keep only last 10000 queries to manage memory
    if (this.queryMetrics.length > 10000) {
      this.queryMetrics = this.queryMetrics.slice(-10000);
    }

    return queryId;
  }

  /**
   * Track user engagement
   */
  trackEngagement(metrics: Omit<EngagementMetrics, 'timestamp'>): void {
    const engagementMetric: EngagementMetrics = {
      timestamp: new Date().toISOString(),
      ...metrics
    };

    this.engagementMetrics.push(engagementMetric);
    
    // Keep only last 5000 sessions
    if (this.engagementMetrics.length > 5000) {
      this.engagementMetrics = this.engagementMetrics.slice(-5000);
    }
  }

  /**
   * Update user feedback for a query
   */
  updateQueryFeedback(queryId: string, feedback: 'positive' | 'negative' | 'neutral'): boolean {
    const query = this.queryMetrics.find(q => q.id === queryId);
    if (query) {
      query.userFeedback = feedback;
      return true;
    }
    return false;
  }

  /**
   * Calculate overall accuracy
   */
  calculateAccuracy(timeRange?: { start: string; end: string }): AccuracyReport {
    let queries = this.queryMetrics;
    
    // Filter by time range if provided
    if (timeRange) {
      const startTime = new Date(timeRange.start).getTime();
      const endTime = new Date(timeRange.end).getTime();
      
      queries = queries.filter(q => {
        const queryTime = new Date(q.timestamp).getTime();
        return queryTime >= startTime && queryTime <= endTime;
      });
    }

    if (queries.length === 0) {
      return {
        overallAccuracy: 0,
        accuracyByIntent: {},
        accuracyByLanguage: {},
        totalQueries: 0,
        timeRange: timeRange || { start: '', end: '' },
        improvementSuggestions: ['No data available for analysis']
      };
    }

    // Calculate overall accuracy based on confidence and feedback
    const accurateQueries = queries.filter(q => {
      if (q.userFeedback === 'positive') return true;
      if (q.userFeedback === 'negative') return false;
      return q.confidence >= 0.7; // Consider high confidence as accurate
    });

    const overallAccuracy = (accurateQueries.length / queries.length) * 100;

    // Calculate accuracy by intent
    const accuracyByIntent: Record<string, number> = {};
    const intentGroups = this.groupBy(queries, 'intent');
    
    for (const [intent, intentQueries] of Object.entries(intentGroups)) {
      const accurate = intentQueries.filter(q => {
        if (q.userFeedback === 'positive') return true;
        if (q.userFeedback === 'negative') return false;
        return q.confidence >= 0.7;
      });
      accuracyByIntent[intent] = (accurate.length / intentQueries.length) * 100;
    }

    // Calculate accuracy by language
    const accuracyByLanguage: Record<string, number> = {};
    const languageGroups = this.groupBy(queries, 'language');
    
    for (const [language, languageQueries] of Object.entries(languageGroups)) {
      const accurate = languageQueries.filter(q => {
        if (q.userFeedback === 'positive') return true;
        if (q.userFeedback === 'negative') return false;
        return q.confidence >= 0.7;
      });
      accuracyByLanguage[language] = (accurate.length / languageQueries.length) * 100;
    }

    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(
      overallAccuracy,
      accuracyByIntent,
      accuracyByLanguage,
      queries
    );

    return {
      overallAccuracy: Math.round(overallAccuracy * 100) / 100,
      accuracyByIntent,
      accuracyByLanguage,
      totalQueries: queries.length,
      timeRange: timeRange || { 
        start: queries[0]?.timestamp || '', 
        end: queries[queries.length - 1]?.timestamp || '' 
      },
      improvementSuggestions
    };
  }

  /**
   * Generate improvement suggestions based on performance data
   */
  private generateImprovementSuggestions(
    overallAccuracy: number,
    accuracyByIntent: Record<string, number>,
    accuracyByLanguage: Record<string, number>,
    queries: QueryMetrics[]
  ): string[] {
    const suggestions: string[] = [];

    // Overall accuracy suggestions
    if (overallAccuracy < this.performanceTargets.accuracyTarget) {
      suggestions.push(`Overall accuracy (${overallAccuracy.toFixed(1)}%) is below target (${this.performanceTargets.accuracyTarget}%). Consider improving NLP models.`);
    }

    // Intent-specific suggestions
    for (const [intent, accuracy] of Object.entries(accuracyByIntent)) {
      if (accuracy < 70) {
        suggestions.push(`Low accuracy for "${intent}" intent (${accuracy.toFixed(1)}%). Add more training data for this intent.`);
      }
    }

    // Language-specific suggestions
    for (const [language, accuracy] of Object.entries(accuracyByLanguage)) {
      if (accuracy < 70) {
        suggestions.push(`Low accuracy for "${language}" language (${accuracy.toFixed(1)}%). Improve language-specific training data.`);
      }
    }

    // Response time suggestions
    const slowQueries = queries.filter(q => q.responseTime > this.performanceTargets.responseTimeTarget);
    if (slowQueries.length > queries.length * 0.1) {
      suggestions.push(`${((slowQueries.length / queries.length) * 100).toFixed(1)}% of queries exceed response time target. Optimize processing pipeline.`);
    }

    // Feedback-based suggestions
    const negativeQueries = queries.filter(q => q.userFeedback === 'negative');
    if (negativeQueries.length > 0) {
      suggestions.push(`${negativeQueries.length} queries received negative feedback. Review and improve responses for these query types.`);
    }

    return suggestions.length > 0 ? suggestions : ['Performance is meeting targets. Continue monitoring.'];
  }

  /**
   * Get engagement statistics
   */
  getEngagementStats(): {
    totalSessions: number;
    averageSessionDuration: number;
    averageQueriesPerSession: number;
    channelDistribution: Record<string, number>;
    languageDistribution: Record<string, number>;
    locationDistribution: Record<string, number>;
  } {
    if (this.engagementMetrics.length === 0) {
      return {
        totalSessions: 0,
        averageSessionDuration: 0,
        averageQueriesPerSession: 0,
        channelDistribution: {},
        languageDistribution: {},
        locationDistribution: {}
      };
    }

    const totalSessions = this.engagementMetrics.length;
    const averageSessionDuration = this.engagementMetrics.reduce((sum, m) => sum + m.sessionDuration, 0) / totalSessions;
    const averageQueriesPerSession = this.engagementMetrics.reduce((sum, m) => sum + m.totalQueries, 0) / totalSessions;

    const channelDistribution = this.getDistribution(this.engagementMetrics, 'communicationChannel');
    const languageDistribution = this.getDistribution(this.engagementMetrics, 'language');
    const locationDistribution = this.getDistribution(this.engagementMetrics, 'location');

    return {
      totalSessions,
      averageSessionDuration: Math.round(averageSessionDuration),
      averageQueriesPerSession: Math.round(averageQueriesPerSession * 100) / 100,
      channelDistribution,
      languageDistribution,
      locationDistribution
    };
  }

  /**
   * Update awareness metrics for a region
   */
  updateAwarenessMetrics(region: string, metrics: Partial<AwarenessMetrics>): void {
    const existing = this.awarenessData.get(region) || {
      region,
      baselineAwareness: 0,
      currentAwareness: 0,
      improvement: 0,
      surveysCompleted: 0,
      educationContentViewed: 0,
      preventionActionsReported: 0
    };

    const updated = { ...existing, ...metrics };
    updated.improvement = ((updated.currentAwareness - updated.baselineAwareness) / updated.baselineAwareness) * 100;

    this.awarenessData.set(region, updated);
  }

  /**
   * Get awareness improvement report
   */
  getAwarenessReport(): {
    overallImprovement: number;
    targetAchieved: boolean;
    regionPerformance: AwarenessMetrics[];
    topPerformingRegions: string[];
    needsAttentionRegions: string[];
  } {
    const regions = Array.from(this.awarenessData.values());
    
    if (regions.length === 0) {
      return {
        overallImprovement: 0,
        targetAchieved: false,
        regionPerformance: [],
        topPerformingRegions: [],
        needsAttentionRegions: []
      };
    }

    const overallImprovement = regions.reduce((sum, r) => sum + r.improvement, 0) / regions.length;
    const targetAchieved = overallImprovement >= this.performanceTargets.awarenessImprovementTarget;

    const sortedRegions = regions.sort((a, b) => b.improvement - a.improvement);
    const topPerformingRegions = sortedRegions.slice(0, 3).map(r => r.region);
    const needsAttentionRegions = sortedRegions.filter(r => r.improvement < 10).map(r => r.region);

    return {
      overallImprovement: Math.round(overallImprovement * 100) / 100,
      targetAchieved,
      regionPerformance: regions,
      topPerformingRegions,
      needsAttentionRegions
    };
  }

  /**
   * Generate comprehensive performance dashboard
   */
  generateDashboard(timeRange?: { start: string; end: string }): {
    accuracy: AccuracyReport;
    engagement: ReturnType<typeof this.getEngagementStats>;
    awareness: ReturnType<typeof this.getAwarenessReport>;
    keyMetrics: {
      totalQueries: number;
      averageConfidence: number;
      averageResponseTime: number;
      userSatisfaction: number;
    };
    alerts: string[];
  } {
    const accuracy = this.calculateAccuracy(timeRange);
    const engagement = this.getEngagementStats();
    const awareness = this.getAwarenessReport();

    // Calculate key metrics
    let queries = this.queryMetrics;
    if (timeRange) {
      const startTime = new Date(timeRange.start).getTime();
      const endTime = new Date(timeRange.end).getTime();
      queries = queries.filter(q => {
        const queryTime = new Date(q.timestamp).getTime();
        return queryTime >= startTime && queryTime <= endTime;
      });
    }

    const averageConfidence = queries.length > 0 
      ? queries.reduce((sum, q) => sum + q.confidence, 0) / queries.length 
      : 0;

    const averageResponseTime = queries.length > 0
      ? queries.reduce((sum, q) => sum + q.responseTime, 0) / queries.length
      : 0;

    const feedbackQueries = queries.filter(q => q.userFeedback);
    const positiveQueries = feedbackQueries.filter(q => q.userFeedback === 'positive');
    const userSatisfaction = feedbackQueries.length > 0
      ? (positiveQueries.length / feedbackQueries.length) * 100
      : 0;

    // Generate alerts
    const alerts: string[] = [];
    
    if (accuracy.overallAccuracy < this.performanceTargets.accuracyTarget) {
      alerts.push(`🚨 Accuracy below target: ${accuracy.overallAccuracy.toFixed(1)}% < ${this.performanceTargets.accuracyTarget}%`);
    }

    if (!awareness.targetAchieved) {
      alerts.push(`📊 Awareness improvement below target: ${awareness.overallImprovement.toFixed(1)}% < ${this.performanceTargets.awarenessImprovementTarget}%`);
    }

    if (averageResponseTime > this.performanceTargets.responseTimeTarget) {
      alerts.push(`⏱️ Response time above target: ${averageResponseTime.toFixed(0)}ms > ${this.performanceTargets.responseTimeTarget}ms`);
    }

    if (userSatisfaction < 70 && feedbackQueries.length > 10) {
      alerts.push(`😞 User satisfaction low: ${userSatisfaction.toFixed(1)}%`);
    }

    return {
      accuracy,
      engagement,
      awareness,
      keyMetrics: {
        totalQueries: queries.length,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime),
        userSatisfaction: Math.round(userSatisfaction * 100) / 100
      },
      alerts
    };
  }

  /**
   * Export analytics data for external analysis
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      queryMetrics: this.queryMetrics,
      engagementMetrics: this.engagementMetrics,
      awarenessData: Array.from(this.awarenessData.values()),
      exportTimestamp: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Simple CSV export for query metrics
      const headers = ['timestamp', 'query', 'intent', 'confidence', 'responseTime', 'userFeedback', 'language'];
      const rows = this.queryMetrics.map(q => [
        q.timestamp,
        q.query.replace(/,/g, ';'), // Escape commas
        q.intent,
        q.confidence,
        q.responseTime,
        q.userFeedback || '',
        q.language
      ]);

      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
  }

  /**
   * Utility function to group array by property
   */
  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Utility function to get distribution of values
   */
  private getDistribution<T>(array: T[], key: keyof T): Record<string, number> {
    const distribution: Record<string, number> = {};
    array.forEach(item => {
      const value = String(item[key]);
      distribution[value] = (distribution[value] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Clear old data to manage memory
   */
  clearOldData(daysToKeep: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffTime = cutoffDate.getTime();

    this.queryMetrics = this.queryMetrics.filter(q => 
      new Date(q.timestamp).getTime() > cutoffTime
    );

    this.engagementMetrics = this.engagementMetrics.filter(e => 
      new Date(e.timestamp).getTime() > cutoffTime
    );

    console.log(`Cleared analytics data older than ${daysToKeep} days`);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
