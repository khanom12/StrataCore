import type { SignoffInputs } from '@/types/domain';
import type { SignoffModel } from '@/types/signoff';

import { formatSignoffName, resolveSignoffProfile } from '@/lib/signoff/engineer-registry';
import { permitToPracticeAsset } from '@/lib/signoff/permit-to-practice';

function normalizeName(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

export function buildSignoffModel(signoff: SignoffInputs): SignoffModel {
  const preparedByValue = signoff.preparedBy?.trim();
  const preparedBy = preparedByValue ? resolveSignoffProfile(preparedByValue) : undefined;
  const signingEngineer = resolveSignoffProfile(signoff.signingEngineer);
  const lines: SignoffModel['lines'] = [];
  const warnings: string[] = [];
  const signingEngineerName = formatSignoffName(signingEngineer.profile);

  if (preparedBy && normalizeName(formatSignoffName(preparedBy.profile)) !== normalizeName(signingEngineerName)) {
    lines.push({ label: 'Prepared by,', value: formatSignoffName(preparedBy.profile) });
    lines.push({ label: 'Reviewed by,', value: signingEngineerName });
  } else if (preparedBy) {
    lines.push({ label: 'Prepared and signed by,', value: signingEngineerName });
  } else {
    lines.push({ label: 'Signed by,', value: signingEngineerName });
  }

  if (!signingEngineer.matched) {
    warnings.push(`Signing engineer "${signoff.signingEngineer}" is not yet in the local signoff registry. A free-text fallback was used.`);
  }

  if (!signingEngineer.profile.memberNumber) {
    warnings.push(`Member number is not yet configured for ${signingEngineerName}. A visible placeholder will be used in the draft/export.`);
  }

  if (!signingEngineer.profile.stampAssetKey) {
    warnings.push(`Stamp asset is not yet configured for ${signingEngineerName}. A text placeholder will be used in the draft/export.`);
  }

  return {
    organization: 'J.R. Paine & Associates Ltd.',
    salutation: 'Yours truly,',
    preparedBy,
    signingEngineer,
    lines,
    permitToPractice: permitToPracticeAsset,
    warnings
  };
}
