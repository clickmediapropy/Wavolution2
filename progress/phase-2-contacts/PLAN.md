# Phase 2: Contact Management

**Goal:** Full contact CRUD with CSV import, search, and paginated list.

**Depends on:** Phase 1 (auth, schema, project setup)

---

## Deliverables

1. `ContactsPage` — paginated table with search, add/edit/delete actions
2. `UploadContactsPage` — CSV file upload and import
3. `ContactTable` component — shadcn Table with cursor-based pagination (`usePaginatedQuery`)
4. Convex functions: `contacts.ts` (list, add, update, delete, deleteMultiple, importCsv, search)
5. `WhatsAppGuard` component (redirects to setup if not connected — will block navigation until Phase 3)
6. Add contact modal / inline form
7. Edit contact modal
8. Delete confirmation dialog (single + bulk)

## TDD Steps

### Tests First

```
tests/
├── convex/
│   ├── contacts.test.ts        # CRUD operations, search, pagination, uniqueness (user_id + phone)
│   └── contacts-import.test.ts # CSV parsing, duplicate handling, error counts
├── components/
│   └── ContactTable.test.tsx   # Renders contacts, pagination controls, search input
└── pages/
    ├── ContactsPage.test.tsx   # Integration: shows table, handles add/edit/delete
    └── UploadContactsPage.test.tsx # File input, upload feedback, stats display
```

### Implementation Order

1. Write Convex functions (`convex/contacts.ts`):
   - `list` query with `usePaginatedQuery` support
   - `search` query using search index
   - `add` mutation (validates uniqueness via `by_user_phone` index)
   - `update` mutation
   - `delete` mutation (single)
   - `deleteMultiple` mutation
   - `importCsv` action (parses CSV, calls internal mutations)
   - `getStats` query (total, pending, sent, failed counts)
2. Write tests for all Convex functions
3. Write `ContactTable` component with shadcn `Table`, `Input`, pagination
4. Write `ContactsPage` — wires ContactTable to Convex queries
5. Write Add/Edit modals with shadcn `Dialog` + `Form`
6. Write Delete confirmation with shadcn `AlertDialog`
7. Write `UploadContactsPage` — file input, progress, result stats
8. Write `WhatsAppGuard` component (placeholder — will fully work in Phase 3)
9. Run all tests, manual verification

## Verification Criteria

- [ ] Can view paginated contact list
- [ ] Can search contacts by name
- [ ] Can add a new contact (duplicate phone per user is rejected)
- [ ] Can edit a contact's name and phone
- [ ] Can delete a single contact
- [ ] Can bulk-delete multiple contacts
- [ ] Can upload a CSV file and see import stats (added, duplicates, errors)
- [ ] Empty state shown when no contacts
- [ ] All tests pass (`vp test`)
