import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import EditorPackWorkspace from '../../../../../src/pages/editor/packs/[packId]';

const useRouterMock = jest.fn();
const useSessionMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => useRouterMock(),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

jest.mock('../../../../../src/features/editor/EditorGate', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../../../../src/features/editor/EditorShell', () => ({
  __esModule: true,
  default: ({ pack }: { pack: { name: string } }) => (
    <div>Editor Shell {pack.name}</div>
  ),
}));

describe('pages/editor/packs/[packId]', () => {
  beforeEach(() => {
    useRouterMock.mockReset();
    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({
      data: { user: { name: 'demo' } },
      status: 'authenticated',
    });
  });

  it('shows loading state when router is not ready', () => {
    useRouterMock.mockReturnValue({ isReady: false, query: {} });

    render(<EditorPackWorkspace />);

    expect(screen.getByText('Loading workspace')).toBeInTheDocument();
  });

  it('redirects to slug path when asPath differs', async () => {
    const replaceMock = jest.fn();
    useRouterMock.mockReturnValue({
      isReady: true,
      query: { packId: 'pack-one' },
      asPath: '/editor/packs/pack-one',
      replace: replaceMock,
    });

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        pack: {
          id: 'p1',
          slug: 'new-slug',
          ownerId: 'demo',
          name: 'Pack One',
          description: 'desc',
          visibility: 'draft',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      }),
    }) as unknown as typeof fetch;

    render(<EditorPackWorkspace />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/editor/demo/packs/new-slug');
    });

    expect(screen.getByText('Redirecting...')).toBeInTheDocument();
  });

  it('renders editor shell when already on canonical path', async () => {
    useRouterMock.mockReturnValue({
      isReady: true,
      query: { packId: 'new-slug' },
      asPath: '/editor/demo/packs/new-slug',
      replace: jest.fn(),
    });

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        pack: {
          id: 'p1',
          slug: 'new-slug',
          ownerId: 'demo',
          name: 'Pack One',
          description: 'desc',
          visibility: 'draft',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      }),
    }) as unknown as typeof fetch;

    render(<EditorPackWorkspace />);

    expect(
      await screen.findByText('Editor Shell Pack One'),
    ).toBeInTheDocument();
  });
});
