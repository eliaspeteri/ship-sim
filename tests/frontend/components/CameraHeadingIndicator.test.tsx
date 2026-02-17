import { render, screen } from '@testing-library/react';
import React from 'react';

import CameraHeadingIndicator from '../../../src/components/CameraHeadingIndicator';

describe('CameraHeadingIndicator', () => {
  it('renders nothing when disabled', () => {
    const { container } = render(
      <CameraHeadingIndicator enabled={false} headingDeg={45} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders heading indicator and label', () => {
    const { container } = render(
      <CameraHeadingIndicator enabled headingDeg={42} hudOffset={20} />,
    );

    expect(screen.getByText('42°')).toBeInTheDocument();
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.bottom).toBe(
      'calc(36px + env(safe-area-inset-bottom))',
    );
  });
});
