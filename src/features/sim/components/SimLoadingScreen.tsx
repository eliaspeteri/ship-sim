import React from 'react';

const SimLoadingScreen: React.FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="rounded-lg bg-black bg-opacity-70 p-8 text-center text-white">
        <h1 className="mb-4 text-2xl font-bold">Loading Ship Simulator</h1>
        <p className="mb-4">Initializing...</p>
        <div className="mx-auto h-2 w-64 overflow-hidden rounded-full bg-gray-700">
          <div className="h-full w-1/2 animate-pulse bg-blue-500"></div>
        </div>
      </div>
    </div>
  );
};

export default SimLoadingScreen;
