import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, type Plugin } from 'vite';

// One Vercel project builds both environments: production (main) gets the plain name, every other build is marked "(Dev)"
// so an installed dev app can be told apart from the real one.
const APP_NAME = process.env.VERCEL_ENV === 'production' ? 'BBB Admin' : 'BBB Admin (Dev)';

const appManifest = (): string => {
    const manifest = JSON.parse(readFileSync(path.resolve(__dirname, 'public/manifest.json'), 'utf8'));

    return `${JSON.stringify({ ...manifest, name: APP_NAME, short_name: APP_NAME }, null, 4)}\n`;
};

const appName = (): Plugin => ({
    name: 'app-name',
    transformIndexHtml: (html) => html.replaceAll('%APP_NAME%', APP_NAME),
    configureServer(server) {
        server.middlewares.use('/manifest.json', (_request, response) => {
            response.setHeader('Content-Type', 'application/manifest+json');
            response.end(appManifest());
        });
    },
    writeBundle(options) {
        writeFileSync(path.join(options.dir ?? 'dist', 'manifest.json'), appManifest());
    },
});

export default defineConfig({
    plugins: [react(), tailwindcss(), appName()],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    server: { host: 'localhost', port: 5174, strictPort: true },
});
