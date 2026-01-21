import React from 'react';

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

type PreferencesSectionProps = {
  settings: SettingsForm;
  onChange: (next: SettingsForm) => void;
};

const fieldLabelClass =
  'grid gap-1.5 text-[12px] text-[rgba(210,222,230,0.9)]';
const fieldControlClass =
  'rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2.5 py-1.5 text-[12px] text-[#f1f7f8]';

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  settings,
  onChange,
}) => {
  const updateSettings = (patch: Partial<SettingsForm>) => {
    onChange({ ...settings, ...patch });
  };

  return (
    <section className="rounded-2xl border border-[rgba(27,154,170,0.35)] bg-[rgba(10,20,34,0.9)] p-4">
      <div className="text-[14px] font-semibold text-[#f1f7f8]">
        Preferences
      </div>
      <div className="mt-3 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <label className={fieldLabelClass}>
          Notification level
          <select
            className={fieldControlClass}
            value={settings.notificationLevel}
            onChange={e =>
              updateSettings({
                notificationLevel: e.target
                  .value as SettingsForm['notificationLevel'],
              })
            }
          >
            <option value="all">All updates</option>
            <option value="mentions">Mentions only</option>
            <option value="none">Silent</option>
          </select>
        </label>
        <label className={fieldLabelClass}>
          Interface density
          <select
            className={fieldControlClass}
            value={settings.interfaceDensity}
            onChange={e =>
              updateSettings({
                interfaceDensity: e.target
                  .value as SettingsForm['interfaceDensity'],
              })
            }
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>
        <label className={fieldLabelClass}>
          Units
          <select
            className={fieldControlClass}
            value={settings.units}
            onChange={e =>
              updateSettings({ units: e.target.value as SettingsForm['units'] })
            }
          >
            <option value="metric">Metric</option>
            <option value="imperial">Imperial</option>
            <option value="nautical">Nautical</option>
          </select>
        </label>
        <label className={fieldLabelClass}>
          Speed unit
          <select
            className={fieldControlClass}
            value={settings.speedUnit}
            onChange={e =>
              updateSettings({
                speedUnit: e.target.value as SettingsForm['speedUnit'],
              })
            }
          >
            <option value="knots">Knots</option>
            <option value="kmh">km/h</option>
            <option value="mph">mph</option>
          </select>
        </label>
        <label className={fieldLabelClass}>
          Distance unit
          <select
            className={fieldControlClass}
            value={settings.distanceUnit}
            onChange={e =>
              updateSettings({
                distanceUnit: e.target.value as SettingsForm['distanceUnit'],
              })
            }
          >
            <option value="nm">NM</option>
            <option value="km">KM</option>
            <option value="mi">MI</option>
          </select>
        </label>
        <label className={fieldLabelClass}>
          Time zone mode
          <select
            className={fieldControlClass}
            value={settings.timeZoneMode}
            onChange={e =>
              updateSettings({
                timeZoneMode: e.target.value as SettingsForm['timeZoneMode'],
              })
            }
          >
            <option value="auto">Auto (from vessel)</option>
            <option value="manual">Manual</option>
          </select>
        </label>
        <label className={fieldLabelClass}>
          Time zone
          <input
            className={fieldControlClass}
            value={settings.timeZone}
            onChange={e => updateSettings({ timeZone: e.target.value })}
            disabled={settings.timeZoneMode !== 'manual'}
          />
        </label>
        <label className="flex items-center gap-2 text-[12px] text-[rgba(210,222,230,0.9)]">
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={e =>
              updateSettings({
                soundEnabled: e.target.checked,
              })
            }
          />
          Sound enabled
        </label>
      </div>
    </section>
  );
};

export default PreferencesSection;
