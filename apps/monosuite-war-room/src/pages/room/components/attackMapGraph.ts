import { CONNECTED_SOURCES, SOURCE_RECORD_CATALOG } from '../data';
import type { ThreatEntity, ContextEntityField, INCIDENT } from '../data';
import type { ScenarioIncident } from '../scenarios';

export type AttackMapNodeKind = 'incident' | 'group' | 'entity' | 'attr';
export type AttackMapRole = 'attacker' | 'victim' | null;
export type AttackMapSourceKind = 'manual' | 'adapter';

export interface AttackMapField {
  label: string;
  value: string;
}

export interface AttackMapNodeModel {
  id: string;
  kind: AttackMapNodeKind;
  role: AttackMapRole;
  label: string;
  value?: string;
  source: AttackMapSourceKind;
  adapter?: string | null;
  /** Display fields for hover / popover */
  fields: AttackMapField[];
  parentId: string | null;
  childIds: string[];
  /** Branch open — children visible when true */
  open: boolean;
  /** Entity that received adapter attrs (for fetch targeting) */
  entityKey?: string;
  sourceId?: string;
}

export interface AttackMapEdgeModel {
  id: string;
  source: string;
  target: string;
  adapter: boolean;
}

export interface AttackMapGraph {
  nodes: AttackMapNodeModel[];
  edges: AttackMapEdgeModel[];
}

type IncidentLike = ScenarioIncident | typeof INCIDENT;

function fieldList(entries: Array<[string, string]>): AttackMapField[] {
  return entries
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([label, value]) => ({ label, value }));
}

function entityAttrFields(entity: ThreatEntity): ContextEntityField[] {
  return entity.fields.filter((field) => field.value.trim().length > 0);
}

function adapterNameForSourceId(sourceId: string | undefined): string | null {
  if (!sourceId) return null;
  return CONNECTED_SOURCES.find((source) => source.id === sourceId)?.adapter ?? null;
}

function sourceKindForEntity(entity: ThreatEntity): AttackMapSourceKind {
  return entity.sourceId ? 'adapter' : 'manual';
}

