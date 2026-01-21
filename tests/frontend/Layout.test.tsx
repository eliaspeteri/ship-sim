import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Layout from '../../src/components/Layout';

const mockUseSession = jest.fn();
const mockSignOut = jest.fn();
const mockReplace = jest.fn();

jest.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
  signOut: () => mockSignOut(),
}));

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    query: {},
    replace: mockReplace,
  }),
}));

describe('Layout navigation', () => {
  beforeEach(() => {
    mockUseSession.mockReset();
    mockSignOut.mockReset();
    mockReplace.mockReset();
  });

  it('hides auth-gated nav links when unauthenticated', () => {
    mockUseSession.mockReturnValue({ status: 'unauthenticated', data: null });
    render(
      <Layout>
        <div>Child</div>
      </Layout>,
    );

    expect(screen.getAllByText('Simulator').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Vessels').length).toBeGreaterThan(0);
    expect(screen.queryByText('Spaces')).not.toBeInTheDocument();
    expect(screen.queryByText('Editor')).not.toBeInTheDocument();
    expect(screen.queryByText('Operations')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Access' })).toBeInTheDocument();
  });

  it('shows auth-gated nav links when authenticated', () => {
    mockUseSession.mockReturnValue({
      status: 'authenticated',
      data: { user: { id: 'u1', role: 'player', name: 'Captain' } },
    });
    render(
      <Layout>
        <div>Child</div>
      </Layout>,
    );

    expect(screen.getAllByText('Spaces').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Editor').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Operations').length).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: 'Access' }),
    ).not.toBeInTheDocument();
  });

  it('opens the access modal when Access is clicked', () => {
    mockUseSession.mockReturnValue({ status: 'unauthenticated', data: null });
    render(
      <Layout>
        <div>Child</div>
      </Layout>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Access' }));
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
  });
});
