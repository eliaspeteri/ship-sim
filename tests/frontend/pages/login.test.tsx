import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';

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

  it('shows lockout countdown and disables submit until expiry', async () => {
    jest.useFakeTimers();
    signInMock.mockResolvedValueOnce({ error: 'LOCKED_OUT:2' });
    signInMock.mockResolvedValueOnce({ url: '/sim' });
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'captain' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(
      await screen.findByText('Too many failed attempts. Try again in 2s.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Locked (2s)' })).toBeDisabled();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('button', { name: 'Locked (1s)' })).toBeDisabled();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Login' })).not.toBeDisabled(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledTimes(2);
      expect(replaceMock).toHaveBeenCalledWith('/sim');
    });
    jest.useRealTimers();
  });

  it('redirects when session already exists', async () => {
    useSessionMock.mockReturnValue({ data: { user: { id: 'u1' } } });
    render(<LoginPage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/sim');
    });
  });
});