/** Build the attack-map tree from room incident + entity lists. */
export function buildAttackMapGraph(
  incident: IncidentLike,
  attackers: ThreatEntity[],
  victims: ThreatEntity[],
): AttackMapGraph {
  const nodes: AttackMapNodeModel[] = [];
  const edges: AttackMapEdgeModel[] = [];
  const byId = new Map<string, AttackMapNodeModel>();

  const add = (partial: Omit<AttackMapNodeModel, 'childIds'> & { childIds?: string[] }) => {
    const node: AttackMapNodeModel = { ...partial, childIds: partial.childIds ?? [] };
    nodes.push(node);
    byId.set(node.id, node);
    if (node.parentId) {
      const parent = byId.get(node.parentId);
      if (parent) {
        parent.childIds.push(node.id);
        edges.push({
          id: `e-${node.parentId}-${node.id}`,
          source: node.parentId,
          target: node.id,
          adapter: node.source === 'adapter',
        });
      }
    }
    return node;
  };

  const incidentNode = add({
    id: 'incident',
    kind: 'incident',
    role: null,
    label: incident.id,
    source: incident.fromAdapter ? 'adapter' : 'manual',
    adapter: incident.fromAdapter ? incident.source : null,
    parentId: null,
    open: true,
    fields: fieldList([
      ['Title', incident.title],
      ['Severity', incident.severity],
      ['Status', incident.status],
      ['Scenario', incident.scenario],
      ['Commander', incident.owner],
      ['Threat actor', incident.threatActor],
      ['MITRE', `${incident.mitreId} · ${incident.mitreTechnique}`],
      ['Tactic', incident.mitreTactic],
      ['Occurred', incident.occurred],
      ['Detected', incident.detected],
      ['Source', incident.source],
    ]),
  });

  const incidentAttrs: Array<[string, string, AttackMapSourceKind, string | null]> = [
    ['Classification', incident.scenario, 'manual', null],
    ['Severity', incident.severity, 'manual', null],
    ['Status', incident.status, 'manual', null],
    ['MITRE technique', `${incident.mitreId} ${incident.mitreTechnique}`, 'manual', null],
    ['Detected at', incident.detected, incident.fromAdapter ? 'adapter' : 'manual', incident.fromAdapter ? incident.source : null],
    ['Source', incident.source, incident.fromAdapter ? 'adapter' : 'manual', incident.fromAdapter ? incident.source : null],
    ['Commander', incident.owner, 'manual', null],
    ['Threat actor', incident.threatActor, 'manual', null],
  ];

  incidentAttrs.forEach(([label, value, source, adapter], index) => {
    if (!value.trim()) return;
    add({
      id: `inc-attr-${index}`,
      kind: 'attr',
      role: null,
      label,
      value,
      source,
      adapter,
      parentId: incidentNode.id,
      open: true,
      fields: fieldList([
        [label, value],
        ['Recorded by', adapter ? `${adapter} adapter` : 'Responder'],
        ['Source', source === 'adapter' ? 'Adapter' : 'Manual'],
      ]),
    });
  });

  const attackersGroup = add({
    id: 'group-attackers',
    kind: 'group',
    role: 'attacker',
    label: 'Attackers',
    source: 'manual',
    parentId: incidentNode.id,
    open: true,
    fields: fieldList([
      ['Entities', String(attackers.length)],
      ['Note', 'Actors and attacker-controlled assets linked to this room.'],
    ]),
  });

  const victimsGroup = add({
    id: 'group-victims',
    kind: 'group',
    role: 'victim',
    label: 'Victims',
    source: 'manual',
    parentId: incidentNode.id,
    open: true,
    fields: fieldList([
      ['Entities', String(victims.length)],
      ['Note', 'Impacted identities and assets from room context.'],
    ]),
  });

  const addEntity = (entity: ThreatEntity, role: 'attacker' | 'victim', groupId: string) => {
    const adapter = adapterNameForSourceId(entity.sourceId);
    const source = sourceKindForEntity(entity);
    const entityNode = add({
      id: `entity-${entity.id}`,
      kind: 'entity',
      role,
      label: entity.identifier,
      source,
      adapter,
      parentId: groupId,
      open: false,
      entityKey: entity.id,
      sourceId: entity.sourceId,
      fields: fieldList([
        ['Identifier', entity.identifier],
        ['Type', entity.identifierType.toUpperCase()],
        ...(entity.secondaryIdentifier
          ? ([['Secondary', entity.secondaryIdentifier]] as Array<[string, string]>)
          : []),
        ['Source', adapter ?? 'Room context'],
        ...entityAttrFields(entity).map((field) => [field.label, field.value] as [string, string]),
      ]),
    });

    entityAttrFields(entity).forEach((field, index) => {
      add({
        id: `attr-${entity.id}-${index}`,
        kind: 'attr',
        role,
        label: field.label,
        value: field.value,
        source,
        adapter,
        parentId: entityNode.id,
        open: true,
        fields: fieldList([
          [field.label, field.value],
          ['Belongs to', entity.identifier],
          ['Recorded by', adapter ? `${adapter} adapter` : 'Responder'],
        ]),
      });
    });
  };

  attackers.forEach((entity) => addEntity(entity, 'attacker', attackersGroup.id));
  victims.forEach((entity) => addEntity(entity, 'victim', victimsGroup.id));

  return { nodes, edges };
}

/** Visible node ids given open flags (parent chain must be open). */
export function visibleAttackMapNodeIds(nodes: AttackMapNodeModel[]): Set<string> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visible = new Set<string>();

  const walk = (id: string) => {
    const node = byId.get(id);
    if (!node) return;
    visible.add(id);
    if (!node.open) return;
    node.childIds.forEach(walk);
  };

  const roots = nodes.filter((node) => !node.parentId);
  roots.forEach((root) => walk(root.id));
  return visible;
}

export function expandAllAttackMap(nodes: AttackMapNodeModel[]): AttackMapNodeModel[] {
  return nodes.map((node) => ({ ...node, open: true }));
}

export function collapseAttackMapToCore(nodes: AttackMapNodeModel[]): AttackMapNodeModel[] {
  return nodes.map((node) => {
    if (node.kind === 'incident' || node.kind === 'group') {
      return { ...node, open: true };
    }
    if (node.kind === 'entity') {
      return { ...node, open: false };
    }
    return node;
  });
}

export function toggleAttackMapBranch(
  nodes: AttackMapNodeModel[],
  nodeId: string,
): AttackMapNodeModel[] {
  return nodes.map((node) => (node.id === nodeId ? { ...node, open: !node.open } : node));
}

