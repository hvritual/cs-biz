<script setup lang="ts">
defineProps<{ items: { label: string; value: string | number }[] }>();
</script>

<template>
  <dl class="stat-strip">
    <div v-for="item in items" :key="item.label">
      <dt>{{ item.label }}</dt><dd>{{ item.value }}</dd>
    </div>
  </dl>
</template>
