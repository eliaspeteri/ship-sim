import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import AccountSection from '../../../../../src/features/profile/components/AccountSection';
import PreferencesSection from '../../../../../src/features/profile/components/PreferencesSection';
import ProfileHeader from '../../../../../src/features/profile/components/ProfileHeader';
import ProfileSidebar from '../../../../../src/features/profile/components/ProfileSidebar';
import ProfileStatus from '../../../../../src/features/profile/components/ProfileStatus';
import SecuritySection from '../../../../../src/features/profile/components/SecuritySection';

describe('Profile components', () => {
  it('renders and updates account section', () => {
    const onChange = jest.fn();
    const onSave = jest.fn();

    const { rerender } = render(
      <AccountSection
        username="captain"
        email="captain@example.com"
        role="admin"
        onChange={onChange}
        onSave={onSave}
        saving={false}
      />,
    );

    fireEvent.change(screen.getByDisplayValue('captain'), {
      target: { value: 'new-captain' },
    });
    fireEvent.change(screen.getByDisplayValue('captain@example.com'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save account' }));

    expect(onChange).toHaveBeenNthCalledWith(1, { username: 'new-captain' });
    expect(onChange).toHaveBeenNthCalledWith(2, { email: 'new@example.com' });
    expect(onSave).toHaveBeenCalled();

    rerender(
      <AccountSection
        username="captain"
        email="captain@example.com"
        role="admin"
        onChange={onChange}
        onSave={onSave}
        saving
      />,
    );
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });

  it('renders and updates preferences section', () => {
    const onChange = jest.fn();
    const settings = {
      soundEnabled: true,
      units: 'metric',
      speedUnit: 'knots',
      distanceUnit: 'nm',
      timeZoneMode: 'auto',
      timeZone: 'UTC',
      notificationLevel: 'all',
      interfaceDensity: 'comfortable',
    } as const;

    const { rerender } = render(
      <PreferencesSection settings={{ ...settings }} onChange={onChange} />,
    );

    fireEvent.change(screen.getByDisplayValue('All updates'), {
      target: { value: 'mentions' },
    });
    fireEvent.change(screen.getByLabelText('Interface density'), {
      target: { value: 'compact' },
    });
    fireEvent.change(screen.getByLabelText('Units'), {
      target: { value: 'nautical' },
    });
    fireEvent.change(screen.getByLabelText('Speed unit'), {
      target: { value: 'kmh' },
    });
    fireEvent.change(screen.getByLabelText('Distance unit'), {
      target: { value: 'km' },
    });
    fireEvent.change(screen.getByLabelText('Time zone mode'), {
      target: { value: 'manual' },
    });
    fireEvent.click(screen.getByLabelText('Sound enabled'));

    expect(onChange).toHaveBeenCalledTimes(7);
    expect(onChange.mock.calls[0][0].notificationLevel).toBe('mentions');
    expect(onChange.mock.calls[1][0].interfaceDensity).toBe('compact');
    expect(onChange.mock.calls[2][0].units).toBe('nautical');
    expect(onChange.mock.calls[3][0].speedUnit).toBe('kmh');
    expect(onChange.mock.calls[4][0].distanceUnit).toBe('km');
    expect(onChange.mock.calls[5][0].timeZoneMode).toBe('manual');
    expect(onChange.mock.calls[6][0].soundEnabled).toBe(false);

    const timeZoneInput = screen.getByDisplayValue('UTC');
    expect(timeZoneInput).toBeDisabled();

    rerender(
      <PreferencesSection
        settings={{ ...settings, timeZoneMode: 'manual' }}
        onChange={onChange}
      />,
    );
    expect(screen.getByDisplayValue('UTC')).not.toBeDisabled();
    fireEvent.change(screen.getByLabelText('Time zone'), {
      target: { value: 'UTC+2' },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      ...settings,
      timeZoneMode: 'manual',
      timeZone: 'UTC+2',
    });
  });

  it('renders profile header/sidebar/status and interactions', () => {
    const onSelect = jest.fn();

    render(
      <>
        <ProfileHeader action={<button type="button">Sync</button>} />
        <ProfileSidebar
          sections={[
            { id: 'account', label: 'Account', description: 'Profile details' },
            { id: 'security', label: 'Security' },
          ]}
          activeId="security"
          onSelect={onSelect}
        />
        <ProfileStatus loading notice="Saved" error="Oops" />
      </>,
    );

    expect(screen.getByText('Profile & settings')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sync' })).toBeInTheDocument();

    const accountButton = screen.getByRole('button', {
      name: 'Account Profile details',
    });
    const securityButton = screen.getByRole('button', { name: 'Security' });

    expect(securityButton).toHaveAttribute('aria-current', 'page');
    fireEvent.click(accountButton);
    expect(onSelect).toHaveBeenCalledWith('account');

    expect(screen.getByText('Loading settings...')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Oops')).toBeInTheDocument();
  });

  it('renders security section and handlers', () => {
    const onChange = jest.fn();
    const onSave = jest.fn();

    const { rerender } = render(
      <SecuritySection
        currentPassword="old-pass"
        newPassword="new-pass"
        confirmPassword="new-pass"
        onChange={onChange}
        onSave={onSave}
        saving={false}
      />,
    );

    const pwInputs = screen.getAllByDisplayValue('new-pass');
    fireEvent.change(screen.getByDisplayValue('old-pass'), {
      target: { value: 'old-pass-2' },
    });
    fireEvent.change(pwInputs[0], { target: { value: 'new-pass-2' } });
    fireEvent.change(pwInputs[1], { target: { value: 'new-pass-2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));

    expect(onChange).toHaveBeenCalledWith({ currentPassword: 'old-pass-2' });
    expect(onChange).toHaveBeenCalledWith({ newPassword: 'new-pass-2' });
    expect(onChange).toHaveBeenCalledWith({ confirmPassword: 'new-pass-2' });
    expect(onSave).toHaveBeenCalled();

    rerender(
      <SecuritySection
        currentPassword="old-pass"
        newPassword="new-pass"
        confirmPassword="new-pass"
        onChange={onChange}
        onSave={onSave}
        saving
      />,
    );

    expect(screen.getByRole('button', { name: 'Updating...' })).toBeDisabled();
  });
});