export function nodeMatchesQuery(node: AttackMapNodeModel, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (node.label.toLowerCase().includes(q)) return true;
  if (node.value?.toLowerCase().includes(q)) return true;
  return node.fields.some(
    (field) => field.label.toLowerCase().includes(q) || field.value.toLowerCase().includes(q),
  );
}

/**
 * Pull the next realistic adapter batch from CONNECTED_SOURCES catalog and
 * attach new attr nodes under a matching room entity.
 */
export function applyAdapterFetchRound(
  nodes: AttackMapNodeModel[],
  edges: AttackMapEdgeModel[],
  round: number,
): { nodes: AttackMapNodeModel[]; edges: AttackMapEdgeModel[]; attachedTo: string | null } {
  const catalog = SOURCE_RECORD_CATALOG;
  if (catalog.length === 0) {
    return { nodes, edges, attachedTo: null };
  }

  const record = catalog[round % catalog.length];
  const entities = nodes.filter((node) => node.kind === 'entity');
  let host =
    entities.find((node) => node.sourceId === record.adapterId) ??
    entities.find((node) =>
      record.fields.some((field) => field.value.includes(node.label) || node.label.includes(field.value)),
    );

  if (!host) {
    const source = CONNECTED_SOURCES.find((item) => item.id === record.adapterId);
    if (source?.role.toLowerCase().includes('attacker')) {
      host = entities.find((node) => node.role === 'attacker') ?? entities[0];
    } else if (source?.role.toLowerCase().includes('victim')) {
      host = entities.find((node) => node.role === 'victim') ?? entities[0];
    } else {
      host = entities[0];
    }
  }

  if (!host) {
    return { nodes, edges, attachedTo: null };
  }

  const nextNodes = nodes.map((node) =>
    node.id === host!.id ? { ...node, open: true } : { ...node },
  );
  const hostIndex = nextNodes.findIndex((node) => node.id === host!.id);
  const hostNode = nextNodes[hostIndex];
  if (!hostNode) {
    return { nodes, edges, attachedTo: null };
  }

  const existingLabels = new Set(
    hostNode.childIds
      .map((id) => nextNodes.find((node) => node.id === id)?.label)
      .filter(Boolean) as string[],
  );

  const nextEdges = [...edges];
  let added = 0;

  record.fields.forEach((field) => {
    if (existingLabels.has(field.label)) return;
    const id = `fetch-${record.recordId}-${field.label.replace(/\s+/g, '-').toLowerCase()}-${round}`;
    if (nextNodes.some((node) => node.id === id)) return;

    const attr: AttackMapNodeModel = {
      id,
      kind: 'attr',
      role: hostNode.role,
      label: field.label,
      value: field.value,
      source: 'adapter',
      adapter: record.adapter,
      parentId: hostNode.id,
      childIds: [],
      open: true,
      fields: [
        { label: field.label, value: field.value },
        { label: 'Belongs to', value: hostNode.label },
        { label: 'Recorded by', value: `${record.adapter} adapter` },
        { label: 'Record', value: `${record.recordTypeLabel} · ${record.recordId}` },
        { label: 'Title', value: record.title },
      ],
    };

    nextNodes.push(attr);
    hostNode.childIds = [...hostNode.childIds, id];
    nextEdges.push({
      id: `e-${hostNode.id}-${id}`,
      source: hostNode.id,
      target: id,
      adapter: true,
    });
    existingLabels.add(field.label);
    added += 1;
  });

  if (added === 0) {
    // Still open host so the user sees the fetch targeted something.
    return { nodes: nextNodes, edges: nextEdges, attachedTo: hostNode.label };
  }

  nextNodes[hostIndex] = { ...hostNode };
  return { nodes: nextNodes, edges: nextEdges, attachedTo: hostNode.label };
}

export function attackMapNodeRadius(kind: AttackMapNodeKind): number {
  if (kind === 'incident') return 22;
  if (kind === 'group') return 14;
  if (kind === 'entity') return 10;
  return 5;
}

export function attackMapTone(
  node: Pick<AttackMapNodeModel, 'kind' | 'role'>,
): 'accent' | 'danger' | 'teal' | 'warning' | 'neutral' {
  if (node.kind === 'incident') return 'warning';
  if (node.role === 'attacker') return 'danger';
  if (node.role === 'victim') return 'teal';
  return 'warning';
}
