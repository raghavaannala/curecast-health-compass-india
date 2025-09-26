import { 
  ChatbotAnalytics, 
  ChatbotSession, 
  ChatbotMessage, 
  Language 
} from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chatbot Analytics Service
 * Tracks usage metrics, accuracy, user satisfaction, and performance
 */
export class ChatbotAnalyticsService {
  private static instance: ChatbotAnalyticsService;
  private analytics: Map<string, ChatbotAnalytics> = new Map();
  private dailyMetrics: Map<string, any> = new Map(); // date -> metrics
  private userSatisfactionScores: Map<string, number[]> = new Map(); // userId -> scores
  private intentAccuracyLog: Array<{ intent: string; predicted: string; actual: string; correct: boolean; timestamp: string }> = [];
  private responseTimeLog: Array<{ sessionId: string; responseTime: number; timestamp: string }> = [];

  public static getInstance(): ChatbotAnalyticsService {
    if (!ChatbotAnalyticsService.instance) {
      ChatbotAnalyticsService.instance = new ChatbotAnalyticsService();
    }
    return ChatbotAnalyticsService.instance;
  }

  constructor() {
    this.initializeDailyMetrics();
  }

  /**
   * Track chatbot session analytics
   */
  async trackSession(session: ChatbotSession): Promise<void> {
    try {
      const analytics: ChatbotAnalytics = {
        sessionId: session.id,
        userId: session.userId,
        platform: session.platform,
        language: session.language,
        startTime: session.startTime,
        endTime: session.endTime,
        messageCount: session.messages.length,
        intentAccuracy: this.calculateIntentAccuracy(session),
        escalated: session.status === 'escalated',
        escalationReason: session.escalationReason,
        resolvedQuery: this.isQueryResolved(session),
        queryCategory: this.categorizeQuery(session),
        responseTime: this.calculateAverageResponseTime(session),
        location: session.userProfile?.location
      };

      this.analytics.set(session.id, analytics);
      await this.updateDailyMetrics(analytics);

    } catch (error) {
      console.error('Error tracking session analytics:', error);
    }
  }

  /**
   * Track user satisfaction score
   */
  async trackUserSatisfaction(
    userId: string, 
    sessionId: string, 
    score: number, // 1-5 scale
    feedback?: string
  ): Promise<void> {
    try {
      // Update analytics record
      const analytics = this.analytics.get(sessionId);
      if (analytics) {
        analytics.userSatisfaction = score;
        this.analytics.set(sessionId, analytics);
      }

      // Track user satisfaction history
      if (!this.userSatisfactionScores.has(userId)) {
        this.userSatisfactionScores.set(userId, []);
      }
      this.userSatisfactionScores.get(userId)!.push(score);

      // Update daily metrics
      const today = new Date().toISOString().split('T')[0];
      const dailyMetrics = this.dailyMetrics.get(today) || this.getEmptyDailyMetrics();
      
      dailyMetrics.satisfactionScores.push(score);
      dailyMetrics.averageSatisfaction = this.calculateAverage(dailyMetrics.satisfactionScores);
      
      if (feedback) {
        dailyMetrics.feedback.push({
          userId,
          sessionId,
          score,
          feedback,
          timestamp: new Date().toISOString()
        });
      }

      this.dailyMetrics.set(today, dailyMetrics);

    } catch (error) {
      console.error('Error tracking user satisfaction:', error);
    }
  }

  /**
   * Track intent recognition accuracy
   */
  async trackIntentAccuracy(
    predictedIntent: string,
    actualIntent: string,
    confidence: number,
    sessionId: string
  ): Promise<void> {
    try {
      const correct = predictedIntent === actualIntent;
      
      this.intentAccuracyLog.push({
        intent: actualIntent,
        predicted: predictedIntent,
        actual: actualIntent,
        correct,
        timestamp: new Date().toISOString()
      });

      // Update daily metrics
      const today = new Date().toISOString().split('T')[0];
      const dailyMetrics = this.dailyMetrics.get(today) || this.getEmptyDailyMetrics();
      
      dailyMetrics.intentAccuracy.total++;
      if (correct) {
        dailyMetrics.intentAccuracy.correct++;
      }
      dailyMetrics.intentAccuracy.percentage = 
        (dailyMetrics.intentAccuracy.correct / dailyMetrics.intentAccuracy.total) * 100;

      this.dailyMetrics.set(today, dailyMetrics);

    } catch (error) {
      console.error('Error tracking intent accuracy:', error);
    }
  }

