import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import EditorUserPackWorkspace from '../../../../../../src/pages/editor/[user]/packs/[packId]';

const useRouterMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => useRouterMock(),
}));

jest.mock('../../../../../../src/features/editor/EditorGate', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../../../../../src/features/editor/EditorShell', () => ({
  __esModule: true,
  default: ({ pack }: { pack: { name: string } }) => (
    <div>Editor Shell {pack.name}</div>
  ),
}));

describe('pages/editor/[user]/packs/[packId]', () => {
  beforeEach(() => {
    useRouterMock.mockReset();
  });

  it('shows loading state', () => {
    useRouterMock.mockReturnValue({
      isReady: false,
      query: {},
    }) as unknown as typeof fetch;

    render(<EditorUserPackWorkspace />);

    expect(screen.getByText('Loading workspace')).toBeInTheDocument();
  });

  it('renders not found when fetch fails and fallback misses', async () => {
    useRouterMock.mockReturnValue({
      isReady: true,
      query: { user: 'demo', packId: 'missing-pack' },
    });

    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error('boom')) as unknown as typeof fetch;

    render(<EditorUserPackWorkspace />);

    expect(await screen.findByText('Pack not found')).toBeInTheDocument();
  });

  it('renders editor shell on successful fetch', async () => {
    useRouterMock.mockReturnValue({
      isReady: true,
      query: { user: 'demo', packId: 'slug-one' },
    });

    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        pack: {
          id: 'p1',
          slug: 'slug-one',
          ownerId: 'demo',
          name: 'Pack One',
          description: 'desc',
          visibility: 'draft',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      }),
    }) as unknown as typeof fetch;

    render(<EditorUserPackWorkspace />);

    await waitFor(() => {
      expect(screen.getByText('Editor Shell Pack One')).toBeInTheDocument();
    });
  });
});
