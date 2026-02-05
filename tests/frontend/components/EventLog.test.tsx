import React from 'react';
import { render, screen } from '@testing-library/react';
import EventLog from '../../../src/components/EventLog';
import useStore from '../../../src/store';

const initialState = useStore.getState();

afterEach(() => {
  useStore.setState(initialState, true);
});

describe('EventLog', () => {
  it('shows empty state when there are no events', () => {
    useStore.setState({ eventLog: [] });

    render(<EventLog />);

    expect(screen.getByText('No events logged yet')).toBeInTheDocument();
    expect(screen.getByText('0 events')).toBeInTheDocument();
  });

  it('renders events sorted by timestamp and applies severity classes', () => {
    useStore.setState({
      eventLog: [
        {
          id: 'event-1',
          message: 'Engine overheat',
          severity: 'critical',
          timestamp: 1000,
        },
        {
          id: 'event-2',
          message: 'Fuel low',
          severity: 'warning',
          timestamp: 2000,
        },
      ],
    });

    const { container } = render(<EventLog />);
    const rows = container.querySelectorAll('tbody tr');

    expect(rows.length).toBe(2);
    expect(rows[0]).toHaveTextContent('Fuel low');
    expect(rows[1]).toHaveTextContent('Engine overheat');

    const warningCell = screen.getByText('Fuel low');
    const criticalCell = screen.getByText('Engine overheat');
    expect(warningCell).toHaveClass('text-amber-300');
    expect(criticalCell).toHaveClass('text-red-400');
  });
});
