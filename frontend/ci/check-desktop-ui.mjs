import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (path) => readFile(resolve(root, path), 'utf8');
const [rules, css, shell, menu, members, agents, frontAgents, doc, task, pkg] = await Promise.all([
  read('doc/design/desktop-ui.md'), read('frontend/apps/console/src/styles/desktop.css'),
  read('frontend/apps/console/src/layouts/basic.vue'),
  read('frontend/apps/console/src/components/EnterpriseCenterOverlay.vue'),
  read('frontend/apps/console/src/views/members/index.vue'),
  read('AGENTS.md'), read('frontend/AGENTS.md'),
  read('frontend/doc/README.md'), read('doc/templates/task.md'),
  read('frontend/package.json'),
]);
const errors = [];
for (const [key,value] of Object.entries({
  '--cl-header-height':'56px', '--cl-rail-expanded':'208px',
  '--cl-rail-collapsed':'76px', '--cl-flyout-width':'480px',
  '--cl-flyout-padding':'20px', '--cl-page-gutter':'24px'
})) {
  if (!css.includes(key + ': ' + value)) errors.push('Incorrect desktop token: ' + key);
  if (!rules.includes(key)) errors.push('Missing rule: ' + key);
}
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
for (const token of ['--cl-rail-surface', '--cl-header-glass-bg', '--cl-header-glass-edge']) {
  if (!css.includes(token)) errors.push('Missing glass/surface token: ' + token);
}
for (const marker of ['backdrop-filter: blur(24px) saturate(175%)', 'background-color: var(--cl-rail-surface)', 'opacity: 1']) {
  if (!css.includes(marker)) errors.push('Missing shell material contract: ' + marker);
}
if (!rules.includes('Header liquid-glass and opaque sidebar rule')) errors.push('Missing material spec');
if (!JSON.parse(pkg).scripts['check:desktop']) errors.push('Missing check:desktop script');
if (errors.length) { console.error(errors.join('\n')); process.exitCode=1; }
else console.log('PASS: canonical Desktop UI tokens, structure, live controls and global references.');
