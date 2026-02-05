import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Telex } from '../../../../src/components/communication/Telex';

const contacts = [
  { id: 'PORT', name: 'Port Station', isStation: true },
  { id: 'SHIP-2', name: 'Neptune' },
];

describe('Telex', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders header and help text', () => {
    render(<Telex contacts={contacts} />);

    expect(screen.getByText(/SHIP TELEX - SHIP-TX1/)).toBeInTheDocument();
    expect(screen.getByText('Compose')).toBeInTheDocument();
    expect(screen.getByText('Receive Test Message')).toBeInTheDocument();
    expect(
      screen.getByText(/vintage maritime communication system/i),
    ).toBeInTheDocument();
  });

  it('sends a message and switches to outbox', () => {
    const onSendMessage = jest.fn();
    render(<Telex contacts={contacts} onSendMessage={onSendMessage} />);

    const recipientSelect = screen.getByRole('combobox');
    fireEvent.change(recipientSelect, { target: { value: 'PORT' } });

    const textarea = screen.getByPlaceholderText(
      'Type your telex message here...',
    );
    fireEvent.change(textarea, { target: { value: 'Hello port' } });

    const sendButton = screen.getByRole('button', { name: 'Send Message' });
    fireEvent.click(sendButton);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(onSendMessage).toHaveBeenCalledWith({
      sender: 'SHIP-TX1',
      recipient: 'PORT',
      content: 'Hello port',
      isOutgoing: true,
    });

    expect(screen.getByText('Outbox')).toBeInTheDocument();
    expect(screen.getByText(/TO: PORT/)).toBeInTheDocument();
    expect(screen.getByText('Hello port')).toBeInTheDocument();
  });

  it('receives and prints a message', () => {
    const onPrintMessage = jest.fn();
    render(<Telex contacts={contacts} onPrintMessage={onPrintMessage} />);

    fireEvent.click(screen.getByText('Receive Test Message'));

    act(() => {
      jest.advanceTimersByTime(800);
    });

    fireEvent.click(screen.getByText('Inbox'));
    expect(screen.getByText(/TEST MESSAGE:/)).toBeInTheDocument();

    const printButton = screen.getByRole('button', { name: 'Print Message' });
    fireEvent.click(printButton);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onPrintMessage).toHaveBeenCalled();
  });
});
