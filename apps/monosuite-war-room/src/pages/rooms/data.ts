import type { RoomSeverity } from '../room/data';
import { INCIDENT } from '../room/data';
import { routes } from '../../shared/routes';

export type RoomListStatus = 'live' | 'closed';

export interface RoomListItem {
  id: string;
  incidentId: string;
  title: string;
  severity: RoomSeverity;
  status: RoomListStatus;
  phase: string;
  commander: string;
  participantCount: number;
  updatedLabel: string;
  href?: string;
}

export const ROOM_LIST: RoomListItem[] = [
  {
    id: 'room-20481',
    incidentId: INCIDENT.id,
    title: INCIDENT.title,
    severity: INCIDENT.severity,
    status: 'live',
    phase: 'Investigation',
    commander: INCIDENT.owner,
    participantCount: 5,
    updatedLabel: '2 min ago',
    href: routes.room,
  },
  {
    id: 'room-20312',
    incidentId: 'INC-20312',
    title: 'Ransomware precursor on finance VLAN',
    severity: 'High',
    status: 'live',
    phase: 'Containment',
    commander: 'Alex Smith',
    participantCount: 3,
    updatedLabel: '18 min ago',
  },
  {
    id: 'room-20190',
    incidentId: 'INC-20190',
    title: 'Credential phishing against helpdesk',
    severity: 'Medium',
    status: 'closed',
    phase: 'Recovery',
    commander: 'David Lee',
    participantCount: 4,
    updatedLabel: 'Yesterday',
  },
  {
    id: 'room-19844',
    incidentId: 'INC-19844',
    title: 'Suspected data staging on srv-prod-01',
    severity: 'Low',
    status: 'closed',
    phase: 'Closed',
    commander: 'Mike Chen',
    participantCount: 2,
    updatedLabel: '3 days ago',
  },
];
