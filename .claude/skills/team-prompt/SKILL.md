---
name: team-prompt
description: "Execute Agent Teams for multi-domain tasks in the Message Hub (wavolution2) app. Use this skill whenever the user describes work spanning 2+ domains (convex backend + react frontend, evolution API + convex, etc.) and you need to create a team to execute it. Triggers on: 'create a team for', 'use the team to', 'have the team do', 'set up a team', 'team this', or any multi-domain task. Also trigger when the user pastes a plan file and says 'implement this' or 'execute this with a team'. This skill creates the team, creates tasks, assigns them, spawns teammates, monitors completion, runs devops validation last, and cleans up. It EXECUTES — it does not generate markdown prompts."
---

# Team Autopilot Executor

Execute Agent Teams end-to-end: analyze the request, create the team, create tasks, assign them, spawn teammates, monitor completion, run devops validation last, clean up.

**This skill EXECUTES teams. It does NOT generate markdown prompts or text descriptions.**

## When This Skill Triggers

- User describes work spanning 2+ file domains (convex + react, evolution + convex, etc.)
- User says "create a team", "use the team", "team this"
- User pastes a plan and says "implement this" or "execute this with a team"
- Any multi-domain task where you'd normally need `TeamCreate + TaskCreate + Agent`

## Step 1: Analyze the Request

Parse the user's request into discrete work items. For each item, identify:
- **What** needs to happen (create, fix, redesign, audit, migrate)
- **Where** the files live (convex/, src/components/, src/pages/, etc.)
- **Domain** it belongs to (backend, frontend, evolution, devops)

If the request is vague, ask clarifying questions before proceeding. Do NOT create a team until you understand the work.

## Step 2: Read Agent Definitions

Read ONLY the agent definitions relevant to the domains you identified:

| Domain | File to read |
|--------|-------------|
| backend | `.claude/agents/convex-specialist.md` |
| frontend | `.claude/agents/react-specialist.md` |
| evolution/whatsapp | `.claude/agents/evolution-specialist.md` |
| devops | `.claude/agents/devops-specialist.md` |

Do NOT read all 4 every time — only the ones needed for this request.

## Step 3: Apply the Decision Matrix

| Scenario | Action |
|----------|--------|
| All files in one domain | **STOP.** Use a single `Agent(subagent_type: "X")` — no team needed. Skip remaining steps. |
| 2+ domains, non-overlapping files | Create team — teammates run in parallel |
| 2+ domains, overlapping files | Create team — tasks with `blockedBy` dependencies |
| Audit / review | Create team — one teammate per audit domain |

**If single subagent suffices, execute it directly and STOP. Do not continue to Step 4.**

## Step 4: Map Files and Detect Conflicts

For each work item:
1. List the specific files it will create or modify
2. Check if any two tasks touch the same files
3. If overlap exists → mark for `blockedBy` dependency
4. Group by teammate — each teammate must own a disjoint set of files

**File-to-teammate routing:**

| File pattern | Teammate name | Agent type |
|-------------|---------------|------------|
| `convex/schema.ts`, `convex/contacts.ts`, `convex/campaigns.ts`, `convex/messages.ts`, `convex/storage.ts`, `convex/migrations.ts`, `convex/auth*.ts` | `backend` | `convex-specialist` |
| `convex/evolution.ts`, `convex/instances.ts`, `convex/http.ts` (webhook routes) | `evolution` | `evolution-specialist` |
| `src/components/**`, `src/pages/**`, `src/hooks/**`, `src/lib/**`, `src/App.tsx` | `frontend` | `react-specialist` |
| `vite.config.ts`, `src/__tests__/**`, `package.json`, `tsconfig*.json`, `vercel.json` | `devops` | `devops-specialist` |

**Shared file conflicts:** `convex/http.ts` may be touched by both `evolution` (webhook routes) and `backend` (auth OIDC routes). If both need it, set a `blockedBy` dependency.

## Step 5: Verify Before Execution

Before creating anything, verify:

1. Every task has specific files listed — no vague tasks like "fix the frontend"
2. No two parallel tasks share files without a `blockedBy` dependency
3. Devops validation is planned as the final step
4. Teammate count is 2-4 (never more than 4 for this project)
5. Constraints include project-specific rules:
   - All Convex functions use `getAuthUserId(ctx)` — never accept userId as argument
   - Schema changes keep old fields as `v.optional()` + migration
   - React uses Convex subscriptions (useQuery/useMutation) — never HTTP fetches
   - Import convex generated files via `@convex/` alias, not relative paths

If any check fails, fix the plan before proceeding.

## Step 6: Create the Team

Execute this tool call NOW:

```
TeamCreate(team_name: "{type}-{short-description}", description: "{what we're building}")
```

Naming convention:
- `feat-{desc}` for new features
- `fix-{desc}` for bug fixes
- `audit-{desc}` for audits/reviews

## Step 7: Create All Tasks

For EACH work item, execute:

```
TaskCreate(
  subject: "{task title}",
  description: "## Files\n{comma-separated files to create/modify}\n\n{detailed instructions for what to do}\n\n## Constraints\n{project-specific rules for this domain}"
)
```

Save every returned task ID — you need them for the next steps.

**Task description requirements:**
- MUST start with `## Files` listing every file the task will touch
- MUST include enough detail for the teammate to work autonomously
- MUST reference the agent definition path so the teammate can read its own instructions
- SHOULD include relevant project constraints (auth patterns, schema migration rules, etc.)

## Step 8: Set Dependencies

For each task that depends on another (overlapping files, or output required as input):

