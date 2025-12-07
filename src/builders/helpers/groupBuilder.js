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

export function buildSelectorMembers({ proxyList = [], translator, groupByCountry = false, manualGroupName, countryGroupNames = [] }) {
    if (!translator) {
        throw new Error('buildSelectorMembers requires a translator function');
    }
    const base = groupByCountry
        ? [
            translator('outboundNames.Node Select'),
            translator('outboundNames.Auto Select'),
            ...(manualGroupName ? [manualGroupName] : []),
            ...countryGroupNames
        ]
        : [
            translator('outboundNames.Node Select'),
            ...proxyList
        ];
    return withDirectReject(base);
}
//add here
export function adjustProxyOrderForGroup({
  members = [],
  groupName = "",
  translator,
}) {
  if (!translator) {
    return members;
  }

  // 🛑 广告拦截 - 默认 REJECT
  if (groupName === translator("outboundNames.Ad Block")) {
    const reordered = members.filter((m) => m !== "REJECT");
    return ["REJECT", ...reordered];
  }

  // 🔒 国内服务 - 默认 DIRECT
  if (groupName === translator("outboundNames.Location:CN")) {
    const reordered = members.filter((m) => m !== "DIRECT");
    return ["DIRECT", ...reordered];
  }

  // 🏠 私有网络 - 默认 DIRECT
  if (groupName === translator("outboundNames.Private")) {
    const reordered = members.filter((m) => m !== "DIRECT");
    return ["DIRECT", ...reordered];
  }

  // 🌐 非中国 - 默认自动选择
  if (groupName === translator("outboundNames.Non-China")) {
    const autoSelect = translator("outboundNames.Auto Select");
    const reordered = members.filter((m) => m !== autoSelect);
    return [autoSelect, ...reordered];
  }

  // 🐟 漏网之鱼 - 默认自动选择
  if (groupName === translator("outboundNames.Fall Back")) {
    const autoSelect = translator("outboundNames.Auto Select");
    const reordered = members.filter((m) => m !== autoSelect);
    return [autoSelect, ...reordered];
  }

  return members;
}
