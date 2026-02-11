import useStore from '../../../store';

export function useHudStoreSnapshot() {
  const vessel = useStore(state => state.vessel);
  const environment = useStore(state => state.environment);
  const mode = useStore(state => state.mode);
  const roles = useStore(state => state.roles);
  const sessionUserId = useStore(state => state.sessionUserId);
  const crewIds = useStore(state => state.crewIds);
  const crewNames = useStore(state => state.crewNames);
  const setNotice = useStore(state => state.setNotice);
  const account = useStore(state => state.account);
  const setAccount = useStore(state => state.setAccount);
  const setPhysicsParams = useStore(state => state.setPhysicsParams);
  const missions = useStore(state => state.missions);
  const missionAssignments = useStore(state => state.missionAssignments);
  const upsertMissionAssignment = useStore(
    state => state.upsertMissionAssignment,
  );
  const socketLatencyMs = useStore(state => state.socketLatencyMs);
  const replay = useStore(state => state.replay);
  const startReplayRecording = useStore(state => state.startReplayRecording);
  const stopReplayRecording = useStore(state => state.stopReplayRecording);
  const startReplayPlayback = useStore(state => state.startReplayPlayback);
  const stopReplayPlayback = useStore(state => state.stopReplayPlayback);
  const clearReplay = useStore(state => state.clearReplay);
  const otherVessels = useStore(state => state.otherVessels);
  const currentVesselId = useStore(state => state.currentVesselId);
  const spaceId = useStore(state => state.spaceId);
  const controls = useStore(state => state.vessel.controls);

  return {
    vessel,
    environment,
    mode,
    roles,
    sessionUserId,
    crewIds,
    crewNames,
    setNotice,
    account,
    setAccount,
    setPhysicsParams,
    missions,
    missionAssignments,
    upsertMissionAssignment,
    socketLatencyMs,
    replay,
    startReplayRecording,
    stopReplayRecording,
    startReplayPlayback,
    stopReplayPlayback,
    clearReplay,
    otherVessels,
    currentVesselId,
    spaceId,
    controls,
  };
}
