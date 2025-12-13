import { describe, it, expect } from 'vitest';
import { PREDEFINED_RULE_SETS } from '../src/config/index.js';
import { parseSelectedRules } from '../src/app/createApp.jsx';

/**
 * Test for backward compatibility fix:
 * Ensures selectedRules parameter accepts both preset names and JSON arrays
 */

describe('selectedRules backward compatibility', () => {
    it('should accept "minimal" preset name', () => {
        const result = parseSelectedRules('minimal');
        expect(result).toEqual(PREDEFINED_RULE_SETS.minimal);
        expect(result).toContain('Location:CN');
        expect(result).toContain('Private');
        expect(result).toContain('Non-China');
    });

    it('should accept "balanced" preset name', () => {
        const result = parseSelectedRules('balanced');
        expect(result).toEqual(PREDEFINED_RULE_SETS.balanced);
        expect(result.length).toBeGreaterThan(PREDEFINED_RULE_SETS.minimal.length);
    });

    it('should accept "comprehensive" preset name', () => {
        const result = parseSelectedRules('comprehensive');
        expect(result).toEqual(PREDEFINED_RULE_SETS.comprehensive);
        expect(result.length).toBeGreaterThanOrEqual(PREDEFINED_RULE_SETS.balanced.length);
    });

    it('should parse valid JSON array', () => {
        const jsonArray = JSON.stringify(['Google', 'Youtube', 'Github']);
        const result = parseSelectedRules(jsonArray);
        expect(result).toEqual(['Google', 'Youtube', 'Github']);
    });

    it('should return empty array for empty string', () => {
        const result = parseSelectedRules('');
        expect(result).toEqual([]);
    });

    it('should return empty array for undefined', () => {
        const result = parseSelectedRules(undefined);
        expect(result).toEqual([]);
    });

    it('should return empty array for null', () => {
        const result = parseSelectedRules(null);
        expect(result).toEqual([]);
    });

    it('should fallback to minimal for invalid JSON', () => {
        const result = parseSelectedRules('invalid-json-{[');
        expect(result).toEqual(PREDEFINED_RULE_SETS.minimal);
    });

    it('should fallback to minimal for unknown preset name', () => {
        const result = parseSelectedRules('unknown-preset');
        expect(result).toEqual(PREDEFINED_RULE_SETS.minimal);
    });

    it('should return empty array if JSON is not an array', () => {
        const jsonObject = JSON.stringify({ rule: 'value' });
        const result = parseSelectedRules(jsonObject);
        expect(result).toEqual([]);
    });
});
