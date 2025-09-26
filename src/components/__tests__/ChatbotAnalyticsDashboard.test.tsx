import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ChatbotAnalyticsDashboard from '../ChatbotAnalyticsDashboard';

// Mock recharts components to avoid canvas issues in tests
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Area: () => <div data-testid="area" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>
}));

describe('ChatbotAnalyticsDashboard', () => {
  it('renders without crashing', () => {
    expect(() => {
      render(<ChatbotAnalyticsDashboard />);
    }).not.toThrow();
  });

  it('shows loading state initially', () => {
    const { getByText } = render(<ChatbotAnalyticsDashboard />);
    expect(getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('has proper CSS classes applied', () => {
    const { container } = render(<ChatbotAnalyticsDashboard />);
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.className).toContain('p-6');
  });
});
