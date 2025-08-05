'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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

  const containerStyle = {
    maxWidth: '1152px',
    margin: '0 auto',
    padding: '32px 16px'
  };

  const headerStyle = {
    marginBottom: '32px'
  };

  const titleStyle = {
    fontSize: '30px',
    fontWeight: 'bold',
    marginBottom: '8px'
  };

  const subtitleStyle = {
    color: '#6b7280',
    fontSize: '16px'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '32px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  };

  const cardHeaderStyle = {
    padding: '16px',
    borderBottom: '1px solid #f3f4f6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const cardContentStyle = {
    padding: '16px'
  };

  const statValueStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '4px'
  };

  const statLabelStyle = {
    fontSize: '12px',
    color: '#6b7280'
  };

  const progressBarContainerStyle = {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '8px'
  };

  const progressBarFillStyle = (percentage: number) => ({
    height: '100%',
    backgroundColor: '#3b82f6',
    width: `${percentage}%`,
    transition: 'width 0.3s ease'
  });

  const modelBadgeStyle = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    color: '#374151'
  };

  const costBadgeStyle = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#f3f4f6',
    color: '#374151'
  };

  const loadingContainerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px'
  };

  const skeletonStyle = {
    height: '32px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    animation: 'pulse 2s ease-in-out infinite'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingContainerStyle}>
          <div style={{ ...skeletonStyle, width: '25%' }}></div>
          <div style={gridStyle}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ ...skeletonStyle, height: '128px' }}></div>
            ))}
          </div>
        </div>
        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Usage Analytics</h1>
        <p style={subtitleStyle}>Track your AI usage and costs across all models</p>
      </div>

      {/* Summary Cards */}
      <div style={gridStyle}>
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Total Messages</span>
            <MessageSquare size={16} color="#6b7280" />
          </div>
          <div style={cardContentStyle}>
            <div style={statValueStyle}>{usage.total_messages.toLocaleString()}</div>
            <p style={statLabelStyle}>All time</p>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Tokens Used</span>
            <Zap size={16} color="#6b7280" />
          </div>
          <div style={cardContentStyle}>
            <div style={statValueStyle}>
              {((usage.total_input_tokens + usage.total_output_tokens) / 1000).toFixed(1)}K
            </div>
            <p style={statLabelStyle}>Input + Output</p>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Total Cost</span>
            <DollarSign size={16} color="#6b7280" />
          </div>
          <div style={cardContentStyle}>
            <div style={statValueStyle}>${usage.total_cost.toFixed(4)}</div>
            <p style={statLabelStyle}>Estimated cost</p>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Avg Cost/1K Tokens</span>
            <BarChart3 size={16} color="#6b7280" />
          </div>
          <div style={cardContentStyle}>
            <div style={statValueStyle}>
              ${usage.total_input_tokens + usage.total_output_tokens > 0 
                ? ((usage.total_cost / (usage.total_input_tokens + usage.total_output_tokens)) * 1000).toFixed(4)
                : '0.0000'}
            </div>
            <p style={statLabelStyle}>Blended rate</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Model Usage Breakdown */}
        <div style={cardStyle}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Model Usage Distribution</h2>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Messages sent to each model</p>
          </div>
          <div style={{ padding: '24px' }}>
            {usage.model_breakdown.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {usage.model_breakdown.map((model) => {
                  const percentage = usage.total_messages > 0 
                    ? (model.count / usage.total_messages) * 100 
                    : 0;
                  return (
                    <div key={model.model}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={modelBadgeStyle}>{model.model}</span>
                          <span style={{ fontSize: '14px', color: '#6b7280' }}>
                            {model.count} messages
                          </span>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{percentage.toFixed(1)}%</span>
                      </div>
                      <div style={progressBarContainerStyle}>
                        <div style={progressBarFillStyle(percentage)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#6b7280' }}>No model usage data yet</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={cardStyle}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Recent Activity</h2>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>Your usage over the last 7 days</p>
          </div>
          <div style={{ padding: '24px' }}>
            {usage.recent_activity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {usage.recent_activity.map((day, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} color="#6b7280" />
                      <span style={{ fontSize: '14px' }}>{day.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        {day.messages} msgs
                      </span>
                      <span style={costBadgeStyle}>${day.cost.toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#6b7280' }}>No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Usage Insights */}
      <div style={{ ...cardStyle, marginTop: '24px' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} />
            Usage Insights
          </h2>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Most Used Model</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                {usage.model_breakdown[0]?.model || 'N/A'}
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                {usage.model_breakdown[0] && usage.total_messages > 0
                  ? `${((usage.model_breakdown[0].count / usage.total_messages) * 100).toFixed(0)}% of your usage`
                  : 'Start chatting to see insights'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Average Daily Messages</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
                {usage.recent_activity.length > 0 
                  ? Math.round(usage.recent_activity.reduce((acc, day) => acc + day.messages, 0) / usage.recent_activity.length)
                  : 0}
              </p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                Based on last 7 days
              </p>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>Cost Efficiency</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>90%</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                Savings vs. competitor pricing
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}