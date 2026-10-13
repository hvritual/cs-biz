import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (path) => readFile(resolve(root, path), 'utf8');
const [rules, css, tokens, shell, menu, members, agents, frontAgents, doc, task, pkg] = await Promise.all([
  read('doc/design/desktop-ui.md'), read('frontend/apps/console/src/styles/desktop.css'),
  read('frontend/apps/console/src/styles/coffeelink-tokens.css'),
  read('frontend/apps/console/src/layouts/basic.vue'),
  read('frontend/apps/console/src/components/EnterpriseCenterOverlay.vue'),
  read('frontend/apps/console/src/views/members/index.vue'),
  read('AGENTS.md'), read('frontend/AGENTS.md'),
  read('frontend/doc/README.md'), read('doc/templates/task.md'),
  read('frontend/package.json'),
]);
const errors = [];
// Verify imported Biz V1.2 numbers, then verify cs-biz uses aliases instead of copies.
const canonical = {
  '--header-height': '56px',
  '--rail-width': '200px',
  '--rail-collapsed-width': '68px',
  '--rail-offset': '8px',
  '--module-width': '480px',
  '--member-detail-width': '360px',
  '--content-padding': '24px',
  '--control-height': '36px',
  '--table-row-height': '64px',
  '--color-text': '#1f2937',
  '--color-text-muted': '#64748b',
  '--color-canvas': '#f5f7fa',
  '--color-surface': '#ffffff',
  '--color-border': '#e5e7eb',
};
for (const [key,value] of Object.entries(canonical)) {
  if (!tokens.includes(key + ': ' + value)) errors.push('Invalid Biz V1.2 token: ' + key);
  if (!rules.includes(key)) errors.push('Design rule omits source token: ' + key);
}
const aliases = {
  '--cl-header-height': '--header-height',
  '--cl-rail-expanded': '--rail-width',
  '--cl-rail-collapsed': '--rail-collapsed-width',
  '--cl-rail-gutter': '--rail-offset',
  '--cl-flyout-width': '--module-width',
  '--cl-page-gutter': '--content-padding',
  '--cl-canvas': '--color-canvas',
  '--cl-action': '--color-primary',
  '--cl-line': '--color-border',
};
for (const [alias,source] of Object.entries(aliases)) {
  if (!css.includes(alias + ': var(' + source + ');')) errors.push('Missing semantic alias: ' + alias);
}
if (!tokens.includes('--color-primary: var(--el-color-primary, #2563eb);'))
  errors.push('Tenant primary color no longer follows Element Plus branding');
if (!tokens.includes(':root.dark') || !tokens.includes(":root[data-density='compact']"))
  errors.push('Biz semantic dark/density variants are missing');
if (!css.includes('left: var(--cl-rail-gutter)') || !css.includes('margin-left: calc(var(--cl-rail-current) + var(--cl-rail-gutter))'))
  errors.push('Biz inset rail / main geometry missing');
for (const source of [agents,frontAgents,doc,task]) {
  if (!source.includes('doc/design/desktop-ui.md')) errors.push('Missing global UI contract reference');
}
for (const item of ['cl-global-header','cl-primary-rail','cl-desktop-main','EnterpriseCenterOverlay']) if(!shell.includes(item)) errors.push('Shell: ' + item);
for (const item of ['cl-navigation-columns','cl-navigation-panel','cl-navigation-mask','canVisitPath','Escape']) if(!(menu+css).includes(item)) errors.push('Overlay: ' + item);
for (const item of ['cl-metrics','cl-members-filter-panel','cl-members-table','cl-member-detail','memberReadScope']) if(!members.includes(item)) errors.push('Members: ' + item);
for (const source of [css,shell,menu,members]) {
  if (/@media\s*\(\s*max-width/i.test(source)) errors.push('Unexpected mobile-specific rule');
  if (/action\s*:\s*\(\s*\)\s*=>\s*\{\s*\}/.test(source)) errors.push('Inert product control');
}
for (const token of ['--cl-rail-surface', '--cl-header-glass-bg', '--cl-header-glass-edge',
  '--cl-table-header-surface', '--cl-table-header-text']) {
  if (!css.includes(token)) errors.push('Missing glass/surface token: ' + token);
}
for (const marker of ['backdrop-filter: blur(24px) saturate(175%)', 'background-color: var(--cl-rail-surface)', 'opacity: 1']) {
  if (!css.includes(marker)) errors.push('Missing shell material contract: ' + marker);
}
if (!rules.includes('Header liquid-glass and opaque sidebar rule')) errors.push('Missing material spec');
if (!shell.includes("'is-collapsed': collapsed") || !shell.includes(' :collapsed="collapsed"')) {
  errors.push('Desktop shell must publish one reactive collapse state to rail, content and overlay');
}
if (!menu.includes("'is-collapsed': collapsed") || menu.includes("railWidth + 'px'")) {
  errors.push('Company flyout must derive position from the canonical collapse token');
}
if (!JSON.parse(pkg).scripts['check:desktop']) errors.push('Missing check:desktop script');
if (errors.length) { console.error(errors.join('\n')); process.exitCode=1; }
else console.log('PASS: Biz V1.2 semantic tokens, inset 200/68 rail, adaptive tenant theme, Desktop UI contract and global references.');
