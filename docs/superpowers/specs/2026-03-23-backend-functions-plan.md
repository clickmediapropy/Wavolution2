# Backend Convex Functions Plan
**Date:** 2026-03-23
**Task:** #9 — Plan all backend Convex functions for new features
**Status:** Complete — ready for implementation in tasks #12, #13, #14

---

## Overview

This document specifies every new Convex function needed to support the CRM, bot, and inbox features being added to Wavolution. It is structured by file and references the new schema tables introduced in task #8.

### Auth pattern (used everywhere)
All public functions use `getAuthUserId` from `@convex-dev/auth/server`. Internal functions receive `userId` as an explicit arg (no auth check needed).

```ts
const userId = await getAuthUserId(ctx);
if (!userId) throw new Error("Not authenticated");
```

### Ownership check pattern
For every record fetch, verify `record.userId === userId` before operating on it.

---

## convex/pipeline.ts (NEW FILE)

Manages kanban pipeline stages and contact-to-stage assignments.

### `listStages` — query
```
args:   {}
return: Doc<"pipelineStages">[]   // ordered by position asc
tables: pipelineStages (read)
auth:   getAuthUserId required
```
Query `pipelineStages` by `by_userId` index, order by `position` field ascending.

---

### `createStage` — mutation
```
args:   { name: v.string(), color: v.optional(v.string()) }
return: Id<"pipelineStages">
tables: pipelineStages (insert)
auth:   getAuthUserId required
```
Compute next `position` by counting existing stages for user + 1. Insert with default color `"#6b7280"` if omitted.

---

### `updateStage` — mutation
```
args:   { id: v.id("pipelineStages"), name: v.string(), color: v.optional(v.string()) }
return: void
tables: pipelineStages (read, patch)
auth:   verify stage.userId === userId
```

---

### `reorderStages` — mutation
```
args:   { orderedIds: v.array(v.id("pipelineStages")) }
return: void
tables: pipelineStages (read, patch each)
auth:   getAuthUserId required
```
For each id at index i, patch `position: i`. Verify all stages belong to user before writing.

---

### `deleteStage` — mutation
```
args:   { id: v.id("pipelineStages") }
return: { movedCount: number }
tables: pipelineStages (delete), contacts (patch many)
auth:   verify stage.userId === userId
```
Delete the stage, then patch all contacts where `pipelineStageId === id` to unset `pipelineStageId` (set to `undefined`). Return count of affected contacts.

---

### `moveContact` — mutation
```
args:   { contactId: v.id("contacts"), stageId: v.optional(v.id("pipelineStages")) }
return: void
tables: contacts (read, patch), pipelineStages (read for name)
auth:   verify contact.userId === userId; if stageId provided, verify stage.userId === userId
```
Patch contact: `{ pipelineStageId: stageId, stageEnteredAt: Date.now() }`. If `stageId` is undefined, clears pipeline assignment.

---

### `getContactsByStage` — query
```
args:   { stageId: v.optional(v.id("pipelineStages")) }
return: Doc<"contacts">[]
tables: contacts (read), pipelineStages (read)
auth:   getAuthUserId required
```
Query contacts `by_userId_and_pipelineStageId` index. If `stageId` is undefined, returns contacts with no pipeline stage assigned.

---

## convex/quickReplies.ts (NEW FILE)

Canned response templates for fast inbox replies.

### `list` — query
```
args:   {}
return: Doc<"quickReplies">[]
tables: quickReplies (read)
auth:   getAuthUserId required
```
Query `by_userId` index, order by creation time desc.

---

### `create` — mutation
```
args:   { shortcut: v.string(), text: v.string(), category: v.optional(v.string()) }
return: Id<"quickReplies">
tables: quickReplies (insert)
auth:   getAuthUserId required
```
Validate `shortcut` is non-empty and unique per user (check `by_userId_and_shortcut` index). Validate `text` is non-empty. Insert.

---

### `update` — mutation
```
args:   { id: v.id("quickReplies"), shortcut: v.string(), text: v.string(), category: v.optional(v.string()) }
return: void
tables: quickReplies (read, patch)
auth:   verify quickReply.userId === userId
```
If shortcut changed, re-check uniqueness. Patch.

---

### `remove` — mutation
```
args:   { id: v.id("quickReplies") }
return: void
tables: quickReplies (delete)
auth:   verify quickReply.userId === userId
```

---

### `search` — query
```
args:   { term: v.string() }
return: Doc<"quickReplies">[]
tables: quickReplies (read)
auth:   getAuthUserId required
```
Use `search_by_text` search index on `quickReplies` (searchField: `text`, filterField: `userId`). Take 20 results.

---

