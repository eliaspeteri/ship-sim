import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthCard from '../../../../src/features/auth/components/AuthCard';
import AuthPageLayout from '../../../../src/features/auth/components/AuthPageLayout';

describe('Auth layout components', () => {
  it('renders AuthCard title, subtitle, and children', () => {
    render(
      <AuthCard title="Welcome" subtitle="Sign in">
        <div>Child content</div>
      </AuthCard>,
    );

    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders AuthPageLayout with children', () => {
    render(
      <AuthPageLayout>
        <div>Layout content</div>
      </AuthPageLayout>,
    );

    expect(screen.getByText('Layout content')).toBeInTheDocument();
  });
});
