import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import EditorPacksPage from '../../../../../src/pages/editor/packs';

const pushMock = jest.fn();
const useSessionMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

jest.mock('../../../../../src/features/editor/EditorGate', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('pages/editor/packs/index', () => {
  beforeEach(() => {
    pushMock.mockReset();
    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({
      data: { user: { name: 'captain' } },
      status: 'authenticated',
    });
  });

  it('loads packs and creates a pack via modal', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ packs: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          pack: {
            id: 'p1',
            slug: 'new-pack',
            ownerId: 'captain',
            name: 'New Pack',
            description: 'Description long enough',
            regionSummary: 'Baltic',
            visibility: 'draft',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        }),
      }) as unknown as typeof fetch;

    render(<EditorPacksPage />);

    await screen.findByText('Map Packs');

    fireEvent.click(screen.getByRole('button', { name: 'New Pack' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create & Open' }));
    expect(
      screen.getByText('Title must be 3-64 characters.'),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('e.g. Port of Rotterdam'), {
      target: { value: 'New Pack' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Scope, intent, and notes for reviewers.'),
      {
        target: { value: 'Description long enough' },
      },
    );
    fireEvent.change(screen.getByPlaceholderText('Region or harbor name'), {
      target: { value: 'Baltic' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create & Open' }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/editor/captain/packs/new-pack');
    });
  });

  it('edits and deletes a pack', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          packs: [
            {
              id: 'p1',
              slug: 'pack-one',
              ownerId: 'captain',
              name: 'Pack One',
              description: 'Desc',
              regionSummary: 'Baltic',
              visibility: 'draft',
              updatedAt: '2026-01-01T00:00:00Z',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true }) as unknown as typeof fetch;

    render(<EditorPacksPage />);

    await screen.findByText('Pack One');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByText('Pack One')).not.toBeInTheDocument();
    });
  });
});