  /**
   * Track response time
   */
  async trackResponseTime(sessionId: string, responseTime: number): Promise<void> {
    try {
      this.responseTimeLog.push({
        sessionId,
        responseTime,
        timestamp: new Date().toISOString()
      });

      // Update daily metrics
      const today = new Date().toISOString().split('T')[0];
      const dailyMetrics = this.dailyMetrics.get(today) || this.getEmptyDailyMetrics();
      
      dailyMetrics.responseTimes.push(responseTime);
      dailyMetrics.averageResponseTime = this.calculateAverage(dailyMetrics.responseTimes);

      this.dailyMetrics.set(today, dailyMetrics);

    } catch (error) {
      console.error('Error tracking response time:', error);
    }
  }

  /**
   * Get analytics dashboard data
   */
  async getDashboardData(
    dateRange: { startDate: string; endDate: string },
    filters?: {
      platform?: string;
      language?: Language;
      location?: { state?: string; district?: string };
    }
  ): Promise<{
    overview: {
      totalSessions: number;
      totalUsers: number;
      averageSatisfaction: number;
      intentAccuracy: number;
      escalationRate: number;
      resolutionRate: number;
    };
    trends: {
      dailySessions: Array<{ date: string; count: number }>;
      satisfactionTrend: Array<{ date: string; score: number }>;
      accuracyTrend: Array<{ date: string; accuracy: number }>;
    };
    breakdowns: {
      byPlatform: Array<{ platform: string; sessions: number; percentage: number }>;
      byLanguage: Array<{ language: string; sessions: number; percentage: number }>;
      byLocation: Array<{ location: string; sessions: number; percentage: number }>;
      byCategory: Array<{ category: string; sessions: number; percentage: number }>;
    };
    performance: {
      averageResponseTime: number;
      peakHours: Array<{ hour: number; sessions: number }>;
      commonIssues: Array<{ issue: string; count: number }>;
    };
  }> {
    try {
      const filteredAnalytics = this.filterAnalytics(dateRange, filters);
      
      return {
        overview: this.calculateOverviewMetrics(filteredAnalytics),
        trends: this.calculateTrends(dateRange, filters),
        breakdowns: this.calculateBreakdowns(filteredAnalytics),
        performance: this.calculatePerformanceMetrics(filteredAnalytics)
      };

    } catch (error) {
      console.error('Error generating dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(): Promise<{
    activeSessions: number;
    messagesPerMinute: number;
    currentResponseTime: number;
    escalationsToday: number;
    satisfactionToday: number;
    topIssues: Array<{ issue: string; count: number }>;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyMetrics = this.dailyMetrics.get(today) || this.getEmptyDailyMetrics();
      
      // Calculate messages per minute (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentAnalytics = Array.from(this.analytics.values())
        .filter(a => new Date(a.startTime) > oneHourAgo);
      
      const totalMessages = recentAnalytics.reduce((sum, a) => sum + a.messageCount, 0);
      const messagesPerMinute = totalMessages / 60;

      // Current response time (last 10 responses)
      const recentResponseTimes = this.responseTimeLog
        .slice(-10)
        .map(r => r.responseTime);
      const currentResponseTime = this.calculateAverage(recentResponseTimes);

      return {
        activeSessions: recentAnalytics.filter(a => !a.endTime).length,
        messagesPerMinute,
        currentResponseTime,
        escalationsToday: dailyMetrics.escalations,
        satisfactionToday: dailyMetrics.averageSatisfaction,
        topIssues: this.getTopIssues(today)
      };

    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      throw error;
    }
  }

  /**
   * Generate accuracy report
   */
  async getAccuracyReport(
    dateRange: { startDate: string; endDate: string }
  ): Promise<{
    overallAccuracy: number;
    intentAccuracy: Array<{ intent: string; accuracy: number; samples: number }>;
    languageAccuracy: Array<{ language: Language; accuracy: number; samples: number }>;
    improvementSuggestions: string[];
  }> {
    try {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      // Filter accuracy log by date range
      const filteredLog = this.intentAccuracyLog.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
      });

      // Calculate overall accuracy
      const overallAccuracy = filteredLog.length > 0 
        ? (filteredLog.filter(log => log.correct).length / filteredLog.length) * 100
        : 0;

      // Calculate intent-wise accuracy
      const intentAccuracy = this.calculateIntentWiseAccuracy(filteredLog);
      
      // Calculate language-wise accuracy
      const languageAccuracy = this.calculateLanguageWiseAccuracy(dateRange);
      
      // Generate improvement suggestions
      const improvementSuggestions = this.generateImprovementSuggestions(
        intentAccuracy,
        languageAccuracy,
        overallAccuracy
      );

      return {
        overallAccuracy,
        intentAccuracy,
        languageAccuracy,
        improvementSuggestions
      };

    } catch (error) {
      console.error('Error generating accuracy report:', error);
      throw error;
    }
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(
    format: 'csv' | 'json' | 'excel',
    dateRange: { startDate: string; endDate: string },
    filters?: any
  ): Promise<{ data: any; filename: string }> {
    try {
      const filteredAnalytics = this.filterAnalytics(dateRange, filters);
      
      const exportData = {
        summary: this.calculateOverviewMetrics(filteredAnalytics),
        sessions: filteredAnalytics,
        dailyMetrics: this.getDailyMetricsInRange(dateRange),
        intentAccuracy: this.intentAccuracyLog.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate >= new Date(dateRange.startDate) && 
                 logDate <= new Date(dateRange.endDate);
        })
      };

