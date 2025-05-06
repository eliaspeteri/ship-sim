import React from 'react';

/**
 * Props for the PushButton component
 */
interface PushButtonProps {
  /** Text label for the button */
  label: string;
  /** Function called when button is clicked */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Color variant of the button */
  color?: 'primary' | 'secondary' | 'danger';
  /** Size variant of the button */
  size?: 'small' | 'medium' | 'large';
}

/**
 * A customizable push button component with different sizes and color variants
 */
export const PushButton: React.FC<PushButtonProps> = ({
  label,
  onClick,
  disabled,
  color,
  size,
}) => {
  // Apply variant classes based on props
  const getButtonClasses = () => {
    // Base styles always applied
    let classes = 'font-semibold rounded transition-colors';

    // Size styles
    switch (size) {
      case 'small':
        classes += ' px-2.5 py-1.5 text-xs';
        break;
      case 'large':
        classes += ' px-6 py-3 text-base';
        break;
      case 'medium':
      default:
        classes += ' px-4 py-2 text-sm';
        break;
    }

    // Color styles
    switch (color) {
      case 'secondary':
        classes +=
          ' bg-gray-600 hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-white';
        break;
      case 'danger':
        classes +=
          ' bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-white';
        break;
      case 'primary':
      default:
        classes +=
          ' bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-white';
        break;
    }

    // Disabled styles
    if (disabled) {
      classes += ' opacity-50 cursor-not-allowed';
    }

    return classes;
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={getButtonClasses()}
    >
      {label}
    </button>
  );
};
