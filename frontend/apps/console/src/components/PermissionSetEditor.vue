<script setup lang="ts">
import type { CheckboxValueType } from 'element-plus';

import type { DataScope, Grant, MenuKey, PermissionCode } from '#/api/mock/types';

import { computed } from 'vue';

import { ElCheckbox, ElRadio, ElRadioGroup, ElSwitch } from 'element-plus';

import { MENU_CATALOG, PERMISSIONS } from '#/api/mock/types';
import { $t as t } from '#/locales';

const props = defineProps<{ disabled?: boolean; modelValue: Grant[] }>();
const emit = defineEmits<{ 'update:modelValue': [value: Grant[]] }>();

interface ActionCell { code: PermissionCode; labelKey: string; scopes: DataScope[] }
interface Leaf { key: MenuKey; labelKey: string; readCode: PermissionCode; actions: ActionCell[] }
interface Section { key: MenuKey; labelKey: string; leaves: Leaf[] }

const READ_CODE: Partial<Record<MenuKey, PermissionCode>> = {
  'workspace.overview': 'workspace.read',
  'crm.customer.list': 'crm.customer.read',
  'workspace.members': 'tenant.member.read',
  'workspace.roles': 'tenant.role.read',
  'workspace.profile': 'tenant.profile.read',
  'workspace.apps': 'tenant.module.read',
};

const scopeRank: Record<DataScope, number> = { own: 0, group: 1, all: 2 };

// Each first-level menu becomes one partition holding its own menu, function and data columns.
const sections = computed<Section[]>(() => MENU_CATALOG.map((entry) => {
  const nodes = entry.children.length > 0 ? entry.children : [{ key: entry.key, labelKey: entry.labelKey }];
  const leaves: Leaf[] = nodes.map((node) => {
    const readCode = READ_CODE[node.key] as PermissionCode;
    const actions = PERMISSIONS
      .filter((permission) => permission.menu === node.key)
      .map((permission) => ({ code: permission.code, labelKey: permission.labelKey, scopes: permission.scopes }));
    return { key: node.key, labelKey: node.labelKey, readCode, actions };
  });
  return { key: entry.key, labelKey: entry.labelKey, leaves };
}));

const grants = computed(() => props.modelValue);

function has(code: PermissionCode): boolean {
  return grants.value.some((grant) => grant.action === code);
}

function scopeOf(code: PermissionCode): DataScope | undefined {
  return grants.value.find((grant) => grant.action === code)?.scope;
}

function leafCodes(leaf: Leaf): PermissionCode[] {
  return leaf.actions.map((action) => action.code);
}

function leafEnabled(leaf: Leaf): boolean {
  return leafCodes(leaf).some((code) => has(code));
}

function sectionEnabled(section: Section): boolean {
  return section.leaves.some((leaf) => leafEnabled(leaf));
}

function multiScope(leaf: Leaf): ActionCell[] {
  return leaf.actions.filter((action) => action.scopes.length > 1);
}

// The widest chosen scope wins so the control reflects the member's actual reach.
function leafScope(leaf: Leaf): DataScope {
  let widest: DataScope = 'own';
  for (const action of multiScope(leaf)) {
    const scope = scopeOf(action.code);
    if (scope && scopeRank[scope] > scopeRank[widest]) widest = scope;
  }
  return widest;
}

function defaultScope(scopes: DataScope[]): DataScope {
  return scopes.includes('own') ? 'own' : scopes[0] as DataScope;
}

function withGrant(next: Grant[], code: PermissionCode, scope: DataScope): Grant[] {
  return [...next.filter((grant) => grant.action !== code), { action: code, scope }];
}

function withoutGrants(next: Grant[], codes: PermissionCode[]): Grant[] {
  const drop = new Set(codes);
  return next.filter((grant) => !drop.has(grant.action));
}

function publish(next: Grant[]): void {
  if (props.disabled) return;
  emit('update:modelValue', next);
}

function toggleAction(code: PermissionCode, scopes: DataScope[], value: CheckboxValueType): void {
  const enabled = value === true;
  if (props.disabled) return;
  let next = props.modelValue.filter((grant) => grant.action !== code);
  if (enabled) next = withGrant(next, code, scopeOf(code) ?? defaultScope(scopes));
  publish(next);
}

function setLeafScope(leaf: Leaf, value: unknown): void {
  if (props.disabled) return;
  const scope = value as DataScope;
  let next = [...props.modelValue];
  for (const action of multiScope(leaf)) {
    if (has(action.code) && action.scopes.includes(scope)) next = withGrant(next, action.code, scope);
  }
  publish(next);
}

function toggleLeaf(leaf: Leaf, value: boolean | number | string): void {
  const enabled = value === true;
  if (props.disabled) return;
  let next = withoutGrants(props.modelValue, leafCodes(leaf));
  if (enabled) next = withGrant(next, leaf.readCode, defaultScope(PERMISSIONS.find((permission) => permission.code === leaf.readCode)?.scopes ?? ['all']));
  publish(next);
}

