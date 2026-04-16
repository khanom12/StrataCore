import type { ResolvedSignoffProfile, SignoffProfile } from '@/types/signoff';

const REGISTRY: SignoffProfile[] = [
  {
    key: 'doug-parth',
    aliases: ['Doug Parth', 'Doug Parth, E.I.T.'],
    name: 'Doug Parth',
    designation: 'E.I.T.'
  },
  {
    key: 'scott-macfarlane',
    aliases: ['Scott MacFarlane', 'Scott MacFarlane, P.Eng.'],
    name: 'Scott MacFarlane',
    designation: 'P.Eng.',
    stampAssetKey: 'scott-macfarlane-stamp',
    stampAssetLabel: 'Engineer stamp placeholder'
  }
];

function normalizeName(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

function parseFreeTextProfile(rawValue: string): SignoffProfile {
  const trimmed = rawValue.trim();
  const [name, ...designationParts] = trimmed.split(',').map((part) => part.trim()).filter(Boolean);

  return {
    key: `free-text:${normalizeName(trimmed) || 'unknown'}`,
    aliases: [trimmed],
    name: name || trimmed || 'Unknown Signatory',
    designation: designationParts.join(', ') || undefined
  };
}

export function formatSignoffName(profile: SignoffProfile): string {
  return profile.designation ? `${profile.name}, ${profile.designation}` : profile.name;
}

export function resolveSignoffProfile(rawValue?: string): ResolvedSignoffProfile {
  const requestedName = rawValue?.trim() || '';
  const normalizedRequestedName = normalizeName(requestedName);
  const matchedProfile = REGISTRY.find((profile) => profile.aliases.some((alias) => normalizeName(alias) === normalizedRequestedName));

  if (matchedProfile) {
    return {
      requestedName,
      matched: true,
      profile: matchedProfile
    };
  }

  return {
    requestedName,
    matched: false,
    profile: parseFreeTextProfile(requestedName || 'Unknown Signatory')
  };
}

export function getEngineerRegistry(): SignoffProfile[] {
  return REGISTRY;
}
