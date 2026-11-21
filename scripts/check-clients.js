// Converts the fixture subscriptions with the real app and loads every result
// in a real client. Unit tests only assert our own idea of each format; most
// regressions so far were configs that sing-box or Mihomo refused to load.
//
// Usage: npm run check:clients -- <sing-box|mihomo> <path to binary>
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { createApp } from '../src/app/createApp.jsx';
import { MemoryKVAdapter } from '../src/adapters/kv/memoryKv.js';

const FIXTURE_DIR = fileURLToPath(new URL('../test/fixtures/client-compat/', import.meta.url));

// Default UI output, plus every rule and country groups to cover the most config surface.
const VARIANTS = {
    default: {},
    comprehensive: { selectedRules: 'comprehensive', group_by_country: 'true' }
};

const run = (binary, args) => execFileSync(binary, args, { encoding: 'utf8', stdio: 'pipe' });

// Clients print warnings on stderr even when the check passes, so keep both streams.
function runCheck(binary, args) {
    const { status, stdout, stderr, error } = spawnSync(binary, args, { encoding: 'utf8' });
    if (error) throw error;
    const output = `${stdout}${stderr}`.trim();
    if (status !== 0) throw new Error(output || `exit code ${status}`);
    return output;
}

const CLIENTS = {
    'sing-box': {
        version: (binary) => run(binary, ['version']).match(/sing-box version (\S+)/)[1],
        // The app picks the config tier from the client's User-Agent, as real clients send it.
        userAgent: (version) => `SFA/${version} (1; sing-box ${version}; language en)`,
        route: '/singbox',
        fileName: 'config.json',
        countProxies: (text) => JSON.parse(text).outbounds.filter(outbound => outbound.server).length,
        check: (binary, dir, file) => runCheck(binary, ['check', '-c', file])
    },
    mihomo: {
        version: (binary) => run(binary, ['-v']).match(/v(\d+\.\d+\.\d+)/)[1],
        userAgent: (version) => `clash.meta/v${version}`,
        route: '/clash',
        fileName: 'config.yaml',
        countProxies: (text) => yaml.load(text).proxies?.length ?? 0,
        check: (binary, dir, file) => runCheck(binary, ['-t', '-d', dir, '-f', file])
    }
};

async function convert(app, client, userAgent, input, params) {
    const query = new URLSearchParams({ config: input, ...params });
    const res = await app.request(`http://localhost${client.route}?${query}`, {
        headers: { 'User-Agent': userAgent }
    });
    const text = await res.text();
    if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text;
}

async function main() {
    const [clientName, binary] = process.argv.slice(2);
    const client = CLIENTS[clientName];
    if (!client || !binary) {
        console.log(`Usage: check-clients <${Object.keys(CLIENTS).join('|')}> <binary>`);
        process.exit(2);
    }
    // The fixtures include malformed links on purpose; the parsers' warnings
    // about them would bury the verdicts, which come from the clients anyway.
    console.warn = console.error = () => {};

    const version = client.version(binary);
    const userAgent = client.userAgent(version);
    const app = createApp({
        kv: new MemoryKVAdapter(),
        assetFetcher: null,
        logger: { info() {}, warn() {}, error() {} },
        config: { configTtlSeconds: 60, shortLinkTtlSeconds: null }
    });
    const workDir = mkdtempSync(join(tmpdir(), 'sublink-client-check-'));
    console.log(`${clientName} ${version} (User-Agent: ${userAgent})`);

    let failures = 0;
    for (const fixture of readdirSync(FIXTURE_DIR).sort()) {
        const input = readFileSync(join(FIXTURE_DIR, fixture), 'utf8');
        for (const [variant, params] of Object.entries(VARIANTS)) {
            const label = `${fixture} [${variant}]`;
            const dir = mkdtempSync(join(workDir, 'case-'));
            const file = join(dir, client.fileName);
            try {
                const text = await convert(app, client, userAgent, input, params);
                writeFileSync(file, text);
                const proxies = client.countProxies(text);
                if (proxies === 0) throw new Error('no proxies in output');
                const output = client.check(binary, dir, file);
                console.log(`ok   ${label}: ${proxies} proxies`);
                // Deprecation warnings pass today but announce the next breaking release.
                if (/WARN/i.test(output)) console.log(output.replace(/^/gm, '     '));
            } catch (error) {
                failures++;
                console.log(`FAIL ${label} (config kept at ${file})\n${error.message.replace(/^/gm, '     ')}`);
            }
        }
    }

    if (failures > 0) {
        console.log(`\n${failures} case(s) failed`);
        process.exit(1);
    }
}

main();
