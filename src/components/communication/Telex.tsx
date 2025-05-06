import React, { useState, useEffect, useRef } from 'react';
import { ToggleSwitch } from '../switches';
import { PushButton } from '../PushButton';

/**
 * Interface for a Telex message
 */
interface TelexMessage {
  /** Unique identifier for the message */
  id: string;
  /** Sender's name or identification code */
  sender: string;
  /** Recipient's name or identification code */
  recipient: string;
  /** Content of the message */
  content: string;
  /** Timestamp when the message was sent or received */
  timestamp: Date;
  /** Whether this message was sent by the local user (outgoing) */
  isOutgoing: boolean;
  /** Whether the message has been read */
  isRead: boolean;
}

/**
 * Props for the Telex component
 */
interface TelexProps {
  /** Ship's telex identification code */
  shipIdentification?: string;
  /** List of available connections/contacts */
  contacts?: Array<{
    id: string;
    name: string;
    isStation?: boolean;
  }>;
  /** Function called when a new message is sent */
  onSendMessage?: (
    message: Omit<TelexMessage, 'id' | 'timestamp' | 'isRead'>,
  ) => void;
  /** Function called when a message is printed */
  onPrintMessage?: (messageId: string) => void;
  /** Initial list of messages to display */
  initialMessages?: TelexMessage[];
  /** Initial connection status */
  initialConnected?: boolean;
  /** Whether to show the help text */
  showHelp?: boolean;
}

/**
 * A vintage maritime telex machine component for ship-to-shore and ship-to-ship text communications
 */
