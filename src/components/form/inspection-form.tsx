'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';

import { describeDraftSource } from '@/lib/draft/draft-source';
import { deriveHouseCutRange } from '@/lib/domain/report-helpers';
import { loadDraftSessionState, saveDraftSessionState, type DraftSessionState } from '@/lib/draft/draft-session';
import { buildFallbackSoilLayer, getPrimarySoilFieldsFromLayer } from '@/lib/domain/soil-layers';
import { blankWorkingDraftFormState, defaultFormState } from '@/lib/draft/default-form-state';
import { loadDraftState, saveDraftState } from '@/lib/draft/storage';
import { ANALYST_CONTROL_GROUPS } from '@/lib/form/analyst-controls';
import { buildDraftWorkflowState, groupValidationIssuesByFieldPath } from '@/lib/form/build-draft-workflow';
import {
  DEFERRED_MANUAL_BRANCHES,
  getActiveDocumentMode,
  getFormInputVisibility,
  getSoilDescriptorVisibility
} from '@/lib/form/dependencies';
import { getFieldPathAnchorId } from '@/lib/form/field-paths';
import { normalizeDependentFormState } from '@/lib/form/normalize-dependent-state';
import { cloneFormState, getReferenceCasePreset, identifyReferenceCasePreset, type ReferenceCasePreset } from '@/lib/reference-cases';
import { formatSignoffName, getEngineerRegistry, resolveSignoffProfile } from '@/lib/signoff/engineer-registry';
import type { FormState, SoilInputs, SoilLayerDescriptor, ValidationIssue } from '@/types/domain';

function selectedValues(event: ChangeEvent<HTMLSelectElement>) {
  return Array.from(event.target.selectedOptions).map((option) => option.value);
}

function formatDerivedNumber(value?: number) {
  return value === undefined ? 'n/a' : `${value.toFixed(1)} m`;
}

const SIGNOFF_CUSTOM_OPTION = '__custom__';

const CLIENT_PRESET_LABELS: Record<string, string> = {
  'victory-homes-2026': 'Victory Homes sample project',
  'generic-happy-path': 'Generic sample project'
};

type StatusTone = 'neutral' | 'success' | 'accent';

function getRegistrySelectValue(value: string | undefined, allowBlank: boolean) {
  const trimmed = value?.trim() ?? '';

  if (!trimmed) {
    return allowBlank ? '' : SIGNOFF_CUSTOM_OPTION;
  }

  const resolved = resolveSignoffProfile(trimmed);
  return resolved.matched ? formatSignoffName(resolved.profile) : SIGNOFF_CUSTOM_OPTION;
}

function getClientPresetLabel(presetId: string, fallbackLabel: string) {
  return CLIENT_PRESET_LABELS[presetId] ?? fallbackLabel;
}

function getDraftLabel(preset: ReferenceCasePreset | undefined) {
  return preset ? getClientPresetLabel(preset.id, preset.label) : 'Custom local draft';
}

function getReadinessStatusTone(status: 'ready' | 'review_required' | 'blocked') {
  if (status === 'blocked') {
    return 'blocked';
  }

  return status === 'review_required' ? 'accent' : 'success';
}