```
TaskUpdate(taskId: "{dependent-task-id}", addBlockedBy: ["{blocking-task-id}"])
```

`blockedBy` is NOT a `TaskCreate` parameter — it MUST be set via `TaskUpdate` after creation.

**Common dependency patterns in this project:**
- Frontend displaying new data → backend must create the query/mutation first
- Evolution API webhooks → backend schema must define the tables first
- Any campaign feature → both backend (campaigns.ts) and evolution (evolution.ts) may be involved

## Step 9: Pre-Assign Tasks to Teammates

For each task, assign it to the teammate who owns its files:

```
TaskUpdate(taskId: "{task-id}", owner: "{teammate-name}")
```

Pre-assignment prevents race conditions. Do NOT rely on teammates self-claiming tasks.

## Step 10: Spawn Implementation Teammates

Spawn ALL implementation teammates (NOT devops) in a SINGLE message — this makes them run in parallel:

```
Agent(
  name: "{role}",
  team_name: "{team-name}",
  subagent_type: "{agent-type}",
  prompt: "You are the {role} specialist on team {team-name}.
           Read your agent definition at .claude/agents/{role}-specialist.md before starting.
           Check TaskList for tasks assigned to you. Complete them in dependency order.
           Mark each task completed via TaskUpdate(status: 'completed') when done.
           SendMessage to the team lead if you discover file conflicts or need a file owned by another task.
           When done with ALL your tasks, report completion via SendMessage to the lead."
)
```

**CRITICAL:**
- All implementation teammates MUST be spawned in the SAME message (parallel execution)
- NEVER use `run_in_background: true`
- Do NOT spawn devops yet — it runs LAST

## Step 11: Wait for Implementation Teammates

Teammates send completion messages automatically when they finish. You receive these as conversation turns.

After all implementation teammates report completion:
1. Call `TaskList` to verify all implementation tasks have status `completed`
2. If any task is NOT completed, investigate:
   - If a teammate reported an error → decide: retry (spawn new agent for same task) or ask the user
   - If a teammate went silent → check `TaskList` status and ask the user

Only proceed to Step 12 when ALL implementation tasks are `completed`.

## Step 12: Spawn Devops (Validation Last)

```
Agent(
  name: "devops",
  team_name: "{team-name}",
  subagent_type: "devops-specialist",
  prompt: "All implementation is complete. Run these validations in order:
           1. npm run check (format + lint + type check)
           2. npm test (vitest)
           3. npx convex dev --once (verify Convex functions push)
           Fix any errors you find. Report results via SendMessage to the lead."
)
```

Wait for devops to complete and report results.

## Step 13: Shutdown and Cleanup

After devops completes:

1. Send shutdown to EACH teammate:
```
SendMessage(recipient: "{teammate-name}", type: "shutdown_request")
```

2. Wait for `shutdown_response` from each teammate.

3. Delete the team:
```
TeamDelete()
```

`TeamDelete` takes NO parameters — it deletes the current session's team.

4. Report results to the user. Do NOT auto-commit — the user decides when to commit.

## Fallback: Teams Feature Disabled

If `TeamCreate` fails or is unavailable (feature flag `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` disabled):

1. Fall back to parallel `Agent()` calls WITHOUT `team_name`
2. Enforce dependencies by spawning dependent agents SEQUENTIALLY (wait for agent A to finish before spawning agent B)
3. Skip `SendMessage`, `TaskCreate`, `TeamDelete` — these require an active team

## Examples

### Example 1: "Add a tags field to contacts with a tag picker in the UI"

Two domains: backend (schema + migration + query) + frontend (tag picker component). Frontend needs the query to exist first.

**Execution:**
1. `TeamCreate(team_name: "feat-contact-tags", description: "Add tags field to contacts with tag picker UI")`
2. `TaskCreate` x 3 (backend schema+mutation, frontend tag picker, devops validation)
3. `TaskUpdate(frontendTaskId, addBlockedBy: [backendTaskId])`
4. `TaskUpdate` x 3 (assign owners)
5. `Agent(name: "backend", ...)` + `Agent(name: "frontend", ...)` in same message
6. Wait → `Agent(name: "devops", ...)`
7. Shutdown → `TeamDelete()`

### Example 2: "Fix TypeScript errors in convex/contacts.ts"

Single domain, single file. **No team.**

**Execution:**
```
Agent(subagent_type: "convex-specialist", prompt: "Fix TypeScript errors in convex/contacts.ts. Read convex/_generated/ai/guidelines.md first. Run npm run check to find errors, fix them, verify again.")
```

### Example 3: "Add media attachment support to campaigns — backend storage + Evolution API sending + UI upload"

Three domains: backend (storage + schema), evolution (send media via API), frontend (upload UI). Backend must complete first since evolution and frontend depend on the new fields/storage.

**Execution:**
1. `TeamCreate(team_name: "feat-campaign-media", description: "Add media attachment support to campaigns")`
2. `TaskCreate` x 4 (backend schema+storage, evolution media sending, frontend upload UI, devops validation)
3. `TaskUpdate(evolutionTaskId, addBlockedBy: [backendTaskId])`
4. `TaskUpdate(frontendTaskId, addBlockedBy: [backendTaskId])`
5. `TaskUpdate` x 4 (assign owners)
6. `Agent(name: "backend", ...)` + `Agent(name: "evolution", ...)` + `Agent(name: "frontend", ...)` in same message
7. Wait → `Agent(name: "devops", ...)`
8. Shutdown → `TeamDelete()`