## convex/knowledgeBase.ts (NEW FILE)

Document store for RAG context injection into bot responses.

### `list` — query
```
args:   {}
return: Doc<"knowledgeBaseEntries">[]
tables: knowledgeBaseEntries (read)
auth:   getAuthUserId required
```
Query `by_userId` index, order desc.

---

### `create` — mutation
```
args:   { title: v.string(), content: v.string(), category: v.optional(v.string()) }
return: Id<"knowledgeBaseEntries">
tables: knowledgeBaseEntries (insert)
auth:   getAuthUserId required
```
Validate both fields non-empty. Insert with `wordCount: content.split(/\s+/).length`.

---

### `update` — mutation
```
args:   { id: v.id("knowledgeBaseEntries"), title: v.string(), content: v.string(), category: v.optional(v.string()) }
return: void
tables: knowledgeBaseEntries (read, patch)
auth:   verify entry.userId === userId
```
Recompute `wordCount` on patch.

---

### `remove` — mutation
```
args:   { id: v.id("knowledgeBaseEntries") }
return: void
tables: knowledgeBaseEntries (delete)
auth:   verify entry.userId === userId
```

---

### `searchContext` — action
```
args:   { query: v.string(), instanceId: v.optional(v.id("instances")), maxChars: v.optional(v.number()) }
return: string   // concatenated context block for prompt injection
tables: knowledgeBaseEntries (read via runQuery)
auth:   getAuthUserId via ctx.auth required
```
Run `ctx.runQuery(internal.knowledgeBase.getEntriesForUser, { userId })` to load all entries (capped at 50). Score each entry against the query using a simple TF-IDF keyword overlap (no external embedding service needed for v1). Return top 3 entries, formatted as a context block, trimmed to `maxChars` (default 2000).

**Internal helper:**

### `getEntriesForUser` — internalQuery
```
args:   { userId: v.id("users") }
return: Doc<"knowledgeBaseEntries">[]
tables: knowledgeBaseEntries (read)
```
Simple query by `by_userId`, take 50.

---

## convex/botGoals.ts (NEW FILE)

Structured bot goal templates — predefined conversation flows.

### `list` — query
```
args:   {}
return: Doc<"botGoals">[]
tables: botGoals (read)
auth:   getAuthUserId required
```
Query `by_userId` index, order by `position` asc.

---

### `create` — mutation
```
args:   {
  name: v.string(),
  triggerKeywords: v.array(v.string()),
  steps: v.array(v.object({ message: v.string(), delayMs: v.optional(v.number()) })),
  isActive: v.optional(v.boolean())
}
return: Id<"botGoals">
tables: botGoals (insert)
auth:   getAuthUserId required
```
Validate name non-empty, steps non-empty array. Position = existing count + 1. Default `isActive: true`.

---

### `update` — mutation
```
args:   {
  id: v.id("botGoals"),
  name: v.string(),
  triggerKeywords: v.array(v.string()),
  steps: v.array(v.object({ message: v.string(), delayMs: v.optional(v.number()) })),
  isActive: v.boolean()
}
return: void
tables: botGoals (read, patch)
auth:   verify goal.userId === userId
```

---

### `remove` — mutation
```
args:   { id: v.id("botGoals") }
return: void
tables: botGoals (delete)
auth:   verify goal.userId === userId
```

---

### `executeGoal` — internalAction
```
args:   {
  goalId: v.id("botGoals"),
  conversationId: v.id("conversations"),
  instanceName: v.string(),
  phone: v.string(),
  userId: v.id("users")
}
return: void
tables: botGoals (read), messages (insert via runMutation), conversations (patch via runMutation)
auth:   internal — no auth check
```
Load goal steps. For each step: schedule `ctx.scheduler.runAfter(cumulativeDelay, internal.botGoals.sendGoalStep, { ... })`. This allows delayed multi-step flows without blocking.

**Internal helper:**

### `sendGoalStep` — internalAction
```
args:   { instanceName: v.string(), phone: v.string(), text: v.string(), userId: v.id("users"), conversationId: v.id("conversations"), instanceId: v.optional(v.id("instances")) }
return: void
```
Call Evolution API `sendText`, then `ctx.runMutation(internal.ai.logBotMessage, { ... })` (reuse existing pattern from `convex/ai.ts`).

---

### `matchGoalByKeyword` — internalQuery
```
args:   { userId: v.id("users"), message: v.string() }
return: Doc<"botGoals"> | null
tables: botGoals (read)
```
Load all active goals for user. For each, check if any `triggerKeyword` (lowercased) is contained in the message (lowercased). Return first match or null.

---

## convex/contacts.ts (ENHANCED — existing file)

