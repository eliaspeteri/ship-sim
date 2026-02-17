import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { ChatPanel } from '../../../src/components/ChatPanel';
import { socketManager } from '../../../src/networking/socket';
import useStore from '../../../src/store';

jest.mock('../../../src/networking/socket', () => ({
  __esModule: true,
  socketManager: {
    requestChatHistory: jest.fn(),
    sendChatMessage: jest.fn(),
  },
}));

const socketMock = socketManager as jest.Mocked<typeof socketManager>;
const initialState = useStore.getState();

afterEach(() => {
  useStore.setState(initialState, true);
  jest.clearAllMocks();
});

describe('ChatPanel', () => {
  it('requests chat history and disables input for spectators', async () => {
    useStore.setState({
      roles: ['spectator'],
      chatMessages: [],
      chatHistoryMeta: {},
    });

    render(<ChatPanel spaceId="space-1" vesselChannel="v1" />);

    await waitFor(() => {
      expect(socketMock.requestChatHistory).toHaveBeenCalledWith(
        'space:space-1:global',
      );
    });

    expect(socketMock.requestChatHistory).toHaveBeenCalledWith(
      'space:space-1:v1',
    );

    expect(
      screen.getByText('Spectators cannot send chat in this space.'),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Message...')).toBeDisabled();
  });

  it('sends chat messages for players and clears input', () => {
    useStore.setState({
      roles: ['player'],
      chatMessages: [
        {
          id: 'm1',
          channel: 'space:space-1:v1',
          message: 'Ping',
          timestamp: 1,
          userId: 'u1',
          username: 'Pilot',
        },
      ],
      chatHistoryMeta: {
        'space:space-1:global': { hasMore: false, loaded: true },
      },
    });

    render(<ChatPanel spaceId="space-1" vesselChannel="v1" />);

    const input = screen.getByPlaceholderText('Message...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  Hello crew  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(socketMock.sendChatMessage).toHaveBeenCalledWith(
      'Hello crew',
      'space:space-1:global',
    );
    expect(input.value).toBe('');
    expect(screen.getByText('Vessel')).toBeInTheDocument();
    expect(screen.getByText(/Pilot:/)).toBeInTheDocument();
  });

  it('allows switching to the vessel channel', () => {
    useStore.setState({
      roles: ['player'],
      chatMessages: [],
      chatHistoryMeta: {},
    });

    render(<ChatPanel spaceId="space-1" vesselChannel="v1" />);

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'space:space-1:v1' },
    });

    expect(socketMock.requestChatHistory).toHaveBeenCalledWith(
      'space:space-1:v1',
    );
  });
});
