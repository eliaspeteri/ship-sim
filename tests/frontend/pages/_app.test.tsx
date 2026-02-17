import { render, screen } from '@testing-library/react';
import React from 'react';

import MyApp from '../../../src/pages/_app';

import type { AppProps } from 'next/app';


const sessionProviderMock = jest.fn(
  ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
);
const layoutMock = jest.fn(
  ({
    children,
    fullBleed,
    navBack,
  }: {
    children: React.ReactNode;
    fullBleed?: boolean;
    navBack?: boolean;
  }) => (
    <div
      data-testid="layout"
      data-fullbleed={String(Boolean(fullBleed))}
      data-navback={String(Boolean(navBack))}
    >
      {children}
    </div>
  ),
);

jest.mock('next-auth/react', () => ({
  SessionProvider: (props: { children: React.ReactNode }) =>
    sessionProviderMock(props),
}));

jest.mock('../../../src/components/Layout', () => ({
  __esModule: true,
  default: (props: {
    children: React.ReactNode;
    fullBleed?: boolean;
    navBack?: boolean;
  }) => layoutMock(props),
}));

describe('pages/_app', () => {
  it('wraps component with session provider and layout', () => {
    const Component = () => <div>Inner page</div>;
    const ComponentWithLayoutFlags = Component as AppProps['Component'] & {
      fullBleedLayout?: boolean;
      navBack?: boolean;
    };
    ComponentWithLayoutFlags.fullBleedLayout = true;
    ComponentWithLayoutFlags.navBack = true;

    render(
      <MyApp
        Component={ComponentWithLayoutFlags}
        pageProps={{ session: { user: {} } }}
        router={{} as AppProps['router']}
      />,
    );

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    const layout = screen.getByTestId('layout');
    expect(layout).toHaveAttribute('data-fullbleed', 'true');
    expect(layout).toHaveAttribute('data-navback', 'true');
    expect(screen.getByText('Inner page')).toBeInTheDocument();
  });
});
