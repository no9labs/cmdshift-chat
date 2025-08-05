'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Password strength calculation
  const calculatePasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z\d]/.test(pwd)) score++;

    if (score <= 1) return { score: 20, label: 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { score: 40, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 3) return { score: 60, label: 'Good', color: 'bg-yellow-500' };
    if (score <= 4) return { score: 80, label: 'Strong', color: 'bg-green-500' };
    return { score: 100, label: 'Very Strong', color: 'bg-green-600' };
  };

  const passwordStrength = calculatePasswordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/login?message=Check your email to confirm your account');
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'github' | 'apple' | 'azure') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
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
    maxWidth: '500px',
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
    backgroundColor: loading || !agreeToTerms ? '#ccc' : '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: loading || !agreeToTerms ? 'not-allowed' : 'pointer',
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

  const socialButtonStyle = {
    width: '100%',
    padding: '10px',
    backgroundColor: 'white',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.label === 'Weak') return '#dc3545';
    if (passwordStrength.label === 'Fair') return '#fd7e14';
    if (passwordStrength.label === 'Good') return '#ffc107';
    if (passwordStrength.label === 'Strong') return '#28a745';
    return '#198754';
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', margin: '0 0 10px 0' }}>Create an account</h1>
          <p style={{ color: '#666', margin: 0 }}>Join CmdShift and start chatting with AI</p>
        </div>

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                First name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
                Last name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
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
              placeholder="Create a strong password"
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

            {password && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                  <span style={{ color: '#666' }}>Password strength</span>
                  <span style={{ fontWeight: '500', color: getPasswordStrengthColor() }}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${passwordStrength.score}%`,
                    height: '100%',
                    backgroundColor: getPasswordStrengthColor(),
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    {password.length >= 8 ? <Check size={14} color="#28a745" /> : <X size={14} color="#999" />}
                    <span style={{ color: password.length >= 8 ? '#28a745' : '#666' }}>At least 8 characters</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    {/[a-z]/.test(password) && /[A-Z]/.test(password) ? <Check size={14} color="#28a745" /> : <X size={14} color="#999" />}
                    <span style={{ color: /[a-z]/.test(password) && /[A-Z]/.test(password) ? '#28a745' : '#666' }}>Mix of uppercase & lowercase</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/\d/.test(password) ? <Check size={14} color="#28a745" /> : <X size={14} color="#999" />}
                    <span style={{ color: /\d/.test(password) ? '#28a745' : '#666' }}>At least one number</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>
              Confirm password
            </label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="terms" style={{ fontSize: '14px', cursor: 'pointer' }}>
              I agree to the{' '}
              <Link href="/terms" style={linkStyle}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" style={linkStyle}>
                Privacy Policy
              </Link>
            </label>
          </div>

          <button type="submit" disabled={loading || !agreeToTerms} style={buttonStyle}>
            {loading && <Loader2 size={20} className="animate-spin" />}
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div style={{ margin: '30px 0', textAlign: 'center' }}>
          <div style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', backgroundColor: '#ddd' }} />
            <span style={{ backgroundColor: 'white', padding: '0 10px', position: 'relative', fontSize: '12px', color: '#666' }}>
              Or sign up with
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <button onClick={() => handleSocialSignup('google')} disabled={loading} style={socialButtonStyle}>
            <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>
          <button onClick={() => handleSocialSignup('github')} disabled={loading} style={socialButtonStyle}>
            <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button onClick={() => handleSocialSignup('apple')} disabled={loading} style={socialButtonStyle}>
            <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
            </svg>
            Apple
          </button>
          <button onClick={() => handleSocialSignup('azure')} disabled={loading} style={socialButtonStyle}>
            <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
              <path fill="#0078D4" d="M0 8.898l5.096-6.895.041 6.629L0 8.965v-.067zm5.096 11.573l.041 6.631L0 20.207v-.068l5.096.332zM23.943 9.76l-11.47-1.64v7.409l11.47.031V9.76zm0 5.93l-11.47.03v7.41l11.47-1.64V15.69z"/>
            </svg>
            Microsoft
          </button>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Already have an account?{' '}
            <Link href="/login" style={linkStyle}>
              Sign in
            </Link>
          </p>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
          <p>🔒 Your data is encrypted and secure</p>
          <p style={{ marginTop: '5px' }}>By signing up, you agree to our Terms and Privacy Policy</p>
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