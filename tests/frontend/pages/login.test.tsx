import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import LoginPage from '../../../src/pages/login';

const replaceMock = jest.fn();
const signInMock = jest.fn();
const useSessionMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

jest.mock('next-auth/react', () => ({
  signIn: (...args: any[]) => signInMock(...args),
  useSession: () => useSessionMock(),
}));

describe('pages/login', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    signInMock.mockReset();
    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({ data: null });
  });

  it('logs in successfully and redirects', async () => {
    signInMock.mockResolvedValue({ url: '/sim' });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'captain' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith(
        'credentials',
        expect.objectContaining({ username: 'captain', password: 'secret' }),
      );
    });
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/sim');
    });
  });

  it('shows sign-in error', async () => {
    signInMock.mockResolvedValue({ error: 'Invalid credentials' });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'captain' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'bad' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('redirects when session already exists', async () => {
    useSessionMock.mockReturnValue({ data: { user: { id: 'u1' } } });
    render(<LoginPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/sim');
    });
  });
});
