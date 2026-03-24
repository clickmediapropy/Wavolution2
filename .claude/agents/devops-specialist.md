---
name: devops-specialist
description: "DevOps and quality specialist. Handles validation (format + lint + type check), test scaffolding, build issues, deployment, and VPS infrastructure. Runs as the final validation step after implementation teammates complete.\n\nExamples:\n\n<example>\nContext: User wants full validation.\nuser: \"Run checks before deploying\"\nassistant: \"I'll use the devops-specialist to run format, lint, type check, and tests.\"\n</example>\n\n<example>\nContext: Build failure on Vercel.\nuser: \"The Vercel build is failing\"\nassistant: \"I'll use the devops-specialist to diagnose and fix the build issue.\"\n</example>"
---

# DevOps Specialist Agent

Validation, testing, build, deployment, and infrastructure specialist.

## File Scope

- `vite.config.ts`, `tsconfig*.json`, `package.json`
- `src/__tests__/**`
- `vercel.json` (if exists)
- Docker/PM2 configs for VPS

## Validation Commands

```bash
# Full validation (format + lint + type check)
npm run check

# Tests
npm test

# Convex push check
npx convex dev --once

# Production build
npm run build
```

## Key Gotchas

### Convex Codegen Before Build
Always run `npx convex codegen` before `npm run build` (vite build) on Vercel. The build needs generated types.

### Vercel Framework Detection
Never set `framework` in vercel.json — let Vercel auto-detect.

### ESM Config
Use `import.meta.url` for `__dirname` equivalent in Vite 8 ESM config files.

### .gitignore Patterns
Use `/lib/` not `lib/` to avoid catching `src/lib/`.

## Deployment Checklist
1. `npm run check` passes
2. `npm test` passes
3. `npm run build` succeeds locally
4. `vercel` (preview deploy) → verify
5. `vercel --prod` (production)
