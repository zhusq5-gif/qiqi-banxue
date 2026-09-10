import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: '七七伴学',
        short_name: '七七伴学',
        description: '孩子的学习打卡与星星奖励',
        theme_color: '#f59e0b',
        background_color: '#fffbeb',
        display: 'standalone',
        lang: 'zh-CN',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  css: { postcss: { plugins: [tailwindcss, autoprefixer] } },
  build: {
    rollupOptions: {
      output: {
        // 将 CloudBase SDK 拆为独立 vendor chunk：SDK 代码稳定，hash 不随业务迭代变化，
        // PWA precache 增量更新时无需重复下载（约 800KB），对 iPad 移动网络友好
        manualChunks(id) {
          if (id.includes('node_modules/@cloudbase/')) return 'vendor-cloudbase'
        },
      },
    },
  },
})
