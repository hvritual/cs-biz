<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Building2, Layers3, Plus, Settings, ShieldCheck, UserRound, Users, X } from 'lucide-vue-next';
import { $t } from '#/locales';
import { canVisitPath } from '#/platform/routing';
import { useWorkspaceStore } from '#/store';

const props = defineProps<{ visible: boolean; railWidth: number; activePath: string }>();
const emit = defineEmits<{ close: []; navigate: [] }>();
const router = useRouter();
const workspace = useWorkspaceStore();
const menu = computed(() => {
  void workspace.context?.accessVersion;
  return [
  { key: 'personal', title: $t('menu.personal'), path: '/personal', icon: UserRound, allowed: !!workspace.user },
  { key: 'members', title: $t('menu.members'), path: '/members', icon: Users, allowed: canVisitPath('/members') },
  { key: 'roles', title: $t('menu.roles'), path: '/roles', icon: ShieldCheck, allowed: canVisitPath('/roles') },
  { key: 'applications', title: $t('menu.applications'), path: '/applications', icon: Layers3, allowed: canVisitPath('/applications') },
  { key: 'settings', title: $t('menu.settings'), path: '/settings', icon: Building2, allowed: canVisitPath('/settings') },
].filter((entry) => entry.allowed);
});
const actions = computed(() => [
  { key: 'addMember', title: $t('shell.addMember'), path: '/members?create=1', icon: Plus, allowed: canVisitPath('/members') && workspace.can('tenant.member.manage') },
  { key: 'newRole', title: $t('shell.newRole'), path: '/roles?create=1', icon: ShieldCheck, allowed: canVisitPath('/roles') && workspace.can('tenant.role.manage') },
  { key: 'editEnterprise', title: $t('shell.editEnterprise'), path: '/settings', icon: Settings, allowed: canVisitPath('/settings') && workspace.can('tenant.profile.update') },
  { key: 'applications', title: $t('menu.applications'), path: '/applications', icon: Layers3, allowed: canVisitPath('/applications') && workspace.can('tenant.module.read') },
].filter((entry) => entry.allowed));
async function navigate(path: string) {
  emit('navigate');
  await router.push(path);
}
function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.visible) {
    event.preventDefault();
    emit('close');
  }
}
watch(() => props.visible, async (open) => {
  if (open) {
    document.addEventListener('keydown', onKeyDown);
    await nextTick();
    document.querySelector<HTMLButtonElement>('.cl-navigation-menu')?.focus();
  } else {
    document.removeEventListener('keydown', onKeyDown);
  }
});
watch(() => workspace.generation, () => { if (props.visible) emit('close'); });
onBeforeUnmount(() => { document.removeEventListener('keydown', onKeyDown); });
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="cl-navigation-layer" :style="{ '--cl-overlay-left': railWidth + 'px' }">
      <div class="cl-navigation-mask" @click.stop="emit('close')"></div>
      <section class="cl-navigation-panel" :aria-label="$t('shell.enterpriseCenter')" role="dialog" aria-modal="true">
        <div class="cl-navigation-heading">
          <div><h2>{{ $t('shell.enterpriseCenter') }}</h2><p>{{ $t('shell.enterpriseCenterDesc') }}</p></div>
          <button class="cl-navigation-close" type="button" :aria-label="$t('common.cancel')" @click="emit('close')"><X :size="19" /></button>
        </div>
        <div class="cl-navigation-columns">
          <section class="cl-navigation-menus">
            <h3>{{ $t('shell.functionMenu') }}</h3>
            <div class="cl-navigation-list">
              <button v-for="entry in menu" :key="entry.key"
                class="cl-navigation-menu" type="button" @click="navigate(entry.path)">
                <span class="cl-navigation-selection" :class="{ 'is-active': activePath === entry.path }">
                  <component :is="entry.icon" :size="19" aria-hidden="true" />
                  <span>{{ entry.title }}</span>
                </span>
              </button>
            </div>
          </section>
          <section class="cl-navigation-actions">
            <h3>{{ $t('shell.quickActions') }}</h3>
            <div class="cl-navigation-action-list">
              <button v-for="entry in actions" :key="entry.key" type="button" @click="navigate(entry.path)">
                <component :is="entry.icon" :size="17" aria-hidden="true" /><span>{{ entry.title }}</span>
              </button>
            </div>
          </section>
        </div>
        <div class="cl-navigation-promo" aria-hidden="true">
          <div><strong>{{ $t('shell.promoTitle') }}</strong><p>{{ $t('shell.promoDesc') }}</p></div>
          <svg viewBox="0 0 120 90" width="112" height="86" fill="none" aria-hidden="true">
            <ellipse cx="60" cy="77" rx="46" ry="8" fill="#bed9ff"/>
            <path d="M30 26h58l-7 46a22 22 0 0 1-22 12h-9a22 22 0 0 1-19-16z" fill="#fff" stroke="#9fc6f3" stroke-width="2"/>
            <path d="M88 35h10c18 0 15 29-14 26" stroke="#8ebbe8" stroke-width="7" stroke-linecap="round"/>
            <ellipse cx="59" cy="27" rx="28" ry="8" fill="#f7fcff" stroke="#9fc6f3" stroke-width="2"/>
            <ellipse cx="59" cy="28" rx="23" ry="5" fill="#d4aa7c"/>
            <path d="M42 11c-9-8 4-10 0-17M60 12c-9-8 4-10 0-17M78 12c-9-8 4-10 0-17" stroke="#b1d7fa" stroke-width="2" stroke-linecap="round" opacity=".7"/>
          </svg>
        </div>
      </section>
    </div>
  </Teleport>
</template>
