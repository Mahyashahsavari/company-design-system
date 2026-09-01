import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { randomId } from '@mantine/hooks';
import {
  IconMail,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUserPlus,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { DiscardChangesModal } from '../../../shared/components/DiscardChangesModal';
import { useDiscardGuard } from '../../../shared/hooks/useDiscardGuard';
import {
  DIRECTORY_USERS,
  INVITE_ROLE_OPTIONS,
  ROOM_ROLES,
  isValidInviteEmail,
  type DirectoryUser,
  type ExternalGuestInvite,
  type MemberInvite,
  type Participant,
  type RoomRole,
} from '../data';

interface InviteParticipantsModalProps {
  opened: boolean;
  participants: Participant[];
  onClose: () => void;
  onSend: (members: MemberInvite[], guests: ExternalGuestInvite[]) => void;
}

interface GuestDraft {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

function emptyGuest(): GuestDraft {
  return { id: randomId(), firstName: '', lastName: '', email: '' };
}

function roleDescription(role: RoomRole) {
  return ROOM_ROLES.find((item) => item.value === role)?.description ?? '';
}

export function InviteParticipantsModal({
  opened,
  participants,
  onClose,
  onSend,
}: InviteParticipantsModalProps) {
  const [tab, setTab] = useState<string | null>('members');
  const [query, setQuery] = useState('');
  const [rolesByUser, setRolesByUser] = useState<Record<string, RoomRole>>({});
  const [guests, setGuests] = useState<GuestDraft[]>([emptyGuest()]);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!opened) return;
    setTab('members');
    setQuery('');
    setRolesByUser({});
    setGuests([emptyGuest()]);
    setAttempted(false);
  }, [opened]);

  const inRoomIds = useMemo(
    () => new Set(participants.filter((person) => !person.removed).map((person) => person.id)),
    [participants],
  );
  const inRoomEmails = useMemo(
    () =>
      new Set(
        participants
          .filter((person) => !person.removed)
          .map((person) => person.email?.trim().toLowerCase())
          .filter((email): email is string => Boolean(email)),
      ),
    [participants],
  );

  const selectedIds = useMemo(() => Object.keys(rolesByUser), [rolesByUser]);

  const filteredPeople = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = (user: DirectoryUser) =>
      !needle ||
      user.name.toLowerCase().includes(needle) ||
      user.email.toLowerCase().includes(needle) ||
      user.department.toLowerCase().includes(needle);

    const selected = DIRECTORY_USERS.filter((user) => user.id in rolesByUser && matches(user));
    const rest = DIRECTORY_USERS.filter((user) => !(user.id in rolesByUser) && matches(user));
    return [...selected, ...rest];
  }, [query, rolesByUser]);

  const directoryByEmail = useMemo(() => {
    const map = new Map<string, DirectoryUser>();
    for (const user of DIRECTORY_USERS) {
      map.set(user.email.trim().toLowerCase(), user);
    }
    return map;
  }, []);

  const filledGuests = guests.filter(
    (guest) => guest.firstName.trim() || guest.lastName.trim() || guest.email.trim(),
  );

  const guestErrors = useMemo(() => {
    const seen = new Map<string, string>();
    const errors: Record<string, Partial<Record<'firstName' | 'lastName' | 'email', string>>> = {};

    for (const guest of guests) {
      const firstName = guest.firstName.trim();
      const lastName = guest.lastName.trim();
      const email = guest.email.trim();
      const blank = !firstName && !lastName && !email;
      if (blank) continue;

      if (!firstName) errors[guest.id] = { ...errors[guest.id], firstName: 'Required' };
      if (!lastName) errors[guest.id] = { ...errors[guest.id], lastName: 'Required' };
      if (!email) {
        errors[guest.id] = { ...errors[guest.id], email: 'Required' };
      } else if (!isValidInviteEmail(email)) {
        errors[guest.id] = { ...errors[guest.id], email: 'Enter a valid email' };
      } else {
        const key = email.toLowerCase();
        if (inRoomEmails.has(key)) {
          errors[guest.id] = { ...errors[guest.id], email: 'Already in this room' };
        } else if (directoryByEmail.has(key)) {
          errors[guest.id] = {
            ...errors[guest.id],
            email: 'This person is in the directory. Invite them from Members.',
          };
        } else if (seen.has(key)) {
          errors[guest.id] = { ...errors[guest.id], email: 'Duplicate email in this invite' };
        } else {
          seen.set(key, guest.id);
        }
      }
    }

    return errors;
  }, [directoryByEmail, guests, inRoomEmails]);

  const validGuests: ExternalGuestInvite[] = filledGuests
    .filter((guest) => !guestErrors[guest.id])
    .map((guest) => ({
      firstName: guest.firstName.trim(),
      lastName: guest.lastName.trim(),
      email: guest.email.trim(),
    }));

  const members: MemberInvite[] = selectedIds.map((userId) => ({
    userId,
    role: rolesByUser[userId],
  }));

  const dirty = selectedIds.length > 0 || filledGuests.length > 0;
  const guestsValid = filledGuests.length === 0 || filledGuests.every((guest) => !guestErrors[guest.id]);
  const canSend = (members.length > 0 || validGuests.length > 0) && guestsValid;
  const { requestClose, confirming, discard, keepEditing } = useDiscardGuard(opened, dirty, onClose);

  const toggleMember = (user: DirectoryUser) => {
    if (inRoomIds.has(user.id)) return;
    setRolesByUser((current) => {
      if (user.id in current) {
        const next = { ...current };
        delete next[user.id];
        return next;
      }
      return { ...current, [user.id]: 'Responder' };
    });
  };

  const send = () => {
    setAttempted(true);
    if (!canSend) {
      if (filledGuests.some((guest) => guestErrors[guest.id])) setTab('guest');
      return;
    }
    onSend(members, validGuests);
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={requestClose}
        size="xl"
        centered
        data-testid="invite-participants-modal"
        title={
          <Stack gap={4}>
            <Text fw={700} size="lg">
              Invite participants
            </Text>
            <Text size="sm" c="dimmed" fw={400}>
              Assign a room role, or invite someone as a view-only guest
            </Text>
          </Stack>
        }
      >
        <Stack gap="md">
          <Tabs value={tab} onChange={setTab}>
            <Tabs.List>
              <Tabs.Tab
                value="members"
                leftSection={<IconUsers size={16} />}
                rightSection={
                  selectedIds.length > 0 ? (
                    <Badge size="xs" variant="light" color="teal">
                      {selectedIds.length}
                    </Badge>
                  ) : undefined
                }
              >
                Members
              </Tabs.Tab>
              <Tabs.Tab
                value="guest"
                leftSection={<IconMail size={16} />}
                rightSection={
                  validGuests.length > 0 ? (
                    <Badge size="xs" variant="light" color="teal">
                      {validGuests.length}
                    </Badge>
                  ) : undefined
                }
              >
                External guest
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="members" pt="md">
              <Stack gap="sm">
                <TextInput
                  placeholder="Search name, email, or team"
                  leftSection={<IconSearch size={16} />}
                  value={query}
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  aria-label="Search organization directory"
                />

                {selectedIds.length > 0 ? (
                  <Group gap={6}>
                    {selectedIds.map((id) => {
                      const user = DIRECTORY_USERS.find((item) => item.id === id);
                      if (!user) return null;
                      return (
                        <Badge
                          key={id}
                          variant="light"
                          color="teal"
                          tt="none"
                          rightSection={
                            <ActionIcon
                              size="xs"
                              color="teal"
                              variant="transparent"
                              aria-label={`Remove ${user.name}`}
                              onClick={() => toggleMember(user)}
                            >
                              <IconX size={10} />
                            </ActionIcon>
                          }
                        >
                          {user.name}
                        </Badge>
                      );
                    })}
                  </Group>
                ) : null}

                <ScrollArea.Autosize mah={320} type="auto" offsetScrollbars>
                  <Stack gap={6}>
                    {filteredPeople.length === 0 ? (
                      <Text size="sm" c="dimmed" py="md" ta="center">
                        No people match this search
                      </Text>
                    ) : (
                      filteredPeople.map((user) => (
                        <DirectoryPersonRow
                          key={user.id}
                          user={user}
                          inRoom={inRoomIds.has(user.id)}
                          selected={user.id in rolesByUser}
                          role={rolesByUser[user.id] ?? 'Responder'}
                          onToggle={() => toggleMember(user)}
                          onRoleChange={(role) =>
                            setRolesByUser((current) => ({ ...current, [user.id]: role }))
                          }
                        />
                      ))
                    )}
                  </Stack>
                </ScrollArea.Autosize>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="guest" pt="md">
              <Stack gap="sm">
                <Alert color="teal" variant="light" title="View-only guest access">
                  External guests are not in the organization directory. Collect a name and email so
                  a room password can be sent later. Guest role is view only — they cannot take
                  response actions.
                </Alert>

                {guests.map((guest, index) => (
                  <GuestInviteCard
                    key={guest.id}
                    index={index}
                    guest={guest}
                    canRemove={guests.length > 1}
                    errors={attempted ? guestErrors[guest.id] : undefined}
                    onChange={(patch) =>
                      setGuests((current) =>
                        current.map((item) => (item.id === guest.id ? { ...item, ...patch } : item)),
                      )
                    }
                    onRemove={() =>
                      setGuests((current) => current.filter((item) => item.id !== guest.id))
                    }
                  />
                ))}

                <Button
                  variant="subtle"
                  leftSection={<IconPlus size={16} />}
                  onClick={() => setGuests((current) => [...current, emptyGuest()])}
                >
                  Add another guest
                </Button>
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              {members.length + validGuests.length === 0
                ? 'Select at least one person to invite'
                : `${members.length + validGuests.length} ready to invite`}
            </Text>
            <Group justify="flex-end" gap="xs">
              <Button variant="default" onClick={requestClose}>
                Cancel
              </Button>
              <Button
                leftSection={<IconUserPlus size={16} />}
                disabled={members.length === 0 && filledGuests.length === 0}
                onClick={send}
              >
                Send invites
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
      <DiscardChangesModal opened={confirming} onKeepEditing={keepEditing} onDiscard={discard} />
    </>
  );
}

