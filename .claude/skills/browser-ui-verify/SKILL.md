---
name: browser-ui-verify
description: Verify UI works in the browser after code changes by navigating routes, filling forms, checking for blank pages, console errors, and runtime crashes that terminal tests miss. Use this skill whenever a dev server is running and you need to verify the UI actually works — after implementing features, fixing bugs, or when the user says "check the UI", "verify in browser", "test the page", "why is it blank", or "something's broken". Also trigger after running `npm run dev`, `vp dev`, `npx vite dev`, or any dev server start. This catches runtime errors (auth failures, missing data, broken imports, blank pages) that vitest/jest unit tests cannot detect.
---

# Browser UI Verification

Verify that your app actually works in the browser — not just that tests pass. Unit tests mock everything; this skill catches what they miss: auth failures, blank pages, broken queries, missing env vars, and runtime crashes.

## Prerequisites

You need Chrome MCP tools (`mcp__claude-in-chrome__*`). Load them with ToolSearch before use:
```
ToolSearch: select:mcp__claude-in-chrome__tabs_context_mcp
ToolSearch: select:mcp__claude-in-chrome__tabs_create_mcp
ToolSearch: select:mcp__claude-in-chrome__navigate
ToolSearch: select:mcp__claude-in-chrome__read_page
ToolSearch: select:mcp__claude-in-chrome__computer
ToolSearch: select:mcp__claude-in-chrome__javascript_tool
```

## Workflow

### 1. Ensure dev server is running

Check if the dev server is up before opening Chrome:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
# or whatever port. 200 = ready, 000 = not running
```

If not running, start it in the background and wait for it:
```bash
npm run dev  # run_in_background: true
sleep 3 && curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
```

Also start the backend if needed (e.g., `npx convex dev` for Convex projects).

### 2. Open a fresh browser tab

Always get tab context first, then create a new tab — never reuse tabs from previous sessions:
```
mcp__claude-in-chrome__tabs_context_mcp(createIfEmpty: true)
mcp__claude-in-chrome__tabs_create_mcp()
mcp__claude-in-chrome__navigate(url: "http://localhost:5173", tabId: <new_tab_id>)
```

### 3. Verify the landing page loads

After navigation, check the page isn't blank:
```
mcp__claude-in-chrome__read_page(tabId, filter: "interactive")
```

If the page shows interactive elements (inputs, buttons, links), it's rendering. If `read_page` returns nothing meaningful, take a screenshot to see what's actually there:
```
mcp__claude-in-chrome__computer(action: "screenshot", tabId)
```

### 4. Handle authentication

Most apps require login. For React apps with controlled inputs, use JavaScript to set values — direct typing may not trigger React's state updates:

```javascript
// React controlled input pattern — triggers proper change events
function setReactInput(el, value) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  ).set;
  setter.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}
const inputs = document.querySelectorAll('input');
setReactInput(inputs[0], 'user@example.com');  // email
setReactInput(inputs[1], 'password123');         // password
```

Then submit via clicking the submit button or pressing Enter. Wait 2-3 seconds for auth to complete and check if the URL changed (successful login typically redirects).

Where to find test credentials:
- Check `.env.local` for `TEST_EMAIL`, `TEST_PASSWORD`, or similar
- Check CLAUDE.md for test account info
- Ask the user if no credentials are found

### 5. Navigate through key routes

After auth, visit each important route and verify it renders:

For each route:
1. Navigate to it
2. Wait 1-2 seconds
3. Check `read_page` for expected elements
4. If blank or broken, take a screenshot and check for errors

Key things to look for:
- **Blank page** — React crashed silently, no error boundary caught it
- **Loading spinner that never resolves** — backend query failing
- **Error overlay** — Vite error overlay or React error boundary
- **Missing UI elements** — component failed to render

### 6. Check for errors

#### Console errors
```javascript
// Via javascript_tool — check for error overlay
document.querySelector('vite-error-overlay') ? 'VITE_ERROR' : 'OK'
```

#### Dev server terminal
If you started the dev server in the background, check its output:
```
TaskOutput(task_id: <dev_server_task_id>, block: false)
```

Look for patterns like:
- `[console.error]` — runtime errors
- `Uncaught Error` — unhandled exceptions
- `Server Error` — backend function failures
- `"User not found"`, `"Not authenticated"` — auth issues
- Component name in error — identifies which component crashed

### 7. Diagnose and fix

Common issues and their fixes:

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Blank page, no errors visible | React component threw, no error boundary | Check terminal for the actual error, wrap in error boundary |
| "User not found" in terminal | Auth lookup using wrong field | Use the framework's auth helper (e.g., `getAuthUserId` for Convex Auth) |
| Page loads but data is empty | Query/subscription not returning data | Check if backend functions are deployed, check auth context |
| "Cannot find module" | Import path broken in production | Check aliases in bundler config (vite.config.ts, tsconfig.json) |
| Form submit does nothing | React controlled inputs not receiving state | Use the `setReactInput` JavaScript pattern above |

### 8. Report results

After verification, report clearly:
- Which routes were checked
- What worked vs what failed
- Screenshots of any issues found
- Console/terminal errors with context
- Suggested fixes for any problems

## Tips

- **Always screenshot failures** — visual evidence helps diagnose issues faster than text descriptions
- **Check terminal AND browser** — some errors only appear server-side (backend function errors), others only in the browser (rendering issues)
- **React form gotcha** — `form_input` and direct typing often don't trigger React's `onChange`. Always use the `setReactInput` JavaScript pattern for controlled inputs
- **After fixing code, reload the page** — navigate to the same URL again rather than assuming HMR caught everything
- **Auth state persists** — if you logged in once, subsequent navigations within the same tab stay authenticated. No need to re-login for each route
