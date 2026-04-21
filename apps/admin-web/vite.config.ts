import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:3000'

  return {
    plugins: [react()],
    base: './',
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        }
      }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/')
            const hasPackage = (pkg: string) => normalizedId.includes(`/node_modules/${pkg}/`)
            const hasAny = (patterns: string[]) => patterns.some((pattern) => normalizedId.includes(pattern))

            if (!normalizedId.includes('/node_modules/')) {
              return undefined
            }

            if (
              hasPackage('react') ||
              hasPackage('react-dom') ||
              hasPackage('scheduler') ||
              hasPackage('use-sync-external-store')
            ) {
              return 'vendor-react'
            }

            if (
              hasPackage('react-router') ||
              hasPackage('react-router-dom') ||
              normalizedId.includes('/node_modules/@remix-run/router/')
            ) {
              return 'vendor-router'
            }

            if (normalizedId.includes('/node_modules/@ant-design/icons/')) {
              return 'vendor-antd-icons'
            }

            if (
              hasPackage('antd') ||
              normalizedId.includes('/node_modules/@ant-design/') ||
              normalizedId.includes('/node_modules/rc-') ||
              normalizedId.includes('/node_modules/@rc-component/')
            ) {
              if (
                hasAny([
                  '/node_modules/antd/es/table/',
                  '/node_modules/antd/es/pagination/',
                  '/node_modules/rc-table/',
                  '/node_modules/rc-pagination/',
                  '/node_modules/rc-resize-observer/',
                  '/node_modules/rc-virtual-list/',
                ])
              ) {
                return 'vendor-antd-table'
              }

              if (
                hasAny([
                  '/node_modules/antd/es/form/',
                  '/node_modules/antd/es/input/',
                  '/node_modules/antd/es/input-number/',
                  '/node_modules/antd/es/select/',
                  '/node_modules/antd/es/switch/',
                  '/node_modules/antd/es/modal/',
                  '/node_modules/antd/es/popconfirm/',
                  '/node_modules/antd/es/checkbox/',
                  '/node_modules/rc-field-form/',
                  '/node_modules/rc-input/',
                  '/node_modules/rc-input-number/',
                  '/node_modules/rc-select/',
                  '/node_modules/rc-dialog/',
                  '/node_modules/rc-textarea/',
                  '/node_modules/rc-motion/',
                  '/node_modules/rc-notification/',
                ])
              ) {
                return 'vendor-antd-forms'
              }

              if (
                hasAny([
                  '/node_modules/antd/es/app/',
                  '/node_modules/antd/es/config-provider/',
                  '/node_modules/antd/es/locale/',
                  '/node_modules/antd/es/theme/',
                  '/node_modules/@ant-design/cssinjs/',
                ])
              ) {
                return 'vendor-antd-foundation'
              }

              if (
                hasAny([
                  '/node_modules/antd/es/button/',
                  '/node_modules/antd/es/card/',
                  '/node_modules/antd/es/grid/',
                  '/node_modules/antd/es/space/',
                  '/node_modules/antd/es/statistic/',
                  '/node_modules/antd/es/tag/',
                  '/node_modules/antd/es/typography/',
                  '/node_modules/rc-overflow/',
                  '/node_modules/rc-tooltip/',
                  '/node_modules/rc-trigger/',
                ])
              ) {
                return 'vendor-antd-display'
              }

              return 'vendor-antd-misc'
            }

            if (hasPackage('axios')) {
              return 'vendor-network'
            }

            return 'vendor-misc'
          },
        },
      },
    }
  }
})