function DirectoryPersonRow({
  user,
  inRoom,
  selected,
  role,
  onToggle,
  onRoleChange,
}: {
  user: DirectoryUser;
  inRoom: boolean;
  selected: boolean;
  role: RoomRole;
  onToggle: () => void;
  onRoleChange: (role: RoomRole) => void;
}) {
  return (
    <Box
      p="sm"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        border: `1px solid ${
          selected ? 'var(--mantine-color-teal-filled)' : 'var(--monosuite-color-border)'
        }`,
        background: selected
          ? 'var(--mantine-color-teal-light)'
          : 'var(--monosuite-color-surface-sunken)',
        opacity: inRoom ? 0.72 : 1,
        cursor: inRoom ? 'not-allowed' : 'pointer',
      }}
      onClick={onToggle}
    >
      <Group wrap="nowrap" gap="sm" align="flex-start">
        <Checkbox
          checked={selected}
          disabled={inRoom}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggle();
          }}
          aria-label={`Invite ${user.name}`}
          mt={4}
        />
        <Avatar color="teal" radius="xl" size="md">
          {user.initials}
        </Avatar>
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={600} truncate>
            {user.name}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {user.email}
          </Text>
          <Text size="xs" c="dimmed">
            {user.department}
          </Text>
          {selected && role === 'Guest' ? (
            <Text size="xs" c="dimmed">
              View only — cannot take response actions
            </Text>
          ) : null}
        </Stack>
        {inRoom ? (
          <Badge size="sm" variant="light" color="neutral" style={{ flexShrink: 0 }}>
            In room
          </Badge>
        ) : selected ? (
          <Box w={168} style={{ flexShrink: 0 }} onClick={(event) => event.stopPropagation()}>
            <Select
              size="xs"
              aria-label={`Role for ${user.name}`}
              data={INVITE_ROLE_OPTIONS}
              value={role}
              allowDeselect={false}
              comboboxProps={{ width: 280, withinPortal: true }}
              onChange={(value) => value && onRoleChange(value as RoomRole)}
              renderOption={({ option }) => (
                <Stack gap={0}>
                  <Text size="sm">{option.label}</Text>
                  <Text size="xs" c="dimmed">
                    {roleDescription(option.value as RoomRole)}
                  </Text>
                </Stack>
              )}
            />
          </Box>
        ) : null}
      </Group>
    </Box>
  );
}

