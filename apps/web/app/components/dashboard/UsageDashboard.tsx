'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UsageData {
  daily: Array<{
    date: string;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    total_cost: number;
  }>;
  monthly_total: {
    total_tokens: number;
    total_cost: number;
    input_tokens: number;
    output_tokens: number;
  };
  model_breakdown: Record<string, {
    tokens: number;
    cost: number;
    percentage: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function UsageDashboard({ userId }: { userId: string }) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
  }, [userId]);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8001/api/v1/usage?user_id=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch usage data');
      const data = await response.json();
      setUsage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center p-8">Loading usage data...</div>;
  if (error) return <div className="text-red-500 p-8">Error: {error}</div>;
  if (!usage) return <div className="p-8">No usage data available</div>;

  // Prepare data for charts
  const dailyChartData = usage.daily.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    tokens: day.total_tokens,
    cost: day.total_cost
  }));

  const tokenBreakdown = [
    { name: 'Input Tokens', value: usage.monthly_total.input_tokens },
    { name: 'Output Tokens', value: usage.monthly_total.output_tokens }
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens (Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.monthly_total.total_tokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Input: {usage.monthly_total.input_tokens.toLocaleString()} | Output: {usage.monthly_total.output_tokens.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost (Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${usage.monthly_total.total_cost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              Across all models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost per 1K Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${usage.monthly_total.total_tokens > 0 
                ? ((usage.monthly_total.total_cost / usage.monthly_total.total_tokens) * 1000).toFixed(4)
                : '0.0000'}
            </div>
            <p className="text-xs text-muted-foreground">
              Blended rate across models
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Usage Trend</CardTitle>
          <CardDescription>Token usage and costs over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="tokens" 
                stroke="#8884d8" 
                name="Tokens"
                strokeWidth={2}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="cost" 
                stroke="#82ca9d" 
                name="Cost ($)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Token Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Token Type Distribution</CardTitle>
          <CardDescription>Input vs Output token usage</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tokenBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {tokenBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Model Usage Breakdown */}
      {usage.model_breakdown && Object.keys(usage.model_breakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Model Usage Breakdown</CardTitle>
            <CardDescription>Token usage and costs by AI model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(usage.model_breakdown).map(([model, data]) => {
                const modelDisplayNames: Record<string, string> = {
                  'deepseek-chat': 'DeepSeek ($0.27/M)',
                  'deepseek-coder': 'DeepSeek Coder ($0.27/M)',
                  'glm-4-plus': 'GLM-4 Plus ($0.05/M)',
                  'glm-4-flash': 'GLM-4 Flash ($0.0001/M)',
                  'qwen3-235b-a22b': 'Qwen3-235B ($2.80/M)'
                };
                
                return (
                  <div key={model} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {modelDisplayNames[model] || model}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {data.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{data.tokens.toLocaleString()} tokens</span>
                      <span>${data.cost.toFixed(4)}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${data.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Model Cost Comparison */}
            <div className="mt-6 pt-6 border-t">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={Object.entries(usage.model_breakdown).map(([model, data]) => ({
                  model: model.split('-')[0].toUpperCase(),
                  cost: data.cost,
                  tokens: data.tokens
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cost" fill="#82ca9d" name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}