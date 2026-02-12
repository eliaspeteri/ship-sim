import React from 'react';
import styles from '../../HudDrawer.module.css';
import {
  MS_PER_SECOND,
  REPLAY_MIN_FRAMES,
  REPLAY_SECONDS_DECIMALS,
} from '../constants';

type ReplayFrame = {
  timestamp: number;
};

type ReplayState = {
  recording: boolean;
  playing: boolean;
  frames: ReplayFrame[];
};

export function HudReplayPanel({
  replay,
  replayDuration,
  startReplayRecording,
  stopReplayRecording,
  startReplayPlayback,
  stopReplayPlayback,
  clearReplay,
}: {
  replay: ReplayState;
  replayDuration: number;
  startReplayRecording: () => void;
  stopReplayRecording: () => void;
  startReplayPlayback: () => void;
  stopReplayPlayback: () => void;
  clearReplay: () => void;
}) {
  return (
    <div className={styles.sectionGrid}>
      <div className={styles.sectionCard}>
        <div className={styles.sectionTitle}>Replay console</div>
        <div className={styles.replayMeta}>
          {replay.frames.length} frames •{' '}
          {(replayDuration / MS_PER_SECOND).toFixed(REPLAY_SECONDS_DECIMALS)}s
          recorded
        </div>
        <div className={styles.replayControls}>
          <button
            type="button"
            className={styles.replayButton}
            onClick={
              replay.recording ? stopReplayRecording : startReplayRecording
            }
            disabled={replay.playing}
          >
            {replay.recording ? 'Stop recording' : 'Start recording'}
          </button>
          <button
            type="button"
            className={styles.replayButtonSecondary}
            onClick={replay.playing ? stopReplayPlayback : startReplayPlayback}
            disabled={
              replay.frames.length < REPLAY_MIN_FRAMES || replay.recording
            }
          >
            {replay.playing ? 'Stop playback' : 'Play ghost'}
          </button>
          <button
            type="button"
            className={styles.replayButtonDanger}
            onClick={clearReplay}
            disabled={replay.recording || replay.frames.length === 0}
          >
            Clear recording
          </button>
        </div>
        <div className={styles.sectionSub}>
          Record a run, stop, then play ghost to overlay the last capture.
          Playback freezes live control updates while active.
        </div>
      </div>
    </div>
  );
}
