import { parseServerInfo, parseUrlParams, parseArray, parseBool } from '../../utils.js';

export function parseTuic(url) {
    const { addressPart, params, name } = parseUrlParams(url);
    const [userinfo, serverInfo] = addressPart.split('@');
    const { host, port } = parseServerInfo(serverInfo);
    // Prefer explicit skip-cert-verify / insecure / allowInsecure; default false when omitted.
    // (Old code defaulted true, which wrongly forced skip-cert-verify for secure links.)
    const insecure = parseBool(
        params['skip-cert-verify'] ?? params.insecure ?? params.allowInsecure ?? params.allow_insecure,
        false
    );
    const tls = {
        enabled: true,
        server_name: params.sni,
        alpn: parseArray(params.alpn),
        insecure: !!insecure
    };

    // Share links commonly use congestion_control or congestion-control
    const congestion =
        params.congestion_control ||
        params['congestion-control'] ||
        params.congestionController ||
        params['congestion-controller'];

    return {
        tag: name,
        type: 'tuic',
        server: host,
        server_port: port,
        uuid: decodeURIComponent(userinfo).split(':')[0],
        password: decodeURIComponent(userinfo).split(':')[1],
        congestion_control: congestion,
        tls,
        flow: params.flow ?? undefined,
        udp_relay_mode: params['udp-relay-mode'] || params.udp_relay_mode,
        zero_rtt: parseBool(params['zero-rtt'], undefined),
        reduce_rtt: parseBool(params['reduce-rtt'], undefined),
        fast_open: parseBool(params['fast-open'], undefined),
        disable_sni: parseBool(params['disable-sni'], undefined)
    };
}
