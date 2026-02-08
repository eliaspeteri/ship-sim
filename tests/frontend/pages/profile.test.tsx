import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import ProfilePage from '../../../src/pages/profile';

const useSessionMock = jest.fn();
const getApiBaseMock = jest.fn(() => 'http://api.test');

jest.mock('next-auth/react', () => ({
  useSession: () => useSessionMock(),
}));

jest.mock('../../../src/lib/api', () => ({
  getApiBase: () => getApiBaseMock(),
}));

jest.mock('../../../src/features/profile/components/ProfileHeader', () => ({
  __esModule: true,
  default: ({ action }: { action?: React.ReactNode }) => (
    <div>
      <div>Profile header</div>
      {action}
    </div>
  ),
}));

jest.mock('../../../src/features/profile/components/ProfileStatus', () => ({
  __esModule: true,
  default: ({
    loading,
    notice,
    error,
  }: {
    loading?: boolean;
    notice?: string | null;
    error?: string | null;
  }) => (
    <div>
      {loading ? <div>Loading settings...</div> : null}
      {notice ? <div>{notice}</div> : null}
      {error ? <div>{error}</div> : null}
    </div>
  ),
}));

jest.mock('../../../src/features/profile/components/ProfileSidebar', () => ({
  __esModule: true,
  default: ({
    sections,
    onSelect,
  }: {
    sections: Array<{ id: string; label: string }>;
    onSelect: (id: string) => void;
  }) => (
    <div>
      {sections.map(section => (
        <button
          key={section.id}
          type="button"
          onClick={() => onSelect(section.id)}
        >
          {section.label}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('../../../src/features/profile/components/AccountSection', () => ({
  __esModule: true,
  default: ({
    username,
    email,
    onChange,
    onSave,
  }: {
    username: string;
    email: string;
    onChange: (patch: { username?: string; email?: string }) => void;
    onSave: () => void;
  }) => (
    <div>
      <div>{`Account: ${username} ${email}`}</div>
      <button
        type="button"
        onClick={() =>
          onChange({ username: 'New Name', email: 'new@example.com' })
        }
      >
        Set account change
      </button>
      <button type="button" onClick={onSave}>
        Save account
      </button>
    </div>
  ),
}));

jest.mock('../../../src/features/profile/components/SecuritySection', () => ({
  __esModule: true,
  default: ({
    onChange,
    onSave,
  }: {
    onChange: (patch: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    }) => void;
    onSave: () => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onChange({
            currentPassword: 'current-pass',
            newPassword: 'abcdefgh',
            confirmPassword: 'different',
          })
        }
      >
        Set mismatch password
      </button>
      <button
        type="button"
        onClick={() =>
          onChange({
            currentPassword: 'current-pass',
            newPassword: 'short',
            confirmPassword: 'short',
          })
        }
      >
        Set short password
      </button>
      <button
        type="button"
        onClick={() =>
          onChange({
            currentPassword: 'current-pass',
            newPassword: 'abcdefgh',
            confirmPassword: 'abcdefgh',
          })
        }
      >
        Set valid password
      </button>
      <button type="button" onClick={onSave}>
        Save security
      </button>
    </div>
  ),
}));

jest.mock(
  '../../../src/features/profile/components/PreferencesSection',
  () => ({
    __esModule: true,
    default: ({
      settings,
      onChange,
    }: {
      settings: Record<string, unknown>;
      onChange: (next: Record<string, unknown>) => void;
    }) => (
      <div>
        <button
          type="button"
          onClick={() => onChange({ ...settings, units: 'imperial' })}
        >
          Change preferences
        </button>
      </div>
    ),
  }),
);

describe('pages/profile', () => {
  beforeEach(() => {
    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({ status: 'unauthenticated', data: null });
    getApiBaseMock.mockReset();
    getApiBaseMock.mockReturnValue('http://api.test');
    (globalThis as any).fetch = jest.fn();
    if (typeof window !== 'undefined') {
      window.location.hash = '';
    }
  });

  it('renders loading and unauthenticated states', () => {
    useSessionMock.mockReturnValue({ status: 'loading', data: null });
    const { unmount } = render(<ProfilePage />);
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();

    unmount();
    useSessionMock.mockReturnValue({ status: 'unauthenticated', data: null });
    render(<ProfilePage />);
    expect(screen.getByText('Profile & settings')).toBeInTheDocument();
    expect(
      screen.getByText('Sign in to manage your preferences.'),
    ).toBeInTheDocument();
  });

  it('handles preferences, account and security flows', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: {
        user: {
          id: 'u1',
          name: 'captain',
          email: 'captain@example.com',
          role: 'captain',
        },
      },
    });
    const fetchMock = (globalThis as any).fetch as jest.Mock;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method || 'GET';
      if (url === 'http://api.test/api/settings/u1' && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ soundEnabled: false, units: 'nautical' }),
        });
      }
      if (url === 'http://api.test/api/settings/u1' && method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      }
      if (url === 'http://api.test/api/profile' && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        if ('password' in body) {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            user: { name: 'New Name', email: 'new@example.com' },
          }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Unexpected request' }),
      });
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/settings/u1',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }));
    fireEvent.click(screen.getByRole('button', { name: 'Change preferences' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/settings/u1',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    expect(screen.getByText('Settings saved.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Account' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save account' }));
    expect(screen.getByText('No account changes to save.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Set account change' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save account' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/profile',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    expect(await screen.findByText('Account updated.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Security' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save security' }));
    expect(
      screen.getByText('Fill out all password fields.'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Set mismatch password' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save security' }));
    expect(screen.getByText('New passwords do not match.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Set valid password' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save security' }));
    await waitFor(() => {
      const profilePosts = fetchMock.mock.calls.filter(
        ([url, init]) =>
          url === 'http://api.test/api/profile' &&
          (init as RequestInit | undefined)?.method === 'POST',
      );
      expect(profilePosts.length).toBeGreaterThanOrEqual(2);
    });
    expect(screen.getByText('Password updated.')).toBeInTheDocument();
  });

  it('handles hash initialization and save failure branches', async () => {
    useSessionMock.mockReturnValue({
      status: 'authenticated',
      data: {
        user: {
          id: 'u2',
          name: 'captain-2',
          email: 'captain2@example.com',
          role: 'captain',
        },
      },
    });
    if (typeof window !== 'undefined') {
      window.location.hash = '#security';
    }
    const fetchMock = (globalThis as any).fetch as jest.Mock;
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      const method = init?.method || 'GET';
      if (url === 'http://api.test/api/settings/u2' && method === 'GET') {
        return Promise.resolve({
          ok: true,
          status: 404,
          json: async () => ({}),
        });
      }
      if (url === 'http://api.test/api/settings/u2' && method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Save settings failed' }),
        });
      }
      if (url === 'http://api.test/api/profile' && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        if ('password' in body) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: async () => ({ error: 'Password update failed' }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Account update failed' }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Unexpected request' }),
      });
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.test/api/settings/u2',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    expect(
      screen.getByRole('button', { name: 'Set valid password' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Set short password' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save security' }));
    expect(
      screen.getByText('Password must be at least 8 characters.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Set valid password' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save security' }));
    await waitFor(() => {
      expect(screen.getByText('Password update failed')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Account' }));
    fireEvent.click(screen.getByRole('button', { name: 'Set account change' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save account' }));
    await waitFor(() => {
      expect(screen.getByText('Account update failed')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Preferences' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
    await waitFor(() => {
      expect(screen.getByText('Save settings failed')).toBeInTheDocument();
    });
  });
});
