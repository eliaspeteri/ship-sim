import React from 'react';
import { render, screen } from '@testing-library/react';

import MyApp from '../../../src/pages/_app';

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
  SessionProvider: (props: any) => sessionProviderMock(props),
}));

jest.mock('../../../src/components/Layout', () => ({
  __esModule: true,
  default: (props: any) => layoutMock(props),
}));

describe('pages/_app', () => {
  it('wraps component with session provider and layout', () => {
    const Component = () => <div>Inner page</div>;
    (Component as any).fullBleedLayout = true;
    (Component as any).navBack = true;

    render(
      <MyApp
        Component={Component as any}
        pageProps={{ session: { user: {} } }}
        router={{} as any}
      />,
    );

    expect(screen.getByTestId('session-provider')).toBeInTheDocument();
    const layout = screen.getByTestId('layout');
    expect(layout).toHaveAttribute('data-fullbleed', 'true');
    expect(layout).toHaveAttribute('data-navback', 'true');
    expect(screen.getByText('Inner page')).toBeInTheDocument();
  });
});
