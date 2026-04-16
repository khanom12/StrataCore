'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';

import { deriveHouseCutRange } from '@/lib/domain/report-helpers';
import { buildFallbackSoilLayer, getPrimarySoilFieldsFromLayer } from '@/lib/domain/soil-layers';
import { defaultFormState } from '@/lib/draft/default-form-state';
import { loadDraftState, saveDraftState } from '@/lib/draft/storage';
import {
  DEFERRED_MANUAL_BRANCHES,
  getActiveDocumentMode,
  getFormInputVisibility,
  getSoilDescriptorVisibility
} from '@/lib/form/dependencies';
import { normalizeDependentFormState } from '@/lib/form/normalize-dependent-state';
import { cloneFormState, getReferenceCasePreset, identifyReferenceCasePreset, type ReferenceCasePreset } from '@/lib/reference-cases';
import { formatSignoffName, getEngineerRegistry, resolveSignoffProfile } from '@/lib/signoff/engineer-registry';
import type { FormState, SoilInputs, SoilLayerDescriptor } from '@/types/domain';

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

export function InspectionForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Loading saved draft...');
  const [statusTone, setStatusTone] = useState<StatusTone>('neutral');
  const pendingStatusRef = useRef<{ message: string; tone: StatusTone } | null>(null);

  const cutRange = deriveHouseCutRange(formState.reportBody.excavation.houseFootingCutDepthsM);
  const matchedPreset = useMemo(() => identifyReferenceCasePreset(formState), [formState]);
  const dependencyVisibility = useMemo(() => getFormInputVisibility(formState), [formState]);
  const activeDocumentMode = useMemo(() => getActiveDocumentMode(), []);
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
  const currentDraftLabel = getDraftLabel(matchedPreset);

  useEffect(() => {
    const nextState = normalizeDependentFormState(loadDraftState());
    const initialPreset = identifyReferenceCasePreset(nextState);

    pendingStatusRef.current = {
      message: initialPreset ? `${getDraftLabel(initialPreset)} ready locally.` : 'Saved local draft ready.',
      tone: 'neutral'
    };

    setFormState(nextState);
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    saveDraftState(formState);

    if (pendingStatusRef.current) {
      setStatusMessage(pendingStatusRef.current.message);
      setStatusTone(pendingStatusRef.current.tone);
      pendingStatusRef.current = null;
      return;
    }

    setStatusMessage('Saved locally.');
    setStatusTone('success');
  }, [formState, hasHydrated]);

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

    setFormState(normalizeDependentFormState(cloneFormState(preset.formState)));
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
            <SelectField
              label="Subject line style"
              value={formState.topBlock.subjectLineFamily}
              onChange={(value) => updateTopBlock('subjectLineFamily', value as FormState['topBlock']['subjectLineFamily'])}
              options={[
                ['singular', 'Foundation Soil Inspection'],
                ['plural', 'Foundation Soils Inspection']
              ]}
            />
            <Field
              label="Heading detail (optional)"
              value={formState.topBlock.headingSuffix ?? ''}
              onChange={(value) => updateTopBlock('headingSuffix', value)}
            />
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
                label="Land description format"
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
                <Field label="Lot" value={formState.topBlock.lot ?? ''} onChange={(value) => updateTopBlock('lot', value)} />
                <Field label="Block" value={formState.topBlock.block ?? ''} onChange={(value) => updateTopBlock('block', value)} />
                <Field label="Plan" value={formState.topBlock.plan ?? ''} onChange={(value) => updateTopBlock('plan', value)} />
                {dependencyVisibility.topBlock.showStreetAddress ? (
                  <Field label="Site address" value={formState.topBlock.streetAddress} onChange={(value) => updateTopBlock('streetAddress', value)} />
                ) : null}
              </>
            ) : null}
            {dependencyVisibility.topBlock.showCustomLegalDescriptionLines ? (
              <TextAreaField
                className="full"
                label="Custom legal description"
                value={(formState.topBlock.customLegalDescriptionLines ?? []).join('\n')}
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
                <SelectField
                  label="Client reference label"
                  value={formState.topBlock.clientReferenceLabelFamily}
                  onChange={(value) =>
                    updateTopBlock('clientReferenceLabelFamily', value as FormState['topBlock']['clientReferenceLabelFamily'])
                  }
                  options={[
                    ['client_job_no', 'Client Job No.'],
                    ['job_hash', 'Job#']
                  ]}
                />
                <Field
                  label="Client reference number"
                  value={formState.topBlock.clientJobNumber ?? ''}
                  onChange={(value) => updateTopBlock('clientJobNumber', value)}
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
              label="Oversized trench handling"
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
              label="Loose material handling"
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
              label="Water condition"
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
                />
                <div className="field full">
                  <p className="note">
                    Layered soil mode is active. The upper fill layer is used as the main soil description, with the native layer kept for traceability.
                  </p>
                </div>
                <SoilLayerFieldSet
                  title="Upper fill layer"
                  layer={engineeredFillLayer}
                  onChange={(key, value) => updateSoilLayer('engineeredFillLayer', key, value)}
                />
                <SoilLayerFieldSet
                  title="Underlying native layer"
                  layer={underlyingNativeLayer}
                  onChange={(key, value) => updateSoilLayer('underlyingNativeLayer', key, value)}
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
            <p className="muted">Footing direction</p>
            <h2>Foundation recommendations</h2>
            <p className="section-intro">
              Choose the footing basis, bearing wording, and any garage-specific conditions that should accompany the recommendation.
            </p>
          </div>
          <div className="field-grid">
            <SelectField
              label="House footing basis"
              value={formState.reportBody.recommendation.footingBasis}
              onChange={(value) => updateRecommendation('footingBasis', value as FormState['reportBody']['recommendation']['footingBasis'])}
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
              options={[
                ['default_140_kpa', '140 kPa working value'],
                ['default_120_kpa', '120 kPa / 2500 psf value'],
                ['review_100_kpa', '100 kPa review option'],
                ['omit', 'Do not include in this draft']
              ]}
            />
            {dependencyVisibility.reportBody.recommendation.showDrainageUpgradeVariant ? (
              <SelectField
                label="Drainage upgrade"
                value={formState.reportBody.recommendation.drainageUpgradeVariant}
                onChange={(value) =>
                  updateRecommendation('drainageUpgradeVariant', value as FormState['reportBody']['recommendation']['drainageUpgradeVariant'])
                }
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
                label="Garage condition"
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
              />
            ) : null}
          </div>
        </section>
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
              <span>Working draft</span>
              <strong>{currentDraftLabel}</strong>
            </div>
            <div className="summary-item">
              <span>Preview destination</span>
              <strong>Letter preview</strong>
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
            </div>
          </div>

          <details className="internal-details">
            <summary>Internal details</summary>
            <div className="field-grid">
              <Field label="Hidden H number" value={formState.archive.hNumber} onChange={(value) => updateArchive('hNumber', value)} />
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
  onChange
}: {
  title: string;
  layer: SoilLayerDescriptor;
  onChange: <K extends keyof SoilLayerDescriptor>(key: K, value: SoilLayerDescriptor[K]) => void;
}) {
  const descriptorVisibility = getSoilDescriptorVisibility(layer.materialFamily);

  return (
    <>
      <div className="field full">
        <h3>{title}</h3>
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

function Field({
  className,
  label,
  onChange,
  type = 'text',
  value
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div className={`field ${className ?? ''}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function TextAreaField({
  className,
  label,
  onChange,
  value
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <div className={`field ${className ?? ''}`}>
      <label htmlFor={id}>{label}</label>
      <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function SelectField({
  blankOptionLabel,
  includeBlankOption,
  label,
  onChange,
  options,
  value
}: {
  blankOptionLabel?: string;
  includeBlankOption?: boolean;
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
        {includeBlankOption ? <option value="">{blankOptionLabel ?? 'None'}</option> : null}
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
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
