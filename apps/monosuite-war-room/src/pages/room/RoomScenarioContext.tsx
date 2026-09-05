import { createContext, useContext } from 'react';
import type { RoomScenarioPack, ScenarioIncident } from './scenarios';
import { INCIDENT } from './data';

const RoomScenarioContext = createContext<RoomScenarioPack | null>(null);

export const RoomScenarioProvider = RoomScenarioContext.Provider;

export function useRoomScenario(): RoomScenarioPack | null {
  return useContext(RoomScenarioContext);
}

/** Incident for the active room — falls back to legacy INCIDENT constant. */
export function useRoomIncident(): ScenarioIncident | typeof INCIDENT {
  const pack = useContext(RoomScenarioContext);
  return pack?.incident ?? INCIDENT;
}
