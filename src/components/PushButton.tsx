import React from 'react';

interface PushButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
}

export const PushButton: React.FC<PushButtonProps> = ({
  label,
  onClick,
  disabled = false,
  color = 'primary',
  size = 'medium',
}) => {
  const baseStyle =
    'font-semibold rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-150 ease-in-out';

  const sizeStyles = {
    small: 'px-2.5 py-1.5 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base',
  };

  const colorStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 text-white',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
  };

  const disabledStyle = 'opacity-50 cursor-not-allowed';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyle}
        ${sizeStyles[size]}
        ${colorStyles[color]}
        ${disabled ? disabledStyle : ''}
      `}
    >
      {label}
    </button>
  );
};
