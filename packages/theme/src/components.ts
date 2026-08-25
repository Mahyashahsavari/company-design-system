import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Checkbox,
  Loader,
  Modal,
  Pagination,
  Paper,
  Select,
  Switch,
  Table,
  TextInput,
  Tooltip,
} from '@mantine/core';

/**
 * Repository-wide component defaults.
 *
 * This is where "how Monosuite looks" is decided once. A default belongs here
 * rather than in a @monosuite/ui wrapper whenever it is purely a visual choice
 * with no API implications - that keeps the wrappers thin and means Mantine
 * components re-exported as-is still look like Monosuite components.
 */
export const components = {
  Button: Button.extend({
    defaultProps: { fw: 500 },
  }),

  ActionIcon: ActionIcon.extend({
    defaultProps: { variant: 'subtle', color: 'neutral' },
  }),

  Card: Card.extend({
    defaultProps: { withBorder: true, shadow: 'none', padding: 'lg', radius: 'md' },
  }),

  Paper: Paper.extend({
    defaultProps: { withBorder: true, shadow: 'none', radius: 'md' },
  }),

  TextInput: TextInput.extend({
    defaultProps: { size: 'sm' },
  }),

  Select: Select.extend({
    defaultProps: { size: 'sm', checkIconPosition: 'right' },
  }),

  Checkbox: Checkbox.extend({
    defaultProps: { radius: 'sm' },
  }),

  Switch: Switch.extend({
    defaultProps: { size: 'md' },
  }),

  Badge: Badge.extend({
    defaultProps: { variant: 'light', radius: 'sm', tt: 'none', fw: 500 },
  }),

  Alert: Alert.extend({
    defaultProps: { variant: 'light', radius: 'md' },
  }),

  Loader: Loader.extend({
    defaultProps: { type: 'oval' },
  }),

  Modal: Modal.extend({
    defaultProps: {
      centered: true,
      radius: 'lg',
      overlayProps: { backgroundOpacity: 0.55, blur: 3 },
    },
  }),

  Table: Table.extend({
    defaultProps: {
      verticalSpacing: 'sm',
      horizontalSpacing: 'md',
      highlightOnHover: true,
    },
  }),

  Pagination: Pagination.extend({
    defaultProps: { size: 'sm', radius: 'md' },
  }),

  Tooltip: Tooltip.extend({
    defaultProps: { withArrow: true, openDelay: 250 },
  }),

  Anchor: Anchor.extend({
    defaultProps: { underline: 'hover' },
  }),
};
