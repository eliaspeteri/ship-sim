import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getApiBase } from '../lib/api';
import AccountSection from '../features/profile/components/AccountSection';
import PreferencesSection from '../features/profile/components/PreferencesSection';
import ProfileHeader from '../features/profile/components/ProfileHeader';
import ProfileStatus from '../features/profile/components/ProfileStatus';
import SecuritySection from '../features/profile/components/SecuritySection';
import ProfileSidebar from '../features/profile/components/ProfileSidebar';

type SettingsForm = {
  soundEnabled: boolean;
  units: 'metric' | 'imperial' | 'nautical';
  speedUnit: 'knots' | 'kmh' | 'mph';
  distanceUnit: 'nm' | 'km' | 'mi';
  timeZoneMode: 'auto' | 'manual';
  timeZone: string;
  notificationLevel: 'all' | 'mentions' | 'none';
  interfaceDensity: 'comfortable' | 'compact';
};

const defaultSettings = (): SettingsForm => ({
  soundEnabled: true,
  units: 'metric',
  speedUnit: 'knots',
  distanceUnit: 'nm',
  timeZoneMode: 'auto',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  notificationLevel: 'mentions',
  interfaceDensity: 'comfortable',
});

const ProfilePage: React.FC = () => {
  const { status, data: session } = useSession();
  const apiBase = useMemo(() => getApiBase(), []);
  const [settings, setSettings] = useState<SettingsForm>(() =>
    defaultSettings(),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = (session?.user as { id?: string })?.id;
  const sessionUsername = session?.user?.name || userId || 'Signed in';
  const sessionEmail = session?.user?.email || '';
  const role = (session?.user as { role?: string })?.role || 'guest';
  const [activeSection, setActiveSection] = useState('account');
  const [accountForm, setAccountForm] = useState({
    username: sessionUsername,
    email: sessionEmail,
  });
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const profileSections = [
    {
      id: 'account',
      label: 'Account',
      description: 'Profile identity and contact info.',
    },
    {
      id: 'security',
      label: 'Security',
      description: 'Password and access credentials.',
    },
    {
      id: 'preferences',
      label: 'Preferences',
      description: 'Simulator and interface defaults.',
    },
  ];

  useEffect(() => {
    if (!userId || status !== 'authenticated') return;
    let active = true;
    const loadSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBase}/api/settings/${userId}`, {
          credentials: 'include',
        });
        if (res.status === 404) {
          if (active) {
            setSettings(defaultSettings());
          }
          return;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Request failed: ${res.status}`);
        }
        const data = await res.json();
        if (!active) return;
        setSettings(prev => ({
          ...prev,
          ...data,
        }));
      } catch (err) {
        if (!active) return;
        console.error('Failed to load settings', err);
        setError(
          err instanceof Error ? err.message : 'Unable to load settings.',
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadSettings();
    return () => {
      active = false;
    };
  }, [apiBase, status, userId]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/settings/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      setNotice('Settings saved.');
    } catch (err) {
      console.error('Failed to save settings', err);
      setError(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAccountSave = async () => {
    if (!userId) return;
    const payload: Record<string, string> = {};
    const nextUsername = accountForm.username.trim();
    const nextEmail = accountForm.email.trim();
    if (nextUsername && nextUsername !== sessionUsername) {
      payload.username = nextUsername;
    }
    if (nextEmail && nextEmail !== sessionEmail) {
      payload.email = nextEmail;
    }
    if (Object.keys(payload).length === 0) {
      setNotice('No account changes to save.');
      return;
    }
    setAccountSaving(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      const data = await res.json().catch(() => ({}));
      setNotice('Account updated.');
      if (data?.user?.name) {
        setAccountForm(prev => ({ ...prev, username: data.user.name }));
      }
      if (data?.user?.email) {
        setAccountForm(prev => ({ ...prev, email: data.user.email }));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to update account.',
      );
    } finally {
      setAccountSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!userId) return;
    const { currentPassword, newPassword, confirmPassword } = securityForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Fill out all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setSecuritySaving(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          password: newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      setNotice('Password updated.');
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to update password.',
      );
    } finally {
      setSecuritySaving(false);
    }
  };

  const handleSectionChange = (next: string) => {
    setActiveSection(next);
    if (typeof window !== 'undefined') {
      window.location.hash = next;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '').trim();
    if (profileSections.some(section => section.id === hash)) {
      setActiveSection(hash);
    }
  }, []);

  useEffect(() => {
    setAccountForm({ username: sessionUsername, email: sessionEmail });
  }, [sessionEmail, sessionUsername]);

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-[1080px] px-4 pb-[60px] pt-8 text-[var(--ink)]">
        Loading profile...
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className="mx-auto max-w-[1080px] px-4 pb-[60px] pt-8 text-[var(--ink)]">
        <div className="text-[26px] font-bold text-[var(--ink)]">
          Profile & settings
        </div>
        <p className="text-[13px] text-[rgba(170,192,202,0.7)]">
          Sign in to manage your preferences.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1080px] px-4 pb-[60px] pt-8 text-[var(--ink)]">
      <ProfileHeader
        action={
          activeSection === 'preferences' ? (
            <button
              type="button"
              onClick={handleSave}
              className="rounded-[10px] border-none bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)] px-4 py-2 text-[12px] font-semibold text-[#f1f7f8]"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save preferences'}
            </button>
          ) : null
        }
      />
      <div className="mt-5">
        <ProfileStatus loading={loading} notice={notice} error={error} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-[calc(var(--nav-height,0px)+24px)] lg:self-start">
          <ProfileSidebar
            sections={profileSections}
            activeId={activeSection}
            onSelect={handleSectionChange}
          />
        </div>
        <div className="space-y-6">
          {activeSection === 'account' ? (
            <AccountSection
              username={accountForm.username}
              email={accountForm.email}
              role={role}
              onChange={patch =>
                setAccountForm(prev => ({ ...prev, ...patch }))
              }
              onSave={handleAccountSave}
              saving={accountSaving}
            />
          ) : null}
          {activeSection === 'security' ? (
            <SecuritySection
              currentPassword={securityForm.currentPassword}
              newPassword={securityForm.newPassword}
              confirmPassword={securityForm.confirmPassword}
              onChange={patch =>
                setSecurityForm(prev => ({ ...prev, ...patch }))
              }
              onSave={handlePasswordSave}
              saving={securitySaving}
            />
          ) : null}
          {activeSection === 'preferences' ? (
            <PreferencesSection
              settings={settings}
              onChange={next => setSettings(next)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
