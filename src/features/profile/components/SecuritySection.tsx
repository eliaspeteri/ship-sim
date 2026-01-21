import React from 'react';

type SecuritySectionProps = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onChange: (patch: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }) => void;
  onSave: () => void;
  saving: boolean;
};

const fieldLabelClass = 'grid gap-1.5 text-[12px] text-[rgba(210,222,230,0.9)]';
const fieldControlClass =
  'rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2.5 py-1.5 text-[12px] text-[#f1f7f8]';

const SecuritySection: React.FC<SecuritySectionProps> = ({
  currentPassword,
  newPassword,
  confirmPassword,
  onChange,
  onSave,
  saving,
}) => {
  return (
    <section className="rounded-2xl border border-[rgba(27,154,170,0.35)] bg-[rgba(10,20,34,0.9)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[14px] font-semibold text-[#f1f7f8]">Security</div>
        <button
          type="button"
          onClick={onSave}
          className="rounded-[10px] border-none bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)] px-4 py-2 text-[12px] font-semibold text-[#f1f7f8]"
          disabled={saving}
        >
          {saving ? 'Updating...' : 'Update password'}
        </button>
      </div>
      <div className="mt-3 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <label className={fieldLabelClass}>
          Current password
          <input
            className={fieldControlClass}
            type="password"
            value={currentPassword}
            onChange={event =>
              onChange({ currentPassword: event.target.value })
            }
            autoComplete="current-password"
          />
        </label>
        <label className={fieldLabelClass}>
          New password
          <input
            className={fieldControlClass}
            type="password"
            value={newPassword}
            onChange={event => onChange({ newPassword: event.target.value })}
            autoComplete="new-password"
          />
        </label>
        <label className={fieldLabelClass}>
          Confirm new password
          <input
            className={fieldControlClass}
            type="password"
            value={confirmPassword}
            onChange={event =>
              onChange({ confirmPassword: event.target.value })
            }
            autoComplete="new-password"
          />
        </label>
      </div>
      <div className="mt-3 text-[11px] text-[rgba(170,192,202,0.7)]">
        Passwords must be at least 8 characters long.
      </div>
    </section>
  );
};

export default SecuritySection;
