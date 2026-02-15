import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Scene from '../components/Scene';
import Dashboard from '../components/Dashboard';
import { HudDrawer } from '../components/HudDrawer';
import useStore from '../store';
import { socketManager } from '../networking/socket';
import { MAX_CREW } from '../constants/vessel';
import { positionToXY } from '../lib/position';
import type { ScenarioDefinition } from '../lib/scenarios';
import { getScenarios } from '../lib/scenarios';
import { getApiBase } from '../lib/api';
import { bboxAroundLatLon, setGeoOrigin } from '../lib/geo';
import {
  PORTS,
  REQUERY_DISTANCE_M,
  REQUERY_MIN_MS,
  SEAMARK_RADIUS_M,
  SEAMARK_REQUEST_LIMIT,
} from '../features/sim/constants';
import { haversineMeters, bboxKey } from '../features/sim/utils';
import { SpaceModal } from '../features/sim/SpaceModal';
import { JoinChoiceModal } from '../features/sim/JoinChoiceModal';
import GuestBanner from '../features/sim/components/GuestBanner';
import SimLoadingScreen from '../features/sim/components/SimLoadingScreen';
import SimTopBar from '../features/sim/components/SimTopBar';
import { useSpaceSelectionFlow } from '../features/sim/hooks/useSpaceSelectionFlow';
import { useSimSessionBootstrap } from '../features/sim/hooks/useSimSessionBootstrap';
import { useMissionBootstrap } from '../features/sim/hooks/useMissionBootstrap';
import { useSimKeyboardControls } from '../features/sim/hooks/useSimKeyboardControls';
import { deriveJoinableVessels } from '../features/sim/selectors/vesselSelectors';

/**
 * Simulation page for Ship Simulator.
 * Accessible without authentication; authenticated users get full controls.
 */