function toggleSection(section: Section, value: boolean | number | string): void {
  const enabled = value === true;
  if (props.disabled) return;
  let next = withoutGrants(props.modelValue, section.leaves.flatMap((leaf) => leafCodes(leaf)));
  if (enabled) {
    for (const leaf of section.leaves) {
      next = withGrant(next, leaf.readCode, defaultScope(PERMISSIONS.find((permission) => permission.code === leaf.readCode)?.scopes ?? ['all']));
    }
  }
  publish(next);
}
</script>

<template>
  <div class="pse">
    <div class="pse-head">
      <span>{{ t('roles.menuColumn') }}</span>
      <span>{{ t('roles.functionColumn') }}</span>
      <span>{{ t('roles.dataColumn') }}</span>
    </div>
    <section v-for="section in sections" :key="section.key" class="pse-section">
      <div v-if="section.leaves.length > 1" class="pse-section-head">
        <span class="pse-section-title">{{ t(section.labelKey) }}</span>
        <ElSwitch
          :model-value="sectionEnabled(section)"
          :disabled="disabled"
          :aria-label="`${t(section.labelKey)} · ${t('roles.menuColumn')}`"
          @change="(value) => toggleSection(section, value)"
        />
      </div>
      <div v-for="leaf in section.leaves" :key="leaf.key" class="pse-row" :class="{ 'is-child': section.leaves.length > 1 }">
        <div class="pse-menu">
          <span class="pse-menu-label">{{ t(leaf.labelKey) }}</span>
          <ElSwitch
            :model-value="leafEnabled(leaf)"
            :disabled="disabled"
            :aria-label="`${t(leaf.labelKey)} · ${t('roles.menuColumn')}`"
            @change="(value) => toggleLeaf(leaf, value)"
          />
        </div>
        <div class="pse-functions">
          <ElCheckbox
            v-for="action in leaf.actions"
            :key="action.code"
            :model-value="has(action.code)"
            :disabled="disabled"
            @change="(value) => toggleAction(action.code, action.scopes, value)"
          >
            {{ t(action.labelKey) }}
          </ElCheckbox>
        </div>
        <div class="pse-data">
          <template v-if="multiScope(leaf).length > 0">
            <ElRadioGroup
              v-if="leafEnabled(leaf)"
              :model-value="leafScope(leaf)"
              :disabled="disabled"
              class="pse-scope-group"
              @change="(value) => setLeafScope(leaf, value)"
            >
              <ElRadio v-for="scope in (['own', 'group', 'all'] as DataScope[])" :key="scope" :value="scope">
                {{ t(scope === 'own' ? 'roles.scopeOwnShort' : scope === 'group' ? 'roles.scopeGroupShort' : 'roles.scopeAllShort') }}
              </ElRadio>
            </ElRadioGroup>
            <span v-else class="pse-scope-idle">{{ t('roles.scopeDisabled') }}</span>
          </template>
          <span v-else class="pse-scope-tenant">{{ t('roles.scopeTenant') }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pse { border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; }
.pse-head, .pse-row { display: grid; grid-template-columns: minmax(0, 220px) minmax(0, 1fr) minmax(0, 240px); align-items: center; gap: var(--space-4); }
.pse-head { padding: 10px var(--space-4); background: var(--color-surface-soft); color: var(--color-text-secondary); font-size: var(--text-xs); font-weight: 600; }
.pse-section + .pse-section { border-top: 1px solid var(--color-border); }
.pse-section-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: 10px var(--space-4); background: var(--color-primary-soft); }
.pse-section-title { font-size: var(--text-sm); font-weight: 650; color: var(--color-text); }
.pse-row { padding: 10px var(--space-4); border-top: 1px solid var(--color-border); }
.pse-row.is-child .pse-menu { padding-left: var(--space-4); }
.pse-menu { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); min-width: 0; }
.pse-menu-label { font-size: var(--text-sm); color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pse-functions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-4); min-width: 0; }
.pse-functions :deep(.el-checkbox) { height: auto; min-height: 28px; margin-right: 0; }
.pse-functions :deep(.el-checkbox__label) { font-size: var(--text-sm); white-space: normal; line-height: 18px; }
.pse-data { min-width: 0; }
.pse-scope-group { display: flex; flex-wrap: nowrap; gap: var(--space-3); }
.pse-scope-group :deep(.el-radio) { height: auto; margin-right: 0; }
.pse-scope-group :deep(.el-radio__label) { font-size: var(--text-sm); padding-left: 6px; }
.pse-scope-idle, .pse-scope-tenant { font-size: var(--text-sm); color: var(--color-text-muted); }
</style>
