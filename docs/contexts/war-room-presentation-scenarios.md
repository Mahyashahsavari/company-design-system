# War Room — presentation scenarios & recent contracts

Working notes for Cursor / humans continuing the **MonoSuite War Room** prototype (`apps/monosuite-war-room`). Captures decisions from the three-scenario room mocks work and follow-ups (canvas overview, Commander demo access, response journey, severity, Pages deploy).

Last verified against commits through `7985f39` (Sep 2026).

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

If the live UI looks stale after a successful deploy, hard-refresh (`Ctrl+Shift+R`) or use a private window — HTML is cached (~10 min); hashed JS may still be served from an older `index.html` until refresh. Confirm new code by searching the live bundle for strings like `Response flow` / `monosuite-response-journey`.

Do **not** commit `IWR_Room_Redesign.patch` unless explicitly requested.

---

## Three presentation rooms

| Room id | Incident id | Theme |
| --- | --- | --- |
| `room-port-scan` | `INC-PS-1001` | External port scan / recon |
| `room-ransomware` | `INC-RW-2002` | Ransomware precursor |
| `room-brute-force` | `INC-BF-3003` | Successful brute-force auth |

**Defaults (locked for demos):**

- All start at **Detected** (`current`); later NIST phases `pending`
- Shared workflow playbook: `nist-800-61`
- No closed rooms in the list for this presentation set
- List rows derived from scenario packs (`buildScenarioRoomList()`)

**Routing:**

- `routes.roomDetail` = `/rooms/:roomId`
- `roomDetailPath(roomId)` helper
- `/` and unknown room ids → `/rooms`
- Pack lookup: `getRoomScenario(roomId)` in `pages/room/scenarios/`

---

## Architecture (scenario packs)

```
/rooms list  →  /rooms/:roomId  →  ROOM_SCENARIOS[roomId]
                                      ↓
                         useRoomState(pack) + RoomScenarioProvider
                                      ↓
                    header / incident rail / canvas work + threads
```

### Key files

| Path | Role |
| --- | --- |
| `pages/room/scenarios/types.ts` | `RoomScenarioPack`, `ScenarioIncident`, `START_AT_DETECTED_STATUSES` |
| `pages/room/scenarios/{portScan,ransomware,bruteForce}.ts` | Narrative mocks |
| `pages/room/scenarios/shared.ts` | Shared roster, `phaseGateWork`, `investigationBoard`, `laterPhaseGates` |
| `pages/room/scenarios/index.ts` | Registry + `getRoomScenario` + list builder |
| `pages/rooms/data.ts` | `ROOM_LIST` from packs (single source of truth) |
| `pages/room/RoomScenarioContext.tsx` | Provider; `useRoomIncident()` / `useRoomScenario()` |
| `pages/room/hooks/useRoomState.ts` | Seeds from pack; `completePhase`, `completedPhaseIds`, scenario work/threads |
| `pages/room/hooks/useRoomWorkflow.ts` | Loads playbook; applies pack `workflowStepStatuses` via `scenarioId` |
| `pages/room/taskQuorum.ts` | Role quorum + **`DEMO_COMMANDER_FULL_ACCESS`** |
| `pages/room/workAnswers.ts` | Canvas work answer helpers |
| `…/response-workflow/WorkflowCanvasView.tsx` | Canvas + phase complete + journey switch |
| `…/response-workflow/ResponseJourneyView.tsx` | Post-complete answer trail |
| `…/response-workflow/workflowCanvasData.ts` | Default work/threads; `workItemsForPhase(phaseId, catalog?)` |
| `shared/constants.ts` | `CURRENT_USER` (`id: harriette`), media dock safe-zone constants |

Legacy `INCIDENT` / `ATTACKER_ENTITIES` in `data.ts` remain as fallbacks; room chrome should prefer pack / `useRoomIncident()`.

---

## Canvas UX contracts

1. **Entry:** show **full NIST spine** (all phases). Do **not** auto-zoom into Detected / phase 1.
2. **Zoom / expand:** only when the user **clicks a phase** (`expandedPhaseId` starts `null`).
3. **Complete Phase:** Commander-gated; advances step statuses via `completePhase` in `useRoomState` (and local canvas fallback).
4. **Multi-phase work:** packs include Detected/Triage gates + investigation board + later phase gates so Detected → Lessons Learned is walkable.
5. **Investigation layout:** role-based 2×2 (owner / admin / investigator / responder) — supports prefixed ids (`ps-owner-impact`, etc.).
6. **After all phases Done:** replace canvas with **Response flow** (`ResponseJourneyView`).
7. **Edit** on journey → back to canvas (`preferCanvasAfterComplete`). Toolbar **View response flow** when complete but on canvas.
8. **Journey content:** answer is primary (bold); question is secondary (dimmed); badge shows `Role · PersonName`.
9. **Media dock overlap:** journey spine uses `padding-bottom: calc(var(--room-canvas-dock-safe, 0px) + 24px)`. RoomPage sets `--room-canvas-dock-safe` when the floating media panel is docked (`ROOM_MEDIA_DOCK_SAFE_ZONE`).

---

## Commander / demo access

- Scenario packs set `commanderParticipantId` = `CURRENT_USER.id` (`harriette`).
- Temporary flag: **`DEMO_COMMANDER_FULL_ACCESS = true`** in `taskQuorum.ts`.
  - Local Commander alone fills role/person assignee pools for answering.
  - `useRoomState` treats local user as Commander when the flag is on.
- **Remove / set false** when real multi-role participation is wired.

---

## Severity colours (attack feel)

`ROOM_SEVERITY_COLOR` in `pages/room/data.ts`:

| Severity | Token | Notes |
| --- | --- | --- |
| Critical | `danger` | Red |
| High | `warning` | Amber / heat |
| Medium | `warning` | **Not** `accent` (cyan) — cyan read as calm/info, wrong for attack |
| Low | `neutral` | |

Badges with icons should use class **`monosuite-badge-with-icon`** (vertical align icon + label) — see `app.css`.

---

## Role quorum (canvas work)

- Work items assign by `AssignableTaskRole`; quorum via `peopleForTaskRole` + `taskQuorumStatus`.
- Prototype role map: `PARTICIPANT_WORK_ROLES` in `taskQuorum.ts` (overridden when demo Commander flag is on).
- Collab threads: Q → F → D style; pack-specific `collabThreads` + `questions`.

---

## Out of scope (still)

- Real backend / persistence across reload
- Auth / different `CURRENT_USER` per room
- Create Room form wiring into these scenario packs
- Shipping unrelated apps or Storybook

---

## Quick smoke checklist

1. `/rooms` shows three live rooms → Open each.
2. Room entry: full phase spine visible (not zoomed into Detected).
3. Click a phase → expand + zoom; Complete Phase as Commander through Detected → … → Lessons Learned.
4. Final Done → Response flow with answers first; Edit returns to canvas; scroll clears media dock.
5. Severity Medium badge is amber (`warning`), not cyan.
6. Light + dark still readable.

---

## Related docs / rules

- `.cursor/rules/features/room-workspace.mdc` — in-room layout contract
- `.cursor/rules/01-war-room-ux.mdc` / `02-war-room-ui.mdc` — product UX/UI
- `.cursor/rules/mantine-direct-usage.mdc` — no hex in apps; semantic tokens
- `docs/project-status.md` — monorepo commands and packages
