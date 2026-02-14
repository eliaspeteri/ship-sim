import React from 'react';
import { render, screen } from '@testing-library/react';
import LicensesSection from '../../../../../src/features/economy/sections/LicensesSection';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('LicensesSection', () => {
  it('renders empty states', () => {
    render(<LicensesSection licenses={[]} exams={[]} />);

    expect(screen.getByText('Licenses & Exams')).toBeInTheDocument();
    expect(screen.getByText('No licenses issued yet.')).toBeInTheDocument();
    expect(screen.getByText('No exams published.')).toBeInTheDocument();
  });

  it('renders licenses and exams', () => {
    render(
      <LicensesSection
        licenses={[
          {
            id: 'l1',
            licenseKey: 'CAPTAIN-A',
            status: 'active',
            expiresAt: '2026-01-01T00:00:00Z',
          },
        ]}
        exams={[
          {
            id: 'e1',
            name: 'Basic Seamanship',
            description: 'Theory exam',
            minScore: 70,
          },
        ]}
      />,
    );

    expect(screen.getByText('CAPTAIN-A')).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.getByText('Basic Seamanship')).toBeInTheDocument();
    expect(screen.getByText('Launch')).toBeInTheDocument();
  });
});