Add the following functions to the existing `convex/contacts.ts`.

### `addTag` — mutation
```
args:   { id: v.id("contacts"), tag: v.string() }
return: void
tables: contacts (read, patch)
auth:   verify contact.userId === userId
```
Normalize tag (trim, lowercase). Read existing `tags` array (default `[]`). Skip if tag already present. Patch with deduplicated merge.

---

### `removeTag` — mutation
```
args:   { id: v.id("contacts"), tag: v.string() }
return: void
tables: contacts (read, patch)
auth:   verify contact.userId === userId
```
Filter out the tag from existing array. Patch.

---

### `setCustomField` — mutation
```
args:   { id: v.id("contacts"), key: v.string(), value: v.union(v.string(), v.number(), v.boolean(), v.null()) }
return: void
tables: contacts (read, patch)
auth:   verify contact.userId === userId
```
Read existing `customFields` object (default `{}`). Merge the key/value. Patch. If `value` is null, delete the key from the object.

---

### `getDetail` — query
```
args:   { id: v.id("contacts") }
return: {
  contact: Doc<"contacts">,
  conversations: Doc<"conversations">[],
  recentMessages: Doc<"messages">[],
  stats: { totalMessages: number, lastMessageAt: number | null }
}
tables: contacts, conversations, messages (all read)
auth:   verify contact.userId === userId
```
Load contact + all conversations for that contact's phone + last 20 messages across those conversations. Compute stats.

---

### `generateAiSummary` — action
```
args:   { id: v.id("contacts") }
return: string   // the AI-generated summary text
tables: contacts (read+patch via runMutation), messages (read via runQuery)
auth:   getAuthUserId via ctx.auth required
```
Load recent 30 messages for the contact. Build a prompt summarizing the relationship, key facts, and recommended next action. Call OpenRouter (reuse `callOpenRouter` helper from `convex/ai.ts` — extract to shared internal helper). Patch contact with `aiSummary` and `aiSummaryGeneratedAt`. Return summary text.

---

## convex/conversations.ts (ENHANCED — existing file)

Add the following functions to the existing `convex/conversations.ts`.

### `assign` — mutation
```
args:   { id: v.id("conversations"), assignedTo: v.optional(v.string()) }
return: void
tables: conversations (read, patch)
auth:   verify conversation.userId === userId
```
Patch `{ assignedTo }`. `undefined` clears assignment. In Wavolution's single-user model, `assignedTo` is a label string (not a userId reference), kept simple.

---

### `addNote` — mutation
```
args:   { conversationId: v.id("conversations"), text: v.string() }
return: Id<"conversationNotes">
tables: conversationNotes (insert), conversations (read for ownership)
auth:   verify conversation.userId === userId
```
Validate text non-empty. Insert into `conversationNotes` table with `{ conversationId, userId, text, createdAt: Date.now() }`.

---

### `listNotes` — query
```
args:   { conversationId: v.id("conversations") }
return: Doc<"conversationNotes">[]
tables: conversationNotes (read), conversations (read for ownership)
auth:   verify conversation.userId === userId
```
Query `conversationNotes` by `by_conversationId` index, order asc.

---

### `deleteNote` — mutation
```
args:   { id: v.id("conversationNotes") }
return: void
tables: conversationNotes (delete, read for ownership), conversations (read for ownership)
auth:   Load note → load conversation → verify conversation.userId === userId
```

---

