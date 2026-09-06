# War Room — presentation scenarios & recent contracts

Working notes for Cursor / humans continuing the **MonoSuite War Room** prototype (`apps/monosuite-war-room`). Captures the three-scenario room mocks and the **SOC-aligned full response flow** (intake → investigation share → propose/select/execute → lessons → minutes).

---

## Live & local

| Surface | URL / command |
| --- | --- |
| Landing | https://mahyashahsavari.github.io/company-design-system/ |
| War Room | https://mahyashahsavari.github.io/company-design-system/war-room/ |
| Rooms list (start here) | https://mahyashahsavari.github.io/company-design-system/war-room/rooms |
| Local | `npm run dev:war-room` → http://localhost:5174 |

**Repo:** https://github.com/Mahyashahsavari/company-design-system  
**Deploy:** push to `main` → workflow `.github/workflows/ci-pages.yml` → `npm run build:pages` → GitHub Pages artifact from `site/`.  
**Build script:** `scripts/build-pages.mjs` sets `VITE_BASE_PATH=/company-design-system/war-room/` for the War Room app.

If the live UI looks stale after a successful deploy, hard-refresh (`Ctrl+Shift+R`) or use a private window.

Do **not** commit `IWR_Room_Redesign.patch` unless explicitly requested.

---

## Three presentation rooms

| Room id | Incident id | Theme | Optional phases |
| --- | --- | --- | --- |
| `room-port-scan` | `INC-PS-1001` | External port scan / recon | Eradication + Recovery **skippable** (no work cards) |
| `room-ransomware` | `INC-RW-2002` | Ransomware precursor | Full C/E/R boards |
| `room-brute-force` | `INC-BF-3003` | Successful brute-force auth | Full C/E/R boards |

**Defaults:**

- All start at **Detected** (`current`); later NIST phases `pending`
- Shared workflow playbook: `nist-800-61`
- Detected has **no required work** (intake already known)
- Triage severity check is **optional** (`required: false`)
- Pack lookup: `getRoomScenario(roomId)` in `pages/room/scenarios/`

---

## SOC response flow (canvas contracts)

| Phase | What happens |
| --- | --- |
| **Detected** | No required cards — Commander can Complete Phase immediately |
| **Triage** | Optional severity check + triage notes; Commander may ask questions |
| **Investigation** | Investigator shares report → Owner/Admin **review only** (no response decisions, no collab threads) |
| **Containment / Eradication / Recovery** | Propose → Owner select → Admin **per-action** Duration/Due, then Done/Rejected (+ optional notes). Collab THREAD / Q / Decision cards live here. |
| **Containment / Eradication / Recovery** | Propose → Owner select → Admin **per-action** Duration/Due, then Done/Rejected (+ optional notes) |
| **Skippable phases** | Primary action is **Skip phase** (not Complete) |
| **Lessons learned** | Summary textarea → multi-select follow-up rules |
| **Minutes** | `roomAction('export')` / journey **Export minutes** → downloads markdown via `buildRoomMinutes.ts` |

Work answers are lifted into `useRoomState.workAnswers` so export survives remount.

### Key builders (`scenarios/shared.ts`)

- `triageSeverityCheck`
- `investigationBoard` — share + acks (not isolation)
- `responseActionBoard(phaseId, …)` — propose → owner → admin execution
- `lessonsLearnedBoard`

### Model extras

- `WorkflowWorkAnswerType` includes `'execution'`
- `optionsFromDependency` — Owner/Admin options from prior answer values
- `TaskPersonAnswer`: `duration`, `dueAt`, `description`, `executionStatus`
- `RoomScenarioPack.initialPhaseSkippable` seeds Commander skip policy

---

## Architecture

```
/rooms list  →  /rooms/:roomId  →  ROOM_SCENARIOS[roomId]
                                      ↓
                         useRoomState(pack) + RoomScenarioProvider
                                      ↓
              header / incident rail / canvas work + threads / minutes
```

### Key files

| Path | Role |
| --- | --- |
| `pages/room/scenarios/*` | Packs + shared boards |
| `pages/room/workAnswers.ts` | Quorum, dependency options, execution validation |
| `pages/room/buildRoomMinutes.ts` | Minutes markdown + download |
| `pages/room/hooks/useRoomState.ts` | `workAnswers`, export, `initialPhaseSkippable` |
| `…/WorkflowCanvasView.tsx` | Canvas + execution inspector |
| `…/ResponseJourneyView.tsx` | Post-complete trail + Export minutes |
| `pages/room/taskQuorum.ts` | **`DEMO_COMMANDER_FULL_ACCESS`** (temporary) |

---

## Canvas UX (unchanged entry rules)

1. Entry: full NIST spine (no auto-zoom).
2. Zoom only on phase click.
3. Complete Phase: Commander-gated; blocked until required work answered.
4. After all phases Done/Skipped → Response flow journey.
5. Media dock safe zone via `--room-canvas-dock-safe`.

---

## Commander / demo access

- `commanderParticipantId` = `CURRENT_USER.id` (`harriette`)
- **`DEMO_COMMANDER_FULL_ACCESS = true`** — local Commander alone answers any role task
- Remove / set false when real multi-role participation exists

---

## Severity colours

| Severity | Token |
| --- | --- |
| Critical | `danger` |
| High / Medium | `warning` |
| Low | `neutral` |

Use class `monosuite-badge-with-icon` for badge+icon alignment.

---

## Out of scope (still)

- Real backend / persistence across reload
- Auth / different `CURRENT_USER` per room
- Create Room form → scenario packs
- Storybook

---

## Quick smoke checklist

1. `/rooms` → open each of the three rooms.
2. Detected: Complete Phase with no work card required.
3. Triage: optional check; notes still work.
4. Investigation: share report → Owner → Admin.
5. Containment: propose → Owner selects inherited options → Admin fills Duration/Due/Description/Done.
6. Port scan: Eradication/Recovery show Skippable; skip or complete empty.
7. Lessons → Complete → Response flow → **Export minutes** downloads `.md`.
8. Light + dark still readable.

---

## Related docs / rules

- `.cursor/rules/features/room-workspace.mdc`
- `.cursor/rules/01-war-room-ux.mdc` / `02-war-room-ui.mdc`
- `.cursor/rules/mantine-direct-usage.mdc`
- `docs/project-status.md`
