import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotaryDial } from '../dials';

/**
 * Interface representing a marine radio channel
 */
interface RadioChannel {
  /** Channel number */
  number: number;
  /** Frequency in MHz */
  frequency: number;
  /** Name/description of the channel's purpose */
  name: string;
  /** Whether it's an emergency channel */
  isEmergency?: boolean;
  /** Whether it's a duplex channel (different transmit/receive frequencies) */
  isDuplex?: boolean;
}

/**
 * Interface for the MarineRadio component props
 */
interface MarineRadioProps {
  /** Width of the radio in pixels */
  width?: number;
  /** Height of the radio in pixels */
  height?: number;
  /** Initial power state */
  initialPower?: boolean;
  /** Initial channel number */
  initialChannel?: number;
  /** Optional callback when a distress call is sent */
  onDistressCall?: () => void;
  /** Optional callback when channel changes */
  onChannelChange?: (channel: number, frequency: number) => void;
  /** Optional position data to display (if available) */
  position?: {
    latitude: number;
    longitude: number;
  };
  /** Whether the radio can be operated (disabled state) */
  disabled?: boolean;
}

// Standard marine VHF radio channels - ordered numerically
const MARINE_CHANNELS: RadioChannel[] = [
  { number: 6, frequency: 156.3, name: 'SAFETY' },
  { number: 9, frequency: 156.45, name: 'CALLING' },
  { number: 12, frequency: 156.6, name: 'PORT OPS' },
  { number: 13, frequency: 156.65, name: 'BRIDGE' },
  { number: 14, frequency: 156.7, name: 'PORT OPS' },
  { number: 15, frequency: 156.75, name: 'SHIP-SHIP' },
  { number: 16, frequency: 156.8, name: 'DISTRESS', isEmergency: true },
  { number: 67, frequency: 156.375, name: 'BRIDGE' },
  { number: 68, frequency: 156.425, name: 'SHIP-SHIP' },
  { number: 69, frequency: 156.475, name: 'SHIP-SHORE' },
  { number: 71, frequency: 156.575, name: 'SHIP-PORT' },
  { number: 72, frequency: 156.625, name: 'SHIP-SHIP' },
  { number: 73, frequency: 156.675, name: 'PORT OPS' },
  { number: 74, frequency: 156.725, name: 'PORT OPS' },
  { number: 77, frequency: 156.875, name: 'PORT OPS' },
];

/**
 * Marine VHF Radio component simulating a realistic shipboard radio with DSC capabilities
 */
