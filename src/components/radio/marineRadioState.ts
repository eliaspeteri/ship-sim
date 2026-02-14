export interface RadioChannel {
  number: number;
  frequency: number;
  name: string;
  isEmergency?: boolean;
  isDuplex?: boolean;
}

export interface MarineRadioState {
  powerOn: boolean;
  volume: number;
  squelch: number;
  currentChannelIndex: number;
  transmitting: boolean;
  highPower: boolean;
  receiving: boolean;
  receiveStrength: number;
  menuOpen: boolean;
  menuOption: number;
  directEntryMode: boolean;
  directEntryBuffer: string;
  distressActive: boolean;
  signalBars: number;
  scanActive: boolean;
  dscActive: boolean;
  currentTime: Date;
  showPosition: boolean;
}

export type MarineRadioAction =
  | { type: 'togglePower' }
  | { type: 'setVolume'; value: number }
  | { type: 'setSquelch'; value: number }
  | { type: 'setChannelIndex'; index: number }
  | { type: 'setTransmitting'; value: boolean }
  | { type: 'setHighPower'; value: boolean }
  | { type: 'setReceiving'; value: boolean; strength: number }
  | { type: 'setMenuOpen'; value: boolean }
  | { type: 'setMenuOption'; value: number }
  | { type: 'setDirectEntry'; mode: boolean; buffer: string }
  | { type: 'setDirectEntryBuffer'; buffer: string }
  | { type: 'setDistressActive'; value: boolean }
  | { type: 'setSignalBars'; value: number }
  | { type: 'setScanActive'; value: boolean }
  | { type: 'setDscActive'; value: boolean }
  | { type: 'setCurrentTime'; value: Date }
  | { type: 'toggleShowPosition' };

export const MENU_OPTIONS = [
  'BACKLIGHT',
  'CONTRAST',
  'LOCAL/DIST',
  'GPS/TIME',
  'RADIO SETUP',
  'DSC SETUP',
] as const;

export const MARINE_CHANNELS: RadioChannel[] = [
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

export const createInitialState = (
  initialPower: boolean,
  initialChannel: number,
): MarineRadioState => ({
  powerOn: initialPower,
  volume: 50,
  squelch: 30,
  currentChannelIndex: Math.max(
    0,
    MARINE_CHANNELS.findIndex(ch => ch.number === initialChannel),
  ),
  transmitting: false,
  highPower: true,
  receiving: false,
  receiveStrength: 0,
  menuOpen: false,
  menuOption: 0,
  directEntryMode: false,
  directEntryBuffer: '',
  distressActive: false,
  signalBars: 0,
  scanActive: false,
  dscActive: false,
  currentTime: new Date(),
  showPosition: false,
});

export function marineRadioReducer(
  state: MarineRadioState,
  action: MarineRadioAction,
): MarineRadioState {
  switch (action.type) {
    case 'togglePower':
      if (state.powerOn) {
        return {
          ...state,
          powerOn: false,
          transmitting: false,
          distressActive: false,
          scanActive: false,
          dscActive: false,
          menuOpen: false,
          directEntryMode: false,
          directEntryBuffer: '',
          receiving: false,
          receiveStrength: 0,
          signalBars: 0,
        };
      }
      return { ...state, powerOn: true };
    case 'setVolume':
      return { ...state, volume: action.value };
    case 'setSquelch':
      return { ...state, squelch: action.value };
    case 'setChannelIndex':
      return { ...state, currentChannelIndex: action.index };
    case 'setTransmitting':
      return { ...state, transmitting: action.value };
    case 'setHighPower':
      return { ...state, highPower: action.value };
    case 'setReceiving':
      return {
        ...state,
        receiving: action.value,
        receiveStrength: action.strength,
      };
    case 'setMenuOpen':
      return { ...state, menuOpen: action.value };
    case 'setMenuOption':
      return { ...state, menuOption: action.value };
    case 'setDirectEntry':
      return {
        ...state,
        directEntryMode: action.mode,
        directEntryBuffer: action.buffer,
      };
    case 'setDirectEntryBuffer':
      return { ...state, directEntryBuffer: action.buffer };
    case 'setDistressActive':
      return { ...state, distressActive: action.value };
    case 'setSignalBars':
      return { ...state, signalBars: action.value };
    case 'setScanActive':
      return { ...state, scanActive: action.value };
    case 'setDscActive':
      return { ...state, dscActive: action.value };
    case 'setCurrentTime':
      return { ...state, currentTime: action.value };
    case 'toggleShowPosition':
      return { ...state, showPosition: !state.showPosition };
    default:
      return state;
  }
}

export function getDisplayMessage(
  state: MarineRadioState,
  currentChannel: RadioChannel,
): string {
  if (!state.powerOn) return '';
  if (state.transmitting) return 'TRANSMIT';
  if (state.distressActive) return 'DISTRESS';
  if (state.dscActive) return 'DSC CALL';
  if (state.directEntryMode) return `CH: ${state.directEntryBuffer || '_'}`;
  if (state.menuOpen) return MENU_OPTIONS[state.menuOption] || '';
  if (state.scanActive) {
    return `SCAN CH ${currentChannel.number.toString().padStart(2, '0')}`;
  }
  return `CH ${currentChannel.number.toString().padStart(2, '0')}`;
}
