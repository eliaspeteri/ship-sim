import React from 'react';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import Layout from '../components/Layout';
import '../styles/globals.css';

type AppPropsWithLayout = AppProps & {
  Component: AppProps['Component'] & { fullBleedLayout?: boolean };
};

/**
 * App entry point. Wraps all pages in NextAuth.js SessionProvider.
 */
function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const { fullBleedLayout } = Component as typeof Component & {
    fullBleedLayout?: boolean;
  };
  return (
    <SessionProvider session={pageProps.session}>
      <Layout fullBleed={fullBleedLayout}>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
}

export default MyApp;
