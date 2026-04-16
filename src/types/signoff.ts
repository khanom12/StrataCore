export interface SignoffProfile {
  key: string;
  aliases: string[];
  name: string;
  designation?: string;
  memberNumber?: string;
  stampAssetKey?: string;
  stampAssetLabel?: string;
}

export interface ResolvedSignoffProfile {
  requestedName: string;
  matched: boolean;
  profile: SignoffProfile;
}

export interface PermitToPracticeAsset {
  key: string;
  label: string;
  placeholderText: string;
  assetPath?: string;
}

export interface SignoffLine {
  label: 'Prepared by' | 'Reviewed by' | 'Signed by' | 'Prepared and signed by';
  value: string;
}

export interface SignoffModel {
  organization: string;
  salutation: string;
  preparedBy?: ResolvedSignoffProfile;
  signingEngineer: ResolvedSignoffProfile;
  lines: SignoffLine[];
  permitToPractice: PermitToPracticeAsset;
  warnings: string[];
}
