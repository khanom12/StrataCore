export function getFieldPathAnchorId(fieldPath: string) {
  return `field-${fieldPath.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
}

export function getFieldPathHash(fieldPath: string) {
  return `#${getFieldPathAnchorId(fieldPath)}`;
}

export function readValueAtPath(value: unknown, fieldPath: string): unknown {
  if (!fieldPath) {
    return undefined;
  }

  const pathSegments = fieldPath.split('.');
  let currentValue = value;

  for (const segment of pathSegments) {
    if (!currentValue || typeof currentValue !== 'object' || !(segment in currentValue)) {
      return undefined;
    }

    currentValue = (currentValue as Record<string, unknown>)[segment];
  }

  return currentValue;
}
