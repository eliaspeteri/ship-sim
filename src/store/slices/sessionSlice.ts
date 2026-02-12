import { MAX_REPLAY_FRAMES } from '../defaults';
import type { ReplayFrame, SimulationState, StoreSet } from '../types';

type SessionSlice = Pick<
  SimulationState,
  | 'mode'
  | 'setMode'
  | 'roles'
  | 'setRoles'
  | 'spaceId'
  | 'setSpaceId'
  | 'spaceInfo'
  | 'setSpaceInfo'
  | 'notice'
  | 'setNotice'
  | 'sessionUserId'
  | 'setSessionUserId'
  | 'crewIds'
  | 'crewNames'
  | 'setCrew'
  | 'socketLatencyMs'
  | 'setSocketLatencyMs'
  | 'replay'
  | 'startReplayRecording'
  | 'stopReplayRecording'
  | 'clearReplay'
  | 'addReplayFrame'
  | 'startReplayPlayback'
  | 'stopReplayPlayback'
>;

export const createSessionSlice = (set: StoreSet): SessionSlice => ({
  mode: 'player',
  setMode: mode => set({ mode }),
  roles: ['guest'],
  setRoles: roles => set({ roles }),
  spaceId: 'global',
  setSpaceId: spaceId => set({ spaceId: spaceId || 'global' }),
  spaceInfo: null,
  setSpaceInfo: info => set({ spaceInfo: info }),
  notice: null,
  setNotice: notice => set({ notice }),
  sessionUserId: null,
  setSessionUserId: id => set({ sessionUserId: id }),
  crewIds: [],
  crewNames: {},
  setCrew: crew =>
    set({
      crewIds: crew.ids ?? [],
      crewNames: crew.names ?? {},
    }),
  socketLatencyMs: null,
  setSocketLatencyMs: ms => set({ socketLatencyMs: ms }),
  replay: { recording: false, playing: false, frames: [] },
  startReplayRecording: () =>
    set({
      replay: { recording: true, playing: false, frames: [] },
    }),
  stopReplayRecording: () =>
    set(state => ({
      replay: { ...state.replay, recording: false },
    })),
  clearReplay: () =>
    set(state => ({
      replay: { ...state.replay, frames: [] },
    })),
  addReplayFrame: (frame: ReplayFrame) =>
    set(state => {
      if (!state.replay.recording) return {};
      const frames = [...state.replay.frames, frame];
      if (frames.length > MAX_REPLAY_FRAMES) {
        frames.splice(0, frames.length - MAX_REPLAY_FRAMES);
      }
      return {
        replay: { ...state.replay, frames },
      };
    }),
  startReplayPlayback: () =>
    set(state => ({
      replay: { ...state.replay, playing: true },
    })),
  stopReplayPlayback: () =>
    set(state => ({
      replay: { ...state.replay, playing: false },
    })),
});
