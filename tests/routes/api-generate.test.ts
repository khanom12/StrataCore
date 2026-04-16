import { describe, expect, it } from 'vitest';

import { POST } from '@/app/api/generate/route';

describe('/api/generate', () => {
  it('normalizes incoming draft payloads before returning the GenerationResult boundary', async () => {
    const response = await POST(
      new Request('http://localhost/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          meta: {
            fileNumber: '1234 - 1',
            clientName: 'Route Test Client',
            clientMailingAddress: ['1 Test Way'],
            streetAddress: '1 Test Way',
            municipality: 'Edmonton, Alberta',
            hNumber: 'h12345'
          },
          inspectionDate: '2026-04-14',
          p2: {
            minCutM: 1.4,
            maxCutM: 1.9,
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
          }
        })
      })
    );

    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      visibleSections: string[];
      filename: string;
      paragraphs: Array<{ sectionId: string }>;
    };

    expect(payload.visibleSections).toContain('TOP_BLOCK');
    expect(payload.visibleSections).toContain('P4');
    expect(payload.paragraphs[0]?.sectionId).toBe('TOP_BLOCK');
    expect(payload.filename).toContain('h12345');
  });
});
