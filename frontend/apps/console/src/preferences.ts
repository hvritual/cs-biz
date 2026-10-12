import { defineOverridesPreferences } from '@vben/preferences';

export const overridesPreferences = defineOverridesPreferences({
  app: {
    name: 'CS Biz', defaultHomePath: '/overview', accessMode: 'backend',
    layout: 'sidebar-nav', locale: 'zh-CN', timezone: 'Asia/Shanghai',
    contentPadding: 0, enablePreferences: false, enableCopyPreferences: false,
    enableCheckUpdates: false, enableRefreshToken: false, defaultAvatar: '',
    watermark: false, compact: false,
  },
  logo: { enable: true, source: '' },
  theme: {
    mode: 'light', colorPrimary: '#0f766e', radius: '0.625', fontSize: 14,
    semiDarkSidebar: false, semiDarkHeader: false,
  },
  sidebar: {
    width: 220, collapseWidth: 64, draggable: false, collapsedButton: false,
    fixedButton: false, expandOnHover: false,
  },
  header: { height: 64 },
  breadcrumb: { enable: false },
  tabbar: { enable: false, keepAlive: false, persist: false },
  copyright: { enable: false },
  footer: { enable: false },
  shortcutKeys: {
    enable: false, globalPreferences: false, globalLockScreen: false,
    globalLogout: false, globalSearch: false,
  },
  transition: { enable: false, loading: false, progress: false },
  widget: {
    fullscreen: false, globalSearch: false, languageToggle: false,
    lockScreen: false, notification: false, refresh: false,
    sidebarToggle: true, themeToggle: false, timezone: false,
  },
});
