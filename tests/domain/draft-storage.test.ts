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
    expect(normalized.reportBody.inspectionDate).toBe('2026-04-10');
    expect(normalized.reportBody.excavation.houseFootingCutDepthsM.frontLeftM).toBe(1.2);
    expect(normalized.reportBody.excavation.houseFootingCutDepthsM.rearRightM).toBe(1.8);
    expect(normalized.reportBody.garage.mode).toBe('none');
    expect(normalized.signoff.signingEngineer).toBe('Legacy Engineer, P.Eng.');
  });

  it('migrates the interim normalized Prompt 2 draft shape into the final canonical FormState', () => {
    const normalized = normalizeStoredDraftState({
      topBlock: {
        letterDate: '2026-04-18',
        fileNumber: '7777 - 2',
        clientName: 'INTERIM CLIENT',
        clientMailingAddress: ['Interim Line 1'],
        legalDescription: {
          include: true,
          lot: '9',
          block: '10',
          plan: 'XYZ 9876'
        },
        streetAddress: '2 Interim Street',
        clientJobNumber: {
          include: true,
          value: 'JOB-22'
        },
        subdivision: {
          include: true,
          value: 'Interim Estates'
        },
        municipality: 'Edmonton, Alberta'
      },
      archive: {
        hNumber: 'h77777'
      },
      reportBody: {
        excavation: {
          inspectionDate: '2026-04-11',
          houseFootingCutDepthsM: {
            frontLeftM: 1.5,
            frontRightM: 1.5,
            rearLeftM: 1.9,
            rearRightM: 1.9
          },
          garageMode: 'higher_than_house',
          garageOffsetAboveHouseM: 0.6
        },
        recommendations: {
          footingBasis: 'modified',
          spreadFootingFamily: 'review_100_kpa',
          garageSlabOrganics: true
        },
        winterConstruction: {
          includeParagraph: false
        }
      },
      signoff: {
        signingEngineer: 'Interim Engineer, P.Eng.'
      }
    });

    expect(normalized.reportBody.inspectionDate).toBe('2026-04-11');
    expect(normalized.reportBody.recommendation.footingBasis).toBe('modified');
    expect(normalized.reportBody.garage.mode).toBe('higher_than_house');
    expect(normalized.reportBody.garage.offsetAboveHouseM).toBe(0.6);
    expect(normalized.reportBody.garage.slabOrganics).toBe(true);
    expect(normalized.reportBody.winter.includeParagraph).toBe(false);
  });
});
