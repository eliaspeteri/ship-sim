import React from 'react';

type ProfileHeaderProps = {
  action?: React.ReactNode;
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ action }) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-[26px] font-bold text-[var(--ink)]">
          Profile & settings
        </div>
        <div className="text-[13px] text-[rgba(170,192,202,0.7)]">
          Manage simulator preferences and account metadata.
        </div>
      </div>
      {action}
    </div>
  );
};

export default ProfileHeader;
