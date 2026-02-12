import React from 'react';
import { simStyles as styles } from './simStyles';
import { ScenarioDefinition } from '../../lib/scenarios';

type Port = { name: string; position: { lat: number; lon: number } };

type JoinableVessel = {
  id: string;
  crewCount: number;
  label: string;
};

type JoinChoiceModalProps = {
  isOpen: boolean;
  ports: Port[];
  selectedPort: string;
  onSelectPort: (name: string) => void;
  joinableVessels: JoinableVessel[];
  maxCrew: number;
  canEnterPlayerMode: boolean;
  onJoinVessel: (vesselId: string) => void;
  onQuickJoin: () => void;
  onCreateVessel: (portName: string) => void;
  onSpectate: () => void;
  scenarios: ScenarioDefinition[];
  scenarioLoadingId: string | null;
  scenarioError: string | null;
  accountRank: number;
  onStartScenario: (scenario: ScenarioDefinition) => void;
};

export function JoinChoiceModal({
  isOpen,
  ports,
  selectedPort,
  onSelectPort,
  joinableVessels,
  maxCrew,
  canEnterPlayerMode,
  onJoinVessel,
  onQuickJoin,
  onCreateVessel,
  onSpectate,
  scenarios,
  scenarioLoadingId,
  scenarioError,
  accountRank,
  onStartScenario,
}: JoinChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        <h2 className={styles.modalTitle}>Choose how to join</h2>
        <p className={styles.helperText}>
          You can join an available vessel with open crew slots or start your
          own.
        </p>
        <div className="flex flex-col gap-3">
          <label className={styles.helperText}>
            Spawn location
            <select
              className={styles.select}
              value={selectedPort}
              onChange={e => onSelectPort(e.target.value)}
            >
              {ports.map(port => (
                <option key={port.name} value={port.name}>
                  {port.name}
                </option>
              ))}
            </select>
          </label>
          {canEnterPlayerMode ? (
            <>
              <div className={styles.detailsCard}>
                <div className={styles.modeLabel}>Join an active crew</div>
                <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
                  {joinableVessels.length === 0 ? (
                    <div className={styles.helperText}>
                      No open crews. Create your own vessel instead.
                    </div>
                  ) : (
                    joinableVessels.map(vessel => (
                      <button
                        key={vessel.id}
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        onClick={() => onJoinVessel(vessel.id)}
                      >
                        {vessel.label} • {vessel.crewCount}/{maxCrew} crew
                      </button>
                    ))
                  )}
                </div>
                {joinableVessels.length > 0 ? (
                  <button
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    onClick={onQuickJoin}
                  >
                    Quick join smallest crew
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
          {canEnterPlayerMode ? (
            <button
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={() => onCreateVessel(selectedPort)}
            >
              Create my own vessel
            </button>
          ) : (
            <div className={styles.detailsCard}>
              Your role is spectator-only in this space.
            </div>
          )}
          <button
            className={`${styles.button} ${styles.buttonNeutral}`}
            onClick={onSpectate}
          >
            Spectate the world
          </button>
          <div className={styles.detailsCard}>
            <div className={styles.modeLabel}>Quick-start scenarios</div>
            {scenarioError ? (
              <div className={styles.errorText}>{scenarioError}</div>
            ) : null}
            <div className={styles.scenarioGrid}>
              {scenarios.map(scenario => {
                const locked = accountRank < scenario.rankRequired;
                const loading = scenarioLoadingId === scenario.id;
                return (
                  <div key={scenario.id} className={styles.scenarioCard}>
                    <div className={styles.scenarioHeader}>
                      <div>
                        <div className={styles.scenarioTitle}>
                          {scenario.name}
                        </div>
                        <div className={styles.scenarioMeta}>
                          {scenario.description}
                        </div>
                      </div>
                      <div className={styles.scenarioMeta}>
                        Rank {scenario.rankRequired}
                      </div>
                    </div>
                    <button
                      className={`${styles.button} ${
                        styles.buttonPrimary
                      } ${styles.scenarioAction}`}
                      disabled={locked || loading}
                      onClick={() => void onStartScenario(scenario)}
                    >
                      {locked
                        ? 'Locked'
                        : loading
                          ? 'Starting…'
                          : 'Start scenario'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
