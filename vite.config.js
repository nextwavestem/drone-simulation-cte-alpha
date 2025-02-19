import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/drone-simulation-cte-alpha/',  // replace <repo-name> with your repository name
});
