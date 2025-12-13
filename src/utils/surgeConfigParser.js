function parseSurgeValue(rawValue = '') {
    const trimmed = rawValue.trim();
    if (trimmed === '') return '';
    const unquoted = trimmed.replace(/^"(.*)"$/, '$1');
    const lower = unquoted.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(unquoted)) {
        return Number(unquoted);
    }
    return unquoted;
}

export function convertSurgeIniToJson(content) {
    const lines = content.split(/\r?\n/);
    const config = {};
    let currentSection = null;

    const ensureObject = (key) => {
        if (!config[key]) config[key] = {};
        return config[key];
    };

    const ensureArray = (key) => {
        if (!config[key]) config[key] = [];
        return config[key];
    };

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith(';') || line.startsWith('#')) {
            continue;
        }
        const sectionMatch = line.match(/^\[(.+)]$/);
        if (sectionMatch) {
            currentSection = sectionMatch[1].trim();
            continue;
        }
        if (!currentSection) {
            continue;
        }
        const sectionName = currentSection.toLowerCase();
        if (sectionName === 'general' || sectionName === 'replica') {
            const equalsIndex = line.indexOf('=');
            if (equalsIndex === -1) continue;
            const key = line.slice(0, equalsIndex).trim();
            const value = line.slice(equalsIndex + 1).trim();
            if (!key) continue;
            const target = ensureObject(sectionName);
            target[key] = parseSurgeValue(value);
        } else if (sectionName === 'proxy') {
            ensureArray('proxies').push(line);
        } else if (sectionName === 'proxy group') {
            ensureArray('proxy-groups').push(line);
        } else if (sectionName === 'rule') {
            ensureArray('rules').push(line);
        } else {
            ensureArray(sectionName).push(line);
        }
    }

    if (!config.general && !config.replica && !config.proxies && !config['proxy-groups']) {
        throw new Error('Unable to parse Surge INI content');
    }

    return config;
}

export function parseSurgeConfigInput(content) {
    const trimmed = content.trim();
    if (!trimmed) {
        throw new Error('Config content is empty');
    }
    try {
        return { configObject: JSON.parse(trimmed), convertedFromIni: false };
    } catch {
        const converted = convertSurgeIniToJson(content);
        return { configObject: converted, convertedFromIni: true };
    }
}
