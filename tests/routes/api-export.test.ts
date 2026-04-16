import { describe, expect, it } from 'vitest';

import { POST } from '@/app/api/export/route';
import { victoryHomes2026IssuedExample } from '@/lib/reference-cases/victory-homes-2026';

describe('/api/export', () => {
  it('returns a downloadable DOCX response with the computed filename', async () => {
    const response = await POST(
      new Request('http://localhost/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(victoryHomes2026IssuedExample)
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(response.headers.get('Content-Disposition')).toContain('attachment; filename="h38566vic.docx"');
    expect(response.headers.get('X-StrataCore-Archive-Path')).toContain('H:\\DATA 2026\\00 Housing 2026\\5478 - 1 VICTORY HOMES LTD.\\h38566vic.docx');

    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(bytes.byteLength).toBeGreaterThan(100);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });
});
