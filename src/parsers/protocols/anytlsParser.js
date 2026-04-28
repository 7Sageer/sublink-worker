import { parseServerInfo, parseUrlParams, createTlsConfig } from '../../utils.js';

/**
 * Parse AnyTLS proxy URL
 * Format: anytls://password@server:port?params#name
 * @param {string} url - AnyTLS URL
 * @returns {object} - Parsed proxy object in sing-box format
 */
export function parseAnytls(url) {
  const { addressPart, params, name } = parseUrlParams(url);
  
  // Extract password and server info from addressPart (format: password@server:port)
  const atSignIndex = addressPart.lastIndexOf('@');
  let password = '';
  let serverInfo = addressPart;
  
  if (atSignIndex > -1) {
    password = decodeURIComponent(addressPart.slice(0, atSignIndex));
    serverInfo = addressPart.slice(atSignIndex + 1);
  }
  
  const { host, port } = parseServerInfo(serverInfo);
  
  // Build TLS config
  const tls = {
    enabled: true,
    server_name: params.sni || params.host || '',
    insecure: params.insecure === '1' || params.insecure === 'true' || params.allowInsecure === '1' || params.allowInsecure === 'true',
  };
  
  // Add fingerprint if provided
  if (params.fp) {
    tls.utls = {
      enabled: true,
      fingerprint: params.fp
    };
  }
  
  // Add ALPN if provided
  if (params.alpn) {
    tls.alpn = params.alpn.split(',');
  }
  
  return {
    type: 'anytls',
    tag: name || 'AnyTLS',
    server: host,
    server_port: port,
    password: password,
    tls: tls,
    // Session validation parameters (optional)
    ...(params.idle_session_check_interval ? { 'idle-session-check-interval': parseInt(params.idle_session_check_interval) } : {}),
    ...(params.idle_session_timeout ? { 'idle-session-timeout': parseInt(params.idle_session_timeout) } : {}),
    ...(params.min_idle_session ? { 'min-idle-session': parseInt(params.min_idle_session) } : {})
  };
}