### `setTyping` — mutation
```
args:   { conversationId: v.id("conversations"), isTyping: v.boolean() }
return: void
tables: conversations (read, patch)
auth:   verify conversation.userId === userId
```
Patch `{ typingAt: isTyping ? Date.now() : null }`. Frontend reads this field to show the agent-typing indicator. (Note: actual "typing" indicator to WhatsApp contact requires Evolution API call — that's a stretch goal; this mutation only tracks agent state in the UI.)

---

### `bulkArchive` — mutation
```
args:   { ids: v.array(v.id("conversations")), archived: v.boolean() }
return: { updated: number }
tables: conversations (read+patch many)
auth:   getAuthUserId required; skip records where conversation.userId !== userId
```
Iterate ids (max 100), verify ownership on each, patch `{ isArchived: archived }`. Return count of updated records.

---

### `bulkMarkRead` — mutation
```
args:   { ids: v.array(v.id("conversations")) }
return: { updated: number }
tables: conversations (read+patch many)
auth:   getAuthUserId required; skip non-owned records
```
Iterate ids (max 100), patch `{ unreadCount: 0, hasBeenInteracted: true }`. Return count.

---

## convex/ai.ts (ENHANCED — existing file)

Add the following to the existing `convex/ai.ts`. Extract `callOpenRouter` helper as a module-level function (already done) — keep reusing it.

### `generateWithRag` — action
```
args:   {
  conversationId: v.id("conversations"),
  userMessage: v.string(),
  systemPrompt: v.optional(v.string())
}
return: string   // AI reply with RAG context injected
tables: conversations, messages, knowledgeBaseEntries (read via runQuery)
auth:   getAuthUserId via ctx.auth required
```
1. Load conversation + last 15 messages for history.
2. Call `ctx.runAction(internal.knowledgeBase.searchContext, { query: userMessage, userId })` to get relevant KB context.
3. Build system prompt: `[systemPrompt or instance.botSystemPrompt] + "\n\nKnowledge Base:\n" + kbContext`.
4. Call `callOpenRouter(...)` with combined prompt.
5. Return reply text (do NOT send or log — caller decides what to do with it).

---

### `executeGoals` — internalAction
```
args:   {
  userId: v.id("users"),
  conversationId: v.id("conversations"),
  instanceName: v.string(),
  phone: v.string(),
  inboundMessage: v.string()
}
return: { matched: boolean, goalId: Id<"botGoals"> | null }
tables: botGoals (read via runQuery), messages (insert via runMutation)
auth:   internal — no auth check
```
1. Call `ctx.runQuery(internal.botGoals.matchGoalByKeyword, { userId, message: inboundMessage })`.
2. If matched, call `ctx.runAction(internal.botGoals.executeGoal, { goalId, conversationId, instanceName, phone, userId })`.
3. Return match result.

This is called from the webhook handler (`convex/webhooks.ts`) after a new inbound message, before the regular `generateAutoReply` bot flow.

---

### `autoFollowup` — action
```
args:   {
  conversationId: v.id("conversations"),
  templateKey: v.optional(v.string())   // optional quick-reply shortcut to use as template
}
return: string   // draft followup message
tables: conversations, messages, quickReplies (read via runQuery)
auth:   getAuthUserId via ctx.auth required
```
1. Load last 20 messages + conversation details.
2. If `templateKey` provided, load matching quick reply via `ctx.runQuery(api.quickReplies.getByShortcut, ...)` and use its text as the base prompt context.
3. Build prompt asking AI to draft a followup message for a conversation that went quiet.
4. Call `callOpenRouter(...)`, return draft (do not send — human reviews first).

**Supporting helper needed in quickReplies.ts:**

### `getByShortcut` — query
```
args:   { shortcut: v.string() }
return: Doc<"quickReplies"> | null
tables: quickReplies (read)
auth:   getAuthUserId required
```
Query `by_userId_and_shortcut` index.

---

## Schema dependencies

These new functions require the following new tables (to be added in task #11):

| Table | Used by |
|-------|---------|
| `pipelineStages` | `pipeline.ts` all functions |
| `quickReplies` | `quickReplies.ts` all functions |
| `knowledgeBaseEntries` | `knowledgeBase.ts` all functions |
| `botGoals` | `botGoals.ts` all functions |
| `conversationNotes` | `conversations.addNote`, `listNotes`, `deleteNote` |

And the following field additions to existing tables:

| Table | New fields |
|-------|-----------|
| `contacts` | `pipelineStageId`, `stageEnteredAt`, `customFields`, `aiSummary`, `aiSummaryGeneratedAt` |
| `conversations` | `assignedTo`, `typingAt` |

---

## Webhook integration point

`convex/webhooks.ts` needs one change when a new inbound message arrives in bot mode:

```
// Before calling generateAutoReply, check for goal matches:
const goalResult = await ctx.runAction(internal.ai.executeGoals, {
  userId, conversationId, instanceName, phone,
  inboundMessage: messageText,
});

// Only fall through to generateAutoReply if no goal matched
if (!goalResult.matched) {
  await ctx.scheduler.runAfter(0, internal.ai.generateAutoReply, { ... });
}
```

This change belongs in task #13 (implement bot goals system).

---

## Function count summary

| File | New functions | Type |
|------|--------------|------|
| `pipeline.ts` | 6 | 2 query, 4 mutation |
| `quickReplies.ts` | 5 | 2 query, 3 mutation |
| `knowledgeBase.ts` | 5 | 1 query, 3 mutation, 1 action + 1 internalQuery |
| `botGoals.ts` | 5 | 2 query, 2 mutation, 1 internalAction + 2 internalAction/internalQuery helpers |
| `contacts.ts` (additions) | 5 | 1 query, 3 mutation, 1 action |
| `conversations.ts` (additions) | 7 | 2 query, 5 mutation |
| `ai.ts` (additions) | 3 | 3 action/internalAction |
| **Total** | **36** | |
