import type { SignoffInputs } from '@/types/domain';
import type { SignoffModel } from '@/types/signoff';

import { formatSignoffName, resolveSignoffProfile } from '@/lib/signoff/engineer-registry';
import { permitToPracticeAsset } from '@/lib/signoff/permit-to-practice';
import { signoffText } from '@/lib/seed/letter-surfaces';

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
    lines.push({ label: signoffText.labels.preparedBy, value: formatSignoffName(preparedBy.profile) });
    lines.push({ label: signoffText.labels.reviewedBy, value: signingEngineerName });
  } else if (preparedBy) {
    lines.push({ label: signoffText.labels.preparedAndSignedBy, value: signingEngineerName });
  } else {
    lines.push({ label: signoffText.labels.signedBy, value: signingEngineerName });
  }

  if (!signingEngineer.matched) {
    warnings.push(`Signing engineer "${signoff.signingEngineer}" is not yet in the local signoff registry. A free-text fallback was used.`);
  }

  if (!signingEngineer.profile.memberNumber) {
    warnings.push(`Member number is not yet configured for ${signingEngineerName}. Client-facing export should remain blocked until the office confirms it.`);
  }

  if (!signingEngineer.profile.stampAssetKey) {
    warnings.push(`Stamp asset is not yet configured for ${signingEngineerName}. The warning remains internal and no placeholder text will be shown in the visible letter.`);
  }

  if (!signoff.preparedBy?.trim() && !signingEngineer.profile.memberNumber) {
    warnings.push(`Visible signoff content is missing the ${signoffText.labels.memberNumber} line until the signing engineer resolves to a registry-backed profile.`);
  }

  if (!permitToPracticeAsset.assetPath) {
    warnings.push(permitToPracticeAsset.statusText);
  }

  return {
    organization: signoffText.organization,
    salutation: signoffText.salutation,
    preparedBy,
    signingEngineer,
    lines,
    permitToPractice: permitToPracticeAsset,
    warnings
  };
}
