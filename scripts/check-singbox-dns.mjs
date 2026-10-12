// Run with: SING_BOX_BINARY=/path/to/sing-box node --test scripts/check-singbox-dns.mjs
// Requires sing-box 1.11, 1.12 or 1.14 and curl; all fixtures use loopback addresses.
import assert from 'node:assert/strict';
import { execFile, execFileSync, spawn } from 'node:child_process';
import dgram from 'node:dgram';
import { once } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { SingboxConfigBuilder } from '../src/builders/SingboxConfigBuilder.js';
import { SING_BOX_CONFIG, SING_BOX_CONFIG_V1_11 } from '../src/config/singboxConfig.js';

const execute = promisify(execFile);
const binary = process.env.SING_BOX_BINARY || 'sing-box';
const proxyUUID = '00000000-0000-0000-0000-000000000000';

function encodeName(name) {
    return Buffer.concat([...name.split('.').map(label => Buffer.concat([
        Buffer.from([label.length]), Buffer.from(label)
    ])), Buffer.from([0])]);
}

async function dnsFixture(t) {
    const socket = dgram.createSocket('udp4');
    const queries = [];
    socket.on('message', (message, peer) => {
        let offset = 12;
        const labels = [];
        while (message[offset]) {
            const length = message[offset++];
            labels.push(message.subarray(offset, offset + length).toString());
            offset += length;
        }
        const type = message.readUInt16BE(offset + 1);
        queries.push({ domain: labels.join('.'), type });
        const data = type === 28 ? Buffer.from('00000000000000000000000000000001', 'hex')
            : type === 5 ? encodeName('target.example') : Buffer.from([127, 0, 0, 1]);
        const header = Buffer.from(message.subarray(0, 12));
        header.writeUInt16BE(0x8180, 2);
        header.writeUInt16BE(1, 6);
        header.writeUInt32BE(0, 8);
        const record = Buffer.alloc(12);
        record.writeUInt16BE(0xc00c, 0);
        record.writeUInt16BE(type, 2);
        record.writeUInt16BE(1, 4);
        record.writeUInt32BE(60, 6);
        record.writeUInt16BE(data.length, 10);
        socket.send(Buffer.concat([header, message.subarray(12, offset + 5), record, data]), peer.port, peer.address);
    });
    socket.bind(0, '127.0.0.1');
    await once(socket, 'listening');
    t.after(() => new Promise(resolve => socket.close(resolve)));
    return { port: socket.address().port, queries };
}

async function query(port, domain, type) {
    const socket = dgram.createSocket('udp4');
    const header = Buffer.alloc(12);
    header.writeUInt16BE(433, 0);
    header.writeUInt16BE(0x100, 2);
    header.writeUInt16BE(1, 4);
    const tail = Buffer.alloc(4);
    tail.writeUInt16BE(type, 0);
    tail.writeUInt16BE(1, 2);
    let timer;
    try {
        return await new Promise((resolve, reject) => {
            timer = setTimeout(() => reject(new Error(`DNS timeout: ${domain}`)), 3000);
            socket.once('error', reject);
            socket.once('message', resolve);
            socket.send(Buffer.concat([header, encodeName(domain), tail]), port, '127.0.0.1');
        });
    } finally {
        clearTimeout(timer);
        socket.close();
    }
}

async function unusedPort(udp = false) {
    const server = udp ? dgram.createSocket('udp4') : net.createServer();
    if (udp) server.bind(0, '127.0.0.1');
    else server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const port = server.address().port;
    await new Promise(resolve => server.close(resolve));
    return port;
}

