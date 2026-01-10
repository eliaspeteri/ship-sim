import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getApiBase } from '../lib/api';
import styles from './Profile.module.css';

type SettingsForm = {
  cameraMode: string;
  soundEnabled: boolean;
  showHUD: boolean;
  timeScale: number;
  units: 'metric' | 'imperial' | 'nautical';
  speedUnit: 'knots' | 'kmh' | 'mph';
  distanceUnit: 'nm' | 'km' | 'mi';
  timeZoneMode: 'auto' | 'manual';
  timeZone: string;
};

const defaultSettings = (): SettingsForm => ({
  cameraMode: 'thirdPerson',
  soundEnabled: true,
  showHUD: true,
  timeScale: 1,
  units: 'metric',
  speedUnit: 'knots',
  distanceUnit: 'nm',
  timeZoneMode: 'auto',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
});

const ProfilePage: React.FC = () => {
  const { status, data: session } = useSession();
  const apiBase = useMemo(() => getApiBase(), []);
  const [settings, setSettings] = useState<SettingsForm>(() =>
    defaultSettings(),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = (session?.user as { id?: string })?.id;
  const username = session?.user?.name || userId || 'Signed in';
  const email = session?.user?.email || 'n/a';
  const role = (session?.user as { role?: string })?.role || 'guest';

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

  if (status === 'loading') {
    return <div className={styles.page}>Loading profile...</div>;
  }

  if (status !== 'authenticated') {
    return (
      <div className={styles.page}>
        <div className={styles.title}>Profile & settings</div>
        <p className={styles.subtitle}>Sign in to manage your preferences.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Profile & settings</div>
          <div className={styles.subtitle}>
            Manage simulator preferences and account metadata.
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className={styles.saveButton}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>

      {loading ? (
        <div className={styles.status}>Loading settings...</div>
      ) : null}
      {notice ? <div className={styles.notice}>{notice}</div> : null}
      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Account</div>
        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.cardLabel}>User</div>
            <div className={styles.cardValue}>{username}</div>
            <div className={styles.cardMeta}>Role {role}</div>
          </div>
          <div className={styles.card}>
            <div className={styles.cardLabel}>Email</div>
            <div className={styles.cardValue}>{email}</div>
            <div className={styles.cardMeta}>
              Email and password updates are handled via auth.
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Preferences</div>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            Camera mode
            <select
              className={styles.select}
              value={settings.cameraMode}
              onChange={e =>
                setSettings(prev => ({ ...prev, cameraMode: e.target.value }))
              }
            >
              <option value="thirdPerson">Third person</option>
              <option value="bridge">Bridge</option>
              <option value="free">Free</option>
            </select>
          </label>
          <label className={styles.field}>
            Time scale
            <input
              className={styles.input}
              type="number"
              min={0.25}
              max={4}
              step={0.25}
              value={settings.timeScale}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  timeScale: Number(e.target.value) || 1,
                }))
              }
            />
          </label>
          <label className={styles.field}>
            Units
            <select
              className={styles.select}
              value={settings.units}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  units: e.target.value as SettingsForm['units'],
                }))
              }
            >
              <option value="metric">Metric</option>
              <option value="imperial">Imperial</option>
              <option value="nautical">Nautical</option>
            </select>
          </label>
          <label className={styles.field}>
            Speed unit
            <select
              className={styles.select}
              value={settings.speedUnit}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  speedUnit: e.target.value as SettingsForm['speedUnit'],
                }))
              }
            >
              <option value="knots">Knots</option>
              <option value="kmh">km/h</option>
              <option value="mph">mph</option>
            </select>
          </label>
          <label className={styles.field}>
            Distance unit
            <select
              className={styles.select}
              value={settings.distanceUnit}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  distanceUnit: e.target.value as SettingsForm['distanceUnit'],
                }))
              }
            >
              <option value="nm">NM</option>
              <option value="km">KM</option>
              <option value="mi">MI</option>
            </select>
          </label>
          <label className={styles.field}>
            Time zone mode
            <select
              className={styles.select}
              value={settings.timeZoneMode}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  timeZoneMode: e.target.value as SettingsForm['timeZoneMode'],
                }))
              }
            >
              <option value="auto">Auto (from vessel)</option>
              <option value="manual">Manual</option>
            </select>
          </label>
          <label className={styles.field}>
            Time zone
            <input
              className={styles.input}
              value={settings.timeZone}
              onChange={e =>
                setSettings(prev => ({ ...prev, timeZone: e.target.value }))
              }
              disabled={settings.timeZoneMode !== 'manual'}
            />
          </label>
          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  soundEnabled: e.target.checked,
                }))
              }
            />
            Sound enabled
          </label>
          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={settings.showHUD}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  showHUD: e.target.checked,
                }))
              }
            />
            Show HUD
          </label>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
