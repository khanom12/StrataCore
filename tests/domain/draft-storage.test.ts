import { describe, expect, it } from 'vitest';

import { normalizeStoredDraftState } from '@/lib/draft/storage';

describe('draft-state normalization', () => {
  it('migrates the legacy scaffold draft shape into the normalized grouped FormState', () => {
    const normalized = normalizeStoredDraftState({
      meta: {
        letterDate: '2026-04-16',
        fileNumber: '9000 - 1',
        clientName: 'LEGACY CLIENT',
        clientMailingAddress: ['Line 1'],
        includeLegalDescription: true,
        lot: '1',
        block: '2',
        plan: 'ABC 1234',
        streetAddress: '1 Example Street',
        municipality: 'Edmonton, Alberta',
        hNumber: 'h99999'
      },
      inspectionDate: '2026-04-10',
      p2: {
        minCutM: 1.2,
        maxCutM: 1.8,
        garageMode: 'none'
      },
      p3: {
        soilLayeringMode: 'single_layer',
        primarySoilOrigin: 'native',
        primaryMaterialFamily: 'clay',
        moisture1: 'moist',
        colour: 'brown',
        plasticity1: 'medium',
        consistencyOrDensity: 'stiff'
      },
      signoff: {
        signingEngineer: 'Legacy Engineer, P.Eng.'
      }
    });

    expect(normalized.topBlock.clientName).toBe('LEGACY CLIENT');
    expect(normalized.archive.hNumber).toBe('h99999');
    expect(normalized.reportBody.excavation.houseFootingCutDepthsM.frontLeftM).toBe(1.2);
    expect(normalized.reportBody.excavation.houseFootingCutDepthsM.rearRightM).toBe(1.8);
    expect(normalized.signoff.signingEngineer).toBe('Legacy Engineer, P.Eng.');
  });
});
