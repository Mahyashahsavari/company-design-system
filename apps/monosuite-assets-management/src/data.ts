export type AssetStatus = 'active' | 'in_repair' | 'retired' | 'missing';

export interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  owner: string;
  status: AssetStatus;
  updatedAt: string;
}

export const ASSETS: Asset[] = [
  {
    id: 'AST-1042',
    name: 'Edge Router — Floor 3',
    type: 'Network',
    location: 'HQ / Floor 3',
    owner: 'NetOps',
    status: 'active',
    updatedAt: '2026-08-24T09:12:00Z',
  },
  {
    id: 'AST-1188',
    name: 'MacBook Pro 16"',
    type: 'Laptop',
    location: 'Remote — Berlin',
    owner: 'Design',
    status: 'active',
    updatedAt: '2026-08-22T14:40:00Z',
  },
  {
    id: 'AST-0911',
    name: 'Backup NAS',
    type: 'Storage',
    location: 'DC-A / Rack 12',
    owner: 'Infra',
    status: 'in_repair',
    updatedAt: '2026-08-20T11:05:00Z',
  },
  {
    id: 'AST-0550',
    name: 'Access Point Lobby',
    type: 'Network',
    location: 'HQ / Lobby',
    owner: 'NetOps',
    status: 'missing',
    updatedAt: '2026-08-18T08:22:00Z',
  },
  {
    id: 'AST-0320',
    name: 'Meeting Room Display',
    type: 'AV',
    location: 'HQ / Room Orion',
    owner: 'Facilities',
    status: 'retired',
    updatedAt: '2026-07-02T16:00:00Z',
  },
  {
    id: 'AST-1401',
    name: 'CI Runner Host',
    type: 'Server',
    location: 'DC-B / Rack 4',
    owner: 'Platform',
    status: 'active',
    updatedAt: '2026-08-25T07:55:00Z',
  },
];

export const STATUS_LABEL: Record<AssetStatus, string> = {
  active: 'Active',
  in_repair: 'In repair',
  retired: 'Retired',
  missing: 'Missing',
};

export const STATUS_COLOR: Record<AssetStatus, string> = {
  active: 'success',
  in_repair: 'warning',
  retired: 'neutral',
  missing: 'danger',
};
