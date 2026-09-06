import type {
  CommanderQuestion,
  HistoryEntry,
  Question,
  WorkflowStep,
} from './data';
import { formatTaskAnswerDisplay } from './taskQuorum';
import type { WorkflowWorkItem } from './components/response-workflow/workflowCanvasData';
import type { WorkAnswersState } from './workAnswers';
import { workItemsForPhase } from './components/response-workflow/workflowCanvasData';

export interface RoomMinutesInput {
  roomTitle: string;
  incidentId?: string;
  incidentSeverity?: string;
  incidentDescription?: string;
  workflowName?: string;
  steps: WorkflowStep[];
  workCatalog: WorkflowWorkItem[];
  workAnswers: WorkAnswersState;
  questions?: Question[];
  commanderQuestions?: CommanderQuestion[];
  triageNotes?: string;
  history?: HistoryEntry[];
  skippedPhases?: string[];
  completedPhaseIds?: string[];
}

/** Build a meeting-minutes style markdown export for the room. */
export function buildRoomMinutesMarkdown(input: RoomMinutesInput): string {
  const lines: string[] = [
    `# Room minutes — ${input.roomTitle}`,
    '',
    `Generated: ${new Date().toLocaleString()}`,
    input.incidentId ? `Incident: ${input.incidentId}` : null,
    input.incidentSeverity ? `Severity: ${input.incidentSeverity}` : null,
    input.workflowName ? `Workflow: ${input.workflowName}` : null,
    '',
  ].filter((line): line is string => line !== null);

  if (input.incidentDescription?.trim()) {
    lines.push('## Incident summary', '', input.incidentDescription.trim(), '');
  }

  if (input.triageNotes?.trim()) {
    lines.push('## Triage notes', '', input.triageNotes.trim(), '');
  }

  lines.push('## Phase outcomes', '');

  for (const step of input.steps) {
    const skipped = input.skippedPhases?.includes(step.id);
    const completed = input.completedPhaseIds?.includes(step.id) || step.status === 'completed';
    const statusLabel = skipped ? 'Skipped' : completed ? 'Completed' : step.status;
    lines.push(`### ${step.label} (${statusLabel})`, '');

    const phaseWork = workItemsForPhase(step.id, input.workCatalog);
    if (phaseWork.length === 0 && !skipped) {
      lines.push('_No required work items (intake already known)._', '');
    }

    for (const item of phaseWork) {
      const answers = input.workAnswers[item.id] ?? [];
      lines.push(`- **${item.roleLabel} · ${item.title}**`);
      lines.push(`  - Q: ${item.question}`);
      if (answers.length === 0) {
        lines.push('  - A: _(not answered)_');
      } else {
        for (const answer of answers) {
          lines.push(
            `  - A (${answer.participantName}, ${answer.answeredAt}): ${formatTaskAnswerDisplay(answer)}`,
          );
        }
      }
    }

    const phaseCommander = (input.commanderQuestions ?? []).filter((q) => q.phaseId === step.id);
    for (const question of phaseCommander) {
      lines.push(`- **Commander · ${question.title}**`);
      if (question.roleAnswers?.length) {
        for (const answer of question.roleAnswers) {
          lines.push(
            `  - A (${answer.participantName}): ${formatTaskAnswerDisplay(answer)}`,
          );
        }
      } else if (question.answer?.trim()) {
        lines.push(`  - A: ${question.answer.trim()}`);
      } else {
        lines.push('  - A: _(not answered)_');
      }
    }

    lines.push('');
  }

  const collab = (input.questions ?? []).filter(
    (q) => (q.answers?.length ?? 0) > 0 || q.decision != null || (q.roleAnswers?.length ?? 0) > 0,
  );
  if (collab.length) {
    lines.push('## Collaboration highlights', '');
    for (const question of collab) {
      lines.push(`- **${question.text}**`);
      if (question.decision) {
        lines.push(`  - Decision: ${question.decision}`);
      }
      if (question.roleAnswers?.length) {
        for (const answer of question.roleAnswers) {
          lines.push(`  - ${answer.participantName}: ${formatTaskAnswerDisplay(answer)}`);
        }
      } else if (question.answers?.length) {
        const latest = question.answers[question.answers.length - 1];
        lines.push(`  - ${latest.author}: ${latest.text}`);
      }
    }
    lines.push('');
  }

  if (input.history?.length) {
    lines.push('## Room history', '');
    for (const entry of input.history.slice(0, 40)) {
      lines.push(`- ${entry.time} · ${entry.actor} · ${entry.action}`);
    }
    lines.push('');
  }

  lines.push('---', '_Exported from MonoSuite War Room (prototype)._', '');
  return lines.join('\n');
}

export function downloadRoomMinutes(filename: string, markdown: string) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
