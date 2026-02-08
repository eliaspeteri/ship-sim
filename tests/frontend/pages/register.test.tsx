import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import RegisterPage from '../../../src/pages/register';

const pushMock = jest.fn();
const signInMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('next-auth/react', () => ({
  signIn: (...args: any[]) => signInMock(...args),
}));

describe('pages/register', () => {
  beforeEach(() => {
    pushMock.mockReset();
    signInMock.mockReset();
  });

  it('registers and auto-logins on success', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    signInMock.mockResolvedValue({});

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'captain' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect((globalThis as any).fetch).toHaveBeenCalledWith(
        '/api/register',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith('/sim');
    });
  });

  it('shows registration failure and login failure', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Taken' }),
    });

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'captain' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Taken')).toBeInTheDocument();

    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    signInMock.mockResolvedValue({ error: 'Nope' });

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(await screen.findByText('Nope')).toBeInTheDocument();
  });
});
