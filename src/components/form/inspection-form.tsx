'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';

import { deriveHouseCutRange } from '@/lib/domain/report-helpers';
import { buildFallbackSoilLayer, getPrimarySoilFieldsFromLayer } from '@/lib/domain/soil-layers';
import { defaultFormState } from '@/lib/draft/default-form-state';
import { loadDraftState, saveDraftState } from '@/lib/draft/storage';
import { getEngineerRegistry, formatSignoffName, resolveSignoffProfile } from '@/lib/signoff/engineer-registry';
import { cloneFormState, getReferenceCasePreset, identifyReferenceCasePreset } from '@/lib/reference-cases';
import type { FormState, SoilInputs, SoilLayerDescriptor } from '@/types/domain';

function selectedValues(event: ChangeEvent<HTMLSelectElement>) {
  return Array.from(event.target.selectedOptions).map((option) => option.value);
}

function formatDerivedNumber(value?: number) {
  return value === undefined ? 'n/a' : `${value.toFixed(1)} m`;
}

const SIGNOFF_CUSTOM_OPTION = '__custom__';

function getRegistrySelectValue(value: string | undefined, allowBlank: boolean) {
  const trimmed = value?.trim() ?? '';

  if (!trimmed) {
    return allowBlank ? '' : SIGNOFF_CUSTOM_OPTION;
  }

  const resolved = resolveSignoffProfile(trimmed);
  return resolved.matched ? formatSignoffName(resolved.profile) : SIGNOFF_CUSTOM_OPTION;
}

