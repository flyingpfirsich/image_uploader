import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';
const certPath = path.resolve(__dirname, '../.certs/localhost+1.pem');
const keyPath = path.resolve(__dirname, '../.certs/localhost+1-key.pem');
const certsExist = isDev && fs.existsSync(certPath) && fs.existsSync(keyPath);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    https: certsExist
      ? {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        }
      : undefined,
  },
});
