import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import Home from '../../../src/pages/index';

const pushMock = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe('pages/index', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it('renders landing content and routes from CTA buttons', () => {
    render(<Home />);

    expect(screen.getByText('Ship Simulator')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Launch simulator' }));
    fireEvent.click(screen.getByRole('button', { name: 'Explore the map' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enter simulator' }));
    fireEvent.click(screen.getByRole('button', { name: 'Manage spaces' }));

    expect(pushMock).toHaveBeenCalledWith('/sim');
    expect(pushMock).toHaveBeenCalledWith('/globe');
    expect(pushMock).toHaveBeenCalledWith('/spaces');
  });
});
