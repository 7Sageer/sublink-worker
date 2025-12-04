import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'dist', 'vercel');
const entryPoint = path.join(rootDir, 'src', 'app', 'createApp.jsx');
const isProduction = process.env.NODE_ENV === 'production';

async function ensureOutputDir() {
    await fs.rm(outDir, { recursive: true, force: true });
    await fs.mkdir(outDir, { recursive: true });
}

async function buildForVercel() {
    await ensureOutputDir();
    await build({
        bundle: true,
        entryPoints: [entryPoint],
        format: 'esm',
        logLevel: 'info',
        minify: isProduction,
        outfile: path.join(outDir, 'createApp.js'),
        platform: 'node',
        sourcemap: isProduction ? false : true,
        target: ['node18']
    });
    console.log('✓ Built dist/vercel/createApp.js for the Vercel runtime');
}

buildForVercel().catch((error) => {
    console.error('Failed to build Vercel bundle');
    console.error(error);
    process.exitCode = 1;
});
