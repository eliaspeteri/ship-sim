import React from 'react';

type AuthNoticeProps = {
  tone: 'error' | 'success';
  children: React.ReactNode;
};

const AuthNotice: React.FC<AuthNoticeProps> = ({ tone, children }) => {
  const baseClass =
    'rounded-[10px] px-2.5 py-2 text-[12px]';
  const toneClass =
    tone === 'success'
      ? 'bg-[rgba(36,102,72,0.8)] text-[#e6fff4]'
      : 'bg-[rgba(120,36,32,0.8)] text-[#ffe7e1]';

  return <div className={`${baseClass} ${toneClass}`}>{children}</div>;
};

export default AuthNotice;
