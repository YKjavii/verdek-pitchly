import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so the built app works from a GitHub Pages project URL
// (https://<user>.github.io/<repo>/) without any extra config, and
// still works fine on a custom domain if you add one later.
export default defineConfig({
  base: './',
  plugins: [react()],
})
