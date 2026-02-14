import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VesselList } from '../../src/components/VesselList';
import { VesselSnapshot } from '../../src/types/vessel.types';

// Mock the store
jest.mock('../../src/store', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseStore = require('../../src/store').default;

describe('VesselList', () => {
  beforeEach(() => {
    mockUseStore.mockImplementation(
      (
        selector: (state: {
          vessel: {
            properties: { name: string };
            position: { lat: number; lon: number };
          };
        }) => unknown,
      ) =>
        selector({
          vessel: {
            properties: { name: 'My Ship' },
            position: { lat: 45.0, lon: -122.0 },
          },
        }),
    );
  });

  it('renders own vessel information', () => {
    render(<VesselList vessels={{}} />);
    expect(screen.getByText(/Own vessel/)).toBeInTheDocument();
    expect(screen.getByText(/My Ship/)).toBeInTheDocument();
    expect(screen.getByText(/Vessel position/)).toBeInTheDocument();
    expect(screen.getByText(/45/)).toBeInTheDocument();
    expect(screen.getByText(/-122/)).toBeInTheDocument();
  });

  it('renders list of other vessels', () => {
    const vessels = {
      vessel1: {
        id: 'vessel1',
        properties: { name: 'Ship A' },
      } as VesselSnapshot,
      vessel2: {
        id: 'vessel2',
        properties: { name: 'Ship B' },
      } as VesselSnapshot,
    };

    render(<VesselList vessels={vessels} />);
    expect(screen.getByText('Ship A')).toBeInTheDocument();
    expect(screen.getByText('Ship B')).toBeInTheDocument();
  });

  it('renders empty list when no vessels', () => {
    render(<VesselList vessels={{}} />);
    const listItems = screen.queryAllByRole('listitem');
    expect(listItems).toHaveLength(0);
  });
});
