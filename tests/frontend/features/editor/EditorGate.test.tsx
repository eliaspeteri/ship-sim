import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import EditorGate from '../../../../src/features/editor/EditorGate';

const replaceMock = jest.fn();
const useSessionMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

jest.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

describe('EditorGate', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    useSessionMock.mockReset();
  });

  it('shows loading state', () => {
    useSessionMock.mockReturnValue({ status: 'loading', data: null });

    render(
      <EditorGate>
        <div>Editor child</div>
      </EditorGate>,
    );

    expect(screen.getByText('Loading Editor')).toBeInTheDocument();
    expect(screen.getByText('Preparing workspace...')).toBeInTheDocument();
  });

  it('redirects unauthenticated users', async () => {
    useSessionMock.mockReturnValue({ status: 'unauthenticated', data: null });

    render(
      <EditorGate>
        <div>Editor child</div>
      </EditorGate>,
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
    expect(screen.getByText('Loading Editor')).toBeInTheDocument();
  });

  it('blocks authenticated users without editor role', () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { role: 'guest' } },
    });

    render(
      <EditorGate>
        <div>Editor child</div>
      </EditorGate>,
    );

    expect(screen.getByText('Editor access required')).toBeInTheDocument();
    expect(
      screen.getByText('Your account does not have editor permissions yet.'),
    ).toBeInTheDocument();
  });

  it('renders children for allowed roles', () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: { user: { role: 'player' } },
    });

    render(
      <EditorGate>
        <div>Editor child</div>
      </EditorGate>,
    );

    expect(screen.getByText('Editor child')).toBeInTheDocument();
  });
});
