import React from 'react';

type VesselListStatusProps = {
  loading: boolean;
  error: string | null;
};

const VesselListStatus: React.FC<VesselListStatusProps> = ({
  loading,
  error,
}) => {
  return (
    <div className="space-y-3">
      {loading ? (
        <div className="text-[12px] text-[rgba(170,192,202,0.7)]">
          Loading vessels...
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

export default VesselListStatus;
