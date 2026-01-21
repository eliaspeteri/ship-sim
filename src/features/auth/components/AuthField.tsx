import React from 'react';

type AuthFieldProps = {
  id: string;
  name?: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
};

const AuthField: React.FC<AuthFieldProps> = ({
  id,
  name,
  label,
  type,
  value,
  onChange,
  autoComplete,
}) => {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] uppercase tracking-[0.16em] text-[rgba(170,192,202,0.8)]">
        {label}
      </span>
      <input
        id={id}
        name={name || id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-[12px] border border-[rgba(60,88,104,0.6)] bg-[rgba(8,18,30,0.75)] px-3 py-2.5 text-[14px] text-[#f1f7f8]"
        required
        autoComplete={autoComplete}
      />
    </label>
  );
};

export default AuthField;
