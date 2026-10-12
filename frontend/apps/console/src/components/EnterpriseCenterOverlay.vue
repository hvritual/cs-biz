<script setup lang="ts">
import { useRouter } from 'vue-router';
import {
  User, Users, Shield, Network, Crown, Building2, Palette, FileText,
  Plus, UserPlus, ShieldCheck, Crown as CrownIcon, Edit, FileSearch,
} from '@vben/icons';
import { $t } from '#/locales';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();

const menuItems = [
  { key: 'personal', icon: User, titleKey: 'menu.personal', path: '/personal' },
  { key: 'members', icon: Users, titleKey: 'menu.members', path: '/members', active: true },
  { key: 'roles', icon: Shield, titleKey: 'menu.roles', path: '/roles' },
  { key: 'organization', icon: Network, titleKey: 'menu.organization', path: '/organization' },
  { key: 'package', icon: Crown, titleKey: 'menu.package', path: '/package' },
  { key: 'enterprise', icon: Building2, titleKey: 'menu.enterprise', path: '/enterprise' },
  { key: 'brand', icon: Palette, titleKey: 'menu.brand', path: '/brand' },
  { key: 'logs', icon: FileText, titleKey: 'menu.logs', path: '/logs' },
];

const quickActions = [
  { icon: Plus, labelKey: 'shell.addMember', action: () => {} },
  { icon: UserPlus, labelKey: 'shell.inviteMember', action: () => {} },
  { icon: ShieldCheck, labelKey: 'shell.newRole', action: () => {} },
  { icon: CrownIcon, labelKey: 'shell.adjustPackage', action: () => {} },
  { icon: Edit, labelKey: 'shell.editEnterprise', action: () => {} },
  { icon: FileSearch, labelKey: 'shell.viewLogs', action: () => {} },
];

function navigateTo(path: string) {
  router.push(path);
  emit('close');
}

function handleClose() {
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="visible" class="enterprise-overlay" @click.self="handleClose">
        <div class="enterprise-drawer">
          <div class="enterprise-header">
            <div>
              <h2>{{ $t('shell.enterpriseCenter') }}</h2>
              <p>{{ $t('shell.enterpriseCenterDesc') }}</p>
            </div>
            <button class="close-btn" @click="handleClose" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="enterprise-content">
            <div class="menu-section">
              <h3>{{ $t('shell.functionMenu') || '功能菜单' }}</h3>
              <nav class="menu-list">
                <button
                  v-for="item in menuItems"
                  :key="item.key"
                  class="menu-item"
                  :class="{ active: item.active }"
                  @click="navigateTo(item.path)"
                >
                  <component :is="item.icon" :size="18" />
                  <span>{{ $t(item.titleKey) }}</span>
                </button>
              </nav>
            </div>

            <div class="actions-section">
              <h3>{{ $t('shell.quickActions') }}</h3>
              <div class="actions-grid">
                <button
                  v-for="action in quickActions"
                  :key="action.labelKey"
                  class="action-btn"
                  @click="action.action"
                >
                  <component :is="action.icon" :size="18" />
                  <span>{{ $t(action.labelKey) }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="enterprise-footer">
            <div class="promo-card">
              <h4>{{ $t('members.promoTitle') }}</h4>
              <p>{{ $t('members.promoSubtitle') }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.enterprise-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
}

.enterprise-drawer {
  width: 480px;
  max-width: 90vw;
  height: 100%;
  background: white;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.enterprise-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.enterprise-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px;
}

.enterprise-header p {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.enterprise-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.menu-section {
  margin-bottom: 32px;
}

.menu-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 0;
  background: transparent;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  width: 100%;
  text-align: left;
  transition: all 0.15s;
}

.menu-item:hover {
  background: #f3f4f6;
  color: #111827;
}

.menu-item.active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 500;
}

.actions-section h3 {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s;
}

.action-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.enterprise-footer {
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}

.promo-card {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 12px;
  padding: 20px;
}

.promo-card h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1e3a5f;
  margin: 0 0 6px;
}

.promo-card p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.overlay-enter-active .enterprise-drawer,
.overlay-leave-active .enterprise-drawer {
  transition: transform 0.2s ease;
}

.overlay-enter-from .enterprise-drawer,
.overlay-leave-to .enterprise-drawer {
  transform: translateX(-100%);
}

@media (max-width: 640px) {
  .enterprise-drawer {
    width: 100%;
    max-width: 100%;
  }
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
