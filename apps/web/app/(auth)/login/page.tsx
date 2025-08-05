'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.href = '/chat/new';
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    padding: '40px'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
    marginTop: '5px'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: loading ? '#ccc' : '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const linkStyle = {
    color: '#007bff',
    textDecoration: 'none',
    fontSize: '14px'
  };

  const errorStyle = {
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    color: '#c33',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '20px',
    fontSize: '14px'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', margin: '0 0 10px 0' }}>Welcome Back</h1>
          <p style={{ color: '#666', margin: 0 }}>Sign in to your CmdShift account</p>
        </div>

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
              Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '32px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Remember me
            </label>
            <Link href="/forgot-password" style={linkStyle}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading && <Loader2 size={20} className="animate-spin" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Don't have an account?{' '}
            <Link href="/signup" style={linkStyle}>
              Sign up
            </Link>
          </p>
        </div>

        <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #eee' }}>
          <div style={{ 
            backgroundColor: '#f0f7ff', 
            padding: '15px', 
            borderRadius: '5px',
            fontSize: '14px',
            color: '#0066cc'
          }}>
            <strong>Demo Accounts:</strong>
            <ul style={{ margin: '10px 0 0 20px', paddingLeft: '0' }}>
              <li>Free: demo@example.com / demo123</li>
              <li>Pro: demo_pro@example.com / demo123</li>
            </ul>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}