async function startSingbox(t, path) {
    const child = spawn(binary, ['run', '-c', path], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    const closed = new Promise(resolve => child.once('close', resolve));
    t.after(async () => {
        child.kill('SIGTERM');
        await closed;
    });
    let timer;
    try {
        await new Promise((resolve, reject) => {
            timer = setTimeout(() => reject(new Error(`sing-box startup timeout\n${output}`)), 8000);
            child.once('error', reject);
            child.once('exit', code => reject(new Error(`sing-box exited ${code}\n${output}`)));
            for (const stream of [child.stdout, child.stderr]) {
                stream.on('data', chunk => {
                    output += chunk.toString();
                    if (output.includes('sing-box started')) resolve();
                });
            }
        });
    } finally {
        clearTimeout(timer);
    }
    return () => output;
}

async function proxyFixture(t, directory, name) {
    const port = await unusedPort();
    const path = join(directory, `${name}-proxy.json`);
    await writeFile(path, JSON.stringify({
        inbounds: [{
            type: 'vless', tag: 'proxy-in', listen: '127.0.0.1', listen_port: port,
            users: [{ uuid: proxyUUID }]
        }],
        outbounds: [{ type: 'direct', tag: 'DIRECT' }],
        route: { rules: [
            { ip_cidr: ['127.0.0.0/8'], outbound: 'DIRECT' },
            { action: 'reject' }
        ] }
    }));
    await startSingbox(t, path);
    return port;
}

test('direct mode bypasses proxy DNS when the node is unavailable', async t => {
    const versionOutput = execFileSync(binary, ['version'], { encoding: 'utf8' });
    const version = versionOutput.match(/sing-box version (1\.(?:11|12|14))\./)?.[1];
    assert.ok(version, `Expected sing-box 1.11, 1.12 or 1.14; got ${versionOutput}`);
    const baseConfig = version === '1.11' ? SING_BOX_CONFIG_V1_11 : SING_BOX_CONFIG;
    const directory = await mkdtemp(join(tmpdir(), 'sublink-dns-direct-'));
    t.after(() => rm(directory, { recursive: true, force: true }));

    const direct = await dnsFixture(t);
    const proxy = await dnsFixture(t);
    const bootstrap = await dnsFixture(t);
    const unavailableProxyPort = await unusedPort(true);
    const dnsPort = await unusedPort(true);
    const input = JSON.stringify({ outbounds: [{
        type: 'vless', tag: 'test-proxy', server: 'node.example',
        server_port: unavailableProxyPort, uuid: proxyUUID
    }] });
    const builder = new SingboxConfigBuilder(
        input, ['Private'], [], baseConfig, 'en-US', null,
        false, false, null, null, version, false
    );
    const config = await builder.build();

    config.log = { level: 'debug', disabled: false };
    config.inbounds = [
        { type: 'direct', tag: 'dns-in', listen: '127.0.0.1', listen_port: dnsPort, network: 'udp' }
    ];
    config.dns.servers = config.dns.servers.map(server => {
        if (server.tag === 'dns_fakeip') return server;
        const port = server.tag === 'dns_proxy'
            ? proxy.port
            : server.tag === 'dns_resolver' ? bootstrap.port : direct.port;
        return version === '1.11'
            ? { ...server, address: `udp://127.0.0.1:${port}` }
            : { ...server, type: 'udp', server: '127.0.0.1', server_port: port };
    });
    config.route.rule_set = config.route.rule_set.map(ruleSet => ({
        type: 'inline',
        tag: ruleSet.tag,
        rules: [ruleSet.tag.endsWith('-ip')
            ? { ip_cidr: ['192.0.2.0/24'] }
            : { domain: ['china.example'] }]
    }));
    // The DNS rule must honor the Clash mode even when the proxy node cannot dial.
    config.experimental = { clash_api: { default_mode: 'direct' } };
    delete config.ntp;

    const path = join(directory, 'direct-mode.json');
    await writeFile(path, JSON.stringify(config));
    await execute(binary, ['check', '-c', path]);
    const logs = await startSingbox(t, path);
    const response = await query(dnsPort, 'unknown.example', 1).catch(error => {
        throw new Error(`${error.message}\n${logs()}`, { cause: error });
    });

    assert.equal(response.readUInt16BE(2) & 15, 0);
    assert.ok(direct.queries.some(query => query.domain === 'unknown.example' && query.type === 1));
    assert.equal(proxy.queries.length, 0, 'direct mode must not query the proxy DNS');
    assert.equal(bootstrap.queries.length, 0, 'direct mode must not bootstrap the proxy node');
});

test('generated DNS policy preserves bootstrap and real-IP routing', async t => {
    const versionOutput = execFileSync(binary, ['version'], { encoding: 'utf8' });
    const version = versionOutput.match(/sing-box version (1\.(?:11|12|14))\./)?.[1];
    assert.ok(version, `Expected sing-box 1.11, 1.12 or 1.14; got ${versionOutput}`);
    const baseConfig = version === '1.11' ? SING_BOX_CONFIG_V1_11 : SING_BOX_CONFIG;
    const directory = await mkdtemp(join(tmpdir(), 'sublink-dns-'));
    t.after(() => rm(directory, { recursive: true, force: true }));

    for (const scenario of [
        { name: 'private', selected: ['Private'], custom: [{ name: 'CustomCN', site: 'cn,geolocation-cn,cn' }], group: 'Private' },
        { name: 'custom-cidr', selected: ['Location:CN'], custom: [{ name: 'CustomCIDR', ip_cidr: '127.0.0.1/32' }], group: 'CustomCIDR' },
        { name: 'private-route-override', selected: ['Private'], custom: [], group: 'Private', routeOverride: true },
        { name: 'custom-cidr-route-override', selected: ['Location:CN'], custom: [{ name: 'CustomCIDR', ip_cidr: '127.0.0.1/32' }], group: 'CustomCIDR', routeOverride: true },
        { name: 'direct-bootstrap-route-override', selected: ['Private'], custom: [], group: 'Private', routeOverride: true, directBootstrap: true }
    ]) {
        await t.test(scenario.name, async t => {
            const direct = await dnsFixture(t);
            const proxy = await dnsFixture(t);
            const bootstrap = await dnsFixture(t);
            const proxyPort = await proxyFixture(t, directory, scenario.name);
            const scenarioBase = structuredClone(baseConfig);
            if (scenario.directBootstrap && version !== '1.11') {
                // Modern sing-box rejects DNS detours to an empty direct outbound.
                scenarioBase.outbounds.find(outbound => outbound.tag === 'DIRECT').domain_resolver = 'dns_resolver';
            }
            const input = JSON.stringify({
                ...(scenario.routeOverride ? { route: { rules: [] } } : {}),
                ...(scenario.directBootstrap ? {
                    dns: {
                        servers: baseConfig.dns.servers.map(server => {
                            if (server.tag === 'dns_resolver') return { ...server, detour: 'DIRECT' };
                            if (server.tag === 'dns_proxy') return { ...server, detour: '🚀 Node Select' };
                            return server;
                        })
                    }
                } : {}),
                outbounds: [{
                    type: 'vless', tag: 'test-proxy', server: 'node.example', server_port: proxyPort,
                    uuid: proxyUUID
                }]
            });
            const server = http.createServer((_request, response) => response.end('LOCAL-DIRECT-OK'));
            server.listen(0, '127.0.0.1');
            await once(server, 'listening');
            t.after(() => new Promise(resolve => server.close(resolve)));
            const socksPort = await unusedPort();
            const dnsPort = await unusedPort(true);
            const builder = new SingboxConfigBuilder(
                input, scenario.selected, scenario.custom, scenarioBase, 'en-US', null,
                false, false, null, null, version, false
            );
            const config = await builder.build();
            if (scenario.directBootstrap && version !== '1.11') {
                assert.equal(config.route.default_domain_resolver, 'dns_resolver');
            }
            const path = join(directory, `${scenario.name}.json`);
            await writeFile(path, JSON.stringify(config));
            await execute(binary, ['check', '-c', path]);

            // Keep generated DNS/route rules intact; fixtures isolate policy from WAN and TUN privileges.
            config.log = { level: 'debug', disabled: false };
            config.inbounds = [
                { type: 'mixed', tag: 'mixed-in', listen: '127.0.0.1', listen_port: socksPort },
                { type: 'direct', tag: 'dns-in', listen: '127.0.0.1', listen_port: dnsPort, network: 'udp' }
            ];
            config.dns.servers = config.dns.servers.map(s => {
                if (s.tag === 'dns_fakeip') return s;
                const port = s.tag === 'dns_proxy' ? proxy.port : s.tag === 'dns_resolver' ? bootstrap.port : direct.port;
                // Keep detours so proxy DNS must bootstrap a real domain-addressed node.
                return version === '1.11'
                    ? { ...s, address: `udp://127.0.0.1:${port}` }
                    : { ...s, type: 'udp', server: '127.0.0.1', server_port: port };
            });
            config.route.rule_set = config.route.rule_set.map(s => ({
                type: 'inline', tag: s.tag, rules: [s.tag === 'private-ip' ? { ip_cidr: ['127.0.0.0/8'] }
                    : s.tag.endsWith('-ip') ? { ip_cidr: ['192.0.2.0/24'] }
                    : { domain: [s.tag === 'geolocation-!cn' ? 'foreign.example' : 'china.example'] }]
            }));
            const target = builder.t(`outboundNames.${scenario.group}`);
            config.outbounds.find(outbound => outbound.tag === target).default = 'DIRECT';
            delete config.ntp;
            delete config.experimental;
            await writeFile(path, JSON.stringify(config));
            const logs = await startSingbox(t, path);

            assert.equal(bootstrap.queries.length, 0, 'the first DNS request must start with a cold node cache');
            for (const type of [1, 28, 5]) {
                const response = await query(dnsPort, 'unknown.example', type).catch(error => {
                    throw new Error(`${error.message}\n${logs()}`, { cause: error });
                });
                assert.equal(response.readUInt16BE(2) & 15, 0);
                assert.ok(proxy.queries.some(q => q.domain === 'unknown.example' && q.type === type));
            }
            assert.ok(bootstrap.queries.some(q => q.domain === 'node.example' && q.type === 1));
            assert.ok(bootstrap.queries.every(q => q.domain === 'node.example'));
            assert.ok(!proxy.queries.some(q => q.domain === 'node.example'));
            assert.ok(!logs().includes('DNS query loopback'), logs());
            assert.equal(direct.queries.length, 0, 'unclassified queries must not reach direct DNS');
            const foreign = await query(dnsPort, 'foreign.example', 1);
            assert.equal(foreign.subarray(-4, -2).toString('hex'), 'c612', 'known foreign domains still use FakeIP');
            assert.ok(!proxy.queries.some(q => q.domain === 'foreign.example'));
            await query(dnsPort, 'china.example', 1);
            assert.ok(direct.queries.some(q => q.domain === 'china.example'));

            const address = (await query(dnsPort, 'nas.example', 1)).subarray(-4).join('.');
            assert.equal(address, '127.0.0.1', 'unknown domains need real IPs for CIDR routing');
            assert.ok(proxy.queries.some(q => q.domain === 'nas.example'));
            assert.ok(!direct.queries.some(q => q.domain === 'nas.example'));
            const requestLogOffset = logs().length;
            const { stdout } = await execute('curl', [
                '--silent', '--show-error', '--noproxy', '', '--max-time', '3',
                '--socks5', `127.0.0.1:${socksPort}`, `http://${address}:${server.address().port}/`
            ]);
            assert.equal(stdout, 'LOCAL-DIRECT-OK');
            const requestLogs = logs().slice(requestLogOffset);
            assert.ok(requestLogs.includes(`route(${target})`), requestLogs);
            assert.ok(requestLogs.includes('outbound/direct[DIRECT]'), requestLogs);
            assert.ok(!requestLogs.includes('outbound/vless[test-proxy]'), requestLogs);
        });
    }
});