export function InspectionForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [draftSession, setDraftSession] = useState<DraftSessionState>({});
  const [hasHydrated, setHasHydrated] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading saved draft...');
  const [statusTone, setStatusTone] = useState<StatusTone>('neutral');
  const pendingStatusRef = useRef<{ message: string; tone: StatusTone } | null>(null);

  const cutRange = deriveHouseCutRange(formState.reportBody.excavation.houseFootingCutDepthsM);
  const matchedPreset = useMemo(() => identifyReferenceCasePreset(formState), [formState]);
  const dependencyVisibility = useMemo(() => getFormInputVisibility(formState), [formState]);
  const activeDocumentMode = useMemo(() => getActiveDocumentMode(), []);
  const workflowState = useMemo(() => buildDraftWorkflowState(formState), [formState]);
  const fieldIssueGroups = useMemo(
    () => groupValidationIssuesByFieldPath(workflowState.validationIssues),
    [workflowState.validationIssues]
  );
  const activeDeferredBranches = useMemo(
    () => workflowState.deferredManualBranches.filter((branch) => branch.active),
    [workflowState.deferredManualBranches]
  );
  const draftSource = useMemo(() => describeDraftSource(formState, draftSession), [draftSession, formState]);
  const signoffProfiles = useMemo(() => getEngineerRegistry(), []);
  const signoffOptions = useMemo(
    () => signoffProfiles.map((profile) => [formatSignoffName(profile), formatSignoffName(profile)] as [string, string]),
    [signoffProfiles]
  );

  const preparedBySelectValue = getRegistrySelectValue(formState.signoff.preparedBy, true);
  const signingEngineerSelectValue = getRegistrySelectValue(formState.signoff.signingEngineer, false);
  const isLayeredSoil = dependencyVisibility.reportBody.soil.showLayeredInputs;
  const engineeredFillLayer = formState.reportBody.soil.engineeredFillLayer ?? buildFallbackSoilLayer(formState.reportBody.soil);
  const underlyingNativeLayer = formState.reportBody.soil.underlyingNativeLayer ?? buildFallbackSoilLayer(formState.reportBody.soil);
  const firstBlockingIssue = workflowState.validationIssues[0];

  useEffect(() => {
    const nextState = normalizeDependentFormState(loadDraftState());
    const savedSession = loadDraftSessionState();
    const initialPreset = identifyReferenceCasePreset(nextState);
    const nextSession = savedSession.sourcePresetId ? savedSession : initialPreset ? { sourcePresetId: initialPreset.id } : {};

    pendingStatusRef.current = {
      message: initialPreset ? `${getDraftLabel(initialPreset)} ready locally.` : 'Saved local draft ready.',
      tone: 'neutral'
    };

    setFormState(nextState);
    setDraftSession(nextSession);
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    saveDraftState(formState);
    saveDraftSessionState(draftSession);

    if (pendingStatusRef.current) {
      setStatusMessage(pendingStatusRef.current.message);
      setStatusTone(pendingStatusRef.current.tone);
      pendingStatusRef.current = null;
      return;
    }

    setStatusMessage('Saved locally.');
    setStatusTone('success');
  }, [draftSession, formState, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated || typeof window === 'undefined') {
      return;
    }

    const focusFromHash = () => {
      const anchorId = decodeURIComponent(window.location.hash).replace(/^#/, '');

      if (!anchorId) {
        return;
      }

      const target = document.getElementById(anchorId);

      if (!target) {
        return;
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusTarget =
        target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement
          ? target
          : target.querySelector('input, select, textarea, button');

      if (focusTarget instanceof HTMLElement) {
        focusTarget.focus();
      }
    };

    focusFromHash();
    window.addEventListener('hashchange', focusFromHash);
    return () => window.removeEventListener('hashchange', focusFromHash);
  }, [hasHydrated]);

  function updateState(updater: (current: FormState) => FormState) {
    setFormState((current) => normalizeDependentFormState(updater(current)));
  }

  function updateTopBlock<K extends keyof FormState['topBlock']>(key: K, value: FormState['topBlock'][K]) {
    updateState((current) => ({ ...current, topBlock: { ...current.topBlock, [key]: value } }));
  }

  function updateArchive<K extends keyof FormState['archive']>(key: K, value: FormState['archive'][K]) {
    updateState((current) => ({ ...current, archive: { ...current.archive, [key]: value } }));
  }

  function updateReportBody<K extends keyof FormState['reportBody']>(key: K, value: FormState['reportBody'][K]) {
    updateState((current) => ({ ...current, reportBody: { ...current.reportBody, [key]: value } }));
  }

  function updateExcavation<K extends keyof FormState['reportBody']['excavation']>(
    key: K,
    value: FormState['reportBody']['excavation'][K]
  ) {
    updateState((current) => ({
      ...current,
      reportBody: {
        ...current.reportBody,
        excavation: { ...current.reportBody.excavation, [key]: value }
      }
    }));
  }

  function updateSoil<K extends keyof FormState['reportBody']['soil']>(key: K, value: FormState['reportBody']['soil'][K]) {
    updateState((current) => ({
      ...current,
      reportBody: {
        ...current.reportBody,
        soil: { ...current.reportBody.soil, [key]: value }
      }
    }));
  }

  function updateSoilLayer<K extends keyof SoilLayerDescriptor>(
    layerKey: 'engineeredFillLayer' | 'underlyingNativeLayer',
    key: K,
    value: SoilLayerDescriptor[K]
  ) {
    updateState((current) => {
      const currentLayer = current.reportBody.soil[layerKey] ?? buildFallbackSoilLayer(current.reportBody.soil);
      const nextLayer = { ...currentLayer, [key]: value } as SoilLayerDescriptor;
      const nextSoil = {
        ...current.reportBody.soil,
        [layerKey]: nextLayer
      };

      if (layerKey === 'engineeredFillLayer') {
        Object.assign(nextSoil, getPrimarySoilFieldsFromLayer(nextLayer));
      }

      return {
        ...current,
        reportBody: {
          ...current.reportBody,
          soil: nextSoil
        }
      };
    });
  }

  function updateRecommendation<K extends keyof FormState['reportBody']['recommendation']>(
    key: K,
    value: FormState['reportBody']['recommendation'][K]
  ) {
    updateState((current) => ({
      ...current,
      reportBody: {
        ...current.reportBody,
        recommendation: { ...current.reportBody.recommendation, [key]: value }
      }
    }));
  }

  function updateGarage<K extends keyof FormState['reportBody']['garage']>(key: K, value: FormState['reportBody']['garage'][K]) {
    updateState((current) => ({
      ...current,
      reportBody: {
        ...current.reportBody,
        garage: { ...current.reportBody.garage, [key]: value }
      }
    }));
  }

  function updateSulphate<K extends keyof FormState['reportBody']['sulphate']>(
    key: K,
    value: FormState['reportBody']['sulphate'][K]
  ) {
    updateState((current) => ({
      ...current,
      reportBody: {
        ...current.reportBody,
        sulphate: { ...current.reportBody.sulphate, [key]: value }
      }
    }));
  }

  function updateWinter(includeParagraph: boolean) {
    updateState((current) => ({
      ...current,
      reportBody: {
        ...current.reportBody,
        winter: { includeParagraph }
      }
    }));
  }

  function updateSignoff<K extends keyof FormState['signoff']>(key: K, value: FormState['signoff'][K]) {
    updateState((current) => ({ ...current, signoff: { ...current.signoff, [key]: value } }));
  }

  function updateCutDepth(
    key: keyof FormState['reportBody']['excavation']['houseFootingCutDepthsM'],
    value: number | undefined
  ) {
    updateState((current) => ({
      ...current,
      reportBody: {
        ...current.reportBody,
        excavation: {
          ...current.reportBody.excavation,
          houseFootingCutDepthsM: { ...current.reportBody.excavation.houseFootingCutDepthsM, [key]: value }
        }
      }
    }));
  }

  function openPreview() {
    saveDraftState(formState);
    saveDraftSessionState(draftSession);
    setStatusMessage('Opening preview with the latest saved draft...');
    setStatusTone('accent');
    router.push('/preview');
  }

  function loadPreset(presetId: string) {
    const preset = getReferenceCasePreset(presetId);

    if (!preset) {
      return;
    }

    pendingStatusRef.current = {
      message: `${getClientPresetLabel(preset.id, preset.label)} loaded and saved locally.`,
      tone: 'accent'
    };

    setDraftSession({ sourcePresetId: preset.id });
    setFormState(normalizeDependentFormState(cloneFormState(preset.formState)));
  }

  function startFreshDraft() {
    pendingStatusRef.current = {
      message: 'Blank working draft loaded and saved locally.',
      tone: 'accent'
    };

    setDraftSession({});
    setFormState(normalizeDependentFormState(cloneFormState(blankWorkingDraftFormState)));
  }

  function jumpToField(fieldPath: string) {
    if (typeof window === 'undefined') {
      return;
    }

    const anchorId = getFieldPathAnchorId(fieldPath);
    window.history.replaceState(null, '', `#${anchorId}`);
    const target = document.getElementById(anchorId);

    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusTarget =
      target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement
        ? target
        : target.querySelector('input, select, textarea, button');

    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus();
    }
  }

  function getFieldIssues(fieldPath: string): ValidationIssue[] {
    return fieldIssueGroups[fieldPath] ?? [];
  }

  function handlePreparedBySelect(value: string) {
    if (!value) {
      updateSignoff('preparedBy', '');
      return;
    }

    if (value === SIGNOFF_CUSTOM_OPTION) {
      if (preparedBySelectValue !== SIGNOFF_CUSTOM_OPTION) {
        updateSignoff('preparedBy', '');
      }

      return;
    }

    updateSignoff('preparedBy', value);
  }

  function handleSigningEngineerSelect(value: string) {
    if (value === SIGNOFF_CUSTOM_OPTION) {
      if (signingEngineerSelectValue !== SIGNOFF_CUSTOM_OPTION) {
        updateSignoff('signingEngineer', '');
      }

      return;
    }

    updateSignoff('signingEngineer', value);
  }

  return (
    <div className="workflow-layout">
      <div className="workflow-main">
        <section className="section-card" id="workflow-status">
          <div className="section-heading">
            <p className="muted">Workflow status</p>
            <h2>Working draft readiness</h2>
            <p className="section-intro">
              Use this summary to catch export blockers early, review unresolved analyst notes, and jump back to the exact input that needs work.
            </p>
          </div>
          <div className={`status-banner status-banner--${getReadinessStatusTone(workflowState.readiness.status)}`}>
            <strong>{workflowState.readiness.label}</strong>
            <p>{draftSource.detail}</p>
          </div>
          <div className="summary-grid summary-grid--four">
            <div className="summary-item">
              <span>Readiness</span>
              <strong>{workflowState.readiness.status === 'ready' ? 'Ready' : workflowState.readiness.status === 'blocked' ? 'Blocked' : 'Review required'}</strong>
            </div>
            <div className="summary-item">
              <span>Blocking issues</span>
              <strong>{workflowState.validationIssues.length}</strong>
            </div>
            <div className="summary-item">
              <span>Analyst review notes</span>
              <strong>{workflowState.reviewFlags.length}</strong>
            </div>
            <div className="summary-item">
              <span>Draft source</span>
              <strong>{draftSource.label}</strong>
            </div>
          </div>
          <div className="issue-summary-grid">
            <div className="issue-summary-card">
              <h3>Blocking issues</h3>
              {workflowState.validationIssues.length === 0 ? (
                <p className="muted">No active blockers are currently preventing export.</p>
              ) : (
                workflowState.validationIssues.map((issue) => (
                  <div key={issue.id} className="issue-summary-item">
                    <div>
                      <strong>{issue.title}</strong>
                      <p>{issue.message}</p>
                    </div>
                    {issue.fieldPath ? (
                      <button className="secondary issue-summary-item__action" type="button" onClick={() => jumpToField(issue.fieldPath!)}>
                        Jump to field
                      </button>
                    ) : null}
                  </div>
                ))
              )}
            </div>
            <div className="issue-summary-card">
              <h3>Analyst review notes</h3>
              {workflowState.reviewFlags.length === 0 ? (
                <p className="muted">No review-sensitive wording branches are active in the current draft.</p>
              ) : (
                workflowState.reviewFlags.map((flag) => (
                  <div key={flag.id} className="issue-summary-item">
                    <div>
                      <strong>{flag.title}</strong>
                      <p>{flag.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="issue-summary-card">
              <h3>Manual / deferred branches</h3>
              {activeDeferredBranches.length === 0 ? (
                <p className="muted">No deferred manual branches are active in the current draft.</p>
              ) : (
                activeDeferredBranches.map((branch) => (
                  <div key={branch.id} className="issue-summary-item">
                    <div>
                      <strong>{branch.description}</strong>
                      <p className="mono">{branch.fieldPath}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <p className="muted">Project setup</p>
            <h2>Project and property</h2>
            <p className="section-intro">
              Capture the letter header, project identity, and property details that need to appear in the draft.
            </p>
          </div>
          <div className="field-grid">
            <Field label="Letter date" type="date" value={formState.topBlock.letterDate} onChange={(value) => updateTopBlock('letterDate', value)} />
            <Field
              label="Site inspection date"
              type="date"
              value={formState.reportBody.inspectionDate}
              onChange={(value) => updateReportBody('inspectionDate', value)}
            />
            <SelectField
              label="Project type"
              value={formState.reportBody.structureVariant}
              onChange={(value) => updateReportBody('structureVariant', value as FormState['reportBody']['structureVariant'])}
              options={[
                ['standard_house', 'Standard house'],
                ['rear_garage_garden_suite', 'Rear garage garden suite']
              ]}
            />
            <Field label="File number" value={formState.topBlock.fileNumber} onChange={(value) => updateTopBlock('fileNumber', value)} />
            <Field label="Client name" value={formState.topBlock.clientName} onChange={(value) => updateTopBlock('clientName', value)} />
            <Field label="Municipality" value={formState.topBlock.municipality} onChange={(value) => updateTopBlock('municipality', value)} />
            <TextAreaField
              className="full"
              label="Client mailing address"
              value={formState.topBlock.clientMailingAddress.join('\n')}
              onChange={(value) => updateTopBlock('clientMailingAddress', value.split('\n').filter(Boolean))}
            />
            <CheckboxField
              label="Include legal land description"
              checked={formState.topBlock.includeLegalDescription}
              onChange={(checked) => updateTopBlock('includeLegalDescription', checked)}
            />
            {dependencyVisibility.topBlock.showLegalDescriptionMode ? (
              <SelectField
                label="Legal description format"
                value={formState.topBlock.legalDescriptionMode}
                onChange={(value) => updateTopBlock('legalDescriptionMode', value as FormState['topBlock']['legalDescriptionMode'])}
                options={[
                  ['single', 'Single lot / block / plan'],
                  ['custom', 'Custom legal description']
                ]}
              />
            ) : null}
            <CheckboxField
              label="Include subdivision name"
              checked={formState.topBlock.includeSubdivision}
              onChange={(checked) => updateTopBlock('includeSubdivision', checked)}
            />
            {dependencyVisibility.topBlock.showSingleLotFields ? (
              <>
                <Field
                  label="Lot"
                  value={formState.topBlock.lot ?? ''}
                  onChange={(value) => updateTopBlock('lot', value)}
                  fieldPath="topBlock.lot"
                  errors={getFieldIssues('topBlock.lot')}
                />
                <Field
                  label="Block"
                  value={formState.topBlock.block ?? ''}
                  onChange={(value) => updateTopBlock('block', value)}
                  fieldPath="topBlock.block"
                  errors={getFieldIssues('topBlock.block')}
                />
                <Field
                  label="Plan"
                  value={formState.topBlock.plan ?? ''}
                  onChange={(value) => updateTopBlock('plan', value)}
                  fieldPath="topBlock.plan"
                  errors={getFieldIssues('topBlock.plan')}
                />
                {dependencyVisibility.topBlock.showStreetAddress ? (
                  <Field
                    label="Site address"
                    value={formState.topBlock.streetAddress}
                    onChange={(value) => updateTopBlock('streetAddress', value)}
                    fieldPath="topBlock.streetAddress"
                    errors={getFieldIssues('topBlock.streetAddress')}
                  />
                ) : null}
              </>
            ) : null}
            {dependencyVisibility.topBlock.showCustomLegalDescriptionLines ? (
              <TextAreaField
                className="full"
                label="Custom legal description"
                value={(formState.topBlock.customLegalDescriptionLines ?? []).join('\n')}
                fieldPath="topBlock.customLegalDescriptionLines"
                errors={getFieldIssues('topBlock.customLegalDescriptionLines')}
                onChange={(value) =>
                  updateTopBlock(
                    'customLegalDescriptionLines',
                    value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                  )
                }
              />
            ) : null}
            <CheckboxField
              label="Include client reference number"
              checked={formState.topBlock.includeClientJobNumber}
              onChange={(checked) => updateTopBlock('includeClientJobNumber', checked)}
            />
            {dependencyVisibility.topBlock.showClientJobNumber ? (
              <>
                <Field
                  label="Client reference number"
                  value={formState.topBlock.clientJobNumber ?? ''}
                  onChange={(value) => updateTopBlock('clientJobNumber', value)}
                  fieldPath="topBlock.clientJobNumber"
                  errors={getFieldIssues('topBlock.clientJobNumber')}
                />
              </>
            ) : null}
            {dependencyVisibility.topBlock.showSubdivision ? (
              <Field label="Subdivision" value={formState.topBlock.subdivision ?? ''} onChange={(value) => updateTopBlock('subdivision', value)} />
            ) : null}
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <p className="muted">Site conditions</p>
            <h2>Site and excavation</h2>
            <p className="section-intro">
              Enter the excavation observations that drive the core footing and site-condition wording.
            </p>
          </div>
          <div className="field-grid">
            <div className="field full">
              <p className="note">
                House footing cut range from the entered measurements: minimum {formatDerivedNumber(cutRange.minimumM)} and maximum{' '}
                {formatDerivedNumber(cutRange.maximumM)}.
              </p>
            </div>
            <Field
              label="Front left cut depth (m)"
              type="number"
              value={formState.reportBody.excavation.houseFootingCutDepthsM.frontLeftM?.toString() ?? ''}
              onChange={(value) => updateCutDepth('frontLeftM', value ? Number(value) : undefined)}
            />
            <Field
              label="Front right cut depth (m)"
              type="number"
              value={formState.reportBody.excavation.houseFootingCutDepthsM.frontRightM?.toString() ?? ''}
              onChange={(value) => updateCutDepth('frontRightM', value ? Number(value) : undefined)}
            />
            <Field
              label="Rear left cut depth (m)"
              type="number"
              value={formState.reportBody.excavation.houseFootingCutDepthsM.rearLeftM?.toString() ?? ''}
              onChange={(value) => updateCutDepth('rearLeftM', value ? Number(value) : undefined)}
            />
            <Field
              label="Rear right cut depth (m)"
              type="number"
              value={formState.reportBody.excavation.houseFootingCutDepthsM.rearRightM?.toString() ?? ''}
              onChange={(value) => updateCutDepth('rearRightM', value ? Number(value) : undefined)}
            />
            <CheckboxField
              label="Rear walkout basement"
              checked={Boolean(formState.reportBody.excavation.walkoutBasement)}
              onChange={(checked) => updateExcavation('walkoutBasement', checked)}
            />
            {dependencyVisibility.reportBody.excavation.showWalkoutExtraRearRemovalM ? (
              <Field
                label="Extra rear removal for frost wall (m)"
                type="number"
                value={formState.reportBody.excavation.walkoutExtraRearRemovalM?.toString() ?? ''}
                onChange={(value) => updateExcavation('walkoutExtraRearRemovalM', value ? Number(value) : undefined)}
                fieldPath="reportBody.excavation.walkoutExtraRearRemovalM"
                errors={getFieldIssues('reportBody.excavation.walkoutExtraRearRemovalM')}
              />
            ) : null}
            <SelectField
              label="Inspection timing"
              value={formState.reportBody.excavation.constructionStage ?? 'normal'}
              onChange={(value) => updateExcavation('constructionStage', value as FormState['reportBody']['excavation']['constructionStage'])}
              options={[
                ['normal', 'Normal live excavation'],
                ['nearly_complete', 'Nearly complete'],
                ['framing', 'Framing stage']
              ]}
            />
            <SelectField
              label="Existing footing condition"
              value={formState.reportBody.excavation.asConstructedMode ?? 'none'}
              onChange={(value) => updateExcavation('asConstructedMode', value as FormState['reportBody']['excavation']['asConstructedMode'])}
              options={[
                ['none', 'None'],
                ['poured_18in', '18-inch strip footing forms placed'],
                ['poured_20in', '20-inch strip footing forms placed'],
                ['poured_24in', '24-inch footing needs review'],
                ['walls_and_footing', 'Walls and footing already constructed']
              ]}
            />
            <SelectField
              label="Site history"
              value={formState.reportBody.excavation.siteHistory ?? 'none'}
              onChange={(value) => updateExcavation('siteHistory', value as FormState['reportBody']['excavation']['siteHistory'])}
              options={[
                ['none', 'No special history'],
                ['infill', 'Infill lot'],
                ['knockdown_rebuild', 'Knockdown / rebuild']
              ]}
            />
            <SelectField
              label="Oversized trench observation"
              value={formState.reportBody.excavation.oversizedTrenchMode ?? 'none'}
              onChange={(value) =>
                updateExcavation('oversizedTrenchMode', value as FormState['reportBody']['excavation']['oversizedTrenchMode'])
              }
              options={[
                ['none', 'None'],
                ['reinforcement', 'Reinforcement path'],
                ['fillcrete_gravel', 'Fillcrete / gravel remediation'],
                ['precast_review', 'Alternate pre-cast review path']
              ]}
            />
            {dependencyVisibility.reportBody.excavation.showTrenchLocation ? (
              <SelectField
                label="Trench location"
                value={formState.reportBody.excavation.trenchLocation ?? 'front'}
                onChange={(value) => updateExcavation('trenchLocation', value as FormState['reportBody']['excavation']['trenchLocation'])}
                options={[
                  ['front', 'Front'],
                  ['front_left', 'Front left'],
                  ['front_right', 'Front right']
                ]}
              />
            ) : null}
            <SelectField
              label="Loose material observation"
              value={formState.reportBody.excavation.looseMaterialMode ?? 'none'}
              onChange={(value) => updateExcavation('looseMaterialMode', value as FormState['reportBody']['excavation']['looseMaterialMode'])}
              options={[
                ['none', 'None'],
                ['noted_only', 'Note only'],
                ['standard_cleanup', 'Standard cleanup'],
                ['thickened_footing_drainage', 'Thickened footing / drainage care']
              ]}
            />
            <CheckboxField
              label="Sloughed material present"
              checked={Boolean(formState.reportBody.excavation.sloughMaterial)}
              onChange={(checked) => updateExcavation('sloughMaterial', checked)}
            />
            <Field
              label="Frost depth (mm)"
              type="number"
              value={formState.reportBody.excavation.frostDepthMm?.toString() ?? ''}
              onChange={(value) => updateExcavation('frostDepthMm', value ? Number(value) : undefined)}
            />
            <SelectField
              label="Water / saturation observation"
              value={formState.reportBody.excavation.waterIssueMode ?? 'none'}
              onChange={(value) => updateExcavation('waterIssueMode', value as FormState['reportBody']['excavation']['waterIssueMode'])}
              options={[
                ['none', 'None'],
                ['free_water_in_auger_holes_basic', 'Free water in auger holes'],
                ['free_water_in_auger_holes_upgraded_drainage', 'Free water with upgraded drainage'],
                ['rain_softened', 'Rain-softened / saturated soil'],
                ['exposed_electrical_trench_water_entry', 'Water entry through exposed trench']
              ]}
            />
            {dependencyVisibility.reportBody.excavation.showWaterIssueDepth ? (
              <Field
                label="Observed water depth below footing (m)"
                type="number"
                value={formState.reportBody.excavation.waterObservedDepthBelowFootingM?.toString() ?? ''}
                onChange={(value) => updateExcavation('waterObservedDepthBelowFootingM', value ? Number(value) : undefined)}
                fieldPath="reportBody.excavation.waterObservedDepthBelowFootingM"
                errors={getFieldIssues('reportBody.excavation.waterObservedDepthBelowFootingM')}
              />
            ) : null}
            <Field
              label="Snow depth (mm)"
              type="number"
              value={formState.reportBody.excavation.snowDepthMm?.toString() ?? ''}
              onChange={(value) => updateExcavation('snowDepthMm', value ? Number(value) : undefined)}
            />
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <p className="muted">Soil observations</p>
            <h2>Soil conditions</h2>
            <p className="section-intro">
              Describe the soil profile that should appear in the letter, including layered fill when it applies.
            </p>
          </div>
          <div className="field-grid">
            <SelectField
              label="Soil layering"
              value={formState.reportBody.soil.soilLayeringMode}
              onChange={(value) => updateSoil('soilLayeringMode', value as SoilInputs['soilLayeringMode'])}
              options={[
                ['single_layer', 'Single layer'],
                ['engineered_fill_over_native', 'Engineered fill over native soil']
              ]}
            />
            <SelectField
              label="Soil origin"
              value={formState.reportBody.soil.primarySoilOrigin}
              onChange={(value) => updateSoil('primarySoilOrigin', value as SoilInputs['primarySoilOrigin'])}
              options={[
                ['native', 'Native soil'],
                ['engineered_fill_jrp', 'Engineered fill by J.R. Paine'],
                ['engineered_fill_jrp_and_others', 'Engineered fill by J.R. Paine and others'],
                ['engineered_fill_others', 'Engineered fill by others'],
                ['engineered_fill_unknown', 'Engineered fill origin unknown']
              ]}
            />
            {isLayeredSoil ? (
              <>
                <SelectField
                  label="Where fill was observed"
                  value={formState.reportBody.soil.layeredCoverageMode ?? 'variable_portions'}
                  onChange={(value) => updateSoil('layeredCoverageMode', value as NonNullable<SoilInputs['layeredCoverageMode']>)}
                  options={[
                    ['variable_portions', 'Variable portions of the excavation'],
                    ['throughout_excavation', 'Throughout the excavation']
                  ]}
                />
                <Field
                  label="Fill depth below footing (mm)"
                  type="number"
                  value={formState.reportBody.soil.fillDepthBelowFootingMm?.toString() ?? ''}
                  onChange={(value) => updateSoil('fillDepthBelowFootingMm', value ? Number(value) : undefined)}
                  fieldPath="reportBody.soil.fillDepthBelowFootingMm"
                  errors={getFieldIssues('reportBody.soil.fillDepthBelowFootingMm')}
                />
                <div className="field full">
                  <p className="note">
                    Fill-over-native soil wording is active. Enter the upper fill layer first, then the native material below it.
                  </p>
                </div>
                <SoilLayerFieldSet
                  title="Upper fill layer"
                  layer={engineeredFillLayer}
                  onChange={(key, value) => updateSoilLayer('engineeredFillLayer', key, value)}
                  fieldPath="reportBody.soil.engineeredFillLayer"
                  errors={getFieldIssues('reportBody.soil.engineeredFillLayer')}
                />
                <SoilLayerFieldSet
                  title="Underlying native layer"
                  layer={underlyingNativeLayer}
                  onChange={(key, value) => updateSoilLayer('underlyingNativeLayer', key, value)}
                  fieldPath="reportBody.soil.underlyingNativeLayer"
                  errors={getFieldIssues('reportBody.soil.underlyingNativeLayer')}
                />
              </>
            ) : (
              <>
                <SelectField
                  label="Material family"
                  value={formState.reportBody.soil.primaryMaterialFamily}
                  onChange={(value) => updateSoil('primaryMaterialFamily', value as SoilInputs['primaryMaterialFamily'])}
                  options={[
                    ['clay', 'Clay'],
                    ['clay_till', 'Clay till'],
                    ['sand', 'Sand'],
                    ['silt', 'Silt'],
                    ['clayey_sand', 'Clayey sand'],
                    ['clayey_silt', 'Clayey silt']
                  ]}
                />
                <SelectField
                  label="Primary moisture"
                  value={formState.reportBody.soil.moisture1}
                  onChange={(value) => updateSoil('moisture1', value as SoilInputs['moisture1'])}
                  options={[
                    ['damp', 'Damp'],
                    ['moist', 'Moist'],
                    ['very_moist', 'Very moist'],
                    ['wet', 'Wet']
                  ]}
                />
                <OptionalSelectField
                  label="Secondary moisture"
                  value={formState.reportBody.soil.moisture2 ?? ''}
                  onChange={(value) => updateSoil('moisture2', value ? (value as SoilInputs['moisture2']) : undefined)}
                  options={[
                    ['moist', 'Moist'],
                    ['very_moist', 'Very moist'],
                    ['wet', 'Wet']
                  ]}
                />
                <SelectField
                  label="Colour"
                  value={formState.reportBody.soil.colour}
                  onChange={(value) => updateSoil('colour', value as SoilInputs['colour'])}
                  options={[
                    ['brown', 'Brown'],
                    ['grey', 'Grey'],
                    ['brown_and_grey', 'Brown and grey'],
                    ['brown_and_dark_grey', 'Brown and dark grey'],
                    ['dark_grey', 'Dark grey'],
                    ['black', 'Black'],
                    ['reddish_brown', 'Reddish brown']
                  ]}
                />
                <SelectField
                  label="Primary plasticity"
                  value={formState.reportBody.soil.plasticity1}
                  onChange={(value) => updateSoil('plasticity1', value as SoilInputs['plasticity1'])}
                  options={[
                    ['low', 'Low'],
                    ['medium', 'Medium'],
                    ['high', 'High']
                  ]}
                />
                <OptionalSelectField
                  label="Secondary plasticity"
                  value={formState.reportBody.soil.plasticity2 ?? ''}
                  onChange={(value) => updateSoil('plasticity2', value ? (value as SoilInputs['plasticity2']) : undefined)}
                  options={[
                    ['medium', 'Medium'],
                    ['high', 'High']
                  ]}
                />
                <SelectField
                  label="Consistency or density"
                  value={formState.reportBody.soil.consistencyOrDensity}
                  onChange={(value) => updateSoil('consistencyOrDensity', value as SoilInputs['consistencyOrDensity'])}
                  options={[
                    ['soft', 'Soft'],
                    ['firm', 'Firm'],
                    ['stiff', 'Stiff'],
                    ['very_stiff', 'Very stiff'],
                    ['hard', 'Hard'],
                    ['very_loose', 'Very loose'],
                    ['loose', 'Loose'],
                    ['compact', 'Compact'],
                    ['dense', 'Dense'],
                    ['very_dense', 'Very dense']
                  ]}
                />
                {dependencyVisibility.reportBody.soil.primary.showClayDescriptors ? (
                  <MultiSelectField
                    label="Clay descriptors"
                    value={formState.reportBody.soil.clayDescriptors ?? []}
                    onChange={(values) => updateSoil('clayDescriptors', values as SoilInputs['clayDescriptors'])}
                    options={[
                      ['silty', 'Silty'],
                      ['very_silty', 'Very silty'],
                      ['sandy', 'Sandy'],
                      ['very_sandy', 'Very sandy']
                    ]}
                  />
                ) : null}
                {dependencyVisibility.reportBody.soil.primary.showSandSiltDescriptors ? (
                  <MultiSelectField
                    label="Sand / silt descriptors"
                    value={formState.reportBody.soil.sandSiltDescriptors ?? []}
                    onChange={(values) => updateSoil('sandSiltDescriptors', values as SoilInputs['sandSiltDescriptors'])}
                    options={[
                      ['coarse', 'Coarse'],
                      ['medium', 'Medium'],
                      ['fine', 'Fine'],
                      ['well_graded', 'Well graded'],
                      ['poorly_graded', 'Poorly graded']
                    ]}
                  />
                ) : null}
                <MultiSelectField
                  label="Trace features"
                  value={formState.reportBody.soil.traceFeatures ?? []}
                  onChange={(values) => updateSoil('traceFeatures', values as SoilInputs['traceFeatures'])}
                  options={[
                    ['oxides', 'Oxides'],
                    ['white_precipitates', 'White precipitates'],
                    ['coal', 'Coal'],
                    ['gravel', 'Gravel'],
                    ['organics', 'Organics'],
                    ['rootlets', 'Rootlets']
                  ]}
                />
              </>
            )}
            <CheckboxField
              label="Include high-plasticity warning"
              checked={Boolean(formState.reportBody.soil.highPlasticWarning)}
              onChange={(checked) => updateSoil('highPlasticWarning', checked)}
            />
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <p className="muted">Garage and drainage</p>
            <h2>Garage and remediation triggers</h2>
            <p className="section-intro">
              Keep the common operator path focused on the garage geometry and any water-related drainage follow-up that the draft needs.
            </p>
          </div>
          <div className="field-grid">
            {dependencyVisibility.reportBody.recommendation.showDrainageUpgradeVariant ? (
              <SelectField
                label="Drainage upgrade"
                value={formState.reportBody.recommendation.drainageUpgradeVariant}
                onChange={(value) =>
                  updateRecommendation('drainageUpgradeVariant', value as FormState['reportBody']['recommendation']['drainageUpgradeVariant'])
                }
                fieldPath="reportBody.recommendation.drainageUpgradeVariant"
                errors={getFieldIssues('reportBody.recommendation.drainageUpgradeVariant')}
                options={[
                  ['none', 'None'],
                  ['washed_rock_interior_exterior_two_laterals', 'Washed rock base with interior and exterior drainage']
                ]}
              />
            ) : null}
            {dependencyVisibility.reportBody.recommendation.showDrainageDrawingAttached ? (
              <CheckboxField
                label="Mention drainage drawing"
                checked={Boolean(formState.reportBody.recommendation.drainageDrawingAttached)}
                onChange={(checked) => updateRecommendation('drainageDrawingAttached', checked)}
              />
            ) : null}
            {dependencyVisibility.reportBody.garage.showGarageMode ? (
              <SelectField
                label="Garage relationship to house"
                value={formState.reportBody.garage.mode}
                onChange={(value) => updateGarage('mode', value as FormState['reportBody']['garage']['mode'])}
                options={[
                  ['none', 'No garage'],
                  ['same_elevation', 'Garage at the same elevation'],
                  ['higher_than_house', 'Garage above the house excavation']
                ]}
              />
            ) : (
              <div className="field full">
                <p className="note">Garage wording is derived automatically for this project type.</p>
              </div>
            )}
            {dependencyVisibility.reportBody.garage.showOffsetAboveHouseM ? (
              <Field
                label="Garage above house by (m)"
                type="number"
                value={formState.reportBody.garage.offsetAboveHouseM?.toString() ?? ''}
                onChange={(value) => updateGarage('offsetAboveHouseM', value ? Number(value) : undefined)}
                fieldPath="reportBody.garage.offsetAboveHouseM"
                errors={getFieldIssues('reportBody.garage.offsetAboveHouseM')}
              />
            ) : null}
            {dependencyVisibility.reportBody.garage.showSlabOrganics ? (
              <CheckboxField
                label="Include garage slab organics note"
                checked={Boolean(formState.reportBody.garage.slabOrganics)}
                onChange={(checked) => updateGarage('slabOrganics', checked)}
              />
            ) : null}
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <p className="muted">Additional notes</p>
            <h2>Concrete and seasonal notes</h2>
            <p className="section-intro">
              Control optional wording related to sulphate exposure and winter construction conditions.
            </p>
          </div>
          <div className="field-grid">
            <CheckboxField
              label="Include sulphate note"
              checked={formState.reportBody.sulphate.includeParagraph}
              onChange={(checked) => updateSulphate('includeParagraph', checked)}
            />
            {dependencyVisibility.reportBody.sulphate.showSulphateClass ? (
              <SelectField
                label="Sulphate class"
                value={formState.reportBody.sulphate.sulphateClass ?? 'negligible'}
                onChange={(value) => updateSulphate('sulphateClass', value as FormState['reportBody']['sulphate']['sulphateClass'])}
                options={[
                  ['negligible', 'Negligible'],
                  ['moderate', 'Moderate'],
                  ['severe', 'Severe'],
                  ['very_severe', 'Very severe']
                ]}
              />
            ) : null}
            <CheckboxField
              label="Include winter construction note"
              checked={formState.reportBody.winter.includeParagraph}
              onChange={updateWinter}
            />
          </div>
        </section>

        <section className="section-card">
          <div className="section-heading">
            <p className="muted">Sign-off</p>
            <h2>Prepared by and sign-off</h2>
            <p className="section-intro">Choose the office sign-off details that will appear in the closing section of the draft.</p>
          </div>
          <div className="field-grid">
            <SelectField
              label="Prepared by"
              value={preparedBySelectValue}
              onChange={handlePreparedBySelect}
              options={[
                ...signoffOptions,
                [SIGNOFF_CUSTOM_OPTION, 'Custom manual entry']
              ]}
              includeBlankOption
              blankOptionLabel="Not shown"
            />
            {preparedBySelectValue === SIGNOFF_CUSTOM_OPTION ? (
              <Field
                label="Prepared by (custom)"
                value={formState.signoff.preparedBy ?? ''}
                onChange={(value) => updateSignoff('preparedBy', value)}
              />
            ) : null}
            <SelectField
              label="Signing engineer"
              value={signingEngineerSelectValue}
              onChange={handleSigningEngineerSelect}
              fieldPath={signingEngineerSelectValue === SIGNOFF_CUSTOM_OPTION ? undefined : 'signoff.signingEngineer'}
              errors={signingEngineerSelectValue === SIGNOFF_CUSTOM_OPTION ? [] : getFieldIssues('signoff.signingEngineer')}
              options={[
                ...signoffOptions,
                [SIGNOFF_CUSTOM_OPTION, 'Custom manual entry']
              ]}
            />
            {signingEngineerSelectValue === SIGNOFF_CUSTOM_OPTION ? (
              <Field
                label="Signing engineer (custom)"
                value={formState.signoff.signingEngineer}
                onChange={(value) => updateSignoff('signingEngineer', value)}
                fieldPath="signoff.signingEngineer"
                errors={getFieldIssues('signoff.signingEngineer')}
              />
            ) : null}
          </div>
        </section>

        <details className="section-card analyst-controls">
          <summary>
            <div>
              <p className="muted">Secondary controls</p>
              <h2>Analyst controls</h2>
            </div>
            <p className="section-intro">
              Use these only when the draft needs an office-specific shell or recommendation override that falls outside the normal operator path.
            </p>
          </summary>
          <div className="note">
            <strong>When to use this panel</strong>
            <p>Leave these settings alone for routine drafting. Open this panel when an analyst needs to adjust letter shell wording or a recommendation family for a specific office case.</p>
          </div>
          <div className="issue-summary-grid">
            {ANALYST_CONTROL_GROUPS.map((group) => (
              <div key={group.id} className="issue-summary-card">
                <h3>{group.title}</h3>
                <p>{group.description}</p>
              </div>
            ))}
          </div>
          <div className="field-grid">
            <SelectField
              label="Subject line style"
              value={formState.topBlock.subjectLineFamily}
              onChange={(value) => updateTopBlock('subjectLineFamily', value as FormState['topBlock']['subjectLineFamily'])}
              fieldPath="topBlock.subjectLineFamily"
              options={[
                ['singular', 'Foundation Soil Inspection'],
                ['plural', 'Foundation Soils Inspection']
              ]}
            />
            <Field
              label="Heading detail (optional)"
              value={formState.topBlock.headingSuffix ?? ''}
              onChange={(value) => updateTopBlock('headingSuffix', value)}
              fieldPath="topBlock.headingSuffix"
            />
            <SelectField
              label="Client reference label"
              value={formState.topBlock.clientReferenceLabelFamily}
              onChange={(value) =>
                updateTopBlock('clientReferenceLabelFamily', value as FormState['topBlock']['clientReferenceLabelFamily'])
              }
              fieldPath="topBlock.clientReferenceLabelFamily"
              options={[
                ['client_job_no', 'Client Job No.'],
                ['job_hash', 'Job#']
              ]}
            />
            <SelectField
              label="House footing basis"
              value={formState.reportBody.recommendation.footingBasis}
              onChange={(value) => updateRecommendation('footingBasis', value as FormState['reportBody']['recommendation']['footingBasis'])}
              fieldPath="reportBody.recommendation.footingBasis"
              options={[
                ['standard', 'Standard footing recommendation'],
                ['modified', 'Modified footing recommendation']
              ]}
            />
            <SelectField
              label="Recommended bearing option"
              value={formState.reportBody.recommendation.spreadFootingFamily}
              onChange={(value) =>
                updateRecommendation('spreadFootingFamily', value as FormState['reportBody']['recommendation']['spreadFootingFamily'])
              }
              fieldPath="reportBody.recommendation.spreadFootingFamily"
              options={[
                ['default_140_kpa', '140 kPa working value'],
                ['default_120_kpa', '120 kPa / 2500 psf value'],
                ['review_100_kpa', '100 kPa review option'],
                ['omit', 'Do not include in this draft']
              ]}
            />
          </div>
        </details>
      </div>

      <aside className="workflow-rail">
        <section className="panel workflow-rail__sticky">
          <p className="muted">Draft workflow</p>
          <h2>Current draft</h2>
          <p className="section-intro">
            The draft saves locally as you edit. Load a sample project for a walkthrough, or continue refining the current local draft.
          </p>
          <div className={`status-banner status-banner--${statusTone}`} aria-live="polite">
            <strong>Draft status</strong>
            <p>{statusMessage}</p>
          </div>
          <div className="summary-grid summary-grid--single">
            <div className="summary-item">
              <span>Draft source</span>
              <strong>{draftSource.label}</strong>
            </div>
            <div className="summary-item">
              <span>Readiness</span>
              <strong>{workflowState.readiness.status === 'ready' ? 'Ready' : workflowState.readiness.status === 'blocked' ? 'Blocked' : 'Review required'}</strong>
            </div>
            <div className="summary-item">
              <span>Next action</span>
              <strong>{firstBlockingIssue?.fieldPath ? 'Fix blocking fields' : 'Open preview'}</strong>
            </div>
          </div>
          <button type="button" onClick={openPreview} disabled={!hasHydrated}>
            Open preview
          </button>

          <div className="rail-section">
            <h3>Sample projects</h3>
            <p className="muted">These examples are useful for demos and quick walkthroughs.</p>
            <div className="button-stack">
              <button
                className={matchedPreset?.id === 'victory-homes-2026' ? 'secondary is-selected' : 'secondary'}
                type="button"
                onClick={() => loadPreset('victory-homes-2026')}
                disabled={matchedPreset?.id === 'victory-homes-2026'}
                aria-pressed={matchedPreset?.id === 'victory-homes-2026'}
              >
                {matchedPreset?.id === 'victory-homes-2026' ? 'Victory Homes sample active' : 'Load Victory Homes sample'}
              </button>
              <button
                className={matchedPreset?.id === 'generic-happy-path' ? 'secondary is-selected' : 'secondary'}
                type="button"
                onClick={() => loadPreset('generic-happy-path')}
                disabled={matchedPreset?.id === 'generic-happy-path'}
                aria-pressed={matchedPreset?.id === 'generic-happy-path'}
              >
                {matchedPreset?.id === 'generic-happy-path' ? 'Generic sample active' : 'Load generic sample'}
              </button>
              <button
                className={draftSource.kind === 'blank_working_draft' ? 'secondary is-selected' : 'secondary'}
                type="button"
                onClick={startFreshDraft}
                disabled={draftSource.kind === 'blank_working_draft'}
                aria-pressed={draftSource.kind === 'blank_working_draft'}
              >
                {draftSource.kind === 'blank_working_draft' ? 'Blank working draft active' : 'Start fresh blank draft'}
              </button>
            </div>
          </div>

          {firstBlockingIssue?.fieldPath ? (
            <div className="note">
              <strong>Blocked draft repair</strong>
              <p>The current draft stays saved locally. Use the button below to jump to the first blocking field before reopening preview or export.</p>
              <button className="secondary" type="button" onClick={() => jumpToField(firstBlockingIssue.fieldPath!)}>
                Jump to first blocker
              </button>
            </div>
          ) : null}

          <details className="internal-details">
            <summary>Internal details</summary>
            <div className="field-grid">
              <Field
                label="Hidden H number"
                value={formState.archive.hNumber}
                onChange={(value) => updateArchive('hNumber', value)}
                fieldPath="archive.hNumber"
                errors={getFieldIssues('archive.hNumber')}
              />
            </div>
            <div className="note">
              <strong>Current letter mode</strong>
              <p>{activeDocumentMode.description}</p>
            </div>
            <div className="note">
              <strong>Analyst review branches still held outside the main draft flow</strong>
              <ul className="internal-list">
                {DEFERRED_MANUAL_BRANCHES.map((branch) => (
                  <li key={branch.id}>{branch.description}</li>
                ))}
              </ul>
            </div>
          </details>
        </section>
      </aside>
    </div>
  );
}

function SoilLayerFieldSet({
  title,
  layer,
  onChange,
  fieldPath,
  errors = []
}: {
  title: string;
  layer: SoilLayerDescriptor;
  onChange: <K extends keyof SoilLayerDescriptor>(key: K, value: SoilLayerDescriptor[K]) => void;
  fieldPath?: string;
  errors?: ValidationIssue[];
}) {
  const descriptorVisibility = getSoilDescriptorVisibility(layer.materialFamily);
  const anchorId = fieldPath ? getFieldPathAnchorId(fieldPath) : undefined;

  return (
    <>
      <div className={`field full ${errors.length ? 'field--error' : ''}`} id={anchorId}>
        <h3>{title}</h3>
        {errors.map((issue) => (
          <p key={issue.id} className="field-error">
            {issue.message}
          </p>
        ))}
      </div>
      <SelectField
        label={`${title} material family`}
        value={layer.materialFamily}
        onChange={(value) => onChange('materialFamily', value as SoilLayerDescriptor['materialFamily'])}
        options={[
          ['clay', 'Clay'],
          ['clay_till', 'Clay till'],
          ['sand', 'Sand'],
          ['silt', 'Silt'],
          ['clayey_sand', 'Clayey sand'],
          ['clayey_silt', 'Clayey silt']
        ]}
      />
      <SelectField
        label={`${title} primary moisture`}
        value={layer.moisture1}
        onChange={(value) => onChange('moisture1', value as SoilLayerDescriptor['moisture1'])}
        options={[
          ['damp', 'Damp'],
          ['moist', 'Moist'],
          ['very_moist', 'Very moist'],
          ['wet', 'Wet']
        ]}
      />
      <OptionalSelectField
        label={`${title} secondary moisture`}
        value={layer.moisture2 ?? ''}
        onChange={(value) => onChange('moisture2', value ? (value as SoilLayerDescriptor['moisture2']) : undefined)}
        options={[
          ['moist', 'Moist'],
          ['very_moist', 'Very moist'],
          ['wet', 'Wet']
        ]}
      />
      <SelectField
        label={`${title} colour`}
        value={layer.colour}
        onChange={(value) => onChange('colour', value as SoilLayerDescriptor['colour'])}
        options={[
          ['brown', 'Brown'],
          ['grey', 'Grey'],
          ['brown_and_grey', 'Brown and grey'],
          ['brown_and_dark_grey', 'Brown and dark grey'],
          ['dark_grey', 'Dark grey'],
          ['black', 'Black'],
          ['reddish_brown', 'Reddish brown']
        ]}
      />
      <OptionalSelectField
        label={`${title} primary plasticity`}
        value={layer.plasticity1 ?? ''}
        onChange={(value) => onChange('plasticity1', value ? (value as SoilLayerDescriptor['plasticity1']) : undefined)}
        options={[
          ['low', 'Low'],
          ['medium', 'Medium'],
          ['high', 'High']
        ]}
      />
      <OptionalSelectField
        label={`${title} secondary plasticity`}
        value={layer.plasticity2 ?? ''}
        onChange={(value) => onChange('plasticity2', value ? (value as SoilLayerDescriptor['plasticity2']) : undefined)}
        options={[
          ['medium', 'Medium'],
          ['high', 'High']
        ]}
      />
      <SelectField
        label={`${title} consistency / density`}
        value={layer.consistencyOrDensity}
        onChange={(value) => onChange('consistencyOrDensity', value as SoilLayerDescriptor['consistencyOrDensity'])}
        options={[
          ['soft', 'Soft'],
          ['firm', 'Firm'],
          ['stiff', 'Stiff'],
          ['very_stiff', 'Very stiff'],
          ['hard', 'Hard'],
          ['very_loose', 'Very loose'],
          ['loose', 'Loose'],
          ['compact', 'Compact'],
          ['dense', 'Dense'],
          ['very_dense', 'Very dense']
        ]}
      />
      {descriptorVisibility.showClayDescriptors ? (
        <MultiSelectField
          label={`${title} clay descriptors`}
          value={layer.clayDescriptors ?? []}
          onChange={(values) => onChange('clayDescriptors', values as SoilLayerDescriptor['clayDescriptors'])}
          options={[
            ['silty', 'Silty'],
            ['very_silty', 'Very silty'],
            ['sandy', 'Sandy'],
            ['very_sandy', 'Very sandy']
          ]}
        />
      ) : null}
      {descriptorVisibility.showSandSiltDescriptors ? (
        <MultiSelectField
          label={`${title} sand / silt descriptors`}
          value={layer.sandSiltDescriptors ?? []}
          onChange={(values) => onChange('sandSiltDescriptors', values as SoilLayerDescriptor['sandSiltDescriptors'])}
          options={[
            ['coarse', 'Coarse'],
            ['medium', 'Medium'],
            ['fine', 'Fine'],
            ['well_graded', 'Well graded'],
            ['poorly_graded', 'Poorly graded']
          ]}
        />
      ) : null}
      <MultiSelectField
        label={`${title} trace features`}
        value={layer.traceFeatures ?? []}
        onChange={(values) => onChange('traceFeatures', values as SoilLayerDescriptor['traceFeatures'])}
        options={[
          ['oxides', 'Oxides'],
          ['white_precipitates', 'White precipitates'],
          ['coal', 'Coal'],
          ['gravel', 'Gravel'],
          ['organics', 'Organics'],
          ['rootlets', 'Rootlets']
        ]}
      />
    </>
  );
}

function getFieldId(label: string, fieldPath?: string) {
  return fieldPath ? getFieldPathAnchorId(fieldPath) : label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function FieldMessages({ id, errors }: { id: string; errors: ValidationIssue[] }) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div id={`${id}-error`} className="field-error-list">
      {errors.map((issue) => (
        <p key={issue.id} className="field-error">
          {issue.message}
        </p>
      ))}
    </div>
  );
}

function Field({
  className,
  errors = [],
  fieldPath,
  label,
  onChange,
  type = 'text',
  value
}: {
  className?: string;
  errors?: ValidationIssue[];
  fieldPath?: string;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  const id = getFieldId(label, fieldPath);

  return (
    <div className={`field ${className ?? ''} ${errors.length ? 'field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        aria-invalid={errors.length > 0}
        aria-describedby={errors.length > 0 ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldMessages id={id} errors={errors} />
    </div>
  );
}

function TextAreaField({
  className,
  errors = [],
  fieldPath,
  label,
  onChange,
  value
}: {
  className?: string;
  errors?: ValidationIssue[];
  fieldPath?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const id = getFieldId(label, fieldPath);

  return (
    <div className={`field ${className ?? ''} ${errors.length ? 'field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        value={value}
        aria-invalid={errors.length > 0}
        aria-describedby={errors.length > 0 ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldMessages id={id} errors={errors} />
    </div>
  );
}

function SelectField({
  blankOptionLabel,
  className,
  errors = [],
  fieldPath,
  includeBlankOption,
  label,
  onChange,
  options,
  value
}: {
  blankOptionLabel?: string;
  className?: string;
  errors?: ValidationIssue[];
  fieldPath?: string;
  includeBlankOption?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  value: string;
}) {
  const id = getFieldId(label, fieldPath);

  return (
    <div className={`field ${className ?? ''} ${errors.length ? 'field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        aria-invalid={errors.length > 0}
        aria-describedby={errors.length > 0 ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        {includeBlankOption ? <option value="">{blankOptionLabel ?? 'None'}</option> : null}
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
      <FieldMessages id={id} errors={errors} />
    </div>
  );
}

function OptionalSelectField({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  value: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">None</option>
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
    </div>
  );
}

function MultiSelectField({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: string[]) => void;
  options: Array<[string, string]>;
  value: string[];
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div className="field full">
      <label htmlFor={id}>{label}</label>
      <select id={id} multiple value={value} onChange={(event) => onChange(selectedValues(event))}>
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div className="checkbox-row">
      <input id={id} checked={checked} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}
