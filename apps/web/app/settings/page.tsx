'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Bell, Globe, Moon, Shield, Trash2, User } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [publicProfile, setPublicProfile] = useState(false);
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    // Implement account deletion logic here
    console.log('Account deletion requested');
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    // Save preferences to backend
    setTimeout(() => {
      setLoading(false);
      alert('Preferences saved successfully');
    }, 1000);
  };

  const containerStyle = {
    maxWidth: '896px',
    margin: '0 auto',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '8px'
  };

  const backButtonStyle = {
    padding: '8px',
    backgroundColor: 'transparent',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const titleStyle = {
    fontSize: '30px',
    fontWeight: 'bold',
    margin: 0
  };

  const subtitleStyle = {
    color: '#6b7280',
    margin: 0
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  };

  const dangerCardStyle = {
    ...cardStyle,
    border: '1px solid #fee2e2'
  };

  const cardHeaderStyle = {
    padding: '24px',
    borderBottom: '1px solid #f3f4f6'
  };

  const cardTitleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px'
  };

  const cardDescriptionStyle = {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  };

  const cardContentStyle = {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px'
  };

  const settingRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const labelStyle = {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '2px'
  };

  const helpTextStyle = {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  };

  const selectStyle = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    minWidth: '128px',
    backgroundColor: 'white',
    cursor: 'pointer'
  };

  const switchContainerStyle = {
    position: 'relative' as const,
    width: '44px',
    height: '24px',
    backgroundColor: '#e5e7eb',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  const switchContainerActiveStyle = {
    ...switchContainerStyle,
    backgroundColor: '#3b82f6'
  };

  const switchKnobStyle = {
    position: 'absolute' as const,
    top: '2px',
    left: '2px',
    width: '20px',
    height: '20px',
    backgroundColor: 'white',
    borderRadius: '50%',
    transition: 'transform 0.2s',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
  };

  const switchKnobActiveStyle = {
    ...switchKnobStyle,
    transform: 'translateX(20px)'
  };

  const separatorStyle = {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '0'
  };

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#3b82f6',
    color: 'white'
  };

  const outlineButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc2626',
    color: 'white',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const footerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
    marginTop: '16px'
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <button
          style={backButtonStyle}
          onClick={() => router.push('/chat/new')}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={titleStyle}>Settings</h1>
          <p style={subtitleStyle}>Manage your account preferences</p>
        </div>
      </div>

      {/* Appearance Settings */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h2 style={cardTitleStyle}>
            <Moon size={20} />
            Appearance
          </h2>
          <p style={cardDescriptionStyle}>Customize how CmdShift looks to you</p>
        </div>
        <div style={cardContentStyle}>
          <div style={settingRowStyle}>
            <div>
              <p style={labelStyle}>Theme</p>
              <p style={helpTextStyle}>Select your preferred theme</p>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              style={selectStyle}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h2 style={cardTitleStyle}>
            <Bell size={20} />
            Notifications
          </h2>
          <p style={cardDescriptionStyle}>Configure how you receive updates</p>
        </div>
        <div style={cardContentStyle}>
          <div style={settingRowStyle}>
            <div>
              <p style={labelStyle}>Push Notifications</p>
              <p style={helpTextStyle}>Receive notifications about your conversations</p>
            </div>
            <div
              style={notifications ? switchContainerActiveStyle : switchContainerStyle}
              onClick={() => setNotifications(!notifications)}
            >
              <div style={notifications ? switchKnobActiveStyle : switchKnobStyle} />
            </div>
          </div>
          <div style={separatorStyle} />
          <div style={settingRowStyle}>
            <div>
              <p style={labelStyle}>Email Updates</p>
              <p style={helpTextStyle}>Receive product updates and newsletters</p>
            </div>
            <div
              style={emailUpdates ? switchContainerActiveStyle : switchContainerStyle}
              onClick={() => setEmailUpdates(!emailUpdates)}
            >
              <div style={emailUpdates ? switchKnobActiveStyle : switchKnobStyle} />
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Security */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h2 style={cardTitleStyle}>
            <Shield size={20} />
            Privacy & Security
          </h2>
          <p style={cardDescriptionStyle}>Control your privacy settings</p>
        </div>
        <div style={cardContentStyle}>
          <div style={settingRowStyle}>
            <div>
              <p style={labelStyle}>Public Profile</p>
              <p style={helpTextStyle}>Allow others to see your profile</p>
            </div>
            <div
              style={publicProfile ? switchContainerActiveStyle : switchContainerStyle}
              onClick={() => setPublicProfile(!publicProfile)}
            >
              <div style={publicProfile ? switchKnobActiveStyle : switchKnobStyle} />
            </div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <h2 style={cardTitleStyle}>
            <Globe size={20} />
            Language & Region
          </h2>
          <p style={cardDescriptionStyle}>Set your language preferences</p>
        </div>
        <div style={cardContentStyle}>
          <div style={settingRowStyle}>
            <div>
              <p style={labelStyle}>Display Language</p>
              <p style={helpTextStyle}>Choose your preferred language</p>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={selectStyle}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div style={dangerCardStyle}>
        <div style={cardHeaderStyle}>
          <h2 style={{ ...cardTitleStyle, color: '#dc2626' }}>
            <User size={20} />
            Danger Zone
          </h2>
          <p style={cardDescriptionStyle}>Irreversible account actions</p>
        </div>
        <div style={cardContentStyle}>
          <button
            style={dangerButtonStyle}
            onClick={handleDeleteAccount}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          >
            <Trash2 size={16} />
            Delete Account
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div style={footerStyle}>
        <button
          style={outlineButtonStyle}
          onClick={() => router.push('/chat/new')}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          Cancel
        </button>
        <button
          style={{ ...primaryButtonStyle, opacity: loading ? 0.7 : 1 }}
          onClick={handleSavePreferences}
          disabled={loading}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2563eb')}
          onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#3b82f6')}
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}