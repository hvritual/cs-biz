<script setup lang="ts">
import type { CheckboxValueType } from 'element-plus';
import type { ConsoleMenuKey, DataScope, Grant, MenuKey, PermissionCode } from '#/api/mock/types';
import { computed } from 'vue';
import { ElCheckbox, ElRadio, ElRadioGroup, ElSwitch } from 'element-plus';
import { MENU_CATALOG, PERMISSIONS } from '#/api/mock/types';
import { $t as t } from '#/locales';

const props = defineProps<{ disabled?: boolean; modelValue: Grant[]; menuGrants: ConsoleMenuKey[] }>();
const emit = defineEmits<{
  'update:modelValue': [value: Grant[]];
  'update:menuGrants': [value: ConsoleMenuKey[]];
}>();
interface ActionCell { code: PermissionCode; labelKey: string; scopes: DataScope[] }
interface Leaf { key: MenuKey; labelKey: string; actions: ActionCell[]; console: boolean }
interface Section { key: MenuKey; labelKey: string; leaves: Leaf[] }
const sections = computed<Section[]>(() => MENU_CATALOG.map((entry) => ({
  key: entry.key, labelKey: entry.labelKey,
  leaves: (entry.children.length ? entry.children : [{ key: entry.key, labelKey: entry.labelKey }]).map((node) => ({
    key: node.key, labelKey: node.labelKey, console: node.key !== 'marketing.functions',
    actions: PERMISSIONS.filter((item) => item.menu === node.key)
      .map((item) => ({ code: item.code, labelKey: item.labelKey, scopes: item.scopes })),
  })),
})));
const has = (code: PermissionCode) => props.modelValue.some((g) => g.action === code);
const scopeOf = (code: PermissionCode) => props.modelValue.find((g) => g.action === code)?.scope;
const enabledMenu = (key: MenuKey) => props.menuGrants.includes(key as ConsoleMenuKey);
const sectionEnabled = (section: Section) => section.leaves.filter((leaf) => leaf.console).every((leaf) => enabledMenu(leaf.key));
const defaultScope = (scopes: DataScope[]): DataScope => scopes.includes('own') ? 'own' : scopes[0]!;
function toggleMenu(key: MenuKey, enabled: unknown) {
  if (props.disabled || key === 'marketing.functions') return;
  const menus = props.menuGrants.filter((item) => item !== key);
  if (enabled === true) menus.push(key as ConsoleMenuKey);
  emit('update:menuGrants', menus);
}
function toggleSection(section: Section, value: unknown) {
  if (props.disabled) return;
  const keys = section.leaves.filter((leaf) => leaf.console).map((leaf) => leaf.key as ConsoleMenuKey);
  const next = props.menuGrants.filter((item) => !keys.includes(item));
  if (value === true) next.push(...keys);
  emit('update:menuGrants', next);
}
function toggleAction(code: PermissionCode, scopes: DataScope[], value: CheckboxValueType) {
  if (props.disabled) return;
  const next = props.modelValue.filter((item) => item.action !== code);
  if (value === true) next.push({ action: code, scope: scopeOf(code) ?? defaultScope(scopes) });
  emit('update:modelValue', next);
}
function setActionScope(code: PermissionCode, scope: DataScope) {
  if (props.disabled || !has(code)) return;
  const allowed = PERMISSIONS.find((item) => item.code === code)?.scopes ?? [];
  if (!allowed.includes(scope)) return;
  emit('update:modelValue', props.modelValue.map((item) => item.action === code ? { ...item, scope } : item));
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
        <ElSwitch :model-value="sectionEnabled(section)" :disabled="disabled"
          :aria-label="`${t(section.labelKey)} · ${t('roles.menuColumn')}`"
          @change="(value) => toggleSection(section, value)" />
      </div>
      <div v-for="leaf in section.leaves" :key="leaf.key" class="pse-row" :class="{ 'is-child': section.leaves.length > 1 }">
        <div class="pse-menu">
          <span class="pse-menu-label">{{ t(leaf.labelKey) }}</span>
          <ElSwitch v-if="leaf.console" :model-value="enabledMenu(leaf.key)" :disabled="disabled"
            :aria-label="`${t(leaf.labelKey)} · ${t('roles.menuColumn')}`"
            @change="(value) => toggleMenu(leaf.key, value)" />
          <span v-else class="pse-scope-tenant">{{ t('roles.externalMenu') }}</span>
        </div>
        <div class="pse-functions">
          <ElCheckbox v-for="action in leaf.actions" :key="action.code"
            :model-value="has(action.code)" :disabled="disabled"
            @change="(value) => toggleAction(action.code, action.scopes, value)">
            {{ t(action.labelKey) }}
          </ElCheckbox>
        </div>
        <div class="pse-data">
          <div v-for="action in leaf.actions" :key="action.code" class="pse-action-scope">
            <ElRadioGroup v-if="has(action.code) && action.scopes.length > 1"
              :model-value="scopeOf(action.code)" :disabled="disabled" class="pse-scope-group"
              :aria-label="`${t(action.labelKey)} · ${t('roles.dataColumn')}`"
              @change="(value) => setActionScope(action.code, value as DataScope)">
              <ElRadio v-for="scope in action.scopes" :key="scope" :value="scope">
                {{ t(scope === 'own' ? 'roles.scopeOwnShort' : scope === 'group' ? 'roles.scopeGroupShort' : 'roles.scopeAllShort') }}
              </ElRadio>
            </ElRadioGroup>
            <span v-else-if="has(action.code)" class="pse-scope-tenant">{{ t('roles.scopeTenant') }}</span>
            <span v-else class="pse-scope-idle">{{ t('roles.scopeDisabled') }}</span>
          </div>
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
.pse-action-scope { min-height: 30px; display: flex; align-items: center; }
.pse-scope-group { display: flex; flex-wrap: nowrap; gap: var(--space-3); }
.pse-scope-group :deep(.el-radio) { height: auto; margin-right: 0; }
.pse-scope-group :deep(.el-radio__label) { font-size: var(--text-sm); padding-left: 6px; }
.pse-scope-idle, .pse-scope-tenant { font-size: var(--text-sm); color: var(--color-text-muted); }
</style>