const SimPage: React.FC & { fullBleedLayout?: boolean } = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const vessel = useStore(state => state.vessel);
  const mode = useStore(state => state.mode);
  const setMode = useStore(state => state.setMode);
  const setSpaceId = useStore(state => state.setSpaceId);
  const spaceId = useStore(state => state.spaceId);
  const roles = useStore(state => state.roles);
  const notice = useStore(state => state.notice);
  const setNotice = useStore(state => state.setNotice);
  const crewIds = useStore(state => state.crewIds);
  const otherVessels = useStore(state => state.otherVessels);
  const setSessionUserId = useStore(state => state.setSessionUserId);
  const setChatMessages = useStore(state => state.setChatMessages);
  const currentVesselId = useStore(state => state.currentVesselId);
  const account = useStore(state => state.account);
  const seamarks = useStore(state => state.seamarks);
  const setSeamarks = useStore(state => state.setSeamarks);

  const sessionRole = (session?.user as { role?: string } | undefined)?.role;
  const isAuthed = status === 'authenticated' && Boolean(session);
  const canEnterPlayerMode =
    sessionRole === 'admin' ||
    sessionRole === 'player' ||
    roles.includes('admin') ||
    roles.includes('player');
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const geoOriginSetRef = React.useRef(false);
  const [showGuestBanner, setShowGuestBanner] = React.useState(true);
  const [selectedPort, setSelectedPort] = React.useState(PORTS[0].name);
  const [scenarioLoadingId, setScenarioLoadingId] = React.useState<
    string | null
  >(null);
  const [scenarioError, setScenarioError] = React.useState<string | null>(null);

  const scenarios = React.useMemo(() => getScenarios(), []);

  const {
    spaceInput,
    setSpaceInput,
    spaces,
    spacesLoading,
    spaceError,
    setSpaceError,
    inviteToken,
    setInviteToken,
    invitePassword,
    setInvitePassword,
    newSpaceName,
    setNewSpaceName,
    newSpaceVisibility,
    setNewSpaceVisibility,
    newSpaceRulesetType,
    setNewSpaceRulesetType,
    newSpacePassword,
    setNewSpacePassword,
    spaceModalOpen,
    setSpaceModalOpen,
    hasChosenSpace,
    spaceSelectionHydrated,
    knownSpaces,
    selectedSpaceRules,
    spaceFlow,
    setSpaceFlow,
    joinSpace,
    fetchSpaces,
    createSpace,
  } = useSpaceSelectionFlow({
    router,
    spaceId,
    setSpaceId,
    setChatMessages,
  });

  const openSpaceModal = React.useCallback(() => {
    setSpaceModalOpen(true);
  }, [setSpaceModalOpen]);

  const { showJoinChoice, setShowJoinChoice, rememberJoinChoice } =
    useSimSessionBootstrap({
      router,
      session,
      status,
      hasChosenSpace,
      spaceSelectionHydrated,
      canEnterPlayerMode,
      mode,
      notice,
      currentVesselId,
      setMode,
      setNotice,
      setSessionUserId,
      openSpaceModal,
    });

  useMissionBootstrap({ status, spaceId });
  useSimKeyboardControls();

  const joinableVessels = React.useMemo(() => {
    return deriveJoinableVessels({
      otherVessels,
      maxCrew: MAX_CREW,
    });
  }, [otherVessels]);

  const startScenario = React.useCallback(
    async (scenario: ScenarioDefinition) => {
      setScenarioError(null);
      setScenarioLoadingId(scenario.id);
      try {
        const apiBase = getApiBase();
        const response = await fetch(
          `${apiBase}/api/scenarios/${scenario.id}/start`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          },
        );
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data?.error || `Request failed: ${response.status}`);
        }

        const data = await response.json();
        if (!data?.space?.id) {
          throw new Error('Scenario space missing from response');
        }

        socketManager.setJoinPreference('player', true);
        setMode('player');
        joinSpace(data.space.id);
        await socketManager.waitForConnection();
        socketManager.requestNewVessel({
          lat: scenario.spawn.lat,
          lon: scenario.spawn.lon,
        });
        setShowJoinChoice(false);
        rememberJoinChoice('create');
        setNotice({
          type: 'info',
          message: `Scenario "${scenario.name}" started.`,
        });
      } catch (error) {
        console.error('Failed to start scenario', error);
        setScenarioError(
          error instanceof Error ? error.message : 'Failed to start scenario',
        );
      } finally {
        setScenarioLoadingId(null);
      }
    },
    [joinSpace, rememberJoinChoice, setMode, setNotice, setShowJoinChoice],
  );

  React.useEffect(() => {
    const lat = vessel.position.lat;
    const lon = vessel.position.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    const now = Date.now();
    if (seamarks.updatedAt && now - seamarks.updatedAt < REQUERY_MIN_MS) return;

    const center = { lat, lon };
    const lastCenter = seamarks.center;

    if (lastCenter) {
      const distance = haversineMeters(lastCenter, center);
      if (distance < REQUERY_DISTANCE_M) return;
    }

    const bbox = bboxAroundLatLon({
      lat,
      lon,
      radiusMeters: SEAMARK_RADIUS_M,
      corner: true,
    });
    const key = bboxKey(bbox);

    if (seamarks.bboxKey === key) return;

    setSeamarks({
      bboxKey: key,
      center,
      radiusMeters: SEAMARK_RADIUS_M,
      updatedAt: now,
    });

    socketManager.requestSeamarksNearby({
      lat,
      lon,
      radiusMeters: SEAMARK_RADIUS_M,
      bbox,
      bboxKey: key,
      limit: SEAMARK_REQUEST_LIMIT,
    });
  }, [
    seamarks.bboxKey,
    seamarks.center,
    seamarks.updatedAt,
    setSeamarks,
    vessel.position.lat,
    vessel.position.lon,
  ]);

  React.useEffect(() => {
    geoOriginSetRef.current = false;
  }, [spaceId]);

  React.useEffect(() => {
    if (geoOriginSetRef.current) return;
    const lat = vessel.position.lat;
    const lon = vessel.position.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    setGeoOrigin({ lat, lon });
    geoOriginSetRef.current = true;
  }, [vessel.position.lat, vessel.position.lon]);

  if (status === 'loading') {
    return <SimLoadingScreen />;
  }

  const vesselXY = positionToXY({
    lat: vessel.position.lat,
    lon: vessel.position.lon,
  });
  const vesselPosition = {
    x: vesselXY.x,
    y: vesselXY.y,
    z: vessel.position.z || 0,
    heading: vessel.orientation.heading || 0,
  };

  const showHelmControl =
    typeof userId === 'string' && crewIds.includes(userId);
  const helmLabel =
    vessel.helm?.userId === userId
      ? 'Release Helm'
      : `Claim Helm${vessel.helm?.username ? ` (${vessel.helm.username})` : ''}`;
  const modeToggleTitle =
    !canEnterPlayerMode && mode !== 'player'
      ? 'Spectator-only role'
      : undefined;

  return (
    <div className="h-[calc(100vh-var(--nav-height,0px))] min-h-[calc(100vh-var(--nav-height,0px))] w-full">
      {isAuthed ? (
        <SimTopBar
          notice={notice}
          showHelmControl={showHelmControl}
          helmLabel={helmLabel}
          onToggleHelm={() =>
            socketManager.requestHelm(
              vessel.helm?.userId === userId ? 'release' : 'claim',
            )
          }
          canEnterPlayerMode={canEnterPlayerMode}
          mode={mode}
          onCreateVessel={() => {
            socketManager.setJoinPreference('player', true);
            socketManager.requestNewVessel();
            setNotice({
              type: 'info',
              message: 'Requesting a new vessel...',
            });
          }}
          onToggleMode={() => {
            const nextMode = mode === 'player' ? 'spectator' : 'player';
            if (nextMode === 'player' && !canEnterPlayerMode) {
              setNotice({
                type: 'error',
                message: 'Your role is spectator-only',
              });
              return;
            }
            setMode(nextMode);
            socketManager.setJoinPreference(nextMode, nextMode === 'player');
            socketManager.notifyModeChange(nextMode);
          }}
          modeToggleTitle={modeToggleTitle}
        />
      ) : showGuestBanner ? (
        <GuestBanner onDismiss={() => setShowGuestBanner(false)} />
      ) : null}

      <SpaceModal
        isOpen={spaceModalOpen}
        flow={spaceFlow}
        spaces={spaces}
        spacesLoading={spacesLoading}
        spaceInput={spaceInput}
        setSpaceInput={setSpaceInput}
        selectedSpaceRules={selectedSpaceRules}
        knownSpaces={knownSpaces}
        inviteToken={inviteToken}
        setInviteToken={setInviteToken}
        invitePassword={invitePassword}
        setInvitePassword={setInvitePassword}
        newSpaceName={newSpaceName}
        setNewSpaceName={setNewSpaceName}
        newSpaceVisibility={newSpaceVisibility}
        setNewSpaceVisibility={setNewSpaceVisibility}
        newSpaceRulesetType={newSpaceRulesetType}
        setNewSpaceRulesetType={setNewSpaceRulesetType}
        newSpacePassword={newSpacePassword}
        setNewSpacePassword={setNewSpacePassword}
        spaceError={spaceError}
        setSpaceError={setSpaceError}
        onJoinSpace={(...args) => {
          void joinSpace(...args);
        }}
        onFetchSpaces={options => {
          void fetchSpaces(options);
        }}
        onCreateSpace={(...args) => {
          void createSpace(...args);
        }}
        onClose={() => setSpaceModalOpen(false)}
        onFlowChange={setSpaceFlow}
      />

      {mode !== 'spectator' ? <Dashboard /> : null}
      <Scene vesselPosition={vesselPosition} mode={mode} />

      {isAuthed ? (
        <HudDrawer
          onOpenSpaces={() => {
            setSpaceModalOpen(true);
            setSpaceError(null);
            setSpaceFlow('choice');
          }}
        />
      ) : null}

      <JoinChoiceModal
        isOpen={showJoinChoice}
        ports={PORTS}
        selectedPort={selectedPort}
        onSelectPort={setSelectedPort}
        joinableVessels={joinableVessels}
        maxCrew={MAX_CREW}
        canEnterPlayerMode={canEnterPlayerMode}
        onJoinVessel={vesselId => {
          socketManager.setJoinPreference('player', true);
          socketManager.requestJoinVessel(vesselId);
          setMode('player');
          setShowJoinChoice(false);
          rememberJoinChoice('join');
        }}
        onQuickJoin={() => {
          socketManager.setJoinPreference('player', true);
          socketManager.requestJoinVessel();
          setMode('player');
          setShowJoinChoice(false);
          rememberJoinChoice('join');
        }}
        onCreateVessel={portName => {
          const port = PORTS.find(p => p.name === portName) || PORTS[0];
          socketManager.setJoinPreference('player', true);
          socketManager.requestNewVessel({
            lat: port.position.lat,
            lon: port.position.lon,
          });
          setMode('player');
          setShowJoinChoice(false);
          rememberJoinChoice('create');
        }}
        onSpectate={() => {
          setMode('spectator');
          socketManager.setJoinPreference('spectator', false);
          socketManager.notifyModeChange('spectator');
          setShowJoinChoice(false);
          rememberJoinChoice('spectate');
          setNotice({
            type: 'info',
            message: 'Spectator mode enabled.',
          });
        }}
        scenarios={scenarios}
        scenarioLoadingId={scenarioLoadingId}
        scenarioError={scenarioError}
        accountRank={account.rank}
        onStartScenario={scenarioId => {
          void startScenario(scenarioId);
        }}
      />
    </div>
  );
};

SimPage.fullBleedLayout = true;

export default SimPage;
