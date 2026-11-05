import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const cmsTarget = env.VITE_CMS_URL || 'https://nordicaffairsmedia.com'
  const apiTarget = env.VITE_API_URL || 'https://nordic-affairs-media-backend.onrender.com'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/cms-proxy': {
          target: cmsTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/cms-proxy/, ''),
        },
        '/api-proxy': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api-proxy/, ''),
        },
      },
    },
  }
})
