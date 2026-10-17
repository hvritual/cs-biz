<script setup lang="ts">
import { usePreferences } from '@vben/preferences';
import { Building2, Users, Megaphone, Contact, Activity, ShieldCheck, KeyRound, SearchCheck } from 'lucide-vue-next';
import { reviewPages } from './catalog';
import { l, pair } from './copy';
import { useFullReviewState } from './state';
const s = useFullReviewState(); const { sidebarCollapsed } = usePreferences();
const primary = new Set(['identity','organizations','sessions','tenants','members','invitations','roles','modules','campaigns','customers','tasks','delivery','diagnostics','audit','telemetry','qualification','release']);
const icons = {identity:KeyRound,platform:Building2,access:Users,marketing:Megaphone,customers:Contact,operations:Activity,observability:SearchCheck,release:ShieldCheck};
</script>
<template>
  <div class="full-primary-links" role="menu" :aria-label="l('审阅页面导航','Review page navigation')">
    <p v-if="!sidebarCollapsed" class="full-muted" style="padding:0 18px;font-size:11px">{{ l('审阅页面导航','Review page navigation') }}</p>
    <button v-for="item in reviewPages.filter(x=>primary.has(x.id))" :key="item.id" type="button" role="menuitem" class="cl-primary-link" :class="{'is-active':s.page.id===item.id}" :title="pair(item.title)" :aria-label="pair(item.title)" :aria-current="s.page.id===item.id?'page':undefined" @click="s.go(item.id)">
      <component :is="icons[item.group]" :size="18" aria-hidden="true" /><span v-if="!sidebarCollapsed" class="cl-primary-text">{{ pair(item.title) }}</span>
    </button>
  </div>
</template>
<style scoped>
.full-primary-links { flex:1; min-height:0; overflow:auto; display:flex; flex-direction:column; gap:3px; padding:6px 0 16px; }
.cl-primary-link { min-height:36px; flex-shrink:0; }
</style>
