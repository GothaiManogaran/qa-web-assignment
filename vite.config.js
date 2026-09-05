import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    open: true
  },
  test: {
    // Default glob also matches *.spec.js, colliding with the Playwright
    // suite in tests/ - scope Vitest to js/*.test.js only.
    include: ['js/**/*.test.js'],
  }
})

