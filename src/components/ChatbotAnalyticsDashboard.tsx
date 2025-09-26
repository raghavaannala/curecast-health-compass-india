import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Globe,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';
import { chatbotAnalyticsService } from '../services/chatbotAnalyticsService';
import { Language } from '../types';

interface ChatbotAnalyticsDashboardProps {
  className?: string;
}

export const ChatbotAnalyticsDashboard: React.FC<ChatbotAnalyticsDashboardProps> = ({ 
  className = '' 
}) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>(null);
  const [accuracyReport, setAccuracyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState<{
    platform?: string;
    language?: Language;
    location?: { state?: string; district?: string };
  }>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'accuracy' | 'realtime'>('overview');

  useEffect(() => {
    loadDashboardData();
    loadRealTimeMetrics();
    loadAccuracyReport();

    // Set up real-time updates
    const interval = setInterval(() => {
      loadRealTimeMetrics();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [selectedDateRange, filters]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await chatbotAnalyticsService.getDashboardData(
        selectedDateRange,
        Object.keys(filters).length > 0 ? filters : undefined
      );
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealTimeMetrics = async () => {
    try {
      const metrics = await chatbotAnalyticsService.getRealTimeMetrics();
      setRealTimeMetrics(metrics);
    } catch (error) {
      console.error('Error loading real-time metrics:', error);
    }
  };

  const loadAccuracyReport = async () => {
    try {
      const report = await chatbotAnalyticsService.getAccuracyReport(selectedDateRange);
      setAccuracyReport(report);
    } catch (error) {
      console.error('Error loading accuracy report:', error);
    }
  };

  const handleExport = async (format: 'csv' | 'json' | 'excel') => {
    try {
      const exportData = await chatbotAnalyticsService.exportAnalytics(
        format,
        selectedDateRange,
        filters
      );
      
      // Create download link
      const blob = new Blob([exportData.data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportData.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading && !dashboardData) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="animate-spin" size={20} />
            <span>Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chatbot Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor chatbot performance and user engagement</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          {/* Date Range Selector */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={selectedDateRange.startDate}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={selectedDateRange.endDate}
              onChange={(e) => setSelectedDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            />
          </div>

          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'accuracy', label: 'Accuracy', icon: CheckCircle },
            { id: 'realtime', label: 'Real-time', icon: Clock }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData.overview.totalSessions.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Unique Users</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData.overview.totalUsers.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Satisfaction</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData.overview.averageSatisfaction.toFixed(1)}/5
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Resolution Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {dashboardData.overview.resolutionRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Sessions Trend */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Daily Sessions</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.trends.dailySessions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Platform Distribution */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Platform Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.breakdowns.byPlatform}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ platform, percentage }) => `${platform}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="sessions"
                  >
                    {dashboardData.breakdowns.byPlatform.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Language Distribution */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Language Usage</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.breakdowns.byLanguage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="language" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Query Categories */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Query Categories</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.breakdowns.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.performance.averageResponseTime.toFixed(0)}ms
                </p>
                <p className="text-sm text-gray-600">Avg Response Time</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.overview.intentAccuracy.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Intent Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {dashboardData.overview.escalationRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Escalation Rate</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accuracy Tab */}
      {activeTab === 'accuracy' && accuracyReport && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Overall Accuracy</h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {accuracyReport.overallAccuracy.toFixed(1)}%
              </div>
              <p className="text-gray-600">Intent Recognition Accuracy</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Intent Accuracy */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Intent-wise Accuracy</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={accuracyReport.intentAccuracy}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="intent" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Language Accuracy */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Language-wise Accuracy</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={accuracyReport.languageAccuracy}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="language" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Improvement Suggestions */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Improvement Suggestions</h3>
            <div className="space-y-3">
              {accuracyReport.improvementSuggestions.map((suggestion: string, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <p className="text-gray-700">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Tab */}
      {activeTab === 'realtime' && realTimeMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Sessions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {realTimeMetrics.activeSessions}
                  </p>
                </div>
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Messages/Min</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {realTimeMetrics.messagesPerMinute.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Response Time</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {realTimeMetrics.currentResponseTime.toFixed(0)}ms
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Today's Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Escalations</span>
                  <span className="font-semibold">{realTimeMetrics.escalationsToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Satisfaction</span>
                  <span className="font-semibold">{realTimeMetrics.satisfactionToday.toFixed(1)}/5</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Top Issues</h3>
              <div className="space-y-3">
                {realTimeMetrics.topIssues.map((issue: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-700">{issue.issue}</span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                      {issue.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotAnalyticsDashboard;
