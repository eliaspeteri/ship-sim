import { useEffect, useRef } from 'react';

import type { MarineRadioAction, MarineRadioState } from './marineRadioState';
import type { Dispatch } from 'react';

type MarineRadioEffectsConfig = {
  state: MarineRadioState;
  isEmergencyChannel: boolean;
  channelCount: number;
};

export function useMarineRadioEffects(
  config: MarineRadioEffectsConfig,
  dispatch: Dispatch<MarineRadioAction>,
) {
  const { state, isEmergencyChannel, channelCount } = config;
  const scanRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      dispatch({ type: 'setCurrentTime', value: new Date() });
    }, 1000);
    return () => clearInterval(timer);
  }, [dispatch]);

  useEffect(() => {
    if (!state.powerOn) {
      dispatch({ type: 'setReceiving', value: false, strength: 0 });
      return;
    }

    const receptionInterval = setInterval(() => {
      const receiveChance = isEmergencyChannel ? 0.3 : 0.15;
      if (Math.random() >= receiveChance) return;

      const strength = 40 + Math.random() * 60;
      dispatch({ type: 'setReceiving', value: true, strength });
      setTimeout(
        () => {
          dispatch({ type: 'setReceiving', value: false, strength: 0 });
        },
        2000 + Math.random() * 3000,
      );
    }, 10000);

    return () => clearInterval(receptionInterval);
  }, [dispatch, isEmergencyChannel, state.powerOn]);

  useEffect(() => {
    if (!state.powerOn || !state.scanActive) {
      if (scanRef.current) {
        clearInterval(scanRef.current);
        scanRef.current = null;
      }
      return;
    }

    if (!scanRef.current) {
      scanRef.current = setInterval(() => {
        if (state.receiving) return;
        dispatch({
          type: 'setChannelIndex',
          index: (state.currentChannelIndex + 1) % channelCount,
        });
      }, 2000);
    }

    return () => {
      if (scanRef.current) {
        clearInterval(scanRef.current);
        scanRef.current = null;
      }
    };
  }, [
    dispatch,
    channelCount,
    state.currentChannelIndex,
    state.powerOn,
    state.receiving,
    state.scanActive,
  ]);

  useEffect(() => {
    if (state.powerOn && state.receiving) {
      const bars = Math.max(
        1,
        Math.min(5, Math.ceil(state.receiveStrength / 20)),
      );
      dispatch({ type: 'setSignalBars', value: bars });
      return;
    }
    dispatch({ type: 'setSignalBars', value: 0 });
  }, [dispatch, state.powerOn, state.receiveStrength, state.receiving]);
}