export function InspectionForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const cutRange = deriveHouseCutRange(formState.reportBody.excavation.houseFootingCutDepthsM);
  const matchedPreset = useMemo(() => identifyReferenceCasePreset(formState), [formState]);
  const signoffProfiles = useMemo(() => getEngineerRegistry(), []);
  const signoffOptions = useMemo(
    () => signoffProfiles.map((profile) => [formatSignoffName(profile), formatSignoffName(profile)] as [string, string]),
    [signoffProfiles]
  );
  const preparedBySelectValue = getRegistrySelectValue(formState.signoff.preparedBy, true);
  const signingEngineerSelectValue = getRegistrySelectValue(formState.signoff.signingEngineer, false);
  const primarySoilFamily = formState.reportBody.soil.primaryMaterialFamily;
  const isClayFamily = primarySoilFamily !== 'sand' && primarySoilFamily !== 'silt';
  const isSandSiltFamily = primarySoilFamily === 'sand' || primarySoilFamily === 'silt';
  const isLayeredSoil = formState.reportBody.soil.soilLayeringMode === 'engineered_fill_over_native';
  const engineeredFillLayer = formState.reportBody.soil.engineeredFillLayer ?? buildFallbackSoilLayer(formState.reportBody.soil);
  const underlyingNativeLayer = formState.reportBody.soil.underlyingNativeLayer ?? buildFallbackSoilLayer(formState.reportBody.soil);

  useEffect(() => {
    setFormState(loadDraftState());
  }, []);

  function updateState(updater: (current: FormState) => FormState) {
    setFormState((current) => updater(current));
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

  function submitDraft() {
    saveDraftState(formState);
    router.push('/preview');
  }

  function loadPreset(presetId: string) {
    const preset = getReferenceCasePreset(presetId);

    if (!preset) {
      return;
    }

    const nextState = cloneFormState(preset.formState);
    setFormState(nextState);
    saveDraftState(nextState);
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
    <>
      <section className="panel">
        <p className="note">
          The form stays intentionally plain, but it now supports explicit presets instead of treating the
          default draft as a fuzzy seed example. The preview still owns all letter assembly, while the form
          only edits the canonical grouped draft state.
        </p>
        <p>
          <strong>Current draft</strong>
        </p>
        <p>{matchedPreset ? `${matchedPreset.label} (${matchedPreset.presetKind === 'reference' ? 'reference preset' : 'smoke preset'})` : 'Live edited draft'}</p>
        <div className="button-row">
          <button type="button" onClick={submitDraft}>
            Save and open preview
          </button>
          <button className="secondary" type="button" onClick={() => loadPreset('victory-homes-2026')}>
            Load Victory Homes 2026
          </button>
          <button className="secondary" type="button" onClick={() => loadPreset('generic-happy-path')}>
            Load generic happy path
          </button>
          <Link className="button secondary" href="/preview">
            Preview current draft
          </Link>
        </div>
      </section>

      <section className="section-card">
        <h2>Visible Letter Metadata</h2>
        <div className="field-grid">
          <Field label="Letter date" type="date" value={formState.topBlock.letterDate} onChange={(value) => updateTopBlock('letterDate', value)} />
          <Field
            label="Inspection date"
            type="date"
            value={formState.reportBody.inspectionDate}
            onChange={(value) => updateReportBody('inspectionDate', value)}
          />
          <Field label="File number" value={formState.topBlock.fileNumber} onChange={(value) => updateTopBlock('fileNumber', value)} />
          <Field label="Client name" value={formState.topBlock.clientName} onChange={(value) => updateTopBlock('clientName', value)} />
          <Field label="Street address" value={formState.topBlock.streetAddress} onChange={(value) => updateTopBlock('streetAddress', value)} />
          <Field label="Heading suffix" value={formState.topBlock.headingSuffix ?? ''} onChange={(value) => updateTopBlock('headingSuffix', value)} />
          <Field label="Municipality" value={formState.topBlock.municipality} onChange={(value) => updateTopBlock('municipality', value)} />
          <Field label="Subdivision" value={formState.topBlock.subdivision ?? ''} onChange={(value) => updateTopBlock('subdivision', value)} />
          <TextAreaField
            className="full"
            label="Client mailing address"
            value={formState.topBlock.clientMailingAddress.join('\n')}
            onChange={(value) => updateTopBlock('clientMailingAddress', value.split('\n').filter(Boolean))}
          />
          <CheckboxField
            label="Include legal description"
            checked={formState.topBlock.includeLegalDescription}
            onChange={(checked) => updateTopBlock('includeLegalDescription', checked)}
          />
          <CheckboxField
            label="Include subdivision"
            checked={formState.topBlock.includeSubdivision}
            onChange={(checked) => updateTopBlock('includeSubdivision', checked)}
          />
          <Field label="Lot" value={formState.topBlock.lot ?? ''} onChange={(value) => updateTopBlock('lot', value)} />
          <Field label="Block" value={formState.topBlock.block ?? ''} onChange={(value) => updateTopBlock('block', value)} />
          <Field label="Plan" value={formState.topBlock.plan ?? ''} onChange={(value) => updateTopBlock('plan', value)} />
          <CheckboxField
            label="Include client job number"
            checked={formState.topBlock.includeClientJobNumber}
            onChange={(checked) => updateTopBlock('includeClientJobNumber', checked)}
          />
          <Field
            label="Client job number"
            value={formState.topBlock.clientJobNumber ?? ''}
            onChange={(value) => updateTopBlock('clientJobNumber', value)}
          />
        </div>
      </section>

      <section className="section-card">
        <h2>Hidden Archive Metadata</h2>
        <div className="field-grid">
          <Field label="Hidden H number" value={formState.archive.hNumber} onChange={(value) => updateArchive('hNumber', value)} />
        </div>
      </section>

      <section className="section-card">
        <h2>Excavation Inputs</h2>
        <div className="field-grid">
          <div className="field full">
            <p className="note">
              Derived cut helper: minimum {formatDerivedNumber(cutRange.minimumM)} | maximum {formatDerivedNumber(cutRange.maximumM)}
            </p>
          </div>
          <Field
            label="Front left cut (m)"
            type="number"
            value={formState.reportBody.excavation.houseFootingCutDepthsM.frontLeftM?.toString() ?? ''}
            onChange={(value) => updateCutDepth('frontLeftM', value ? Number(value) : undefined)}
          />
          <Field
            label="Front right cut (m)"
            type="number"
            value={formState.reportBody.excavation.houseFootingCutDepthsM.frontRightM?.toString() ?? ''}
            onChange={(value) => updateCutDepth('frontRightM', value ? Number(value) : undefined)}
          />
          <Field
            label="Rear left cut (m)"
            type="number"
            value={formState.reportBody.excavation.houseFootingCutDepthsM.rearLeftM?.toString() ?? ''}
            onChange={(value) => updateCutDepth('rearLeftM', value ? Number(value) : undefined)}
          />
          <Field
            label="Rear right cut (m)"
            type="number"
            value={formState.reportBody.excavation.houseFootingCutDepthsM.rearRightM?.toString() ?? ''}
            onChange={(value) => updateCutDepth('rearRightM', value ? Number(value) : undefined)}
          />
          <CheckboxField
            label="Rear walkout basement"
            checked={Boolean(formState.reportBody.excavation.walkoutBasement)}
            onChange={(checked) => updateExcavation('walkoutBasement', checked)}
          />
          <SelectField
            label="Construction stage"
            value={formState.reportBody.excavation.constructionStage ?? 'normal'}
            onChange={(value) => updateExcavation('constructionStage', value as FormState['reportBody']['excavation']['constructionStage'])}
            options={[
              ['normal', 'Normal live excavation'],
              ['nearly_complete', 'Nearly complete'],
              ['framing', 'Framing stage']
            ]}
          />
          <SelectField
            label="As-constructed mode"
            value={formState.reportBody.excavation.asConstructedMode ?? 'none'}
            onChange={(value) => updateExcavation('asConstructedMode', value as FormState['reportBody']['excavation']['asConstructedMode'])}
            options={[
              ['none', 'None'],
              ['poured_18in', 'Footing poured - 18 inch family'],
              ['poured_20in', 'Footing poured - 20 inch family'],
              ['poured_24in', 'Footing poured - 24 inch review family'],
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
          <CheckboxField
            label="Oversized trench"
            checked={Boolean(formState.reportBody.excavation.oversizedTrench)}
            onChange={(checked) => updateExcavation('oversizedTrench', checked)}
          />
          {formState.reportBody.excavation.oversizedTrench ? (
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
          <CheckboxField
            label="Loose peeling material"
            checked={Boolean(formState.reportBody.excavation.loosePeelingMaterial)}
            onChange={(checked) => updateExcavation('loosePeelingMaterial', checked)}
          />
          <CheckboxField
            label="Slough material"
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
            label="Rain-softened mode"
            value={formState.reportBody.excavation.rainSoftenedMode ?? 'none'}
            onChange={(value) => updateExcavation('rainSoftenedMode', value as FormState['reportBody']['excavation']['rainSoftenedMode'])}
            options={[
              ['none', 'None'],
              ['saturated_soft_surficial', 'Saturated soft surficial material'],
              ['standing_water_rain_softened', 'Standing water after rain']
            ]}
          />
          <CheckboxField
            label="Free water in auger holes"
            checked={Boolean(formState.reportBody.excavation.freeWaterInAugerHoles)}
            onChange={(checked) => updateExcavation('freeWaterInAugerHoles', checked)}
          />
          <CheckboxField
            label="Exposed electrical trench"
            checked={Boolean(formState.reportBody.excavation.exposedElectricalTrench)}
            onChange={(checked) => updateExcavation('exposedElectricalTrench', checked)}
          />
          <Field
            label="Snow depth (mm)"
            type="number"
            value={formState.reportBody.excavation.snowDepthMm?.toString() ?? ''}
            onChange={(value) => updateExcavation('snowDepthMm', value ? Number(value) : undefined)}
          />
        </div>
      </section>

      <section className="section-card">
        <h2>Soil Inputs</h2>
        <div className="field-grid">
          <SelectField
            label="Layering mode"
            value={formState.reportBody.soil.soilLayeringMode}
            onChange={(value) =>
              updateState((current) => {
                const nextMode = value as SoilInputs['soilLayeringMode'];
                const nextSoil = {
                  ...current.reportBody.soil,
                  soilLayeringMode: nextMode
                };

                if (nextMode === 'engineered_fill_over_native') {
                  nextSoil.engineeredFillLayer = current.reportBody.soil.engineeredFillLayer ?? buildFallbackSoilLayer(current.reportBody.soil);
                  nextSoil.underlyingNativeLayer = current.reportBody.soil.underlyingNativeLayer ?? buildFallbackSoilLayer(current.reportBody.soil);
                }

                return {
                  ...current,
                  reportBody: {
                    ...current.reportBody,
                    soil: nextSoil
                  }
                };
              })
            }
            options={[
              ['single_layer', 'Single layer'],
              ['engineered_fill_over_native', 'Engineered fill over native']
            ]}
          />
          <SelectField
            label="Soil origin"
            value={formState.reportBody.soil.primarySoilOrigin}
            onChange={(value) => updateSoil('primarySoilOrigin', value as SoilInputs['primarySoilOrigin'])}
            options={[
              ['native', 'Native'],
              ['engineered_fill_jrp', 'Engineered fill by JRP'],
              ['engineered_fill_jrp_and_others', 'Engineered fill by JRP and others'],
              ['engineered_fill_others', 'Engineered fill by others'],
              ['engineered_fill_unknown', 'Engineered fill unknown']
            ]}
          />
          {isLayeredSoil ? (
            <>
              <Field
                label="Fill depth below footing (mm)"
                type="number"
                value={formState.reportBody.soil.fillDepthBelowFootingMm?.toString() ?? ''}
                onChange={(value) => updateSoil('fillDepthBelowFootingMm', value ? Number(value) : undefined)}
              />
              <div className="field full">
                <p className="note">Layered engineered-fill mode is active. The engineered fill layer drives the primary top-level soil descriptors used for fallback and traceability.</p>
              </div>
              <SoilLayerFieldSet
                title="Engineered fill layer"
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
                label="Consistency / density"
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
              {isClayFamily ? (
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
              {isSandSiltFamily ? (
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
            label="High plastic warning"
            checked={Boolean(formState.reportBody.soil.highPlasticWarning)}
            onChange={(checked) => updateSoil('highPlasticWarning', checked)}
          />
        </div>
      </section>

      <section className="section-card">
        <h2>Recommendation / Garage / Sulphate Inputs</h2>
        <div className="field-grid">
          <SelectField
            label="P4 footing basis"
            value={formState.reportBody.recommendation.footingBasis}
            onChange={(value) => updateRecommendation('footingBasis', value as FormState['reportBody']['recommendation']['footingBasis'])}
            options={[
              ['standard', 'Standard'],
              ['modified', 'Modified']
            ]}
          />
          <SelectField
            label="Spread footing family"
            value={formState.reportBody.recommendation.spreadFootingFamily}
            onChange={(value) =>
              updateRecommendation('spreadFootingFamily', value as FormState['reportBody']['recommendation']['spreadFootingFamily'])
            }
            options={[
              ['default_140_kpa', '140 kPa working default'],
              ['omit', 'Omit from prototype'],
              ['review_100_kpa', '100 kPa review branch']
            ]}
          />
          <SelectField
            label="Garage mode"
            value={formState.reportBody.garage.mode}
            onChange={(value) => updateGarage('mode', value as FormState['reportBody']['garage']['mode'])}
            options={[
              ['none', 'No garage'],
              ['same_elevation', 'Garage at same elevation'],
              ['higher_than_house', 'Garage above house excavation']
            ]}
          />
          {formState.reportBody.garage.mode === 'higher_than_house' ? (
            <Field
              label="Garage offset above house (m)"
              type="number"
              value={formState.reportBody.garage.offsetAboveHouseM?.toString() ?? ''}
              onChange={(value) => updateGarage('offsetAboveHouseM', value ? Number(value) : undefined)}
            />
          ) : null}
          <CheckboxField
            label="Garage slab organics advisory"
            checked={Boolean(formState.reportBody.garage.slabOrganics)}
            onChange={(checked) => updateGarage('slabOrganics', checked)}
          />
          <CheckboxField
            label="Include sulphate paragraph"
            checked={formState.reportBody.sulphate.includeParagraph}
            onChange={(checked) => updateSulphate('includeParagraph', checked)}
          />
          {formState.reportBody.sulphate.includeParagraph ? (
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
            label="Include winter construction paragraph"
            checked={formState.reportBody.winter.includeParagraph}
            onChange={updateWinter}
          />
        </div>
      </section>

      <section className="section-card">
        <h2>Signoff Inputs</h2>
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
    </>
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
  const isClayLayer = layer.materialFamily !== 'sand' && layer.materialFamily !== 'silt';
  const isSandSiltLayer = layer.materialFamily === 'sand' || layer.materialFamily === 'silt';

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
      {isClayLayer ? (
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
      {isSandSiltLayer ? (
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
