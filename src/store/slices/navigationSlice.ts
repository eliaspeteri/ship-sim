import { defaultNavigationData } from '../defaults';

import type { NavigationData, SimulationState, StoreSet } from '../types';

type NavigationSlice = Pick<
  SimulationState,
  'navigation' | 'updateNavigation' | 'addWaypoint' | 'removeWaypoint'
>;

export const createNavigationSlice = (set: StoreSet): NavigationSlice => ({
  navigation: defaultNavigationData,
  updateNavigation: navUpdate =>
    set(state => {
      const nextWaypoints = navUpdate.route?.waypoints
        ? (navUpdate.route.waypoints as NavigationData['route']['waypoints'])
        : state.navigation.route.waypoints;
      return {
        navigation: {
          ...state.navigation,
          ...navUpdate,
          route: navUpdate.route
            ? {
                ...state.navigation.route,
                ...navUpdate.route,
                waypoints: nextWaypoints,
              }
            : state.navigation.route,
          charts: navUpdate.charts
            ? {
                ...state.navigation.charts,
                ...navUpdate.charts,
              }
            : state.navigation.charts,
        },
      };
    }),
  addWaypoint: (x, y, name) =>
    set(state => ({
      navigation: {
        ...state.navigation,
        route: {
          ...state.navigation.route,
          waypoints: [...state.navigation.route.waypoints, { x, y, name }],
          currentWaypoint:
            state.navigation.route.currentWaypoint === -1
              ? 0
              : state.navigation.route.currentWaypoint,
        },
      },
    })),
  removeWaypoint: index =>
    set(state => {
      const newWaypoints = [...state.navigation.route.waypoints];
      newWaypoints.splice(index, 1);

      let newCurrentWaypoint = state.navigation.route.currentWaypoint;
      if (newWaypoints.length === 0) {
        newCurrentWaypoint = -1;
      } else if (index <= state.navigation.route.currentWaypoint) {
        newCurrentWaypoint = Math.max(
          0,
          state.navigation.route.currentWaypoint - 1,
        );
      }

      return {
        navigation: {
          ...state.navigation,
          route: {
            waypoints: newWaypoints,
            currentWaypoint: newCurrentWaypoint,
          },
        },
      };
    }),
});
