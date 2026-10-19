export type GarmentCategory = 'top' | 'bottom' | 'dress' | 'outerwear' | 'footwear' | 'accessory';

export type OccasionType = 
  | 'beachwear' 
  | 'wedding' 
  | 'date_night' 
  | 'casual_brunch' 
  | 'office' 
  | 'streetwear' 
  | 'cocktail' 
  | 'airport' 
  | 'festival' 
  | 'custom';

export type Season = 'summer' | 'fall' | 'winter' | 'spring' | 'all-season';

export interface Garment {
  id: string;
  name: string;
  category: GarmentCategory;
  subcategory: string;
  color: string;
  colorHex: string;
  pattern: string;
  material: string;
  seasons: Season[];
  occasions: (OccasionType | string)[];
  imageUrl: string;
  source: 'google_photos' | 'camera_roll' | 'manual';
  sourcePhotoUrl?: string;
  tags: string[];
  timesWorn: number;
  isFavorite: boolean;
  createdAt: string;
  isGroupPhoto?: boolean;
  isSolo?: boolean;
  faceCount?: number;
  alternatePhotos?: string[];
}

export interface OutfitPair {
  id: string;
  title: string;
  occasion: string;
  matchScore: number;
  top?: Garment;
  bottom?: Garment;
  dress?: Garment;
  outerwear?: Garment;
  footwear?: Garment;
  accessory?: Garment;
  stylistNote: string;
  vibe: string;
  weatherAppropriate: string;
}

export interface ModelBodySettings {
  gender: 'female' | 'male' | 'unisex';
  height: number; // in cm
  build: 'slim' | 'athletic' | 'curvy' | 'regular';
  skinTone: string;
  lighting: 'studio' | 'sunset' | 'daylight' | 'dramatic';
  viewAngle: 'front' | 'side' | 'back' | 'three_quarter';
  autoRotate: boolean;
  rotationSpeed: number;
}

export interface ExtractedGarmentCandidate {
  id: string;
  name: string;
  category: GarmentCategory;
  subcategory: string;
  color: string;
  colorHex: string;
  material: string;
  occasions: OccasionType[];
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number }; // percentage coords (0-100)
  flatLayUrl: string;
}

export interface CrowdFace {
  id: string;
  name: string;
  isUser: boolean;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

export interface GooglePhotoItem {
  id: string;
  imageUrl: string;
  caption: string;
  date: string;
  location: string;
  faceDetected: boolean;
  faceConfidence: number;
  faceBbox: { x: number; y: number; width: number; height: number }; // percentage coords
  detectedGarments: ExtractedGarmentCandidate[];
  crowdFaces?: CrowdFace[];
  isGroupPhoto?: boolean;
}

