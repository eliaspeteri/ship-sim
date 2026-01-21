import React from 'react';

type AccountSectionProps = {
  username: string;
  email: string;
  role: string;
  onChange: (patch: { username?: string; email?: string }) => void;
  onSave: () => void;
  saving: boolean;
};

const AccountSection: React.FC<AccountSectionProps> = ({
  username,
  email,
  role,
  onChange,
  onSave,
  saving,
}) => {
  return (
    <section className="rounded-2xl border border-[rgba(27,154,170,0.35)] bg-[rgba(10,20,34,0.9)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[14px] font-semibold text-[#f1f7f8]">Account</div>
        <button
          type="button"
          onClick={onSave}
          className="rounded-[10px] border-none bg-[linear-gradient(135deg,#1b9aaa,#0f6d75)] px-4 py-2 text-[12px] font-semibold text-[#f1f7f8]"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save account'}
        </button>
      </div>
      <div className="mt-3 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <label className="grid gap-1.5 rounded-xl border border-[rgba(40,60,80,0.6)] bg-[rgba(6,12,18,0.6)] px-3.5 py-3 text-[12px] text-[rgba(210,222,230,0.9)]">
          Username
          <input
            className="rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2.5 py-1.5 text-[12px] text-[#f1f7f8]"
            value={username}
            onChange={event => onChange({ username: event.target.value })}
            autoComplete="username"
          />
          <div className="text-[11px] text-[rgba(150,168,182,0.7)]">
            Role {role}
          </div>
        </label>
        <label className="grid gap-1.5 rounded-xl border border-[rgba(40,60,80,0.6)] bg-[rgba(6,12,18,0.6)] px-3.5 py-3 text-[12px] text-[rgba(210,222,230,0.9)]">
          Email
          <input
            className="rounded-[10px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-2.5 py-1.5 text-[12px] text-[#f1f7f8]"
            value={email}
            onChange={event => onChange({ email: event.target.value })}
            autoComplete="email"
            type="email"
            placeholder="Add an email address"
          />
          <div className="text-[11px] text-[rgba(150,168,182,0.7)]">
            Updates apply after saving.
          </div>
        </label>
      </div>
    </section>
  );
};

export default AccountSection;
