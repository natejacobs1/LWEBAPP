import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'tiff-range-server',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && req.url.split('?')[0] === '/lsm_map_web.tif') {
              const filePath = path.resolve(__dirname, 'public/lsm_map_web.tif');
              if (fs.existsSync(filePath)) {
                const stat = fs.statSync(filePath);
                const range = req.headers.range;
                res.setHeader('Content-Type', 'image/tiff');
                res.setHeader('Accept-Ranges', 'bytes');
                res.setHeader('Access-Control-Allow-Origin', '*');
                if (range) {
                  const parts = range.replace(/bytes=/, '').split('-');
                  const start = parseInt(parts[0], 10);
                  const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
                  const chunksize = end - start + 1;
                  res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
                    'Content-Length': chunksize,
                  });
                  fs.createReadStream(filePath, {start, end}).pipe(res);
                } else {
                  res.writeHead(200, {'Content-Length': stat.size});
                  fs.createReadStream(filePath).pipe(res);
                }
                return;
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
