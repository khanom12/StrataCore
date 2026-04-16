import type { ResolvedSignoffProfile, SignoffProfile } from '@/types/signoff';

const REGISTRY: SignoffProfile[] = [
  {
    key: 'doug-parth',
    aliases: ['Doug Parth', 'Doug Parth, E.I.T.'],
    name: 'Doug Parth',
    designation: 'E.I.T.'
  },
  {
    key: 'muhammad-huzaifa',
    aliases: ['Muhammad Huzaifa', 'Muhammad Huzaifa, E.I.T.'],
    name: 'Muhammad Huzaifa',
    designation: 'E.I.T.'
  },
  {
    key: 'darren-wang',
    aliases: ['Darren Wang', 'Darren Wang, E.I.T.'],
    name: 'Darren Wang',
    designation: 'E.I.T.'
  },
  {
    key: 'andrew-klein',
    aliases: ['Andrew R. Klein', 'Andrew R. Klein, B. Sc.'],
    name: 'Andrew R. Klein',
    designation: 'B. Sc.'
  },
  {
    key: 'scott-macfarlane',
    aliases: ['Scott MacFarlane', 'Scott MacFarlane, P.Eng.', 'Scott MacFarlane, P. Eng.'],
    name: 'Scott MacFarlane',
    designation: 'P.Eng.',
    memberNumber: '89667',
    stampAssetKey: 'scott-macfarlane-stamp',
    stampAssetLabel: 'Engineer stamp placeholder'
  },
  {
    key: 'patrick-winski',
    aliases: ['Patrick Winski', 'Patrick Winski, P.Eng.', 'Patrick Winski, P. Eng.'],
    name: 'Patrick Winski',
    designation: 'P.Eng.',
    memberNumber: '71849',
    stampAssetKey: 'patrick-winski-stamp'
  },
  {
    key: 'danny-trommelen',
    aliases: ['Danny Trommelen', 'Danny Trommelen, P.Eng.'],
    name: 'Danny Trommelen',
    designation: 'P.Eng.',
    memberNumber: '135832',
    stampAssetKey: 'danny-trommelen-stamp'
  },
  {
    key: 'alan-lang',
    aliases: ['Alan Lang', 'Alan Lang, P.Eng.', 'Al Lang', 'Al Lang, P. Eng.'],
    name: 'Alan Lang',
    designation: 'P.Eng.',
    memberNumber: '46743',
    stampAssetKey: 'alan-lang-stamp'
  },
  {
    key: 'abe-rahime',
    aliases: ['Abe Rahime', 'Abe Rahime, P.Eng.'],
    name: 'Abe Rahime',
    designation: 'P.Eng.',
    memberNumber: '67871',
    stampAssetKey: 'abe-rahime-stamp'
  },
  {
    key: 'john-tsoi',
    aliases: ['John Tsoi', 'John Tsoi, P.Eng.', 'John Tsoi, P. Eng.'],
    name: 'John Tsoi',
    designation: 'P.Eng.',
    memberNumber: '76087',
    stampAssetKey: 'john-tsoi-stamp'
  },
  {
    key: 'rick-evans',
    aliases: ['Rick Evans', 'Rick Evans, P.Eng.', 'Rick Evans, P. Eng.'],
    name: 'Rick Evans',
    designation: 'P.Eng.',
    memberNumber: '49679',
    stampAssetKey: 'rick-evans-stamp'
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
