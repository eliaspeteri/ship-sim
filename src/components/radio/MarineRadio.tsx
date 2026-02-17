import React, { useCallback, useMemo, useReducer } from 'react';

import {
  MARINE_CHANNELS,
  MENU_OPTIONS,
  createInitialState,
  getDisplayMessage,
  marineRadioReducer,
} from './marineRadioState';
import { MarineRadioView } from './MarineRadioView';
import { useMarineRadioEffects } from './useMarineRadioEffects';

interface MarineRadioProps {
  width?: number;
  height?: number;
  initialPower?: boolean;
  initialChannel?: number;
  onDistressCall?: () => void;
  onChannelChange?: (channel: number, frequency: number) => void;
  position?: {
    latitude: number;
    longitude: number;
  };
  disabled?: boolean;
}

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
  const [state, dispatch] = useReducer(
    marineRadioReducer,
    createInitialState(initialPower, initialChannel),
  );

  const currentChannel = MARINE_CHANNELS[state.currentChannelIndex];
  useMarineRadioEffects(
    {
      state,
      isEmergencyChannel: Boolean(currentChannel?.isEmergency),
      channelCount: MARINE_CHANNELS.length,
    },
    dispatch,
  );

  const displayMessage = useMemo(
    () => getDisplayMessage(state, currentChannel),
    [currentChannel, state],
  );

  const handlePowerToggle = useCallback(() => {
    if (disabled) return;
    dispatch({ type: 'togglePower' });
  }, [disabled]);

  const handleVolumeChange = useCallback(
    (dialValue: number) => {
      if (!state.powerOn || disabled) return;
      dispatch({ type: 'setVolume', value: dialValue });
    },
    [disabled, state.powerOn],
  );

  const handleSquelchChange = useCallback(
    (dialValue: number) => {
      if (!state.powerOn || disabled) return;
      dispatch({ type: 'setSquelch', value: dialValue });
    },
    [disabled, state.powerOn],
  );

  const stopScan = useCallback(() => {
    if (state.scanActive) {
      dispatch({ type: 'setScanActive', value: false });
    }
  }, [state.scanActive]);

  const setChannelByNumber = useCallback(
    (channelNumber: number, frequency: number) => {
      const index = MARINE_CHANNELS.findIndex(
        ch => ch.number === channelNumber,
      );
      if (index < 0) return;
      dispatch({ type: 'setChannelIndex', index });
      onChannelChange?.(channelNumber, frequency);
      stopScan();
    },
    [onChannelChange, stopScan],
  );

  const handleChannelDialChange = useCallback(
    (dialValue: number) => {
      if (
        !state.powerOn ||
        disabled ||
        state.transmitting ||
        state.distressActive
      ) {
        return;
      }
      const maxIndex = MARINE_CHANNELS.length - 1;
      const nextIndex = Math.floor((dialValue / 100) * maxIndex);
      if (nextIndex === state.currentChannelIndex) return;

      const channel = MARINE_CHANNELS[nextIndex];
      dispatch({ type: 'setChannelIndex', index: nextIndex });
      onChannelChange?.(channel.number, channel.frequency);
      stopScan();
    },
    [
      disabled,
      onChannelChange,
      state.currentChannelIndex,
      state.distressActive,
      state.powerOn,
      state.transmitting,
      stopScan,
    ],
  );

  const handleChannel16 = useCallback(() => {
    if (!state.powerOn || disabled || state.transmitting) return;
    setChannelByNumber(16, 156.8);
  }, [disabled, setChannelByNumber, state.powerOn, state.transmitting]);

  const handleChannel9 = useCallback(() => {
    if (!state.powerOn || disabled || state.transmitting) return;
    setChannelByNumber(9, 156.45);
  }, [disabled, setChannelByNumber, state.powerOn, state.transmitting]);

  const handleScan = useCallback(() => {
    if (
      !state.powerOn ||
      disabled ||
      state.transmitting ||
      state.directEntryMode ||
      state.menuOpen
    ) {
      return;
    }
    dispatch({ type: 'setScanActive', value: !state.scanActive });
  }, [
    disabled,
    state.directEntryMode,
    state.menuOpen,
    state.powerOn,
    state.scanActive,
    state.transmitting,
  ]);

  const handleHiLoPower = useCallback(() => {
    if (!state.powerOn || disabled || state.transmitting) return;
    dispatch({ type: 'setHighPower', value: !state.highPower });
  }, [disabled, state.highPower, state.powerOn, state.transmitting]);

  const handleDistress = useCallback(() => {
    if (!state.powerOn || disabled) return;
    setChannelByNumber(16, 156.8);
    dispatch({ type: 'setDistressActive', value: true });
    onDistressCall?.();
    setTimeout(() => {
      dispatch({ type: 'setDistressActive', value: false });
    }, 5000);
  }, [disabled, onDistressCall, setChannelByNumber, state.powerOn]);

  const handleDsc = useCallback(() => {
    if (!state.powerOn || disabled || state.transmitting) return;
    dispatch({ type: 'setDscActive', value: !state.dscActive });
  }, [disabled, state.dscActive, state.powerOn, state.transmitting]);

  const handleClear = useCallback(() => {
    if (!state.powerOn || disabled) return;

    if (state.directEntryMode) {
      dispatch({ type: 'setDirectEntry', mode: false, buffer: '' });
      return;
    }
    if (state.menuOpen) {
      dispatch({ type: 'setMenuOpen', value: false });
      return;
    }
    if (state.dscActive) {
      dispatch({ type: 'setDscActive', value: false });
      return;
    }
    if (state.distressActive) {
      dispatch({ type: 'setDistressActive', value: false });
      return;
    }

    dispatch({ type: 'toggleShowPosition' });
  }, [
    disabled,
    state.directEntryMode,
    state.distressActive,
    state.dscActive,
    state.menuOpen,
    state.powerOn,
  ]);

  const handleMenu = useCallback(() => {
    if (!state.powerOn || disabled || state.transmitting) return;

    if (!state.menuOpen) {
      dispatch({ type: 'setMenuOpen', value: true });
      dispatch({ type: 'setMenuOption', value: 0 });
      return;
    }

    dispatch({
      type: 'setMenuOption',
      value: (state.menuOption + 1) % MENU_OPTIONS.length,
    });
  }, [
    disabled,
    state.menuOpen,
    state.menuOption,
    state.powerOn,
    state.transmitting,
  ]);

  const handleMenuSelect = useCallback(() => {
    if (!state.powerOn || disabled || state.transmitting || !state.menuOpen) {
      return;
    }
    if (MENU_OPTIONS[state.menuOption] === 'GPS/TIME') {
      dispatch({ type: 'toggleShowPosition' });
    }
    dispatch({ type: 'setMenuOpen', value: false });
  }, [
    disabled,
    state.menuOpen,
    state.menuOption,
    state.powerOn,
    state.transmitting,
  ]);

  const handleTransmitPress = useCallback(() => {
    if (!state.powerOn || disabled) return;
    dispatch({ type: 'setTransmitting', value: true });
  }, [disabled, state.powerOn]);

  const handleTransmitRelease = useCallback(() => {
    if (!state.powerOn || disabled || !state.transmitting) return;
    dispatch({ type: 'setTransmitting', value: false });
  }, [disabled, state.powerOn, state.transmitting]);

  const handleKeypadInput = useCallback(
    (digit: number) => {
      if (!state.powerOn || disabled || state.transmitting) return;

      if (!state.directEntryMode) {
        dispatch({ type: 'setDirectEntry', mode: true, buffer: `${digit}` });
        return;
      }

      if (state.directEntryBuffer.length < 2) {
        dispatch({
          type: 'setDirectEntryBuffer',
          buffer: `${state.directEntryBuffer}${digit}`,
        });
      }

      if (state.directEntryBuffer.length !== 1) return;

      const channelNum = parseInt(`${state.directEntryBuffer}${digit}`, 10);
      const channelIndex = MARINE_CHANNELS.findIndex(
        ch => ch.number === channelNum,
      );

      if (channelIndex < 0) {
        setTimeout(() => {
          dispatch({ type: 'setDirectEntry', mode: false, buffer: '' });
        }, 1000);
        return;
      }

      const channel = MARINE_CHANNELS[channelIndex];
      dispatch({ type: 'setChannelIndex', index: channelIndex });
      dispatch({ type: 'setDirectEntry', mode: false, buffer: '' });
      onChannelChange?.(channel.number, channel.frequency);
      stopScan();
    },
    [
      disabled,
      onChannelChange,
      state.directEntryBuffer,
      state.directEntryMode,
      state.powerOn,
      state.transmitting,
      stopScan,
    ],
  );

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

  const channelDialValue =
    (state.currentChannelIndex / (MARINE_CHANNELS.length - 1)) * 100;

  return (
    <MarineRadioView
      width={width}
      height={height}
      disabled={disabled}
      powerOn={state.powerOn}
      transmitting={state.transmitting}
      distressActive={state.distressActive}
      dscActive={state.dscActive}
      scanActive={state.scanActive}
      menuOpen={state.menuOpen}
      directEntryMode={state.directEntryMode}
      highPower={state.highPower}
      signalBars={state.signalBars}
      volume={state.volume}
      squelch={state.squelch}
      channelDialValue={channelDialValue}
      displayMessage={displayMessage}
      currentChannel={currentChannel}
      currentTime={state.currentTime}
      showPosition={state.showPosition}
      position={position}
      formatPosition={formatPosition}
      onPowerToggle={handlePowerToggle}
      onDistress={handleDistress}
      onDsc={handleDsc}
      onChannel16={handleChannel16}
      onChannel9={handleChannel9}
      onHiLoPower={handleHiLoPower}
      onScan={handleScan}
      onClear={handleClear}
      onMenu={handleMenu}
      onMenuSelect={handleMenuSelect}
      onTransmitPress={handleTransmitPress}
      onTransmitRelease={handleTransmitRelease}
      onKeypadInput={handleKeypadInput}
      onVolumeChange={handleVolumeChange}
      onSquelchChange={handleSquelchChange}
      onChannelDialChange={handleChannelDialChange}
    />
  );
}
