import { normalizeDependentFormState } from '@/lib/form/normalize-dependent-state';
import { getFormInputVisibility } from '@/lib/form/dependencies';
import { buildSignoffModel } from '@/lib/signoff/build-signoff-model';
import type { FormState, GenerationResult, ValidationIssue } from '@/types/domain';

function isBlank(value?: string) {
  return !value?.trim();
}

function addIssue(
  issues: ValidationIssue[],
  issue: {
    id: string;
    title: string;
    message: string;
    fieldPath?: string;
  }
) {
  issues.push(issue);
}

function collectClientFacingText(result?: GenerationResult) {
  return result?.paragraphs.map((paragraph) => paragraph.text).join('\n') ?? '';
}

export function validateDraftForClientOutput(formState: FormState, generationResult?: GenerationResult): ValidationIssue[] {
  const normalizedFormState = normalizeDependentFormState(formState);
  const visibility = getFormInputVisibility(normalizedFormState);
  const issues: ValidationIssue[] = [];

  if (normalizedFormState.topBlock.includeLegalDescription && normalizedFormState.topBlock.legalDescriptionMode === 'single') {
    if (isBlank(normalizedFormState.topBlock.lot)) {
      addIssue(issues, {
        id: 'single-legal-lot',
        title: 'Lot is required',
        message: 'The single-lot legal description is active, so the visible lot value must be provided before export.',
        fieldPath: 'topBlock.lot'
      });
    }

    if (isBlank(normalizedFormState.topBlock.block)) {
      addIssue(issues, {
        id: 'single-legal-block',
        title: 'Block is required',
        message: 'The single-lot legal description is active, so the visible block value must be provided before export.',
        fieldPath: 'topBlock.block'
      });
    }

    if (isBlank(normalizedFormState.topBlock.plan)) {
      addIssue(issues, {
        id: 'single-legal-plan',
        title: 'Plan is required',
        message: 'The single-lot legal description is active, so the visible plan value must be provided before export.',
        fieldPath: 'topBlock.plan'
      });
    }

    if (isBlank(normalizedFormState.topBlock.streetAddress)) {
      addIssue(issues, {
        id: 'single-legal-street',
        title: 'Site address is required',
        message: 'The single-lot legal description is active, so the street address must remain visible in the client-facing shell.',
        fieldPath: 'topBlock.streetAddress'
      });
    }
  }

  if (normalizedFormState.topBlock.includeLegalDescription && normalizedFormState.topBlock.legalDescriptionMode === 'custom') {
    if (!(normalizedFormState.topBlock.customLegalDescriptionLines?.length ?? 0)) {
      addIssue(issues, {
        id: 'custom-legal-lines',
        title: 'Custom legal description is empty',
        message: 'Custom legal-description mode is active, so at least one custom legal-description line is required before export.',
        fieldPath: 'topBlock.customLegalDescriptionLines'
      });
    }
  }

  if (visibility.topBlock.showClientJobNumber && isBlank(normalizedFormState.topBlock.clientJobNumber)) {
    addIssue(issues, {
      id: 'client-reference-number',
      title: 'Client reference number is required',
      message: 'The client reference number is enabled in the visible top block, so the value must be filled before export.',
      fieldPath: 'topBlock.clientJobNumber'
    });
  }

  if (visibility.reportBody.excavation.showWalkoutExtraRearRemovalM && normalizedFormState.reportBody.excavation.walkoutExtraRearRemovalM === undefined) {
    addIssue(issues, {
      id: 'walkout-extra-rear-removal',
      title: 'Walkout rear removal is required',
      message: 'The walkout wording family is active, so the extra rear removal for the frost-wall wording must be set before export.',
      fieldPath: 'reportBody.excavation.walkoutExtraRearRemovalM'
    });
  }

  if (visibility.reportBody.garage.showOffsetAboveHouseM && normalizedFormState.reportBody.garage.offsetAboveHouseM === undefined) {
    addIssue(issues, {
      id: 'garage-offset',
      title: 'Garage offset is required',
      message: 'The higher-than-house garage family is active, so the offset above the house excavation must be provided before export.',
      fieldPath: 'reportBody.garage.offsetAboveHouseM'
    });
  }

  if (visibility.reportBody.excavation.showWaterIssueDepth && normalizedFormState.reportBody.excavation.waterObservedDepthBelowFootingM === undefined) {
    addIssue(issues, {
      id: 'water-depth',
      title: 'Observed water depth is required',
      message: 'The auger-hole water family is active, so the observed water depth below footing must be provided before export.',
      fieldPath: 'reportBody.excavation.waterObservedDepthBelowFootingM'
    });
  }

  if (
    visibility.reportBody.recommendation.showDrainageUpgradeVariant &&
    normalizedFormState.reportBody.recommendation.drainageUpgradeVariant === 'none'
  ) {
    addIssue(issues, {
      id: 'drainage-upgrade-variant',
      title: 'Drainage upgrade selection is required',
      message: 'The upgraded-drainage water family is active, so the downstream drainage upgrade selection must be set before export.',
      fieldPath: 'reportBody.recommendation.drainageUpgradeVariant'
    });
  }

  if (visibility.reportBody.soil.showLayeredInputs) {
    if (normalizedFormState.reportBody.soil.fillDepthBelowFootingMm === undefined) {
      addIssue(issues, {
        id: 'layered-soil-fill-depth',
        title: 'Layered-soil fill depth is required',
        message: 'Layered soil mode is active, so the fill depth below footing must be provided before export.',
        fieldPath: 'reportBody.soil.fillDepthBelowFootingMm'
      });
    }

    if (!normalizedFormState.reportBody.soil.engineeredFillLayer) {
      addIssue(issues, {
        id: 'layered-soil-fill-layer',
        title: 'Upper fill layer is required',
        message: 'Layered soil mode is active, so the upper fill layer must remain populated before export.',
        fieldPath: 'reportBody.soil.engineeredFillLayer'
      });
    }

    if (!normalizedFormState.reportBody.soil.underlyingNativeLayer) {
      addIssue(issues, {
        id: 'layered-soil-native-layer',
        title: 'Underlying native layer is required',
        message: 'Layered soil mode is active, so the underlying native layer must remain populated before export.',
        fieldPath: 'reportBody.soil.underlyingNativeLayer'
      });
    }
  }

  if (isBlank(normalizedFormState.signoff.signingEngineer)) {
    addIssue(issues, {
      id: 'signing-engineer',
      title: 'Signing engineer is required',
      message: 'A signing engineer is required for every client-facing draft before export.',
      fieldPath: 'signoff.signingEngineer'
    });
  }

  if (isBlank(normalizedFormState.archive.hNumber)) {
    addIssue(issues, {
      id: 'archive-h-number',
      title: 'Hidden H number is required',
      message: 'The H number drives the filename and archive path, so it must be present before export.',
      fieldPath: 'archive.hNumber'
    });
  }

  const signoffModel = buildSignoffModel(normalizedFormState.signoff);

  if (!signoffModel.signingEngineer.profile.memberNumber) {
    addIssue(issues, {
      id: 'signoff-member-number',
      title: 'Engineer member number is missing',
      message: 'The visible signoff block requires a registry-backed APEGA member number before export can continue.',
      fieldPath: 'signoff.signingEngineer'
    });
  }

  const clientFacingText = collectClientFacingText(generationResult);

  if (/\[(?:review required|registry pending|[^\]]*placeholder[^\]]*)\]/i.test(clientFacingText)) {
    addIssue(issues, {
      id: 'client-facing-placeholder-leak',
      title: 'Client-facing placeholder text remains',
      message: 'The generated client-facing text still contains placeholder or review-required markers and must not be exported yet.'
    });
  }

  return issues;
}
