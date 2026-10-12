<script setup lang="ts">
import type { DataScope, Grant, PermissionCode } from '#/api/mock/types';

import { ElCheckbox, ElOption, ElSelect } from 'element-plus';

import { PERMISSIONS } from '#/api/mock/types';
import { $t as t } from '#/locales';

const props = defineProps<{ modelValue: Grant[]; disabled?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: Grant[]] }>();

function selected(action: PermissionCode) {
  return props.modelValue.some((grant) => grant.action === action);
}

function scopeFor(action: PermissionCode): DataScope {
  const grants = props.modelValue.filter((grant) => grant.action === action);
  return grants.some((grant) => grant.scope === 'all') ? 'all' : 'own';
}

function setGrant(action: PermissionCode, enabled: boolean, scope?: DataScope) {
  const definition = PERMISSIONS.find((permission) => permission.code === action);
  if (!definition || props.disabled) return;
  const next = props.modelValue.filter((grant) => grant.action !== action);
  if (enabled) {
    const choice = scope ?? (definition.scopes.includes('own') ? 'own' : definition.scopes[0]);
    if (choice && definition.scopes.includes(choice)) {
      next.push({ action, scope: choice });
    }
  }
  emit('update:modelValue', next);
}
</script>

<template>
  <div class="grant-editor">
    <div class="grant-heading">
      <span>{{ t('roles.action') }}</span>
      <span>{{ t('roles.scope') }}</span>
    </div>
    <div v-for="permission in PERMISSIONS" :key="permission.code" class="grant-row">
      <ElCheckbox
        :model-value="selected(permission.code)"
        :disabled="disabled"
        @change="(value) => setGrant(permission.code, Boolean(value))"
      >
        {{ t(permission.labelKey) }}
      </ElCheckbox>
      <ElSelect
        v-if="permission.scopes.length > 1"
        :model-value="selected(permission.code) ? scopeFor(permission.code) : undefined"
        :disabled="disabled || !selected(permission.code)"
        :placeholder="t('roles.selectScope')"
        :aria-label="`${t(permission.labelKey)} · ${t('roles.scope')}`"
        @change="(value: DataScope) => setGrant(permission.code, true, value)"
      >
        <ElOption
          v-for="scope in permission.scopes"
          :key="scope"
          :value="scope"
          :label="t(scope === 'own' ? 'roles.scopeOwn' : 'roles.scopeAllCustomers')"
        />
      </ElSelect>
      <span v-else class="muted scope-label">{{ t('roles.scopeTenant') }}</span>
    </div>
  </div>
</template>

<style scoped>
.grant-editor { overflow: hidden; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; }
.grant-heading, .grant-row { display: grid; grid-template-columns: minmax(0, 1fr) 148px; align-items: center; gap: 16px; padding: 10px 14px; }
.grant-heading { background: var(--el-fill-color-light); color: var(--el-text-color-secondary); font-size: 12px; font-weight: 500; }
.grant-row + .grant-row { border-top: 1px solid var(--el-border-color-extra-light); }
.grant-row :deep(.el-checkbox) { min-width: 0; height: auto; min-height: 32px; }
.grant-row :deep(.el-checkbox__label) { white-space: normal; line-height: 20px; }
.scope-label { font-size: 13px; }
@media (max-width: 480px) { .grant-heading, .grant-row { grid-template-columns: minmax(0, 1fr) 116px; gap: 8px; padding: 10px; } }
</style>
