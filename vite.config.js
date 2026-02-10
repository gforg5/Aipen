import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This securely injects the API key at build-time for Vercel
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY)
  }
});
