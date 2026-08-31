import { Group, Text, type TextProps } from '@mantine/core';

interface MetadataLabelValueRowProps {
  label: string;
  value: string;
  size?: TextProps['size'];
}

/** Label always renders in full; value ellipsizes when space is tight. */
export function MetadataLabelValueRow({
  label,
  value,
  size = 'xs',
}: MetadataLabelValueRowProps) {
  return (
    <Group justify="space-between" gap="xs" wrap="nowrap" align="flex-start" w="100%">
      <Text size={size} c="dimmed" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
        {label}
      </Text>
      <Text size={size} fw={600} ta="right" truncate title={value} style={{ minWidth: 0, flex: 1 }}>
        {value}
      </Text>
    </Group>
  );
}
