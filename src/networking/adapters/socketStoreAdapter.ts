import useStore from '../../store';

export type SocketStoreState = ReturnType<typeof useStore.getState>;

export interface SocketStoreAdapter {
  getState(): SocketStoreState;
}

export const createDefaultSocketStoreAdapter = (): SocketStoreAdapter => ({
  getState: () => useStore.getState(),
});