      const filename = `chatbot_analytics_${dateRange.startDate}_${dateRange.endDate}.${format}`;
      
      return {
        data: format === 'json' ? JSON.stringify(exportData, null, 2) : exportData,
        filename
      };

    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Calculate intent accuracy for a session
   */
  private calculateIntentAccuracy(session: ChatbotSession): number {
    // This would analyze the session messages and calculate accuracy
    // For now, return a placeholder value
    return 0.85; // 85% accuracy
  }

  /**
   * Check if query was resolved
   */
  private isQueryResolved(session: ChatbotSession): boolean {
    // Check if session ended normally (not escalated or timeout)
    return session.status === 'completed' && !session.escalationReason;
  }

  /**
   * Categorize query based on session content
   */
  private categorizeQuery(session: ChatbotSession): string {
    const messages = session.messages.map(m => m.content.toLowerCase()).join(' ');
    
    if (messages.includes('vaccine') || messages.includes('vaccination')) {
      return 'vaccination';
    } else if (messages.includes('symptom') || messages.includes('sick') || messages.includes('pain')) {
      return 'symptoms';
    } else if (messages.includes('emergency') || messages.includes('urgent')) {
      return 'emergency';
    } else if (messages.includes('prevention') || messages.includes('health')) {
      return 'prevention';
    }
    
    return 'general';
  }

  /**
   * Calculate average response time for a session
   */
  private calculateAverageResponseTime(session: ChatbotSession): number {
    const assistantMessages = session.messages.filter(m => m.role === 'assistant');
    if (assistantMessages.length === 0) return 0;

    let totalTime = 0;
    let count = 0;

    for (let i = 1; i < session.messages.length; i++) {
      const current = session.messages[i];
      const previous = session.messages[i - 1];
      
      if (current.role === 'assistant' && previous.role === 'user') {
        const responseTime = new Date(current.timestamp).getTime() - 
                           new Date(previous.timestamp).getTime();
        totalTime += responseTime;
        count++;
      }
    }

    return count > 0 ? totalTime / count : 0;
  }

  /**
   * Initialize daily metrics structure
   */
  private initializeDailyMetrics(): void {
    const today = new Date().toISOString().split('T')[0];
    this.dailyMetrics.set(today, this.getEmptyDailyMetrics());
  }

  /**
   * Get empty daily metrics structure
   */
  private getEmptyDailyMetrics(): any {
    return {
      date: new Date().toISOString().split('T')[0],
      sessions: 0,
      users: new Set(),
      messages: 0,
      escalations: 0,
      resolutions: 0,
      satisfactionScores: [],
      averageSatisfaction: 0,
      responseTimes: [],
      averageResponseTime: 0,
      intentAccuracy: { correct: 0, total: 0, percentage: 0 },
      platforms: { whatsapp: 0, sms: 0, web: 0, ivr: 0 },
      languages: {},
      categories: {},
      feedback: []
    };
  }

