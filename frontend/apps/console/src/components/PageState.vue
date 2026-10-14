<script setup lang="ts">
import { ElButton, ElSkeleton } from 'element-plus';
import { FolderOpen, RotateCcw } from 'lucide-vue-next';

import { $t } from '#/locales';
import { errorMessage } from '#/utils/format';

defineProps<{ loading?: boolean; error?: unknown; empty?: boolean; emptyTitle?: string; emptyDescription?: string }>();
defineEmits<{ retry: [] }>();
</script>

<template>
  <div v-if="loading" class="loading-state" aria-live="polite" aria-busy="true">
    <span class="sr-only">{{ $t('common.loading') }}</span>
    <ElSkeleton :rows="6" animated />
  </div>
  <div v-else-if="error" class="empty-state" role="alert">
    <RotateCcw :size="28" aria-hidden="true" />
    <h2>{{ $t('common.unableToLoad') }}</h2>
    <p>{{ errorMessage(error) }}</p>
    <ElButton @click="$emit('retry')">{{ $t('common.tryAgain') }}</ElButton>
  </div>
  <div v-else-if="empty" class="empty-state">
    <FolderOpen :size="32" aria-hidden="true" />
    <h2>{{ emptyTitle || $t('common.noResults') }}</h2>
    <p v-if="emptyDescription">{{ emptyDescription }}</p>
    <slot name="emptyActions" />
  </div>
  <slot v-else />
</template>
