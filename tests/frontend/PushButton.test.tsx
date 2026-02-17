import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { PushButton } from '../../src/components/PushButton';

describe('PushButton', () => {
  it('renders with label', () => {
    render(<PushButton label="Test Button" onClick={() => {}} />);
    expect(
      screen.getByRole('button', { name: /test button/i }),
    ).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const mockOnClick = jest.fn();
    render(<PushButton label="Click Me" onClick={mockOnClick} />);
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    const mockOnClick = jest.fn();
    render(<PushButton label="Disabled" onClick={mockOnClick} disabled />);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('applies primary color by default', () => {
    render(<PushButton label="Primary" onClick={() => {}} />);
    const button = screen.getByRole('button', { name: /primary/i });
    expect(button).toHaveClass('bg-blue-600');
  });

  it('applies secondary color', () => {
    render(
      <PushButton label="Secondary" onClick={() => {}} color="secondary" />,
    );
    const button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toHaveClass('bg-gray-600');
  });

  it('applies danger color', () => {
    render(<PushButton label="Danger" onClick={() => {}} color="danger" />);
    const button = screen.getByRole('button', { name: /danger/i });
    expect(button).toHaveClass('bg-red-600');
  });

  it('applies small size', () => {
    render(<PushButton label="Small" onClick={() => {}} size="small" />);
    const button = screen.getByRole('button', { name: /small/i });
    expect(button).toHaveClass('px-2.5', 'py-1.5', 'text-xs');
  });

  it('applies medium size by default', () => {
    render(<PushButton label="Medium" onClick={() => {}} />);
    const button = screen.getByRole('button', { name: /medium/i });
    expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
  });

  it('applies large size', () => {
    render(<PushButton label="Large" onClick={() => {}} size="large" />);
    const button = screen.getByRole('button', { name: /large/i });
    expect(button).toHaveClass('px-6', 'py-3', 'text-base');
  });

  it('applies disabled styles', () => {
    render(<PushButton label="Disabled" onClick={() => {}} disabled />);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });
});
