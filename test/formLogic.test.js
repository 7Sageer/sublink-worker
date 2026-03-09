import { describe, it, expect } from 'vitest';
import { formLogicFn } from '../src/components/formLogic.js';

describe('formLogic toString fix', () => {
  it('includes parseSurgeConfigInput definition in toString output', () => {
    const fnString = formLogicFn.toString();

    // Verify the function references parseSurgeConfigInput
    expect(fnString).toContain('parseSurgeConfigInput');

    // Verify the function definition IS included
    expect(fnString).toMatch(/function\s+parseSurgeConfigInput/);

    // Verify helper functions are also included
    expect(fnString).toMatch(/function\s+parseSurgeValue/);
    expect(fnString).toMatch(/function\s+convertSurgeIniToJson/);
  });
});
