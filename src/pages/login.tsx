import React from 'react';
import Head from 'next/head';
import LoginPanel from '../components/LoginPanel';

/**
 * Login page for user authentication
 * This page provides access to the login and registration functionality
 */
const LoginPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Ship Simulator - Login</title>
        <meta name="description" content="Login to Ship Simulator" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-full max-w-md p-6">
          <h1 className="text-3xl font-bold text-white text-center mb-8">
            Ship Simulator
          </h1>

          <LoginPanel className="w-full" />

          <div className="mt-6 text-center text-gray-400 text-sm">
            <p>Access the simulation environment</p>
          </div>
        </div>
      </main>
    </>
  );
};

export default LoginPage;
