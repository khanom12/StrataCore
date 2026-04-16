import { describe, expect, it } from 'vitest';

import { buildSignoffModel } from '@/lib/signoff/build-signoff-model';

describe('buildSignoffModel', () => {
  it('renders prepared-by and reviewed-by lines when different people are selected', () => {
    const signoff = buildSignoffModel({
      preparedBy: 'Doug Parth, E.I.T.',
      signingEngineer: 'Scott MacFarlane, P.Eng.'
    });

    expect(signoff.lines).toEqual([
      { label: 'Prepared by', value: 'Doug Parth, E.I.T.' },
      { label: 'Reviewed by', value: 'Scott MacFarlane, P.Eng.' }
    ]);
    expect(signoff.signingEngineer.profile.memberNumber).toBe('89667');
  });

  it('collapses to prepared-and-signed wording when the preparer and signing engineer are the same', () => {
    const signoff = buildSignoffModel({
      preparedBy: 'Scott MacFarlane, P.Eng.',
      signingEngineer: 'Scott MacFarlane, P.Eng.'
    });

    expect(signoff.lines).toEqual([{ label: 'Prepared and signed by', value: 'Scott MacFarlane, P.Eng.' }]);
  });

  it('falls back cleanly when the signing engineer is not found in the local registry', () => {
    const signoff = buildSignoffModel({
      preparedBy: '',
      signingEngineer: 'Unknown Reviewer, P.Eng.'
    });

    expect(signoff.signingEngineer.matched).toBe(false);
    expect(signoff.lines).toEqual([{ label: 'Signed by', value: 'Unknown Reviewer, P.Eng.' }]);
    expect(signoff.warnings.some((warning) => warning.includes('free-text fallback'))).toBe(true);
  });
});