export function MarineRadio({
  width = 400,
  height = 200,
  initialPower = false,
  initialChannel = 16,
  onDistressCall,
  onChannelChange,
  position,
  disabled = false,
}: MarineRadioProps): React.ReactElement {
  // Radio state
  const [powerOn, setPowerOn] = useState<boolean>(initialPower);
  const [volume, setVolume] = useState<number>(50);
  const [squelch, setSquelch] = useState<number>(30);
  const [currentChannelIndex, setCurrentChannelIndex] = useState<number>(
    MARINE_CHANNELS.findIndex(ch => ch.number === initialChannel) || 0,
  );
  const [transmitting, setTransmitting] = useState<boolean>(false);
  const [highPower, setHighPower] = useState<boolean>(true);
  const [receiving, setReceiving] = useState<boolean>(false);
  const [receiveStrength, setReceiveStrength] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [menuOption, setMenuOption] = useState<number>(0);
  const [directEntryMode, setDirectEntryMode] = useState<boolean>(false);
  const [directEntryBuffer, setDirectEntryBuffer] = useState<string>('');
  const [displayMessage, setDisplayMessage] = useState<string>('');
  const [distressActive, setDistressActive] = useState<boolean>(false);
  const [signalBars, setSignalBars] = useState<number>(0);
  const [scanActive, setScanActive] = useState<boolean>(false);
  const [dscActive, setDscActive] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showPosition, setShowPosition] = useState<boolean>(false);

  // Scanning state
  const scanRef = useRef<NodeJS.Timeout | null>(null);

  // Current channel data
  const currentChannel = MARINE_CHANNELS[currentChannelIndex];

  // Menu options
  const menuOptions = [
    'BACKLIGHT',
    'CONTRAST',
    'LOCAL/DIST',
    'GPS/TIME',
    'RADIO SETUP',
    'DSC SETUP',
  ];

  // Calculate dimensions
  const padding = 72; // Increased padding from 14 to 20
  const displayHeight = height * 0.35;
  const controlsHeight = height - displayHeight - padding * 2;

  // Set current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Simulate occasional random reception when powered on
  useEffect(() => {
    if (!powerOn) {
      setReceiving(false);
      setReceiveStrength(0);
      return;
    }

    const randomReception = () => {
      // 15% chance of receiving when on a non-emergency channel
      // 30% chance when on channel 16 (emergency channel)
      const receiveChance = currentChannel.isEmergency ? 0.3 : 0.15;

      if (Math.random() < receiveChance) {
        setReceiving(true);
        setReceiveStrength(40 + Math.random() * 60); // Random strength between 40-100

        // Reception lasts 2-5 seconds
        setTimeout(
          () => {
            setReceiving(false);
            setReceiveStrength(0);
          },
          2000 + Math.random() * 3000,
        );
      }
    };

    const receptionInterval = setInterval(randomReception, 10000);
    return () => clearInterval(receptionInterval);
  }, [powerOn, currentChannel]);

  // Handle channel scanning
  useEffect(() => {
    if (!powerOn || !scanActive) {
      if (scanRef.current) {
        clearInterval(scanRef.current);
        scanRef.current = null;
      }
      return;
    }

    if (scanActive && !scanRef.current) {
      scanRef.current = setInterval(() => {
        // If receiving, pause scanning
        if (receiving) return;

        setCurrentChannelIndex(prev => (prev + 1) % MARINE_CHANNELS.length);
      }, 2000);
    }

    return () => {
      if (scanRef.current) {
        clearInterval(scanRef.current);
        scanRef.current = null;
      }
    };
  }, [powerOn, scanActive, receiving]);

  // Update signal strength bars based on receive strength
  useEffect(() => {
    if (powerOn && receiving) {
      const bars = Math.max(1, Math.min(5, Math.ceil(receiveStrength / 20)));
      setSignalBars(bars);
    } else {
      setSignalBars(0);
    }
  }, [powerOn, receiving, receiveStrength]);

  // Update display message based on state
  useEffect(() => {
    if (!powerOn) {
      setDisplayMessage('');
      return;
    }

    if (transmitting) {
      setDisplayMessage('TRANSMIT');
    } else if (distressActive) {
      setDisplayMessage('DISTRESS');
    } else if (dscActive) {
      setDisplayMessage('DSC CALL');
    } else if (directEntryMode) {
      setDisplayMessage(`CH: ${directEntryBuffer || '_'}`);
    } else if (menuOpen) {
      setDisplayMessage(menuOptions[menuOption]);
    } else if (scanActive) {
      setDisplayMessage(
        `SCAN CH ${currentChannel.number.toString().padStart(2, '0')}`,
      );
    } else {
      setDisplayMessage(
        `CH ${currentChannel.number.toString().padStart(2, '0')}`,
      );
    }
  }, [
    powerOn,
    transmitting,
    distressActive,
    dscActive,
    directEntryMode,
    directEntryBuffer,
    menuOpen,
    menuOption,
    scanActive,
    currentChannel,
    menuOptions,
  ]);

  // Toggle visibility of position data when GPS/TIME menu option is selected and confirmed
  useEffect(() => {
    if (menuOpen && menuOptions[menuOption] === 'GPS/TIME') {
      // This is where menu option selection would be implemented
    }
  }, [menuOpen, menuOption, menuOptions]);

  // Handle power button click
  const handlePowerToggle = useCallback(() => {
    if (disabled) return;

    setPowerOn(prev => !prev);
    if (transmitting) setTransmitting(false);
    if (distressActive) setDistressActive(false);
    if (scanActive) setScanActive(false);
    if (dscActive) setDscActive(false);
    if (menuOpen) setMenuOpen(false);
    if (directEntryMode) {
      setDirectEntryMode(false);
      setDirectEntryBuffer('');
    }
  }, [
    disabled,
    transmitting,
    distressActive,
    scanActive,
    dscActive,
    menuOpen,
    directEntryMode,
  ]);

  // Handle volume dial change
  const handleVolumeChange = useCallback(
    (dialValue: number) => {
      if (!powerOn || disabled) return;
      setVolume(dialValue);
    },
    [powerOn, disabled],
  );

  // Handle squelch dial change
  const handleSquelchChange = useCallback(
    (dialValue: number) => {
      if (!powerOn || disabled) return;
      setSquelch(dialValue);
    },
    [powerOn, disabled],
  );

  // Handle channel selection from the dial
  const handleChannelDialChange = useCallback(
    (dialValue: number) => {
      if (!powerOn || disabled || transmitting || distressActive) return;

      // Map 0-100 dial to channel indices
      const channelsCount = MARINE_CHANNELS.length;
      const newIndex = Math.floor((dialValue / 100) * (channelsCount - 1));

      if (newIndex !== currentChannelIndex) {
        setCurrentChannelIndex(newIndex);

        if (onChannelChange) {
          const channel = MARINE_CHANNELS[newIndex];
          onChannelChange(channel.number, channel.frequency);
        }

        // Cancel scanning if manually changing channels
        if (scanActive) setScanActive(false);
      }
    },
    [
      powerOn,
      disabled,
      transmitting,
      distressActive,
      currentChannelIndex,
      onChannelChange,
      scanActive,
    ],
  );

  // Go directly to channel 16 (emergency)
  const handleChannel16 = useCallback(() => {
    if (!powerOn || disabled || transmitting) return;

    const ch16Index = MARINE_CHANNELS.findIndex(ch => ch.number === 16);
    if (ch16Index >= 0) {
      setCurrentChannelIndex(ch16Index);

      if (onChannelChange) {
        onChannelChange(16, 156.8);
      }

      // Stop scanning
      if (scanActive) setScanActive(false);
    }
  }, [powerOn, disabled, transmitting, onChannelChange, scanActive]);

  // Go to channel 9 (alternate calling)
  const handleChannel9 = useCallback(() => {
    if (!powerOn || disabled || transmitting) return;

    const ch9Index = MARINE_CHANNELS.findIndex(ch => ch.number === 9);
    if (ch9Index >= 0) {
      setCurrentChannelIndex(ch9Index);

      if (onChannelChange) {
        onChannelChange(9, 156.45);
      }

      // Stop scanning
      if (scanActive) setScanActive(false);
    }
  }, [powerOn, disabled, transmitting, onChannelChange, scanActive]);

  // Handle SCAN button
  const handleScan = useCallback(() => {
    if (!powerOn || disabled || transmitting || directEntryMode || menuOpen)
      return;

    setScanActive(prev => !prev);
  }, [powerOn, disabled, transmitting, directEntryMode, menuOpen]);

  // Handle hi/lo power toggle
  const handleHiLoPower = useCallback(() => {
    if (!powerOn || disabled || transmitting) return;

    setHighPower(prev => !prev);
  }, [powerOn, disabled, transmitting]);

  // Handle distress button
  const handleDistress = useCallback(() => {
    if (!powerOn || disabled) return;

    // Go to channel 16
    const ch16Index = MARINE_CHANNELS.findIndex(ch => ch.number === 16);
    if (ch16Index >= 0) {
      setCurrentChannelIndex(ch16Index);
      setDistressActive(true);

      if (onChannelChange) {
        onChannelChange(16, 156.8);
      }

      // Notify parent component about distress call
      if (onDistressCall) {
        onDistressCall();
      }

      // Auto-cancel the distress call after 5 seconds
      setTimeout(() => {
        setDistressActive(false);
      }, 5000);

      // Stop scanning
      if (scanActive) setScanActive(false);
    }
  }, [powerOn, disabled, onChannelChange, onDistressCall, scanActive]);

  // Handle DSC button
  const handleDSC = useCallback(() => {
    if (!powerOn || disabled || transmitting) return;

    setDscActive(prev => !prev);
  }, [powerOn, disabled, transmitting]);

  // Handle CLEAR button
  const handleClear = useCallback(() => {
    if (!powerOn || disabled) return;

    // Clear specific states in priority order
    if (directEntryMode) {
      setDirectEntryMode(false);
      setDirectEntryBuffer('');
    } else if (menuOpen) {
      setMenuOpen(false);
    } else if (dscActive) {
      setDscActive(false);
    } else if (distressActive) {
      setDistressActive(false);
    } else {
      // Toggle position view when no other actions to clear
      setShowPosition(prev => !prev);
    }
  }, [powerOn, disabled, directEntryMode, menuOpen, dscActive, distressActive]);

  // Handle MENU button
  const handleMenu = useCallback(() => {
    if (!powerOn || disabled || transmitting) return;

    if (!menuOpen) {
      setMenuOpen(true);
      setMenuOption(0);
    } else {
      // If already in menu, cycle through options
      setMenuOption(prev => (prev + 1) % menuOptions.length);
    }
  }, [powerOn, disabled, transmitting, menuOpen, menuOptions.length]);

  // Handle menu option selection (simulated for demo)
  const handleMenuSelect = useCallback(() => {
    if (!powerOn || disabled || transmitting || !menuOpen) return;

    // Simple demo functionality for menu options
    if (menuOptions[menuOption] === 'GPS/TIME') {
      setShowPosition(prev => !prev);
    }

    // Exit menu after selection
    setMenuOpen(false);
  }, [powerOn, disabled, transmitting, menuOpen, menuOption, menuOptions]);

  // Handle transmit button
  const handleTransmitPress = useCallback(() => {
    if (!powerOn || disabled) return;

    setTransmitting(true);
  }, [powerOn, disabled]);

  // Handle transmit button release
  const handleTransmitRelease = useCallback(() => {
    if (!powerOn || disabled || !transmitting) return;

    setTransmitting(false);
  }, [powerOn, disabled, transmitting]);

  // Handle numeric keypad input
  const handleKeypadInput = useCallback(
    (digit: number) => {
      if (!powerOn || disabled || transmitting) return;

      if (!directEntryMode) {
        setDirectEntryMode(true);
        setDirectEntryBuffer(digit.toString());
      } else {
        // Append digit if less than 2 digits
        if (directEntryBuffer.length < 2) {
          setDirectEntryBuffer(prev => `${prev}${digit}`);
        }

        // If we have 2 digits, attempt to change channel
        if (directEntryBuffer.length === 1) {
          const channelNum = parseInt(`${directEntryBuffer}${digit}`, 10);
          const channelIndex = MARINE_CHANNELS.findIndex(
            ch => ch.number === channelNum,
          );

          if (channelIndex >= 0) {
            // Valid channel, switch to it
            setCurrentChannelIndex(channelIndex);
            setDirectEntryMode(false);
            setDirectEntryBuffer('');

            if (onChannelChange) {
              const channel = MARINE_CHANNELS[channelIndex];
              onChannelChange(channel.number, channel.frequency);
            }

            // Stop scanning
            if (scanActive) setScanActive(false);
          } else {
            // Invalid channel, clear input
            setTimeout(() => {
              setDirectEntryBuffer('');
              setDirectEntryMode(false);
            }, 1000);
          }
        }
      }
    },
    [
      powerOn,
      disabled,
      transmitting,
      directEntryMode,
      directEntryBuffer,
      onChannelChange,
      scanActive,
    ],
  );

  // Format position for display
  const formatPosition = useCallback(
    (coord: number, isLat: boolean): string => {
      const abs = Math.abs(coord);
      const degrees = Math.floor(abs);
      const minutes = ((abs - degrees) * 60).toFixed(3);
      const direction = isLat
        ? coord >= 0
          ? 'N'
          : 'S'
        : coord >= 0
          ? 'E'
          : 'W';

      return `${degrees.toString().padStart(2, '0')}°${minutes.padStart(6, '0')}'${direction}`;
    },
    [],
  );

  // Calculate the normalized value for the channel dial (0-100)
  const channelDialValue =
    (currentChannelIndex / (MARINE_CHANNELS.length - 1)) * 100;

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height + 20}px`, // Added 20px to overall height to prevent clipping
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: `${padding - 40}px 12px ${padding}px 12px`,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
        opacity: disabled ? 0.7 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ventilation grill (top left) */}
      <div
        style={{
          position: 'absolute',
          top: '6px',
          left: '10px',
          width: '60px',
          height: '12px',
          display: 'flex',
          gap: '3px',
        }}
      >
        {[...Array(5)].map((_, i) => (
          <div
            key={`vent-${i}`}
            style={{
              width: '8px',
              height: '12px',
              backgroundColor: '#111',
              borderRadius: '1px',
            }}
          />
        ))}
      </div>

      {/* Display Panel */}
      <div
        style={{
          height: `${displayHeight}px`,
          backgroundColor: powerOn ? '#f7941d' : '#442700', // Orange when on, dark amber when off
          borderRadius: '4px',
          padding: '32px',
          marginBottom: '10px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'background-color 0.2s ease',
          overflow: 'hidden',
          color: '#000',
        }}
      >
        {/* Main Display Row - Channel & Status */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '40%',
          }}
        >
          {/* Channel/Status Display */}
          <div
            style={{
              fontFamily: 'monospace',
              fontWeight: 'bold',
              fontSize: powerOn
                ? `${displayHeight * 0.36}px`
                : `${displayHeight * 0.2}px`,
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {powerOn ? displayMessage : ''}

            {/* Emergency Indicator */}
            {powerOn && currentChannel.isEmergency && !distressActive && (
              <span
                style={{
                  fontSize: `${displayHeight * 0.2}px`,
                  backgroundColor: 'red',
                  padding: '0px 4px',
                  borderRadius: '2px',
                  marginLeft: '8px',
                  color: '#FFF',
                }}
              >
                EMERGENCY
              </span>
            )}

            {/* Distress Active Indicator */}
            {powerOn && distressActive && (
              <span
                style={{
                  fontSize: `${displayHeight * 0.2}px`,
                  backgroundColor: 'red',
                  padding: '0px 4px',
                  borderRadius: '2px',
                  marginLeft: '8px',
                  color: '#FFF',
                  animation: 'blink 1s infinite',
                }}
              >
                DISTRESS ACTIVE
              </span>
            )}

            {/* Transmit Power Indicator */}
            {powerOn && !menuOpen && !directEntryMode && !distressActive && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: `${displayHeight * 0.2}px`,
                }}
              >
                {highPower ? 'HI' : 'LO'}
              </span>
            )}
          </div>

          {/* Signal Strength Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '2px',
              height: '100%',
              marginLeft: '8px',
            }}
          >
            {[1, 2, 3, 4, 5].map(bar => (
              <div
                key={`bar-${bar}`}
                style={{
                  width: '4px',
                  backgroundColor:
                    powerOn && bar <= signalBars ? '#000' : '#885000',
                  height: `${bar * 16}%`,
                  borderRadius: '1px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Secondary Display Row - Always visible with Frequency & Position/Time */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '6px',
            fontFamily: 'monospace',
            fontSize: `${displayHeight * 0.2}px`,
          }}
        >
          {powerOn && (
            <>
              <div>
                {currentChannel.frequency.toFixed(3)} MHz
                <span
                  style={{
                    marginLeft: '5px',
                    fontSize: `${displayHeight * 0.15}px`,
                  }}
                >
                  {currentChannel.name}
                </span>
              </div>
              <div>
                {position && showPosition ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      fontSize: '9px',
                      lineHeight: '1.2',
                    }}
                  >
                    <div>{`${formatPosition(position.latitude, true)}`}</div>
                    <div>{`${formatPosition(position.longitude, false)}`}</div>
                  </div>
                ) : (
                  `${currentTime.toTimeString().substring(0, 5)}`
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Controls Panel */}
      <div
        style={{
          display: 'flex',
          flexGrow: 1,
          alignItems: 'flex-start',
          gap: '12px',
          paddingBottom: '10px', // Added padding at the bottom to prevent clipping
        }}
      >
        {/* Left Controls - PTT Mic and Volume */}
        <div
          style={{
            width: '80px',
            height: '80%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          {/* PTT Button with Mic appearance */}
          <button
            onMouseDown={handleTransmitPress}
            onMouseUp={handleTransmitRelease}
            onMouseLeave={handleTransmitRelease}
            onTouchStart={handleTransmitPress}
            onTouchEnd={handleTransmitRelease}
            disabled={!powerOn || disabled}
            style={{
              width: '80px',
              height: `${controlsHeight * 0.9}px`,
              backgroundColor: '#333',
              borderRadius: '8px',
              border: transmitting ? '2px solid #f44' : '2px solid #555',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: '32px',
              cursor: !powerOn || disabled ? 'not-allowed' : 'pointer',
              boxShadow: transmitting
                ? '0 0 8px rgba(255, 68, 68, 0.6)'
                : 'none',
              opacity: !powerOn || disabled ? 0.6 : 1,
            }}
          >
            {/* Speaker holes */}
            {/*             <div
              style={{
                width: '100%',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-around',
                marginBottom: 'auto',
              }}
            >
              {[...Array(15)].map((_, i) => (
                <div
                  key={`hole-${i}`}
                  style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: '#222',
                    borderRadius: '50%',
                    margin: '2px',
                  }}
                />
              ))}
            </div> */}

            {/* PTT text */}
            <div
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: transmitting ? '#f44' : '#444',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 'bold',
                color: '#fff',
              }}
            >
              PTT
            </div>
          </button>

          {/* Volume Control Dial */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '9px',
                color: '#aaa',
                textAlign: 'center',
                marginBottom: '2px',
              }}
            >
              VOLUME
            </div>
            <RotaryDial
              value={volume}
              onChange={handleVolumeChange}
              min={0}
              max={100}
              size={55}
              activeColor={powerOn ? '#22c55e' : '#4B5563'}
              disabled={!powerOn || disabled}
              showValue={false}
              numTicks={0}
            />
          </div>
        </div>

        {/* Center Controls - Main Buttons Area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexGrow: 1,
            height: '100%',
          }}
        >
          {/* Top Row Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
            }}
          >
            {/* DISTRESS Button */}
            <button
              onClick={handleDistress}
              disabled={!powerOn || disabled}
              style={{
                width: '70px',
                height: '26px',
                backgroundColor: '#f44',
                borderRadius: '4px',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: !powerOn || disabled ? 'not-allowed' : 'pointer',
                opacity: !powerOn || disabled ? 0.6 : 1,
                boxShadow: distressActive ? '0 0 10px #f44' : 'none',
              }}
            >
              DISTRESS
            </button>

            {/* DSC Button */}
            <button
              onClick={handleDSC}
              disabled={!powerOn || disabled || transmitting}
              style={{
                width: '50px',
                height: '26px',
                backgroundColor: dscActive ? '#5bc0de' : '#1F2937',
                borderRadius: '4px',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor:
                  !powerOn || disabled || transmitting
                    ? 'not-allowed'
                    : 'pointer',
                opacity: !powerOn || disabled || transmitting ? 0.6 : 1,
              }}
            >
              DSC
            </button>

            {/* PWR Button */}
            <button
              onClick={handlePowerToggle}
              disabled={disabled}
              style={{
                width: '50px',
                height: '26px',
                backgroundColor: powerOn ? '#22c55e' : '#4B5563',
                borderRadius: '4px',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              PWR
            </button>
          </div>

          {/* Middle Row Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
            }}
          >
            {/* 16/9 Button */}
            <button
              onClick={handleChannel16}
              onDoubleClick={handleChannel9}
              disabled={!powerOn || disabled || transmitting}
              style={{
                width: '50px',
                height: '26px',
                backgroundColor:
                  currentChannel.number === 16 || currentChannel.number === 9
                    ? '#22c55e'
                    : '#1F2937',
                borderRadius: '4px',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor:
                  !powerOn || disabled || transmitting
                    ? 'not-allowed'
                    : 'pointer',
                opacity: !powerOn || disabled || transmitting ? 0.6 : 1,
              }}
            >
              16/9
            </button>

            {/* HI/LO Button */}
            <button
              onClick={handleHiLoPower}
              disabled={!powerOn || disabled || transmitting}
              style={{
                width: '50px',
                height: '26px',
                backgroundColor: !highPower ? '#5bc0de' : '#1F2937',
                borderRadius: '4px',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor:
                  !powerOn || disabled || transmitting
                    ? 'not-allowed'
                    : 'pointer',
                opacity: !powerOn || disabled || transmitting ? 0.6 : 1,
              }}
            >
              HI/LO
            </button>

            {/* SCAN Button */}
            <button
              onClick={handleScan}
              disabled={
                !powerOn ||
                disabled ||
                transmitting ||
                directEntryMode ||
                menuOpen
              }
              style={{
                width: '50px',
                height: '26px',
                backgroundColor: scanActive ? '#5bc0de' : '#1F2937',
                borderRadius: '4px',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor:
                  !powerOn ||
                  disabled ||
                  transmitting ||
                  directEntryMode ||
                  menuOpen
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  !powerOn ||
                  disabled ||
                  transmitting ||
                  directEntryMode ||
                  menuOpen
                    ? 0.6
                    : 1,
              }}
            >
              SCAN
            </button>
          </div>

          {/* Bottom Row Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
            }}
          >
            {/* CLEAR Button */}
            <button
              onClick={handleClear}
              disabled={!powerOn || disabled}
              style={{
                width: '50px',
                height: '26px',
                backgroundColor: '#1F2937',
                borderRadius: '4px',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: !powerOn || disabled ? 'not-allowed' : 'pointer',
                opacity: !powerOn || disabled ? 0.6 : 1,
              }}
            >
              CLEAR
            </button>

            {/* MENU Button */}
            <button
              onClick={handleMenu}
              onDoubleClick={handleMenuSelect}
              disabled={!powerOn || disabled || transmitting}
              style={{
                width: '50px',
                height: '26px',
                backgroundColor: menuOpen ? '#5bc0de' : '#1F2937',
                borderRadius: '4px',
                border: 'none',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor:
                  !powerOn || disabled || transmitting
                    ? 'not-allowed'
                    : 'pointer',
                opacity: !powerOn || disabled || transmitting ? 0.6 : 1,
              }}
            >
              MENU
            </button>
          </div>

          {/* Channel Selector Keypad in a 3x4 grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '4px',
              justifyContent: 'center',
              marginTop: 'auto',
              width: '90%',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {/* First row: 1, 2, 3 */}
            {[1, 2, 3].map(digit => (
              <button
                key={`digit-${digit}`}
                onClick={() => handleKeypadInput(digit)}
                disabled={!powerOn || disabled || transmitting}
                style={{
                  height: '22px',
                  backgroundColor: '#1F2937',
                  borderRadius: '3px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor:
                    !powerOn || disabled || transmitting
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: !powerOn || disabled || transmitting ? 0.6 : 1,
                }}
              >
                {digit}
              </button>
            ))}

            {/* Second row: 4, 5, 6 */}
            {[4, 5, 6].map(digit => (
              <button
                key={`digit-${digit}`}
                onClick={() => handleKeypadInput(digit)}
                disabled={!powerOn || disabled || transmitting}
                style={{
                  height: '22px',
                  backgroundColor: '#1F2937',
                  borderRadius: '3px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor:
                    !powerOn || disabled || transmitting
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: !powerOn || disabled || transmitting ? 0.6 : 1,
                }}
              >
                {digit}
              </button>
            ))}

            {/* Third row: 7, 8, 9 */}
            {[7, 8, 9].map(digit => (
              <button
                key={`digit-${digit}`}
                onClick={() => handleKeypadInput(digit)}
                disabled={!powerOn || disabled || transmitting}
                style={{
                  height: '22px',
                  backgroundColor: '#1F2937',
                  borderRadius: '3px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor:
                    !powerOn || disabled || transmitting
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: !powerOn || disabled || transmitting ? 0.6 : 1,
                }}
              >
                {digit}
              </button>
            ))}

            {/* Fourth row: 0 (centered across) */}
            <div style={{ gridColumn: '1 / span 3' }}>
              <button
                onClick={() => handleKeypadInput(0)}
                disabled={!powerOn || disabled || transmitting}
                style={{
                  width: '100%',
                  height: '22px',
                  backgroundColor: '#1F2937',
                  borderRadius: '3px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor:
                    !powerOn || disabled || transmitting
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: !powerOn || disabled || transmitting ? 0.6 : 1,
                }}
              >
                0
              </button>
            </div>
          </div>
        </div>

        {/* Right Controls - Channel Dial & Squelch */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            width: '80px',
            height: '80%',
          }}
        >
          {/* Squelch Control */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '9px',
                color: '#aaa',
                textAlign: 'center',
                marginBottom: '2px',
              }}
            >
              SQUELCH
            </div>
            <RotaryDial
              value={squelch}
              onChange={handleSquelchChange}
              min={0}
              max={100}
              size={55}
              activeColor={powerOn ? '#22c55e' : '#4B5563'}
              disabled={!powerOn || disabled}
              showValue={false}
              numTicks={0}
            />
          </div>

          {/* Channel Select Dial */}
          <div
            style={{
              marginTop: 'auto',
            }}
          >
            <div
              style={{
                fontSize: '9px',
                color: '#aaa',
                textAlign: 'center',
                marginBottom: '2px',
              }}
            >
              SELECT
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '4px',
              }}
            >
              <RotaryDial
                value={channelDialValue}
                onChange={handleChannelDialChange}
                min={0}
                max={100}
                size={70}
                activeColor={powerOn ? '#22c55e' : '#4B5563'}
                disabled={
                  !powerOn || disabled || transmitting || distressActive
                }
                showValue={false}
                numTicks={0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
