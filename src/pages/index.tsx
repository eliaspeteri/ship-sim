import React from 'react';
import { useRouter } from 'next/router';

/**
 * Landing page for Ship Simulator. No simulation runs here.
 */
const Home: React.FC = () => {
  const router = useRouter();
  return (
    <main className="min-h-full flex flex-col items-center justify-center bg-gray-900">
      <h1 className="text-4xl font-bold text-white mb-6">Ship Simulator</h1>
      <p className="text-gray-300 mb-8">
        Welcome to the Ship Simulator platform.
      </p>
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded text-lg"
        onClick={() => router.push('/sim')}
      >
        Launch Simulation
      </button>
    </main>
  );
};

export default Home;
