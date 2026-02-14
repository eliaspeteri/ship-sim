import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import EditorIndexPage from '../../../../src/pages/editor/index';

const replaceMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

describe('pages/editor/index', () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  it('renders loader content and redirects to packs', async () => {
    render(<EditorIndexPage />);

    expect(screen.getByText('Opening editor')).toBeInTheDocument();
    expect(screen.getByText('Routing you to map packs...')).toBeInTheDocument();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/editor/packs');
    });

    expect(
      (EditorIndexPage as unknown as { fullBleedLayout?: boolean })
        .fullBleedLayout,
    ).toBe(true);
  });
});
