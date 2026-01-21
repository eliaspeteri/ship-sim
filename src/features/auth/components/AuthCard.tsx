import React from 'react';

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

const AuthCard: React.FC<AuthCardProps> = ({ title, subtitle, children }) => {
  return (
    <div className="w-[min(420px,90vw)] rounded-[18px] border border-[rgba(27,154,170,0.35)] bg-[rgba(10,20,34,0.92)] p-7 shadow-[0_24px_60px_rgba(4,10,18,0.6)]">
      <div className="mb-1.5 text-[26px] font-bold">{title}</div>
      <div className="mb-5 text-[13px] text-[rgba(170,192,202,0.7)]">
        {subtitle}
      </div>
      {children}
    </div>
  );
};

export default AuthCard;
