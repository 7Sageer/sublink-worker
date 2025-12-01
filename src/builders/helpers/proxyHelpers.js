function defaultGetName(item) {
    return item?.name || item?.tag || '';
}

function defaultSetName(item, name) {
    if (item) {
        if ('name' in item) {
            item.name = name;
        } else if ('tag' in item) {
            item.tag = name;
        }
    }
}

function defaultIsSame(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

export function addProxyWithDedup(collection, proxy, { getName = defaultGetName, setName = defaultSetName, isSame = defaultIsSame } = {}) {
    if (!proxy) return;
    if (!Array.isArray(collection)) {
        throw new Error('addProxyWithDedup expects the target collection to be an array');
    }

    let candidate = proxy;
    const targetName = getName(candidate) || '';
    const similarProxies = collection.filter(item => {
        const name = getName(item) || '';
        return targetName && name.includes(targetName);
    });

    const hasIdentical = collection.some(item => isSame(item, candidate));
    if (hasIdentical) {
        return;
    }

    if (similarProxies.length > 0 && typeof setName === 'function' && targetName) {
        const updated = setName(candidate, `${targetName} ${similarProxies.length + 1}`);
        if (typeof updated !== 'undefined') {
            candidate = updated;
        }
    }

    collection.push(candidate);
}
