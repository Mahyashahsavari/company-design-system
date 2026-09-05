import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconCheck,
  IconPencil,
  IconRoute2,
} from '@tabler/icons-react';
import type {
  CommanderQuestion,
  EvidenceItem,
  Question,
  RoomSeverity,
  TaskPersonAnswer,
  WorkflowStep,
} from '../../data';
import {
  formatTaskAnswerDisplay,
  TASK_ROLE_COLOR,
  TASK_ROLE_LABEL,
} from '../../taskQuorum';
import type { WorkAnswersState } from '../../workAnswers';
import {
  threadsForPhase,
  workItemsForPhase,
  type CollabThreadDef,
  type WorkflowWorkItem,
} from './workflowCanvasData';
import { SeverityIcon, severityColor } from '../../severity';

interface ResponseJourneyViewProps {
  steps: WorkflowStep[];
  answers: WorkAnswersState;
  questions: Question[];
  workCatalog: WorkflowWorkItem[];
  threadCatalog: CollabThreadDef[];
  commanderQuestions: CommanderQuestion[];
  triageNotes: string;
  incidentTitle: string;
  incidentDescription?: string;
  incidentSeverity: RoomSeverity;
  evidence: EvidenceItem[];
  onEdit: () => void;
}

function collabKind(question: Question): 'question' | 'finding' | 'decision' {
  if (question.status === 'decision' || question.decision) return 'decision';
  if (question.status === 'answered') return 'finding';
  return 'question';
}

function collabCode(question: Question): string {
  const kind = collabKind(question);
  if (kind === 'decision') return `D-${question.id}`;
  if (kind === 'finding') return `F-${question.id}`;
  return `Q-${question.id}`;
}

function collabAccent(kind: 'question' | 'finding' | 'decision'): 'teal' | 'accent' | 'brand' {
  if (kind === 'decision') return 'brand';
  if (kind === 'finding') return 'accent';
  return 'teal';
}

function uniqueNames(names: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  names.forEach((name) => {
    const trimmed = name?.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    result.push(trimmed);
  });
  return result;
}

function namesFromRoleAnswers(answers: TaskPersonAnswer[] | undefined): string[] {
  return uniqueNames((answers ?? []).map((answer) => answer.participantName));
}

function workAnswerLines(answers: TaskPersonAnswer[] | undefined): string[] {
  return (answers ?? []).map((answer) => formatTaskAnswerDisplay(answer));
}

function collabRespondents(question: Question): string[] {
  if (question.decision?.by) return uniqueNames([question.decision.by]);
  if ((question.roleAnswers?.length ?? 0) > 0) return namesFromRoleAnswers(question.roleAnswers);
  return uniqueNames((question.answers ?? []).map((answer) => answer.author));
}

function collabAnswerLines(question: Question): string[] {
  if (question.decision) return [question.decision.choice];
  if ((question.roleAnswers?.length ?? 0) > 0) return workAnswerLines(question.roleAnswers);
  return (question.answers ?? []).map((answer) => answer.text.trim()).filter(Boolean);
}

