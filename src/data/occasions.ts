import { OccasionType } from '../types';

export interface OccasionConfig {
  id: OccasionType;
  label: string;
  emoji: string;
  description: string;
  suggestedColors: string[];
  vibe: string;
  recommendedTypes: string[];
}

export const OCCASIONS_LIST: OccasionConfig[] = [
  {
    id: 'beachwear',
    label: 'Beachwear & Resort',
    emoji: '🏖️',
    description: 'Light, breathable linens, breezy cuts, sun hats, and easy sandals.',
    suggestedColors: ['#F5E6D3', '#7FB5B5', '#E6C280', '#FFFFFF', '#D9822B'],
    vibe: 'Effortless, airy, sun-kissed',
    recommendedTypes: ['Linen Shirt', 'Swim Trunks', 'Sundress', 'Espadrilles', 'Straw Hat', 'Slide Sandals']
  },
  {
    id: 'casual_brunch',
    label: 'Casual Brunch',
    emoji: '🥐',
    description: 'Relaxed yet chic styling with comfortable fits, subtle jewelry, and loafers/sneakers.',
    suggestedColors: ['#DFD7D0', '#556B2F', '#3B4D61', '#E8A598', '#FFFFFF'],
    vibe: 'Put-together relaxed, social, daylight chic',
    recommendedTypes: ['Oversized Tee', 'Wide-Leg Trousers', 'Knit Polo', 'Denim Jacket', 'Clean White Sneakers']
  },
  {
    id: 'wedding',
    label: 'Wedding Guest / Formal Gala',
    emoji: '🥂',
    description: 'Elevated sophistication with tailored silhouettes, rich textures, and formal footwear.',
    suggestedColors: ['#1A1A24', '#0E2F44', '#78184A', '#D4AF37', '#4A5D4E'],
    vibe: 'Majestic, tailored, luxurious',
    recommendedTypes: ['Silk Slip Dress', 'Bespoke Blazer', 'Tailored Trousers', 'Patent Loafers', 'Pointed Heels']
  },
  {
    id: 'date_night',
    label: 'Romantic Date Night',
    emoji: '🍷',
    description: 'Intimate, mood-enhancing tones, sensual silhouettes, leather details, and sleek boots.',
    suggestedColors: ['#1C1B20', '#800020', '#36454F', '#C5A059', '#3E2723'],
    vibe: 'Intriguing, sultry, sharp',
    recommendedTypes: ['Satin Blouse', 'Leather Biker Jacket', 'Fitted Black Denim', 'Chelsea Boots', 'Heeled Mules']
  },
  {
    id: 'office',
    label: 'Executive & Office',
    emoji: '💼',
    description: 'Clean lines, structured tailoring, smart layering, and timeless neutral palettes.',
    suggestedColors: ['#2B2B36', '#4B5563', '#E5E7EB', '#0F4C81', '#7C6853'],
    vibe: 'Authoritative, sharp, polished',
    recommendedTypes: ['Structured Blazer', 'Pleated Pants', 'Oxford Shirt', 'Leather Derby Shoes', 'Trench Coat']
  },
  {
    id: 'streetwear',
    label: 'Urban Streetwear',
    emoji: '👟',
    description: 'Modern silhouettes, statement outerwear, utility details, and hype sneakers.',
    suggestedColors: ['#171717', '#E11D48', '#2563EB', '#A3E635', '#737373'],
    vibe: 'Edgy, contemporary, bold',
    recommendedTypes: ['Boxy Hoodie', 'Cargo Trousers', 'Graphic Heavyweight Tee', 'High-Top Sneakers', 'Crossbody Bag']
  },
  {
    id: 'cocktail',
    label: 'Cocktail Party',
    emoji: '🍸',
    description: 'Celebratory evening-wear featuring statement cuts, metallic accents, and refined poise.',
    suggestedColors: ['#0A0A0F', '#9333EA', '#059669', '#E11D48', '#E2E8F0'],
    vibe: 'Glamorous, radiant, captivating',
    recommendedTypes: ['Little Black Dress', 'Velvet Dinner Jacket', 'Sleek Trousers', 'Strappy Heels', 'Gold Clutch']
  },
  {
    id: 'airport',
    label: 'Airport & Travel Chic',
    emoji: '✈️',
    description: 'First-class comfort without sacrificing aesthetic: cashmere knits, soft trousers, and slides.',
    suggestedColors: ['#D6CEC2', '#475569', '#1E293B', '#A89F91', '#F1F5F9'],
    vibe: 'Jetset, effortless comfort, minimalist',
    recommendedTypes: ['Cashmere Sweater', 'Relaxed Joggers', 'Oversized Trench', 'Slip-on Sneakers', 'Tote Bag']
  },
  {
    id: 'festival',
    label: 'Festival & Concert',
    emoji: '🪩',
    description: 'Expressive bohemian or cyberpunk cuts, breathable fabrics, and danceable footwear.',
    suggestedColors: ['#EC4899', '#8B5CF6', '#F59E0B', '#10B981', '#18181B'],
    vibe: 'Vibrant, bold, electric',
    recommendedTypes: ['Fringed Jacket', 'Printed Mesh Top', 'Distressed Denim Shorts', 'Combat Boots', 'Bucket Hat']
  }
];
