import type { WorkflowStatus, WorkflowStep } from '../../data';

export interface ResponseWorkflowProps {
  /** Protocol / playbook label shown in the header (e.g. NIC800). */
  protocol?: string;
  /** Ordered workflow steps from the parent — fully drives nodes and edges. */
  steps: WorkflowStep[];
  /** Canvas height in px. */
  height?: number;
  /** Optional title override. */
  title?: string;
}

export type WorkflowNodeData = {
  label: string;
  status: WorkflowStatus;
  owner: string;
  time: string;
  icon: WorkflowStep['icon'];
  stepNumber: number;
};
