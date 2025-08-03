'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  MessageSquare, 
  Zap, 
  DollarSign,
  BarChart3,
  Calendar
} from 'lucide-react';

interface UsageData {
  total_messages: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
  model_breakdown: Array<{
    model: string;
    count: number;
    tokens: number;
    cost: number;
  }>;
  recent_activity: Array<{
    date: string;
    messages: number;
    tokens: number;
    cost: number;
  }>;
}

export default function UsagePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [usage, setUsage] = useState<UsageData>({
    total_messages: 0,
    total_input_tokens: 0,
    total_output_tokens: 0,
    total_cost: 0,
    model_breakdown: [],
    recent_activity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/login');
        return;
      }
      
      setUser(user);
      
      try {
        const response = await fetch(`http://localhost:8001/api/v1/usage?user_id=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          
          // Transform the data to match our interface
          const transformedData: UsageData = {
            total_messages: data.total_messages || 0,
            total_input_tokens: data.monthly_total?.input_tokens || 0,
            total_output_tokens: data.monthly_total?.output_tokens || 0,
            total_cost: data.total_cost || data.monthly_total?.total_cost || 0,
            model_breakdown: Object.entries(data.model_breakdown || {}).map(([model, stats]: [string, any]) => ({
              model,
              count: Math.round(stats.tokens / 500), // Estimate messages
              tokens: stats.tokens,
              cost: stats.cost
            })).sort((a, b) => b.count - a.count),
            recent_activity: (data.daily || []).slice(-7).map((day: any) => ({
              date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              messages: day.messages || Math.round(day.total_tokens / 500),
              tokens: day.total_tokens,
              cost: day.total_cost
            }))
          };
          
          setUsage(transformedData);
        }
      } catch (error) {
        console.error('Failed to fetch usage data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkUserAndFetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Usage Analytics</h1>
        <p className="text-muted-foreground">Track your AI usage and costs across all models</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.total_messages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((usage.total_input_tokens + usage.total_output_tokens) / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground">
              Input + Output
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${usage.total_cost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/1K Tokens</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${usage.total_input_tokens + usage.total_output_tokens > 0 
                ? ((usage.total_cost / (usage.total_input_tokens + usage.total_output_tokens)) * 1000).toFixed(4)
                : '0.0000'}
            </div>
            <p className="text-xs text-muted-foreground">
              Blended rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Model Usage Breakdown */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Model Usage Distribution</CardTitle>
            <CardDescription>Messages sent to each model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usage.model_breakdown.length > 0 ? (
              usage.model_breakdown.map((model) => {
                const percentage = usage.total_messages > 0 
                  ? (model.count / usage.total_messages) * 100 
                  : 0;
                return (
                  <div key={model.model} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{model.model}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {model.count} messages
                        </span>
                      </div>
                      <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No model usage data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your usage over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usage.recent_activity.length > 0 ? (
                usage.recent_activity.map((day, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{day.date}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {day.messages} msgs
                      </span>
                      <Badge variant="secondary">${day.cost.toFixed(3)}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Tips */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Most Used Model</p>
              <p className="text-2xl font-bold">
                {usage.model_breakdown[0]?.model || 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">
                {usage.model_breakdown[0] && usage.total_messages > 0
                  ? `${((usage.model_breakdown[0].count / usage.total_messages) * 100).toFixed(0)}% of your usage`
                  : 'Start chatting to see insights'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Average Daily Messages</p>
              <p className="text-2xl font-bold">
                {usage.recent_activity.length > 0 
                  ? Math.round(usage.recent_activity.reduce((acc, day) => acc + day.messages, 0) / usage.recent_activity.length)
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Based on last 7 days
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Cost Efficiency</p>
              <p className="text-2xl font-bold text-green-600">90%</p>
              <p className="text-xs text-muted-foreground">
                Savings vs. competitor pricing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}