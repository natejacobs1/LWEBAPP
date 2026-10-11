import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

const currentDir = import.meta.dirname || process.cwd();

export default defineConfig(() => {
  return {
    publicDir: 'public',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'tiff-range-server',
        buildStart() {
          const publicFolder = path.resolve(currentDir, 'public');
          if (!fs.existsSync(publicFolder)) {
            fs.mkdirSync(publicFolder, { recursive: true });
          }
          try {
            const rootFiles = fs.readdirSync(currentDir).filter((f) => f.endsWith('.tif'));
            for (const f of rootFiles) {
              const rootFile = path.resolve(currentDir, f);
              const pubFile = path.resolve(publicFolder, f);
              if (fs.existsSync(rootFile) && fs.statSync(rootFile).size > 1000) {
                if (!fs.existsSync(pubFile) || fs.statSync(pubFile).size < 1000) {
                  fs.copyFileSync(rootFile, pubFile);
                }
              }
            }
          } catch (e) {
            console.warn('Could not sync root tif to public:', e);
          }
        },
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const urlPath = req.url ? req.url.split('?')[0] : '';
            if (urlPath.endsWith('.tif')) {
              const filename = path.basename(urlPath);
              const localPaths = [
                path.resolve(currentDir, 'public', filename),
                path.resolve(currentDir, filename),
              ];
              const filePath = localPaths.find((p) => fs.existsSync(p));

              // If file exists locally and is not an LFS pointer (> 1000 bytes)
              if (filePath && fs.statSync(filePath).size > 1000) {
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
                  fs.createReadStream(filePath, { start, end }).pipe(res);
                } else {
                  res.writeHead(200, { 'Content-Length': stat.size });
                  fs.createReadStream(filePath).pipe(res);
                }
                return;
              }

              // Otherwise proxy Range request to GitHub media storage
              const targetUrl = `https://media.githubusercontent.com/media/natejacobs1/LWEBAPP/main/${filename}`;
              const headers: Record<string, string> = {};
              if (req.headers.range) {
                headers['Range'] = req.headers.range as string;
              }

              fetch(targetUrl, { headers })
                .then((remoteRes) => {
                  res.statusCode = remoteRes.status;
                  res.setHeader('Content-Type', remoteRes.headers.get('content-type') || 'image/tiff');
                  res.setHeader('Accept-Ranges', 'bytes');
                  res.setHeader('Access-Control-Allow-Origin', '*');
                  if (remoteRes.headers.get('content-range')) {
                    res.setHeader('Content-Range', remoteRes.headers.get('content-range')!);
                  }
                  if (remoteRes.headers.get('content-length')) {
                    res.setHeader('Content-Length', remoteRes.headers.get('content-length')!);
                  }
                  if (remoteRes.body) {
                    const reader = remoteRes.body.getReader();
                    const streamPump = (): void => {
                      reader.read().then(({ done, value }) => {
                        if (done) {
                          res.end();
                          return;
                        }
                        res.write(value);
                        streamPump();
                      }).catch((err) => {
                        res.destroy(err);
                      });
                    };
                    streamPump();
                  } else {
                    res.end();
                  }
                })
                .catch(() => {
                  next();
                });
              return;
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(currentDir, '.'),
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
