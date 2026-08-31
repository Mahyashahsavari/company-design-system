import type { WorkflowStep } from '../../data';

export interface ResponseWorkflowProps {
  /** Protocol / playbook label shown in the header (e.g. NIC800). */
  protocol?: string;
  /** Ordered workflow steps from the parent. */
  steps: WorkflowStep[];
  /** Timeline height in px. Target 150–180 including header. */
  height?: number;
  /** Optional title override. */
  title?: string;
}
