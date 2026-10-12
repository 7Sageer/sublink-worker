// Run with: node --test scripts/check-singbox-dns.mjs (requires sing-box 1.14 and curl).
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

const execute = promisify(execFile);
const binary = process.env.SING_BOX_BINARY || 'sing-box';
const input = JSON.stringify({ outbounds: [{
    type: 'vless', tag: 'test-proxy', server: '127.0.0.1', server_port: 1,
    uuid: '00000000-0000-0000-0000-000000000000'
}] });

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

test('generated DNS policy preserves real-IP routing', async t => {
    const version = execFileSync(binary, ['version'], { encoding: 'utf8' });
    assert.match(version, /sing-box version 1\.14\./);
    const directory = await mkdtemp(join(tmpdir(), 'sublink-dns-'));
    t.after(() => rm(directory, { recursive: true, force: true }));

    for (const scenario of [
        { name: 'private', selected: ['Private'], custom: [{ name: 'CustomCN', site: 'cn,geolocation-cn,cn' }], group: 'Private' },
        { name: 'custom-cidr', selected: ['Location:CN'], custom: [{ name: 'CustomCIDR', ip_cidr: '127.0.0.1/32' }], group: 'CustomCIDR' }
    ]) {
        await t.test(scenario.name, async t => {
            const direct = await dnsFixture(t);
            const proxy = await dnsFixture(t);
            const server = http.createServer((_request, response) => response.end('LOCAL-DIRECT-OK'));
            server.listen(0, '127.0.0.1');
            await once(server, 'listening');
            t.after(() => new Promise(resolve => server.close(resolve)));
            const socksPort = await unusedPort();
            const dnsPort = await unusedPort(true);
            const builder = new SingboxConfigBuilder(
                input, scenario.selected, scenario.custom, null, 'en-US', null,
                false, false, null, null, '1.14', false
            );
            const config = await builder.build();
            const path = join(directory, `${scenario.name}.json`);
            await writeFile(path, JSON.stringify(config));
            await execute(binary, ['check', '-c', path]);

            // Keep generated DNS/route rules intact; fixtures isolate policy from WAN and TUN privileges.
            config.log = { level: 'debug', disabled: false };
            config.inbounds = [
                { type: 'mixed', tag: 'mixed-in', listen: '127.0.0.1', listen_port: socksPort },
                { type: 'direct', tag: 'dns-in', listen: '127.0.0.1', listen_port: dnsPort, network: 'udp' }
            ];
            config.dns.servers = config.dns.servers.map(s => s.type === 'fakeip' ? s : {
                type: 'udp', tag: s.tag, server: '127.0.0.1', server_port: s.tag === 'dns_proxy' ? proxy.port : direct.port
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

            for (const type of [1, 28, 5]) {
                const response = await query(dnsPort, 'unknown.example', type);
                assert.equal(response.readUInt16BE(2) & 15, 0);
                assert.ok(proxy.queries.some(q => q.domain === 'unknown.example' && q.type === type));
            }
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
            const { stdout } = await execute('curl', [
                '--silent', '--show-error', '--noproxy', '', '--max-time', '3',
                '--socks5', `127.0.0.1:${socksPort}`, `http://${address}:${server.address().port}/`
            ]);
            assert.equal(stdout, 'LOCAL-DIRECT-OK');
            assert.ok(logs().includes(`route(${target})`), logs());
            assert.ok(logs().includes('outbound/direct[DIRECT]'), logs());
            assert.ok(!logs().includes('outbound/vless[test-proxy]'), logs());
        });
    }
});
