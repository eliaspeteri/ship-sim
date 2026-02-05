import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AccessModal from '../../src/features/auth/components/AccessModal';

const replaceMock = jest.fn();
const signInMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({
    asPath: '/sim',
    replace: replaceMock,
  }),
}));

jest.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

const setField = (label: string, value: string) => {
  fireEvent.change(screen.getByLabelText(label), {
    target: { value },
  });
};

beforeEach(() => {
  replaceMock.mockReset();
  signInMock.mockReset();
  global.fetch = jest.fn();
});

describe('AccessModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <AccessModal open={false} onClose={jest.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('logs in and refreshes on success', async () => {
    const onClose = jest.fn();
    signInMock.mockResolvedValue({ error: null });

    render(<AccessModal open={true} onClose={onClose} />);

    setField('Username', 'captain');
    setField('Password', 'secret');
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(signInMock).toHaveBeenCalled());
    expect(signInMock).toHaveBeenCalledWith('credentials', {
      redirect: false,
      username: 'captain',
      password: 'secret',
      callbackUrl: '/sim',
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/sim'));
  });

  it('shows login error on failed sign-in', async () => {
    signInMock.mockResolvedValue({ error: 'Invalid credentials' });

    render(<AccessModal open={true} onClose={jest.fn()} />);

    setField('Username', 'captain');
    setField('Password', 'bad');
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() =>
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument(),
    );
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('shows login error on exception', async () => {
    signInMock.mockRejectedValue(new Error('Network down'));

    render(<AccessModal open={true} onClose={jest.fn()} />);

    setField('Username', 'captain');
    setField('Password', 'secret');
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() =>
      expect(screen.getByText('Network down')).toBeInTheDocument(),
    );
  });

  it('registers a new account and signs in', async () => {
    const onClose = jest.fn();
    signInMock.mockResolvedValue({ error: null });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<AccessModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    setField('Username', 'newbie');
    setField('Password', 'secret');
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'newbie', password: 'secret' }),
      }),
    );

    expect(
      await screen.findByText('Registration successful. Signing you in...'),
    ).toBeInTheDocument();
    await waitFor(() => expect(signInMock).toHaveBeenCalled());
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith('/sim'));
  });

  it('shows registration error when sign-in fails after register', async () => {
    signInMock.mockResolvedValue({ error: 'Nope' });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<AccessModal open={true} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    setField('Username', 'newbie');
    setField('Password', 'secret');
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => expect(screen.getByText('Nope')).toBeInTheDocument());
  });

  it('shows registration error when api fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Nope' }),
    });

    render(<AccessModal open={true} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    setField('Username', 'newbie');
    setField('Password', 'secret');
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => expect(screen.getByText('Nope')).toBeInTheDocument());
  });

  it('stops keydown propagation inside the modal', () => {
    render(<AccessModal open={true} onClose={jest.fn()} />);

    const input = screen.getByLabelText('Username');
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    const stopPropagation = jest.fn();
    Object.defineProperty(event, 'target', { value: input });
    Object.defineProperty(event, 'stopPropagation', { value: stopPropagation });

    document.dispatchEvent(event);

    expect(stopPropagation).toHaveBeenCalled();
  });

  it('closes when not loading', () => {
    const onClose = jest.fn();
    render(<AccessModal open={true} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close access modal'));
    expect(onClose).toHaveBeenCalled();
  });

  it('prevents closing while loading', async () => {
    let resolveSignIn: (value: unknown) => void = () => {};
    signInMock.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveSignIn = resolve;
        }),
    );
    const onClose = jest.fn();

    render(<AccessModal open={true} onClose={onClose} />);

    setField('Username', 'captain');
    setField('Password', 'secret');
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    fireEvent.click(screen.getByLabelText('Close access modal'));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).not.toHaveBeenCalled();

    resolveSignIn({ error: null });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
