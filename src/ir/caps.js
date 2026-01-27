export const CAPS = {
    clash: { reality: false, utls: false },
    singbox: { reality: true, utls: true },
    surge: { reality: false, utls: false },
    xray: { reality: true, utls: true }
};

/**
 * Apply target capability downgrade to an IR node.
 * This MUST NOT mutate the input IR object.
 * @param {object} ir
 * @param {'clash'|'singbox'|'surge'|'xray'} target
 * @returns {object}
 */
export function downgradeByCaps(ir, target) {
    const caps = CAPS[target];
    if (!caps || !ir) return ir;

    const out = structuredClone(ir);

    if (!caps.reality && out.tls?.reality) {
        delete out.tls.reality;
    }
    if (!caps.utls && out.tls?.utls) {
        delete out.tls.utls;
    }

    return out;
}