export const Telex: React.FC<TelexProps> = ({
  shipIdentification = 'SHIP-TX1',
  contacts = [],
  onSendMessage,
  onPrintMessage,
  initialMessages = [],
  initialConnected = true,
  showHelp = true,
}) => {
  // State for managing messages
  const [messages, setMessages] = useState<TelexMessage[]>(initialMessages);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [viewMode, setViewMode] = useState<'compose' | 'inbox' | 'outbox'>(
    'compose',
  );
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isReceiving, setIsReceiving] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(initialConnected);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'error'
  >(initialConnected ? 'connected' : 'disconnected');

  // References
  const telexPaperRef = useRef<HTMLDivElement>(null);

  // Set connection status based on isConnected state
  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  // Auto-scroll to the bottom of the paper when new messages arrive
  useEffect(() => {
    if (telexPaperRef.current) {
      telexPaperRef.current.scrollTop = telexPaperRef.current.scrollHeight;
    }
  }, [messages, viewMode]);

  /**
   * Simulate the typewriter sound effect for the telex
   */
  const playTypewriterSound = () => {
    // In a real implementation, we'd include sound effects here
    // This is a placeholder for a potential sound effect implementation
    console.info('Typewriter sound played');
  };

  /**
   * Handle key press for typewriter effect
   */
  const handleKeyPress = () => {
    playTypewriterSound();
  };

  /**
   * Send a message from the telex machine
   */
  const sendMessage = () => {
    if (!currentMessage.trim() || !selectedRecipient || !isConnected) return;

    // Start sending animation/indicator
    setIsSending(true);

    // Simulate transmission delay
    setTimeout(() => {
      // Create new message object
      const newMessage: Omit<TelexMessage, 'id' | 'timestamp' | 'isRead'> = {
        sender: shipIdentification,
        recipient: selectedRecipient,
        content: currentMessage,
        isOutgoing: true,
      };

      // Add to local messages
      const messageId = `msg-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      const timestamp = new Date();

      setMessages(prevMessages => [
        ...prevMessages,
        {
          ...newMessage,
          id: messageId,
          timestamp,
          isRead: true,
        },
      ]);

      // Clear input
      setCurrentMessage('');

      // Call the callback if provided
      if (onSendMessage) {
        onSendMessage(newMessage);
      }

      // Stop sending animation/indicator
      setIsSending(false);

      // Switch to outbox after sending
      setViewMode('outbox');
    }, 1500);
  };

  /**
   * Simulate receiving a new message
   */
  const receiveTestMessage = () => {
    if (!isConnected) return;

    setIsReceiving(true);

    // Simulate reception delay
    setTimeout(() => {
      // Create a random test message
      const randomContact =
        contacts[Math.floor(Math.random() * contacts.length)]?.id || 'UNKNOWN';

      const newMessage: Omit<TelexMessage, 'id' | 'timestamp' | 'isRead'> = {
        sender: randomContact,
        recipient: shipIdentification,
        content:
          'TEST MESSAGE: This is an automatically generated test message for the telex system. Please acknowledge receipt.',
        isOutgoing: false,
      };

      // Create new message object
      const messageId = `msg-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      const timestamp = new Date();

      // Add to messages
      setMessages(prevMessages => [
        ...prevMessages,
        {
          ...newMessage,
          id: messageId,
          timestamp,
          isRead: false,
        },
      ]);

      // Stop receiving animation/indicator
      setIsReceiving(false);
    }, 800);
  };

  /**
   * Simulate printing a telex message
   */
  const printMessage = (messageId: string) => {
    setIsPrinting(true);

    // Find message
    const message = messages.find(m => m.id === messageId);
    if (!message) {
      setIsPrinting(false);
      return;
    }

    // Simulate printing delay
    setTimeout(() => {
      // Call the callback if provided
      if (onPrintMessage) {
        onPrintMessage(messageId);
      }

      // Update message as read
      setMessages(prevMessages =>
        prevMessages.map(m =>
          m.id === messageId ? { ...m, isRead: true } : m,
        ),
      );

      setIsPrinting(false);
    }, 2000);
  };

  /**
   * Get filtered messages based on the current view mode
   */
  const getFilteredMessages = () => {
    switch (viewMode) {
      case 'inbox':
        return messages.filter(message => !message.isOutgoing);
      case 'outbox':
        return messages.filter(message => message.isOutgoing);
      default:
        return messages;
    }
  };

  /**
   * Format a date for telex display
   */
  const formatTelexDate = (date: Date) => {
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  /**
   * Render the telex message paper
   */
  const renderTelexPaper = () => {
    if (viewMode === 'compose') {
      return (
        <div className="h-full p-4 font-mono text-sm">
          <div className="mb-2">
            TO: {selectedRecipient || '[SELECT RECIPIENT]'}
          </div>
          <div className="mb-2">FROM: {shipIdentification}</div>
          <div className="mb-2">DATE: {formatTelexDate(new Date())}</div>
          <div className="mb-2">----------------------------------</div>
          <div className="whitespace-pre-wrap break-words">
            {currentMessage || 'Type your message here...'}
          </div>
        </div>
      );
    }

    const filteredMessages = getFilteredMessages();

    return (
      <div className="h-full p-4 font-mono text-sm">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-gray-500">
            No messages in {viewMode}
          </div>
        ) : (
          filteredMessages.map(message => (
            <div
              key={message.id}
              className={`mb-4 ${!message.isRead ? 'font-bold' : ''}`}
            >
              <div className="mb-1">
                {message.isOutgoing ? 'TO:' : 'FROM:'}{' '}
                {message.isOutgoing ? message.recipient : message.sender}
              </div>
              <div className="mb-1">
                {message.isOutgoing ? 'FROM:' : 'TO:'}{' '}
                {message.isOutgoing ? message.sender : message.recipient}
              </div>
              <div className="mb-1">
                DATE: {formatTelexDate(message.timestamp)}
              </div>
              <div className="mb-1">----------------------------------</div>
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
              <div className="mb-1">----------------------------------</div>
              {!message.isOutgoing && !message.isRead && (
                <button
                  className="px-2 py-1 bg-amber-700 text-amber-100 text-xs rounded hover:bg-amber-600"
                  onClick={() => printMessage(message.id)}
                  disabled={isPrinting}
                >
                  {isPrinting ? 'Printing...' : 'Print Message'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4 w-full max-w-3xl">
      {/* Controls section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <label className="mr-4 text-gray-300">Connection Status:</label>
          <ToggleSwitch
            isOn={isConnected}
            onToggle={setIsConnected}
            width={60}
            height={30}
            baseColor="#4B5563"
            leverColor="#E5E7EB"
            label={isConnected ? 'Connected' : 'Disconnected'}
            labelPosition="right"
          />
        </div>

        <PushButton
          label="Receive Test Message"
          onClick={receiveTestMessage}
          color="secondary"
          size="small"
          disabled={!isConnected}
        />
      </div>

      {/* Main telex terminal */}
      <div className="flex flex-col w-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-lg">
        {/* Telex header */}
        <div className="bg-gray-800 p-3 flex justify-between items-center">
          <div className="flex items-center">
            <div
              className="h-3 w-3 rounded-full mr-2"
              style={{
                backgroundColor:
                  connectionStatus === 'connected'
                    ? '#10B981'
                    : connectionStatus === 'disconnected'
                      ? '#6B7280'
                      : '#EF4444',
                boxShadow:
                  connectionStatus === 'connected' ? '0 0 8px #10B981' : 'none',
              }}
            ></div>
            <h2 className="font-mono font-bold text-gray-300">
              SHIP TELEX - {shipIdentification}
            </h2>
          </div>
          <div className="flex space-x-3">
            <div
              className={`px-2 py-1 rounded ${
                viewMode === 'compose'
                  ? 'bg-blue-900 text-blue-100'
                  : 'bg-gray-700 text-gray-300'
              } cursor-pointer`}
              onClick={() => setViewMode('compose')}
            >
              Compose
            </div>
            <div
              className={`px-2 py-1 rounded ${
                viewMode === 'inbox'
                  ? 'bg-blue-900 text-blue-100'
                  : 'bg-gray-700 text-gray-300'
              } cursor-pointer`}
              onClick={() => setViewMode('inbox')}
            >
              Inbox
            </div>
            <div
              className={`px-2 py-1 rounded ${
                viewMode === 'outbox'
                  ? 'bg-blue-900 text-blue-100'
                  : 'bg-gray-700 text-gray-300'
              } cursor-pointer`}
              onClick={() => setViewMode('outbox')}
            >
              Outbox
            </div>
          </div>
        </div>

        {/* Telex body */}
        <div className="flex flex-col flex-grow h-96 bg-amber-50 relative overflow-hidden">
          {/* Paper roll styling */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-200/10 via-transparent to-amber-200/10 pointer-events-none z-10"></div>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
              backgroundSize: '10px 10px',
            }}
          ></div>

          {/* Telex paper content */}
          <div
            ref={telexPaperRef}
            className="flex-grow overflow-auto scrollbar-thin scrollbar-thumb-amber-400 scrollbar-track-amber-100"
            style={{ maxHeight: 'calc(100% - 60px)' }}
          >
            {renderTelexPaper()}
          </div>

          {/* Status indicators */}
          <div className="p-2 bg-amber-100 border-t border-amber-300 flex justify-between items-center z-20">
            <div className="flex items-center space-x-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isPrinting ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
                }`}
              ></div>
              <span className="text-xs text-gray-600">Print</span>
              <div
                className={`h-2 w-2 rounded-full ${
                  isSending ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}
              ></div>
              <span className="text-xs text-gray-600">TX</span>
              <div
                className={`h-2 w-2 rounded-full ${
                  isReceiving ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'
                }`}
              ></div>
              <span className="text-xs text-gray-600">RX</span>
            </div>
            <div className="text-xs text-gray-600">
              {connectionStatus === 'connected'
                ? 'CONNECTED'
                : connectionStatus === 'disconnected'
                  ? 'DISCONNECTED'
                  : 'CONNECTION ERROR'}
            </div>
          </div>
        </div>

        {/* Telex controls */}
        {viewMode === 'compose' && (
          <div className="bg-gray-800 p-3 space-y-3">
            {/* Recipient selector */}
            <div className="flex items-center">
              <label className="text-gray-300 mr-2 w-20">Recipient:</label>
              <select
                className="flex-grow px-2 py-1 bg-gray-700 text-gray-300 border border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedRecipient}
                onChange={e => setSelectedRecipient(e.target.value)}
                disabled={!isConnected}
              >
                <option value="">Select recipient</option>
                <optgroup label="Shore Stations">
                  {contacts
                    .filter(c => c.isStation)
                    .map(contact => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Ships">
                  {contacts
                    .filter(c => !c.isStation)
                    .map(contact => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Message input */}
            <div>
              <textarea
                className="w-full h-32 px-3 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={currentMessage}
                onChange={e => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your telex message here..."
                disabled={!isConnected}
              />
            </div>

            {/* Send button */}
            <div className="flex justify-end">
              <button
                className={`px-4 py-2 rounded font-bold ${
                  !currentMessage.trim() ||
                  !selectedRecipient ||
                  !isConnected ||
                  isSending
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
                onClick={sendMessage}
                disabled={
                  !currentMessage.trim() ||
                  !selectedRecipient ||
                  !isConnected ||
                  isSending
                }
              >
                {isSending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help section */}
      {showHelp && (
        <div className="mt-4 text-sm text-gray-400 bg-gray-800 p-4 rounded-lg">
          <p>
            This telex system simulates the vintage maritime communication
            system used for text messaging between ships and shore stations. You
            can compose messages, view received messages, and track
            communication history.
          </p>
          <ul className="list-disc list-inside mt-2">
            <li>
              Click tabs to switch between compose, inbox, and outbox views
            </li>
            <li>Select a contact and type a message to send</li>
            <li>
              Use the &quot;Receive Test Message&quot; button to simulate
              receiving a message
            </li>
            <li>Toggle connection status to simulate connectivity issues</li>
            <li>Unread messages appear in bold and can be printed</li>
          </ul>
        </div>
      )}
    </div>
  );
};
