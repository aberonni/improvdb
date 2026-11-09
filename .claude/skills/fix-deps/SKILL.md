---
name: fix-deps
description: Fix a failing dependency update (Renovate) branch or PR - resolve peer dependency conflicts, apply code changes for breaking upgrades, and get typecheck, lint, build and E2E tests green. Use when the user runs /fix-deps or asks to fix a dependency update PR.
argument-hint: <branch-name-or-PR-number>
---

# Fix a dependency update branch

Target: `$ARGUMENTS` (a Renovate branch name like `renovate/react-table-9.x`, or a PR number).

## 1. Check out the branch

- Stop and tell the user if `git status --porcelain` is not empty.
- `git fetch origin`
- Branch name: `git checkout <branch>` (tracking `origin/<branch>`).
- PR number: `git fetch origin pull/<N>/head:pr-<N> && git checkout pr-<N>`. Note that pushing back
  requires the real head branch name. Find it with `git ls-remote origin | grep <sha>`.

## 2. Understand what changed

- `git diff origin/main -- package.json` to list bumped packages.
- For every **major** bump, read the release notes / migration guide (GitHub releases, CHANGELOG.md
  or the official upgrade guide) before touching code. Note breaking changes that affect APIs used
  in this repo (`grep` for the imports under `src/`, `prisma/`, `tests/`).

## 3. Install

- `fnm use`, then `npm ci`.
- On `ERESOLVE` / peer dependency errors: find which package's peer range doesn't accept the new
  version and upgrade that package too (check `npm view <pkg> peerDependencies` for newer
  releases). Prefer upgrading the lagging package over `--legacy-peer-deps` or `overrides`. Only use
  `overrides` as a last resort, and tell the user why. Re-run `npm install` to update the lockfile.

## 4. Static checks (same as CI)

Run, fix, and repeat until all pass:

```bash
npm run typecheck
npm run lint
npx next build --webpack   # not `npm run build`: that runs `prisma migrate deploy`
```

Follow the conventions in CLAUDE.md (`@/` imports, Tailwind classes, shadcn components in
`src/components/ui/`). Fix the root cause. Don't silence errors with `any`, `@ts-expect-error` or
eslint-disable unless the upstream types are genuinely wrong, and say so if you do.

## 5. E2E tests (required)

```bash
npm run test:e2e
```

This runs in Docker against a fresh database, exactly like CI. If it fails:

- Functional failures: fix the code (or the test, if the upgrade intentionally changed behaviour
  the test relied on, such as markup or accessible names).
- Screenshot diffs: inspect the expected/actual/diff images under `test-results/`. If the
  difference is an expected visual change caused by the upgrade, run `npm run test:e2e:update` and
  list the updated snapshots in your summary. If it looks like a regression, fix the code instead.

Iterate with `npm run test:e2e -- <spec file>` for speed, then run the full suite once at the end.

## 6. Commit and hand back

- Commit the fixes on the branch with a message that summarises the changes per package.
- **Ask the user before pushing.** Once pushed and CI is green, Renovate auto-merges the PR.
- Final summary: what was bumped, what code changed and why, any updated snapshots, and anything
  that tests don't cover and that deserves a manual check (for example, email sending for
  `nodemailer`, or OG images for `@vercel/og`).