  /**
   * Update daily metrics
   */
  private async updateDailyMetrics(analytics: ChatbotAnalytics): Promise<void> {
    const date = analytics.startTime.split('T')[0];
    const dailyMetrics = this.dailyMetrics.get(date) || this.getEmptyDailyMetrics();

    dailyMetrics.sessions++;
    dailyMetrics.users.add(analytics.userId);
    dailyMetrics.messages += analytics.messageCount;
    
    if (analytics.escalated) {
      dailyMetrics.escalations++;
    }
    
    if (analytics.resolvedQuery) {
      dailyMetrics.resolutions++;
    }

    dailyMetrics.platforms[analytics.platform]++;
    
    if (!dailyMetrics.languages[analytics.language]) {
      dailyMetrics.languages[analytics.language] = 0;
    }
    dailyMetrics.languages[analytics.language]++;

    if (!dailyMetrics.categories[analytics.queryCategory]) {
      dailyMetrics.categories[analytics.queryCategory] = 0;
    }
    dailyMetrics.categories[analytics.queryCategory]++;

    this.dailyMetrics.set(date, dailyMetrics);
  }

  /**
   * Filter analytics by date range and filters
   */
  private filterAnalytics(
    dateRange: { startDate: string; endDate: string },
    filters?: any
  ): ChatbotAnalytics[] {
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    return Array.from(this.analytics.values()).filter(analytics => {
      const analyticsDate = new Date(analytics.startTime);
      
      // Date range filter
      if (analyticsDate < startDate || analyticsDate > endDate) {
        return false;
      }

      // Platform filter
      if (filters?.platform && analytics.platform !== filters.platform) {
        return false;
      }

      // Language filter
      if (filters?.language && analytics.language !== filters.language) {
        return false;
      }

      // Location filter
      if (filters?.location) {
        if (filters.location.state && 
            analytics.location?.state !== filters.location.state) {
          return false;
        }
        if (filters.location.district && 
            analytics.location?.district !== filters.location.district) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Calculate overview metrics
   */
  private calculateOverviewMetrics(analytics: ChatbotAnalytics[]): any {
    const totalSessions = analytics.length;
    const uniqueUsers = new Set(analytics.map(a => a.userId)).size;
    const escalated = analytics.filter(a => a.escalated).length;
    const resolved = analytics.filter(a => a.resolvedQuery).length;
    const satisfactionScores = analytics
      .filter(a => a.userSatisfaction !== undefined)
      .map(a => a.userSatisfaction!);

    return {
      totalSessions,
      totalUsers: uniqueUsers,
      averageSatisfaction: this.calculateAverage(satisfactionScores),
      intentAccuracy: this.calculateAverage(analytics.map(a => a.intentAccuracy)),
      escalationRate: totalSessions > 0 ? (escalated / totalSessions) * 100 : 0,
      resolutionRate: totalSessions > 0 ? (resolved / totalSessions) * 100 : 0
    };
  }

  /**
   * Calculate trends
   */
  private calculateTrends(
    dateRange: { startDate: string; endDate: string },
    filters?: any
  ): any {
    const dailySessions: Array<{ date: string; count: number }> = [];
    const satisfactionTrend: Array<{ date: string; score: number }> = [];
    const accuracyTrend: Array<{ date: string; accuracy: number }> = [];

    // Generate date range
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayMetrics = this.dailyMetrics.get(dateStr);
      
      dailySessions.push({
        date: dateStr,
        count: dayMetrics?.sessions || 0
      });
      
      satisfactionTrend.push({
        date: dateStr,
        score: dayMetrics?.averageSatisfaction || 0
      });
      
      accuracyTrend.push({
        date: dateStr,
        accuracy: dayMetrics?.intentAccuracy.percentage || 0
      });
    }

    return { dailySessions, satisfactionTrend, accuracyTrend };
  }

  /**
   * Calculate breakdowns
   */
  private calculateBreakdowns(analytics: ChatbotAnalytics[]): any {
    const total = analytics.length;
    
    // Platform breakdown
    const platformCounts = analytics.reduce((acc, a) => {
      acc[a.platform] = (acc[a.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPlatform = Object.entries(platformCounts).map(([platform, count]) => ({
      platform,
      sessions: count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));

    // Language breakdown
    const languageCounts = analytics.reduce((acc, a) => {
      acc[a.language] = (acc[a.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byLanguage = Object.entries(languageCounts).map(([language, count]) => ({
      language,
      sessions: count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));

    // Location breakdown
    const locationCounts = analytics.reduce((acc, a) => {
      const location = a.location?.state || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byLocation = Object.entries(locationCounts).map(([location, count]) => ({
      location,
      sessions: count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));

    // Category breakdown
    const categoryCounts = analytics.reduce((acc, a) => {
      acc[a.queryCategory] = (acc[a.queryCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      sessions: count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));

    return { byPlatform, byLanguage, byLocation, byCategory };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(analytics: ChatbotAnalytics[]): any {
    const responseTimes = analytics.map(a => a.responseTime);
    const averageResponseTime = this.calculateAverage(responseTimes);

    // Peak hours analysis
    const hourCounts = analytics.reduce((acc, a) => {
      const hour = new Date(a.startTime).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHours = Object.entries(hourCounts)
      .map(([hour, sessions]) => ({ hour: parseInt(hour), sessions }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5);

    // Common issues (escalation reasons)
    const issueCounts = analytics
      .filter(a => a.escalationReason)
      .reduce((acc, a) => {
        acc[a.escalationReason!] = (acc[a.escalationReason!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const commonIssues = Object.entries(issueCounts)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { averageResponseTime, peakHours, commonIssues };
  }

  /**
   * Calculate average of number array
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Calculate intent-wise accuracy
   */
  private calculateIntentWiseAccuracy(logs: any[]): Array<{ intent: string; accuracy: number; samples: number }> {
    const intentStats = logs.reduce((acc, log) => {
      if (!acc[log.intent]) {
        acc[log.intent] = { correct: 0, total: 0 };
      }
      acc[log.intent].total++;
      if (log.correct) {
        acc[log.intent].correct++;
      }
      return acc;
    }, {} as Record<string, { correct: number; total: number }>);

    return Object.entries(intentStats).map(([intent, stats]) => ({
      intent,
      accuracy: (stats.correct / stats.total) * 100,
      samples: stats.total
    }));
  }

  /**
   * Calculate language-wise accuracy
   */
  private calculateLanguageWiseAccuracy(dateRange: any): Array<{ language: Language; accuracy: number; samples: number }> {
    // This would analyze accuracy by language
    // Placeholder implementation
    return [
      { language: 'english', accuracy: 90, samples: 100 },
      { language: 'hindi', accuracy: 85, samples: 80 },
      { language: 'telugu', accuracy: 82, samples: 60 }
    ];
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovementSuggestions(
    intentAccuracy: any[],
    languageAccuracy: any[],
    overallAccuracy: number
  ): string[] {
    const suggestions: string[] = [];

    if (overallAccuracy < 80) {
      suggestions.push('Overall accuracy is below 80%. Consider retraining the NLP model with more diverse examples.');
    }

    const lowAccuracyIntents = intentAccuracy.filter(i => i.accuracy < 70);
    if (lowAccuracyIntents.length > 0) {
      suggestions.push(`Low accuracy intents detected: ${lowAccuracyIntents.map(i => i.intent).join(', ')}. Add more training examples for these intents.`);
    }

    const lowAccuracyLanguages = languageAccuracy.filter(l => l.accuracy < 75);
    if (lowAccuracyLanguages.length > 0) {
      suggestions.push(`Languages with low accuracy: ${lowAccuracyLanguages.map(l => l.language).join(', ')}. Improve language-specific training data.`);
    }

    return suggestions;
  }

  /**
   * Get top issues for a specific date
   */
  private getTopIssues(date: string): Array<{ issue: string; count: number }> {
    const dayMetrics = this.dailyMetrics.get(date);
    if (!dayMetrics) return [];

    // This would analyze common issues from the day's data
    return [
      { issue: 'Intent not recognized', count: 5 },
      { issue: 'Language detection failed', count: 3 },
      { issue: 'Complex medical query', count: 2 }
    ];
  }

  /**
   * Get daily metrics in date range
   */
  private getDailyMetricsInRange(dateRange: { startDate: string; endDate: string }): any[] {
    const result: any[] = [];
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const metrics = this.dailyMetrics.get(dateStr);
      if (metrics) {
        result.push({
          ...metrics,
          users: metrics.users.size // Convert Set to number
        });
      }
    }

    return result;
  }
}

export const chatbotAnalyticsService = ChatbotAnalyticsService.getInstance();
