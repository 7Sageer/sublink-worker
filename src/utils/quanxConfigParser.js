// QX sections mix key=value, flag-only (e.g. `no-ipv6`) and positional lines,
// so bodies are kept as raw lines instead of being parsed into key/value maps.
export function parseQuanxIni(content) {
    // Null prototype: section names come from user input (e.g. [__proto__])
    const sections = Object.create(null);
    let current = null;
    for (const rawLine of String(content ?? '').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || /^(#|;|\/\/)/.test(line)) continue;
        const header = line.match(/^\[([^\]]+)\]\s*(?:[;#].*)?$/);
        if (header) {
            current = header[1].trim().toLowerCase();
            sections[current] = sections[current] || [];
            continue;
        }
        if (current) sections[current].push(line);
    }
    return Object.keys(sections).length > 0 ? { sections } : null;
}

export function isQuanxConfig(value) {
    const sections = value?.sections;
    return !!sections && typeof sections === 'object' && !Array.isArray(sections)
        && Object.values(sections).every(lines => Array.isArray(lines) && lines.every(line => typeof line === 'string'));
}

// Accepts INI text or an already-structured object and always returns parser output,
// so object payloads get the same name normalization and line splitting as INI text.
export function normalizeQuanxConfig(content) {
    if (typeof content === 'string') return parseQuanxIni(content);
    if (!isQuanxConfig(content)) return null;
    const ini = Object.entries(content.sections)
        .map(([name, lines]) => [`[${name}]`, ...lines].join('\n'))
        .join('\n');
    return parseQuanxIni(ini);
}
