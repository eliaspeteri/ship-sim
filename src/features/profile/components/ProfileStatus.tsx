import React from 'react';

type ProfileStatusProps = {
  loading: boolean;
  notice: string | null;
  error: string | null;
};

const ProfileStatus: React.FC<ProfileStatusProps> = ({
  loading,
  notice,
  error,
}) => {
  return (
    <div className="space-y-3">
      {loading ? (
        <div className="text-[12px] text-[rgba(170,192,202,0.7)]">
          Loading settings...
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-[10px] bg-[rgba(28,88,130,0.7)] px-2.5 py-2 text-[12px] text-[#e6f2ff]">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-[10px] bg-[rgba(120,36,32,0.8)] px-2.5 py-2 text-[12px] text-[#ffe7e1]">
          {error}
        </div>
      ) : null}
    </div>
  );
};

export default ProfileStatus;
