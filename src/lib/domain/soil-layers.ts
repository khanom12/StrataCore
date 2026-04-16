import type { SoilInputs, SoilLayerDescriptor } from '@/types/domain';

export function buildFallbackSoilLayer(soil: SoilInputs): SoilLayerDescriptor {
  return {
    materialFamily: soil.primaryMaterialFamily,
    clayDescriptors: soil.clayDescriptors,
    sandSiltDescriptors: soil.sandSiltDescriptors,
    moisture1: soil.moisture1,
    moisture2: soil.moisture2,
    colour: soil.colour,
    plasticity1: soil.plasticity1,
    plasticity2: soil.plasticity2,
    consistencyOrDensity: soil.consistencyOrDensity,
    traceFeatures: soil.traceFeatures
  };
}

export function getEngineeredFillLayer(soil: SoilInputs): SoilLayerDescriptor {
  return soil.engineeredFillLayer ?? buildFallbackSoilLayer(soil);
}

export function getUnderlyingNativeLayer(soil: SoilInputs): SoilLayerDescriptor {
  return soil.underlyingNativeLayer ?? buildFallbackSoilLayer(soil);
}

export function getPrimarySoilFieldsFromLayer(layer: SoilLayerDescriptor) {
  return {
    primaryMaterialFamily: layer.materialFamily,
    clayDescriptors: layer.clayDescriptors,
    sandSiltDescriptors: layer.sandSiltDescriptors,
    moisture1: layer.moisture1,
    moisture2: layer.moisture2,
    colour: layer.colour,
    plasticity1: layer.plasticity1 ?? 'medium',
    plasticity2: layer.plasticity2,
    consistencyOrDensity: layer.consistencyOrDensity,
    traceFeatures: layer.traceFeatures
  } satisfies Pick<
    SoilInputs,
    | 'primaryMaterialFamily'
    | 'clayDescriptors'
    | 'sandSiltDescriptors'
    | 'moisture1'
    | 'moisture2'
    | 'colour'
    | 'plasticity1'
    | 'plasticity2'
    | 'consistencyOrDensity'
    | 'traceFeatures'
  >;
}
