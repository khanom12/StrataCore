import type { HouseFootingCutDepthsM } from '@/types/domain';

interface CutRange {
  minimumM?: number;
  maximumM?: number;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

function collectCutDepthValues(cutDepths: HouseFootingCutDepthsM): number[] {
  return Object.values(cutDepths).filter((value): value is number => value !== undefined && !Number.isNaN(value));
}

function parseIsoDateParts(dateString: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString.trim());

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return { year, month, day };
}

export function deriveHouseCutRange(cutDepths: HouseFootingCutDepthsM): CutRange {
  const values = collectCutDepthValues(cutDepths);

  if (values.length === 0) {
    return { minimumM: undefined, maximumM: undefined };
  }

  return {
    minimumM: Math.min(...values),
    maximumM: Math.max(...values)
  };
}

export function deriveFrontAndRearCutRanges(cutDepths: HouseFootingCutDepthsM) {
  const frontValues = [cutDepths.frontLeftM, cutDepths.frontRightM].filter(
    (value): value is number => value !== undefined && !Number.isNaN(value)
  );
  const rearValues = [cutDepths.rearLeftM, cutDepths.rearRightM].filter(
    (value): value is number => value !== undefined && !Number.isNaN(value)
  );

  return {
    front: frontValues.length ? { minimumM: Math.min(...frontValues), maximumM: Math.max(...frontValues) } : { minimumM: undefined, maximumM: undefined },
    rear: rearValues.length ? { minimumM: Math.min(...rearValues), maximumM: Math.max(...rearValues) } : { minimumM: undefined, maximumM: undefined }
  };
}

export function formatDisplayDate(dateString: string): string {
  const parts = parseIsoDateParts(dateString);

  if (parts) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day)));
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function getCalendarYear(dateString: string): number {
  const parts = parseIsoDateParts(dateString);

  if (parts) {
    return parts.year;
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return new Date().getFullYear();
  }

  return date.getUTCFullYear();
}
