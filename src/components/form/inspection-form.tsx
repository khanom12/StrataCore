'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ChangeEvent } from 'react';

import { defaultFormState } from '@/lib/draft/default-form-state';
import { loadDraftState, saveDraftState } from '@/lib/draft/storage';
import type { FormState, SoilInputs } from '@/types/domain';

function selectedValues(event: ChangeEvent<HTMLSelectElement>) {
  return Array.from(event.target.selectedOptions).map((option) => option.value);
}

export function InspectionForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(defaultFormState);

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

  function updateRecommendations<K extends keyof FormState['reportBody']['recommendations']>(
    key: K,
    value: FormState['reportBody']['recommendations'][K]
  ) {
    updateState((current) => ({
      ...current,
      reportBody: {
        ...current.reportBody,
        recommendations: { ...current.reportBody.recommendations, [key]: value }
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

  function updateWinterParagraph(includeParagraph: boolean) {
    updateState((current) => ({
      ...current,
      reportBody: {
        ...current.reportBody,
        winterConstruction: { includeParagraph }
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

  function resetDraft() {
    setFormState(defaultFormState);
    saveDraftState(defaultFormState);
  }

  return (
    <>
      <section className="panel">
        <p className="note">
          The normalized V1 form now groups visible top-block metadata, hidden archive metadata, report body
          inputs, and signoff inputs separately. Corner cut depths are the primary excavation input so later
          prompts can derive min/max and walkout wording from one source.
        </p>
        <div className="button-row">
          <button type="button" onClick={submitDraft}>
            Save and open preview
          </button>
          <button className="secondary" type="button" onClick={resetDraft}>
            Reset to seed example
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
            value={formState.reportBody.excavation.inspectionDate}
            onChange={(value) => updateExcavation('inspectionDate', value)}
          />
          <Field label="File number" value={formState.topBlock.fileNumber} onChange={(value) => updateTopBlock('fileNumber', value)} />
          <Field label="Client name" value={formState.topBlock.clientName} onChange={(value) => updateTopBlock('clientName', value)} />
          <Field label="Street address" value={formState.topBlock.streetAddress} onChange={(value) => updateTopBlock('streetAddress', value)} />
          <Field label="Heading suffix" value={formState.topBlock.headingSuffix ?? ''} onChange={(value) => updateTopBlock('headingSuffix', value)} />
          <Field label="Municipality" value={formState.topBlock.municipality} onChange={(value) => updateTopBlock('municipality', value)} />
          <Field
            label="Subdivision"
            value={formState.topBlock.subdivision.value ?? ''}
            onChange={(value) => updateTopBlock('subdivision', { ...formState.topBlock.subdivision, value })}
          />
          <TextAreaField
            className="full"
            label="Client mailing address"
            value={formState.topBlock.clientMailingAddress.join('\n')}
            onChange={(value) => updateTopBlock('clientMailingAddress', value.split('\n').filter(Boolean))}
          />
          <CheckboxField
            label="Include legal description"
            checked={formState.topBlock.legalDescription.include}
            onChange={(checked) => updateTopBlock('legalDescription', { ...formState.topBlock.legalDescription, include: checked })}
          />
          <CheckboxField
            label="Include subdivision"
            checked={formState.topBlock.subdivision.include}
            onChange={(checked) => updateTopBlock('subdivision', { ...formState.topBlock.subdivision, include: checked })}
          />
          <Field
            label="Lot"
            value={formState.topBlock.legalDescription.lot ?? ''}
            onChange={(value) => updateTopBlock('legalDescription', { ...formState.topBlock.legalDescription, lot: value })}
          />
          <Field
            label="Block"
            value={formState.topBlock.legalDescription.block ?? ''}
            onChange={(value) => updateTopBlock('legalDescription', { ...formState.topBlock.legalDescription, block: value })}
          />
          <Field
            label="Plan"
            value={formState.topBlock.legalDescription.plan ?? ''}
            onChange={(value) => updateTopBlock('legalDescription', { ...formState.topBlock.legalDescription, plan: value })}
          />
          <CheckboxField
            label="Include client job number"
            checked={formState.topBlock.clientJobNumber.include}
            onChange={(checked) => updateTopBlock('clientJobNumber', { ...formState.topBlock.clientJobNumber, include: checked })}
          />
          <Field
            label="Client job number"
            value={formState.topBlock.clientJobNumber.value ?? ''}
            onChange={(value) => updateTopBlock('clientJobNumber', { ...formState.topBlock.clientJobNumber, value })}
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
          <SelectField
            label="Garage mode"
            value={formState.reportBody.excavation.garageMode}
            onChange={(value) => updateExcavation('garageMode', value as FormState['reportBody']['excavation']['garageMode'])}
            options={[
              ['none', 'No garage'],
              ['same_elevation', 'Garage at same elevation'],
              ['higher_than_house', 'Garage above house excavation']
            ]}
          />
          <Field
            label="Garage offset above house (m)"
            type="number"
            value={formState.reportBody.excavation.garageOffsetAboveHouseM?.toString() ?? ''}
            onChange={(value) => updateExcavation('garageOffsetAboveHouseM', value ? Number(value) : undefined)}
          />
          <CheckboxField
            label="Rear walkout basement"
            checked={Boolean(formState.reportBody.excavation.walkoutBasement)}
            onChange={(checked) => updateExcavation('walkoutBasement', checked)}
          />
        </div>
      </section>

      <section className="section-card">
        <h2>Soil Inputs</h2>
        <div className="field-grid">
          <SelectField
            label="Layering mode"
            value={formState.reportBody.soil.soilLayeringMode}
            onChange={(value) => updateSoil('soilLayeringMode', value as SoilInputs['soilLayeringMode'])}
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
            label="Moisture"
            value={formState.reportBody.soil.moisture1}
            onChange={(value) => updateSoil('moisture1', value as SoilInputs['moisture1'])}
            options={[
              ['damp', 'Damp'],
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
            label="Plasticity"
            value={formState.reportBody.soil.plasticity1}
            onChange={(value) => updateSoil('plasticity1', value as SoilInputs['plasticity1'])}
            options={[
              ['low', 'Low'],
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
          <div className="field full">
            <label htmlFor="trace-features">Trace features</label>
            <select
              id="trace-features"
              multiple
              value={formState.reportBody.soil.traceFeatures ?? []}
              onChange={(event) => updateSoil('traceFeatures', selectedValues(event) as SoilInputs['traceFeatures'])}
            >
              <option value="oxides">Oxides</option>
              <option value="white_precipitates">White precipitates</option>
              <option value="coal">Coal</option>
              <option value="gravel">Gravel</option>
              <option value="organics">Organics</option>
              <option value="rootlets">Rootlets</option>
            </select>
          </div>
          <CheckboxField
            label="High plastic warning"
            checked={Boolean(formState.reportBody.soil.highPlasticWarning)}
            onChange={(checked) => updateSoil('highPlasticWarning', checked)}
          />
        </div>
      </section>

      <section className="section-card">
        <h2>Recommendation / Sulphate Inputs</h2>
        <div className="field-grid">
          <SelectField
            label="P4 footing basis"
            value={formState.reportBody.recommendations.footingBasis}
            onChange={(value) => updateRecommendations('footingBasis', value as FormState['reportBody']['recommendations']['footingBasis'])}
            options={[
              ['standard', 'Standard'],
              ['modified', 'Modified']
            ]}
          />
          <SelectField
            label="Spread footing family"
            value={formState.reportBody.recommendations.spreadFootingFamily}
            onChange={(value) =>
              updateRecommendations('spreadFootingFamily', value as FormState['reportBody']['recommendations']['spreadFootingFamily'])
            }
            options={[
              ['default_140_kpa', '140 kPa working default'],
              ['omit', 'Omit from prototype'],
              ['review_100_kpa', '100 kPa review branch']
            ]}
          />
          <CheckboxField
            label="Garage slab organics advisory"
            checked={Boolean(formState.reportBody.recommendations.garageSlabOrganics)}
            onChange={(checked) => updateRecommendations('garageSlabOrganics', checked)}
          />
          <CheckboxField
            label="Include sulphate paragraph"
            checked={formState.reportBody.sulphate.includeParagraph}
            onChange={(checked) => updateSulphate('includeParagraph', checked)}
          />
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
          <CheckboxField
            label="Include winter construction paragraph"
            checked={formState.reportBody.winterConstruction.includeParagraph}
            onChange={updateWinterParagraph}
          />
        </div>
      </section>

      <section className="section-card">
        <h2>Signoff Inputs</h2>
        <div className="field-grid">
          <Field label="Prepared by" value={formState.signoff.preparedBy ?? ''} onChange={(value) => updateSignoff('preparedBy', value)} />
          <Field label="Signing engineer" value={formState.signoff.signingEngineer} onChange={(value) => updateSignoff('signingEngineer', value)} />
        </div>
      </section>
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