function GuestInviteCard({
  index,
  guest,
  canRemove,
  errors,
  onChange,
  onRemove,
}: {
  index: number;
  guest: GuestDraft;
  canRemove: boolean;
  errors?: Partial<Record<'firstName' | 'lastName' | 'email', string>>;
  onChange: (patch: Partial<GuestDraft>) => void;
  onRemove: () => void;
}) {
  return (
    <Box
      p="md"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        border: '1px solid var(--monosuite-color-border)',
        background: 'var(--monosuite-color-surface-sunken)',
      }}
    >
      <Group justify="space-between" mb="sm">
        <Text size="sm" fw={600}>
          Guest {index + 1}
        </Text>
        {canRemove ? (
          <Tooltip label="Remove guest">
            <ActionIcon
              variant="subtle"
              color="danger"
              aria-label={`Remove guest ${index + 1}`}
              onClick={onRemove}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        ) : null}
      </Group>
      <Stack gap="sm">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <TextInput
            label="First name"
            placeholder="First name"
            required
            value={guest.firstName}
            error={errors?.firstName}
            onChange={(event) => onChange({ firstName: event.currentTarget.value })}
          />
          <TextInput
            label="Last name"
            placeholder="Last name"
            required
            value={guest.lastName}
            error={errors?.lastName}
            onChange={(event) => onChange({ lastName: event.currentTarget.value })}
          />
        </SimpleGrid>
        <TextInput
          label="Email"
          placeholder="name@example.com"
          required
          type="email"
          value={guest.email}
          error={errors?.email}
          onChange={(event) => onChange({ email: event.currentTarget.value })}
          description="A room password will be emailed to this address."
        />
        <Text size="xs" c="dimmed">
          Role: Guest · view only
        </Text>
      </Stack>
    </Box>
  );
}