/** Read-only response trail after every NIST phase is complete. */
export function ResponseJourneyView({
  steps,
  answers,
  questions,
  workCatalog,
  threadCatalog,
  commanderQuestions,
  triageNotes,
  incidentTitle,
  incidentDescription = '',
  incidentSeverity,
  evidence,
  onEdit,
}: ResponseJourneyViewProps) {
  const questionsById = new Map(questions.map((question) => [question.id, question]));

  return (
    <Box
      className="monosuite-response-journey"
      role="region"
      aria-label="Completed response flow"
    >
      <Group
        className="monosuite-response-journey-header"
        justify="space-between"
        align="flex-start"
        wrap="wrap"
        gap="sm"
      >
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
          <ThemeIcon size={36} radius="md" variant="light" color="teal">
            <IconRoute2 size={20} aria-hidden />
          </ThemeIcon>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Group gap={8} wrap="wrap">
              <Text fw={800} size="sm">
                Response flow
              </Text>
              <Badge size="sm" variant="light" color="success" leftSection={<IconCheck size={12} />}>
                Resolved
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" lineClamp={2}>
              Answers recorded while containing{' '}
              <Text span fw={600} c="var(--mantine-color-text)">
                {incidentTitle}
              </Text>
              . Edit reopens the canvas.
            </Text>
          </Stack>
        </Group>
        <Button
          variant="light"
          color="brand"
          size="xs"
          leftSection={<IconPencil size={14} />}
          onClick={onEdit}
        >
          Edit
        </Button>
      </Group>

      <ScrollArea className="monosuite-response-journey-scroll" type="auto" offsetScrollbars>
        <Stack gap={0} className="monosuite-response-journey-spine" px="md" pt="sm">
          <Paper
            withBorder
            radius="md"
            p="sm"
            mb="md"
            bg="var(--monosuite-color-surface-sunken)"
            className="monosuite-response-journey-incident"
          >
            <Group gap="xs" wrap="wrap" mb={6}>
              <Badge
                size="xs"
                variant="light"
                color={severityColor(incidentSeverity)}
                className="monosuite-badge-with-icon"
                leftSection={<SeverityIcon severity={incidentSeverity} size={11} />}
              >
                {incidentSeverity}
              </Badge>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} lts="0.06em">
                Incident
              </Text>
            </Group>
            <Text size="sm" fw={700} lh={1.35}>
              {incidentTitle}
            </Text>
            {incidentDescription.trim() ? (
              <Text size="xs" c="dimmed" mt={4} lh={1.45}>
                {incidentDescription.trim()}
              </Text>
            ) : null}
          </Paper>

          {steps.map((step, index) => {
            const phaseWork = workItemsForPhase(step.id, workCatalog).filter((item) => {
              if (item.answerType === 'generated') return true;
              return (answers[item.id]?.length ?? 0) > 0;
            });
            const threadQuestions = threadsForPhase(step.id, threadCatalog)
              .flatMap((thread) => thread.itemIds)
              .map((id) => questionsById.get(id))
              .filter((question): question is Question => Boolean(question))
              .filter(
                (question) =>
                  Boolean(question.decision) ||
                  question.status === 'answered' ||
                  (question.answers?.length ?? 0) > 0 ||
                  (question.roleAnswers?.length ?? 0) > 0,
              );
            const phaseCommander = commanderQuestions.filter(
              (question) =>
                question.phaseId === step.id &&
                ((question.roleAnswers?.length ?? 0) > 0 || Boolean(question.answer)),
            );
            const phaseEvidence = evidence.filter((item) => item.phaseId === step.id);
            const showTriageNotes = step.id === 'triage' && triageNotes.trim().length > 0;
            const hasEntries =
              phaseWork.length > 0 ||
              threadQuestions.length > 0 ||
              phaseCommander.length > 0 ||
              phaseEvidence.length > 0 ||
              showTriageNotes ||
              step.id === 'detected';

            return (
              <Box key={step.id} className="monosuite-response-journey-phase">
                <Box className="monosuite-response-journey-rail" aria-hidden>
                  <Box className="monosuite-response-journey-dot">
                    <IconCheck size={12} stroke={2.5} />
                  </Box>
                  {index < steps.length - 1 ? (
                    <Box className="monosuite-response-journey-line" />
                  ) : null}
                </Box>

                <Stack gap="xs" className="monosuite-response-journey-phase-body" pb="lg">
                  <Group gap={8} wrap="wrap">
                    <Badge size="xs" variant="outline" color="neutral" radius="sm">
                      {String(index + 1).padStart(2, '0')}
                    </Badge>
                    <Text size="sm" fw={800}>
                      {step.label}
                    </Text>
                    <Badge size="xs" variant="light" color="success">
                      Done
                    </Badge>
                  </Group>

                  {!hasEntries ? (
                    <Text size="xs" c="dimmed">
                      Phase completed with no recorded work items.
                    </Text>
                  ) : null}

                  {step.id === 'detected' ? (
                    <JourneyEntry
                      roleLabel="Intake"
                      color="accent"
                      answer="Incident acknowledged"
                      question="Detection intake confirmed and response room opened."
                    />
                  ) : null}

                  {showTriageNotes ? (
                    <JourneyEntry
                      roleLabel="Triage"
                      color="warning"
                      answer={triageNotes.trim()}
                      question="Triage notes captured during severity review."
                    />
                  ) : null}

                  {phaseWork.map((item) => {
                    const personAnswers = answers[item.id] ?? [];
                    const respondents = namesFromRoleAnswers(personAnswers);
                    const answerText =
                      item.answerType === 'generated'
                        ? 'Containment action generated from Investigation answers'
                        : workAnswerLines(personAnswers).join(' · ') || 'Recorded';
                    return (
                      <JourneyEntry
                        key={item.id}
                        roleLabel={item.roleLabel}
                        respondents={respondents}
                        color={TASK_ROLE_COLOR[item.role] ?? 'neutral'}
                        answer={answerText}
                        question={item.question || item.title}
                      />
                    );
                  })}

                  {threadQuestions.map((question) => {
                    const kind = collabKind(question);
                    const roleLabel =
                      question.roleLabel ??
                      (question.assigneeRole
                        ? TASK_ROLE_LABEL[question.assigneeRole]
                        : collabCode(question));
                    return (
                      <JourneyEntry
                        key={`collab-${question.id}`}
                        roleLabel={roleLabel}
                        respondents={collabRespondents(question)}
                        color={collabAccent(kind)}
                        answer={collabAnswerLines(question).join(' · ') || 'Recorded'}
                        question={question.text}
                      />
                    );
                  })}

                  {phaseCommander.map((question) => {
                    const personAnswers = question.roleAnswers ?? [];
                    const answerText =
                      question.answerType === 'select'
                        ? workAnswerLines(personAnswers).join(' · ')
                        : question.answer?.trim() ||
                          workAnswerLines(personAnswers).join(' · ') ||
                          'Recorded';
                    const respondents =
                      namesFromRoleAnswers(personAnswers).length > 0
                        ? namesFromRoleAnswers(personAnswers)
                        : uniqueNames([question.createdBy]);
                    return (
                      <JourneyEntry
                        key={question.id}
                        roleLabel="Commander"
                        respondents={respondents}
                        color="brand"
                        answer={answerText}
                        question={question.title}
                      />
                    );
                  })}

                  {phaseEvidence.map((item) => (
                    <JourneyEntry
                      key={item.id}
                      roleLabel="Evidence"
                      respondents={uniqueNames([item.by])}
                      color="neutral"
                      answer={item.name}
                      question={`${item.kind}${item.time ? ` · ${item.time}` : ''}`}
                    />
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </ScrollArea>
    </Box>
  );
}

function JourneyEntry({
  roleLabel,
  respondents = [],
  color,
  answer,
  question,
}: {
  roleLabel: string;
  respondents?: string[];
  color: string;
  answer: string;
  question?: string;
}) {
  const who =
    respondents.length === 0
      ? roleLabel
      : respondents.length === 1
        ? `${roleLabel} · ${respondents[0]}`
        : `${roleLabel} · ${respondents.join(', ')}`;

  return (
    <Box className="monosuite-response-journey-entry">
      <Group gap={6} wrap="wrap" mb={6}>
        <Badge size="xs" variant="light" color={color}>
          {who}
        </Badge>
      </Group>
      <Text size="sm" fw={700} lh={1.4}>
        {answer}
      </Text>
      {question ? (
        <Text size="xs" c="dimmed" mt={4} lh={1.45}>
          {question}
        </Text>
      ) : null}
    </Box>
  );
}
