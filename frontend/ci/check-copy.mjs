import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../apps/console/src/', import.meta.url));
const forbidden = /未接入|未对接|开发中|待开发|占位|演示数据|模拟数据|接口未|后端未|前端未|\b(?:mock|stub|placeholder|TODO|API|backend|frontend|not implemented|coming soon)\b/i;
const failures = [];

function flatten(value, path = '', output = new Map()) {
  for (const [key, item] of Object.entries(value)) {
    const name = path ? `${path}.${key}` : key;
    if (typeof item === 'string') output.set(name, item);
    else if (item && typeof item === 'object') flatten(item, name, output);
    else failures.push(`${name}: translation must be text`);
  }
  return output;
}

const locales = {};
for (const locale of ['zh-CN', 'en-US']) {
  const values = new Map();
  const directory = resolve(root, 'locales/langs', locale);
  for (const file of (await readdir(directory)).filter((name) => name.endsWith('.json'))) {
    const json = JSON.parse(await readFile(resolve(directory, file), 'utf8'));
    for (const [key, value] of flatten(json, file.slice(0, -5))) {
      values.set(key, value);
      if (!value.trim() || forbidden.test(value)) failures.push(`${locale}/${key}: invalid product copy: ${value}`);
    }
  }
  locales[locale] = values;
}

const allKeys = new Set([...locales['zh-CN'].keys(), ...locales['en-US'].keys()]);
const ownedNamespaces = new Set([...allKeys].map((key) => key.split('.')[0]));
const staticReferences = new Set();
for (const key of allKeys) {
  const zh = locales['zh-CN'].get(key);
  const en = locales['en-US'].get(key);
  if (!zh || !en) failures.push(`${key}: missing language`);
  else {
    const slots = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(',');
    if (slots(zh) !== slots(en)) failures.push(`${key}: interpolation fields differ`);
  }
}

async function inspectTemplates(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await inspectTemplates(path);
    else if (entry.name.endsWith('.vue') || (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts'))) {
      const source = await readFile(path, 'utf8');
      for (const match of source.matchAll(/\$t\(\s*['"]([\w.-]+)['"]/g)) {
        const key = match[1];
        if (!ownedNamespaces.has(key.split('.')[0])) continue;
        staticReferences.add(key);
        if (!allKeys.has(key)) failures.push(`${path}: unknown application translation key ${key}`);
      }
      if (!entry.name.endsWith('.vue')) continue;
      const template = source.replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<style\b[\s\S]*?<\/style>/g, '');
      const literals = template.replace(/\{\{[\s\S]*?\}\}/g, '').replace(/<!--[^]*?-->/g, '');
      for (const match of literals.matchAll(/>([^<>]+)</g)) {
        if (forbidden.test(match[1])) failures.push(`${path}: engineering words in visible text`);
      }
      for (const match of literals.matchAll(/(?<![:\w-])(?:title|placeholder|aria-label|alt)="([^"]*)"/g)) {
        if (forbidden.test(match[1])) failures.push(`${path}: engineering words in visible attribute`);
      }
    }
  }
}
await inspectTemplates(root);

if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`PASS: ${allKeys.size} application translation keys, ${staticReferences.size} static application references, two languages, matching interpolation fields, product copy scan.\n`);
  process.stdout.write('Scope: application locale values, static references in owned namespaces, and literal Vue text/labels; browser journeys also inspect rendered copy.\n');
}
