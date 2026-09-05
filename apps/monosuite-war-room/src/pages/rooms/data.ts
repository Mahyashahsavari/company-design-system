import { buildScenarioRoomList, type RoomListMeta } from '../room/scenarios';

export type RoomListStatus = 'live' | 'closed';

export type RoomListItem = RoomListMeta & {
  status: RoomListStatus;
};

export const ROOM_LIST: RoomListItem[] = buildScenarioRoomList();
