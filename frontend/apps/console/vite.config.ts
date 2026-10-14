import { defineConfig } from '@vben/vite-config';
import ElementPlus from 'unplugin-element-plus/vite';

export default defineConfig(async () => ({
  application: { nitroMock: false, pwa: false, archiver: false },
  vite: {
    plugins: [ElementPlus({ format: 'esm' })],
    server: { host: '127.0.0.1', port: 5777, strictPort: true },
    preview: { host: '127.0.0.1', port: 5778, strictPort: true },
  },
}));
