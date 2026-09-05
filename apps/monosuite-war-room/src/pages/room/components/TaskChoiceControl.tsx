import { Checkbox, Radio, Stack, Textarea } from '@mantine/core';
import { OTHER_OPTION_VALUE, type TaskSelectionMode } from '../taskQuorum';

interface TaskChoiceControlProps {
  options: string[];
  selectionMode?: TaskSelectionMode;
  allowOther?: boolean;
  values: string[];
  otherText: string;
  onValuesChange: (values: string[]) => void;
  onOtherTextChange: (text: string) => void;
  label?: string;
  disabled?: boolean;
}

/** Single/multi choice with optional Other + textarea. */
export function TaskChoiceControl({
  options,
  selectionMode = 'single',
  allowOther = false,
  values,
  otherText,
  onValuesChange,
  onOtherTextChange,
  label,
  disabled = false,
}: TaskChoiceControlProps) {
  const choices = allowOther && !options.includes(OTHER_OPTION_VALUE)
    ? [...options, OTHER_OPTION_VALUE]
    : options;
  const otherSelected = values.includes(OTHER_OPTION_VALUE);

  if (selectionMode === 'multi') {
    return (
      <Stack gap="sm">
        <Checkbox.Group
          label={label}
          value={values}
          onChange={onValuesChange}
          required
        >
          <Stack gap={6} mt={6}>
            {choices.map((option) => (
              <Checkbox key={option} value={option} label={option} disabled={disabled} />
            ))}
          </Stack>
        </Checkbox.Group>
        {otherSelected ? (
          <Textarea
            label="Other response"
            placeholder="Describe your answer"
            minRows={2}
            autosize
            required
            value={otherText}
            disabled={disabled}
            onChange={(event) => onOtherTextChange(event.currentTarget.value)}
          />
        ) : null}
      </Stack>
    );
  }

  return (
    <Stack gap="sm">
      <Radio.Group
        label={label}
        value={values[0] ?? ''}
        onChange={(value) => onValuesChange(value ? [value] : [])}
        required
      >
        <Stack gap={6} mt={6}>
          {choices.map((option) => (
            <Radio key={option} value={option} label={option} disabled={disabled} />
          ))}
        </Stack>
      </Radio.Group>
      {otherSelected ? (
        <Textarea
          label="Other response"
          placeholder="Describe your answer"
          minRows={2}
          autosize
          required
          value={otherText}
          disabled={disabled}
          onChange={(event) => onOtherTextChange(event.currentTarget.value)}
        />
      ) : null}
    </Stack>
  );
}

export function isChoiceAnswerValid(
  values: string[],
  otherText: string,
  selectionMode: TaskSelectionMode = 'single',
): boolean {
  if (values.length === 0) return false;
  if (selectionMode === 'single' && values.length !== 1) return false;
  if (values.includes(OTHER_OPTION_VALUE) && !otherText.trim()) return false;
  return true;
}
