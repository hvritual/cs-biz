/**
 * Self-checking delivery policy guard: no external dependencies, no browser.
 * The Fast Gate protects against accidentally restoring full E2E on every push.
 * It also protects the collapsed rail's reactive state/token wiring.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const load = (path) => readFileSync(resolve(root, path), 'utf8');
const sources = {
  pkg: JSON.parse(load('frontend/package.json')),
  fast: load('.github/workflows/frontend.yml'),
  full: load('.github/workflows/frontend-full.yml'),
  shell: load('frontend/apps/console/src/layouts/basic.vue'),
  overlay: load('frontend/apps/console/src/components/EnterpriseCenterOverlay.vue'),
  css: load('frontend/apps/console/src/styles/desktop.css'),
};
function problems({ pkg, fast, full, shell, overlay, css }) {
  const errors = [];
  const scripts = pkg.scripts ?? {};
  if (!scripts['check:fast']?.includes('pnpm typecheck') ||
      !scripts['check:fast']?.includes('pnpm lint') ||
      !scripts['check:fast']?.includes('pnpm test:unit') ||
      /(?:pnpm build|pnpm test:e2e)(?![:\w-])/.test(scripts['check:fast'] ?? '')) {
    errors.push('Fast Gate must run static/unit checks without build or E2E');
  }
  if (!scripts['check:full']?.includes('pnpm check:fast') ||
      !scripts['check:full']?.includes('pnpm build') ||
      !scripts['check:full']?.includes('pnpm test:e2e')) {
    errors.push('Full Gate must include fast checks, build and all E2E');
  }
  if (scripts.check !== 'pnpm check:full') errors.push('Legacy check must remain the full gate');
  if (!fast.includes('corepack pnpm check:fast') ||
      fast.includes('playwright install') || fast.includes('corepack pnpm check:full')) {
    errors.push('Push workflow must never install a browser or run the full gate');
  }
  if (!full.includes('corepack pnpm check:full') ||
      !full.includes('ready_for_review') || !full.includes('synchronize') ||
      !full.includes('!github.event.pull_request.draft') ||
      /^\s{2}push:/m.test(full)) {
    errors.push('Full Gate may run only on review-ready PRs (or explicit manual dispatch)');
  }
  if (!fast.includes('cancel-in-progress: true') || !full.includes('cancel-in-progress: true')) {
    errors.push('Obsolete runs must cancel when superseded');
  }
  if (!shell.includes("'is-collapsed': collapsed") ||
      !shell.includes(' :collapsed="collapsed"') ||
      /collapsed\.value\s*\?\s*76\s*:\s*208/.test(shell)) {
    errors.push('Shared shell collapse state is not connected to canonical tokens');
  }
  if (!overlay.includes("'is-collapsed': collapsed") ||
      overlay.includes("railWidth + 'px'") ||
      !css.includes('.cl-desktop-shell.is-collapsed') ||
      !css.includes('.cl-navigation-layer.is-collapsed')) {
    errors.push('Collapsed panel positioning must use the CSS token mapping');
  }
  return errors;
}
const failures = problems(sources);
// Negative fixtures: the policy checker must actually detect the old failure.
for (const [name, broken] of [
  ['legacy 76/208 sizing', { ...sources, shell: sources.shell.replace("'is-collapsed': collapsed", "'not-collapsed': collapsed") }],
  ['full CI on each push', { ...sources, fast: sources.fast.replace('corepack pnpm check:fast', 'corepack pnpm check:full') }],
  ['missing required E2E', { ...sources, pkg: { ...sources.pkg, scripts: { ...sources.pkg.scripts, 'check:full': 'pnpm check:fast' } } }],
]) {
  if (problems(broken).length === 0) failures.push('Policy self-test missed ' + name);
}
if (failures.length) {
  console.error('FAIL: delivery policy\n' + failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('PASS: fast/full gates, cancellation, collapse-token coupling and negative fixtures');
}
