'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ChangeEvent } from 'react';

import { defaultFormState } from '@/lib/draft/default-form-state';
import { loadDraftState, saveDraftState } from '@/lib/draft/storage';
import type { FormState, P3State } from '@/types/domain';

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
          Assumption in this prototype: P4 footing basis is an explicit operator choice for now because the
          seed pack marks the standard-versus-modified thresholds as still open.
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
        <h2>Metadata / Top Block</h2>
        <div className="field-grid">
          <Field
            label="Letter date"
            type="date"
            value={formState.meta.letterDate}
            onChange={(value) => updateState((current) => ({ ...current, meta: { ...current.meta, letterDate: value } }))}
          />
          <Field
            label="Inspection date"
            type="date"
            value={formState.inspectionDate}
            onChange={(value) => updateState((current) => ({ ...current, inspectionDate: value }))}
          />
          <Field
            label="File number"
            value={formState.meta.fileNumber}
            onChange={(value) => updateState((current) => ({ ...current, meta: { ...current.meta, fileNumber: value } }))}
          />
          <Field
            label="Hidden H number"
            value={formState.meta.hNumber}
            onChange={(value) => updateState((current) => ({ ...current, meta: { ...current.meta, hNumber: value } }))}
          />
          <Field
            label="Client name"
            value={formState.meta.clientName}
            onChange={(value) => updateState((current) => ({ ...current, meta: { ...current.meta, clientName: value } }))}
          />
          <Field
            label="Street address"
            value={formState.meta.streetAddress}
            onChange={(value) => updateState((current) => ({ ...current, meta: { ...current.meta, streetAddress: value } }))}
          />
          <TextAreaField
            className="full"
            label="Client mailing address"
            value={formState.meta.clientMailingAddress.join('\n')}
            onChange={(value) =>
              updateState((current) => ({
                ...current,
                meta: { ...current.meta, clientMailingAddress: value.split('\n').filter(Boolean) }
              }))
            }
          />
          <Field
            label="Heading suffix"
            value={formState.meta.headingSuffix ?? ''}
            onChange={(value) => updateState((current) => ({ ...current, meta: { ...current.meta, headingSuffix: value } }))}
          />
          <Field
            label="Municipality"
            value={formState.meta.municipality}
            onChange={(value) => updateState((current) => ({ ...current, meta: { ...current.meta, municipality: value } }))}
          />
          <Field
            label="Subdivision"
            value={formState.meta.subdivision ?? ''}
            onChange={(value) => updateState((current) => ({ ...current, meta: { ...current.meta, subdivision: value } }))}
          />
          <CheckboxField
            label="Include legal description"
            checked={formState.meta.includeLegalDescription}
            onChange={(checked) =>
              updateState((current) => ({ ...current, meta: { ...current.meta, includeLegalDescription: checked } }))
            }
          />
          <CheckboxField
            label="Include subdivision"
            checked={Boolean(formState.meta.includeSubdivision)}
            onChange={(checked) =>
              updateState((current) => ({ ...current, meta: { ...current.meta, includeSubdivision: checked } }))
            }
          />
          <Field
            label="Lot"
            value={formState.meta.lot ?? ''}
            onChange={(value) => updateState((current) => ({ ...current, meta: { ...current.meta, lot: value } }))}
          />
          <Field
            label="Block"
            value={formState.meta.block ?? ''}
            onChange={(value) => updateState((current) => ({ ...current, meta: { ...current.meta, block: value } }))}
          />
          <Field
            label="Plan"
            value={formState.meta.plan ?? ''}
            onChange={(value) => updateState((current) => ({ ...current, meta: { ...current.meta, plan: value } }))}
          />
          <CheckboxField
            label="Include client job number"
            checked={Boolean(formState.meta.includeClientJobNumber)}
            onChange={(checked) =>
              updateState((current) => ({ ...current, meta: { ...current.meta, includeClientJobNumber: checked } }))
            }
          />
          <Field
            label="Client job number"
            value={formState.meta.clientJobNumber ?? ''}
            onChange={(value) =>
              updateState((current) => ({ ...current, meta: { ...current.meta, clientJobNumber: value } }))
            }
          />
        </div>
      </section>

      <section className="section-card">
        <h2>P2 Excavation Conditions</h2>
        <div className="field-grid">
          <Field
            label="Minimum cut (m)"
            type="number"
            value={formState.p2.minCutM?.toString() ?? ''}
            onChange={(value) =>
              updateState((current) => ({ ...current, p2: { ...current.p2, minCutM: value ? Number(value) : undefined } }))
            }
          />
          <Field
            label="Maximum cut (m)"
            type="number"
            value={formState.p2.maxCutM?.toString() ?? ''}
            onChange={(value) =>
              updateState((current) => ({ ...current, p2: { ...current.p2, maxCutM: value ? Number(value) : undefined } }))
            }
          />
          <SelectField
            label="Garage mode"
            value={formState.p2.garageMode}
            onChange={(value) =>
              updateState((current) => ({
                ...current,
                p2: { ...current.p2, garageMode: value as FormState['p2']['garageMode'] }
              }))
            }
            options={[
              ['none', 'No garage'],
              ['same_elevation', 'Garage at same elevation'],
              ['higher_than_house', 'Garage above house excavation']
            ]}
          />
          <Field
            label="Garage offset above house (m)"
            type="number"
            value={formState.p2.garageOffsetAboveHouseM?.toString() ?? ''}
            onChange={(value) =>
              updateState((current) => ({
                ...current,
                p2: { ...current.p2, garageOffsetAboveHouseM: value ? Number(value) : undefined }
              }))
            }
          />
          <CheckboxField
            label="Rear walkout basement"
            checked={Boolean(formState.p2.walkoutBasement)}
            onChange={(checked) => updateState((current) => ({ ...current, p2: { ...current.p2, walkoutBasement: checked } }))}
          />
        </div>
      </section>

      <section className="section-card">
        <h2>P3 Soil Conditions</h2>
        <div className="field-grid">
          <SelectField
            label="Layering mode"
            value={formState.p3.soilLayeringMode}
            onChange={(value) =>
              updateState((current) => ({
                ...current,
                p3: { ...current.p3, soilLayeringMode: value as P3State['soilLayeringMode'] }
              }))
            }
            options={[
              ['single_layer', 'Single layer'],
              ['engineered_fill_over_native', 'Engineered fill over native']
            ]}
          />
          <SelectField
            label="Soil origin"
            value={formState.p3.primarySoilOrigin}
            onChange={(value) =>
              updateState((current) => ({
                ...current,
                p3: { ...current.p3, primarySoilOrigin: value as P3State['primarySoilOrigin'] }
              }))
            }
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
            value={formState.p3.primaryMaterialFamily}
            onChange={(value) =>
              updateState((current) => ({
                ...current,
                p3: { ...current.p3, primaryMaterialFamily: value as P3State['primaryMaterialFamily'] }
              }))
            }
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
            value={formState.p3.moisture1}
            onChange={(value) =>
              updateState((current) => ({ ...current, p3: { ...current.p3, moisture1: value as P3State['moisture1'] } }))
            }
            options={[
              ['damp', 'Damp'],
              ['moist', 'Moist'],
              ['very_moist', 'Very moist'],
              ['wet', 'Wet']
            ]}
          />
          <SelectField
            label="Colour"
            value={formState.p3.colour}
            onChange={(value) =>
              updateState((current) => ({ ...current, p3: { ...current.p3, colour: value as P3State['colour'] } }))
            }
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
            value={formState.p3.plasticity1}
            onChange={(value) =>
              updateState((current) => ({ ...current, p3: { ...current.p3, plasticity1: value as P3State['plasticity1'] } }))
            }
            options={[
              ['low', 'Low'],
              ['medium', 'Medium'],
              ['high', 'High']
            ]}
          />
          <SelectField
            label="Consistency / density"
            value={formState.p3.consistencyOrDensity}
            onChange={(value) =>
              updateState((current) => ({
                ...current,
                p3: { ...current.p3, consistencyOrDensity: value as P3State['consistencyOrDensity'] }
              }))
            }
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
              value={formState.p3.traceFeatures ?? []}
              onChange={(event) =>
                updateState((current) => ({
                  ...current,
                  p3: { ...current.p3, traceFeatures: selectedValues(event) as P3State['traceFeatures'] }
                }))
              }
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
            checked={Boolean(formState.p3.highPlasticWarning)}
            onChange={(checked) => updateState((current) => ({ ...current, p3: { ...current.p3, highPlasticWarning: checked } }))}
          />
        </div>
      </section>

      <section className="section-card">
        <h2>P4 to P7 Controls</h2>
        <div className="field-grid">
          <SelectField
            label="P4 footing basis"
            value={formState.p4.footingBasis}
            onChange={(value) =>
              updateState((current) => ({
                ...current,
                p4: { ...current.p4, footingBasis: value as FormState['p4']['footingBasis'] }
              }))
            }
            options={[
              ['standard', 'Standard'],
              ['modified', 'Modified']
            ]}
          />
          <SelectField
            label="Spread footing family"
            value={formState.p4.spreadFootingMode}
            onChange={(value) =>
              updateState((current) => ({
                ...current,
                p4: { ...current.p4, spreadFootingMode: value as FormState['p4']['spreadFootingMode'] }
              }))
            }
            options={[
              ['default_140_kpa', '140 kPa working default'],
              ['omit', 'Omit from prototype'],
              ['review_100_kpa', '100 kPa review branch']
            ]}
          />
          <CheckboxField
            label="Garage slab organics advisory"
            checked={Boolean(formState.p5?.garageSlabOrganics)}
            onChange={(checked) =>
              updateState((current) => ({ ...current, p5: { ...current.p5, garageSlabOrganics: checked } }))
            }
          />
          <CheckboxField
            label="Include sulphate paragraph"
            checked={Boolean(formState.p6?.includeSulphateParagraph)}
            onChange={(checked) =>
              updateState((current) => ({
                ...current,
                p6: { ...current.p6, includeSulphateParagraph: checked, sulphateClass: current.p6?.sulphateClass ?? 'negligible' }
              }))
            }
          />
          <SelectField
            label="Sulphate class"
            value={formState.p6?.sulphateClass ?? 'negligible'}
            onChange={(value) =>
              updateState((current) => ({
                ...current,
                p6: {
                  ...current.p6,
                  includeSulphateParagraph: true,
                  sulphateClass: value as NonNullable<FormState['p6']>['sulphateClass']
                }
              }))
            }
            options={[
              ['negligible', 'Negligible'],
              ['moderate', 'Moderate'],
              ['severe', 'Severe'],
              ['very_severe', 'Very severe']
            ]}
          />
        </div>
      </section>

      <section className="section-card">
        <h2>Signoff</h2>
        <div className="field-grid">
          <Field
            label="Prepared by"
            value={formState.signoff.preparedBy ?? ''}
            onChange={(value) => updateState((current) => ({ ...current, signoff: { ...current.signoff, preparedBy: value } }))}
          />
          <Field
            label="Signing engineer"
            value={formState.signoff.signingEngineer}
            onChange={(value) =>
              updateState((current) => ({ ...current, signoff: { ...current.signoff, signingEngineer: value } }))
            }
          />
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
