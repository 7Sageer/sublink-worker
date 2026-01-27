const normalize = (value) => typeof value === 'string' ? value.trim() : value;

export function uniqueNames(names = []) {
    const seen = new Set();
    const result = [];
    names.forEach(name => {
        if (typeof name !== 'string') return;
        const normalized = normalize(name);
        if (!normalized || seen.has(normalized)) return;
        seen.add(normalized);
        result.push(normalized);
    });
    return result;
}

export function withDirectReject(options = []) {
    return uniqueNames([
        ...options,
        'DIRECT',
        'REJECT'
    ]);
}

export function buildNodeSelectMembers({ proxyList = [], translator, groupByCountry = false, manualGroupName, countryGroupNames = [] }) {
    if (!translator) {
        throw new Error('buildNodeSelectMembers requires a translator function');
    }
    const autoName = translator('outboundNames.Auto Select');
    const base = groupByCountry
        ? [
            autoName,
            ...(manualGroupName ? [manualGroupName] : []),
            ...countryGroupNames
        ]
        : [
            autoName,
            ...proxyList
        ];
    return withDirectReject(base);
}

export function buildSelectorMembers({ proxyList = [], translator, groupByCountry = false, manualGroupName, countryGroupNames = [], targetGroupName = '' }) {
    if (!translator) {
        throw new Error('buildSelectorMembers requires a translator function');
    }

    const nodeSelectName = translator('outboundNames.Node Select');
    const autoSelectName = translator('outboundNames.Auto Select');

    // Define groups that should default to DIRECT
    // Using translation keys/values to match what's passed in
    const directDefaultGroups = [
        translator('outboundNames.Bilibili'),
        translator('outboundNames.Location:CN'),
        translator('outboundNames.Private')
    ];

    // Define groups that should default to REJECT
    const rejectDefaultGroups = [
        translator('outboundNames.Ad Block')
    ];

    const isDirectDefault = directDefaultGroups.includes(targetGroupName);
    const isRejectDefault = rejectDefaultGroups.includes(targetGroupName);

    const base = groupByCountry
        ? [
            nodeSelectName,
            autoSelectName,
            ...(manualGroupName ? [manualGroupName] : []),
            ...countryGroupNames
        ]
        : [
            nodeSelectName,
            ...proxyList
        ];

    let members = base;

    if (isDirectDefault) {
        // Remove DIRECT from list if exists (to avoid dupe) and prepend it
        // The list is just strings at this point, but wrapped via withDirectReject usually adds validRefs.
        // We'll construct the array manually to control order.
        members = ['DIRECT', ...base, 'REJECT'];
        return uniqueNames(members);
    } else if (isRejectDefault) {
        members = ['REJECT', 'DIRECT', ...base];
        return uniqueNames(members);
    }

    return withDirectReject(base);
}
