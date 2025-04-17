import { render, screen } from '@testing-library/react';
import Home from '../src/pages/index'; // Adjust the import based on your actual page structure

describe('Home Page', () => {
  test('renders the home page', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { name: /welcome to the ship simulator/i });
    expect(heading).toBeInTheDocument();
  });

  test('renders navigation links', () => {
    render(<Home />);
    const navLink = screen.getByRole('link', { name: /features/i });
    expect(navLink).toBeInTheDocument();
  });
});

// Add more tests as needed for other components and functionalities.