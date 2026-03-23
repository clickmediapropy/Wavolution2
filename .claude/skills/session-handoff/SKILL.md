---
name: session-handoff
description: Generate a next.md handoff document that gives a fresh Claude session full context on the project, what's been done, and what to do next. Use when the user says "save progress", "generate handoff", "whats next", "session handoff", "save context", "I'm done for now", "wrap up", or before ending a session. Also use proactively when a major milestone completes. The output is next.md — the user just says "read next.md" in a new session to resume.
---

# Session Handoff Generator

Generate a `next.md` file that gives a fresh Claude session everything it needs to continue the work. The new session has zero context — this file is the bridge.

## When to Generate

- User says "save progress", "wrap up", "handoff", "whats next"
- A major task or phase just completed
- Before the user ends the session
- User explicitly asks for next.md

## How to Gather Context

Read these sources to build the handoff (skip any that don't exist):

1. **CLAUDE.md** — project overview, stack, commands, architecture
2. **Git state** — `git log --oneline -10`, `git status`, current branch
3. **Memory files** — `MEMORY.md` index for recent learnings
4. **Phase plans** — `progress/*/PLAN.md` for current/next phase
5. **Recent conversation** — what was just built, any bugs found/fixed, decisions made
6. **Task list** — any pending tasks from the current session

## Output: next.md

Write to `next.md` in the project root. Use this exact structure:

```markdown
# Session Handoff — [Project Name]
Generated: [date]

## Project
[1-2 sentences: what this project is]

## Stack
[bullet list of key technologies]

## What's Done
[bullet list of completed work, most recent first. Include commit hashes.]

## Current State
[What's working, what's deployed, any known issues. Be specific — URLs, error messages, partial states.]

## What's Next
[The immediate next task. Be specific enough that Claude can start working without asking questions.]
[If there's a phase plan, reference it: "See progress/phase-X/PLAN.md for full plan"]

## Key Context
[Things that aren't obvious from the code — decisions made, gotchas discovered, patterns to follow.
Pull from memory files and conversation. These are the things that would waste 30 minutes if rediscovered.]

## Commands to Start
[Exact commands to get the dev environment running]
```

## Guidelines

- **Be specific, not vague.** "Fix the contacts page" is useless. "The contacts page throws 'User not found' because getUserOrThrow looks up by email index instead of using getAuthUserId — see convex/contacts.ts:17" is useful.
- **Include file paths.** The new session needs to know where to look.
- **Include commit hashes.** So the new session can verify it's looking at the right code.
- **Include blockers.** If something is waiting on a deploy, an API key, or user input, say so.
- **Keep it under 80 lines.** Dense and scannable beats comprehensive and long.
- **Don't duplicate CLAUDE.md.** Reference it, don't repeat it. Focus on session-specific context.
