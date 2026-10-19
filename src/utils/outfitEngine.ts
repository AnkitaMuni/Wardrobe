import { Garment, OutfitPair, OccasionType } from '../types';

interface ScoreResult {
  score: number;
  reason: string;
}

// Color compatibility matrix for high-fashion aesthetics
export function evaluateColorHarmony(color1: string, color2: string): ScoreResult {
  const c1 = color1.toLowerCase();
  const c2 = color2.toLowerCase();

  // Neutral matches
  const neutrals = ['white', 'ivory', 'sand', 'beige', 'black', 'grey', 'charcoal', 'navy', 'cream', 'oatmeal'];
  const isC1Neutral = neutrals.some(n => c1.includes(n));
  const isC2Neutral = neutrals.some(n => c2.includes(n));

  if (isC1Neutral && isC2Neutral) {
    return { score: 96, reason: 'Sophisticated monochromatic/neutral harmony' };
  }
  if (isC1Neutral || isC2Neutral) {
    return { score: 94, reason: 'Grounding neutral balances the expressive tone' };
  }

  // Complementary & Earthy combos
  if ((c1.includes('olive') || c1.includes('sage')) && (c1.includes('terracotta') || c2.includes('rust') || c2.includes('sand'))) {
    return { score: 98, reason: 'Stunning organic earth-tone contrast' };
  }
  if ((c1.includes('gold') || c1.includes('champagne')) && (c2.includes('emerald') || c2.includes('black') || c2.includes('navy'))) {
    return { score: 97, reason: 'High-contrast luxury evening pairing' };
  }

  return { score: 88, reason: 'Complementary color balance' };
}

/**
 * Feature 1: Generate 5 Distinct Outfit Options for ANY Occasion
 */
export function generateOccasionOutfits(
  wardrobe: Garment[],
  occasionInput: OccasionType | string
): OutfitPair[] {
  const normOccasion = occasionInput.toLowerCase().trim();

  // Filter items that match occasion or have versatile tags
  const tops = wardrobe.filter(g => g.category === 'top');
  const bottoms = wardrobe.filter(g => g.category === 'bottom');
  const dresses = wardrobe.filter(g => g.category === 'dress');
  const outers = wardrobe.filter(g => g.category === 'outerwear');
  const footwear = wardrobe.filter(g => g.category === 'footwear');
  const accessories = wardrobe.filter(g => g.category === 'accessory');

  const outfits: OutfitPair[] = [];

  // Helper to test if item fits the occasion
  const fitsOccasion = (item: Garment): boolean => {
    return (
      item.occasions.some(o => o.toLowerCase().includes(normOccasion) || normOccasion.includes(o.toLowerCase())) ||
      item.tags.some(t => t.toLowerCase().includes(normOccasion) || normOccasion.includes(t.toLowerCase())) ||
      item.subcategory.toLowerCase().includes(normOccasion)
    );
  };

  // Sort candidates prioritizing occasion matches
  const sortedTops = [...tops].sort((a, b) => (fitsOccasion(b) ? 1 : 0) - (fitsOccasion(a) ? 1 : 0));
  const sortedBottoms = [...bottoms].sort((a, b) => (fitsOccasion(b) ? 1 : 0) - (fitsOccasion(a) ? 1 : 0));
  const sortedFootwear = [...footwear].sort((a, b) => (fitsOccasion(b) ? 1 : 0) - (fitsOccasion(a) ? 1 : 0));
  const sortedOuters = [...outers].sort((a, b) => (fitsOccasion(b) ? 1 : 0) - (fitsOccasion(a) ? 1 : 0));
  const sortedDresses = [...dresses].sort((a, b) => (fitsOccasion(b) ? 1 : 0) - (fitsOccasion(a) ? 1 : 0));

  // Option 1: Top-Tier Hero Coordination (Best matching top + bottom + footwear)
  if (sortedTops.length > 0 && sortedBottoms.length > 0) {
    const top = sortedTops[0];
    const bottom = sortedBottoms[0];
    const shoes = sortedFootwear[0];
    const acc = accessories.find(a => fitsOccasion(a)) || accessories[0];
    const outer = fitsOccasion(sortedOuters[0]) ? sortedOuters[0] : undefined;

    const colorScore = evaluateColorHarmony(top.color, bottom.color).score;

    outfits.push({
      id: `outfit-occ-1`,
      title: `The Signature ${capitalize(normOccasion)} Ensemble`,
      occasion: normOccasion,
      matchScore: Math.min(99, colorScore + 2),
      top,
      bottom,
      footwear: shoes,
      outerwear: outer,
      accessory: acc,
      stylistNote: `Combines the breathable drape of the ${top.name} with the fluid silhouette of ${bottom.name}. The ${shoes ? shoes.name : 'footwear'} grounds the look with understated luxury.`,
      vibe: `Clean, refined, tailor-made for ${normOccasion}`,
      weatherAppropriate: 'Ideal for 20°C - 30°C warm daylight'
    });
  }

  // Option 2: Dress or High-Contrast Alternative
  if (sortedDresses.length > 0) {
    const dress = sortedDresses[0];
    const shoes = sortedFootwear.find(s => s.id !== outfits[0]?.footwear?.id) || sortedFootwear[0];
    const outer = sortedOuters.find(o => o.category === 'outerwear');
    const acc = accessories.find(a => a.id !== outfits[0]?.accessory?.id) || accessories[1] || accessories[0];

    outfits.push({
      id: `outfit-occ-2`,
      title: `One-Piece Effortless Elegance`,
      occasion: normOccasion,
      matchScore: 97,
      dress,
      footwear: shoes,
      outerwear: outer,
      accessory: acc,
      stylistNote: `An instant statement piece. The ${dress.name} gives an elongated, flattering drape that requires minimal styling while maximizing impact.`,
      vibe: `Effortless, head-turning, elegant`,
      weatherAppropriate: 'Breezy & comfortable across environments'
    });
  } else if (sortedTops.length > 1 && sortedBottoms.length > 0) {
    // If no dress, use top 2 with bottom 1
    const top = sortedTops[1];
    const bottom = sortedBottoms[0];
    const shoes = sortedFootwear[1] || sortedFootwear[0];

    outfits.push({
      id: `outfit-occ-2`,
      title: `Contemporary Tonal Pairing`,
      occasion: normOccasion,
      matchScore: 94,
      top,
      bottom,
      footwear: shoes,
      stylistNote: `Pairs ${top.name} with ${bottom.name} for a modern, textured silhouette that feels fresh and balanced.`,
      vibe: `Subtle luxury, tonal, poised`,
      weatherAppropriate: 'Mild & pleasant climate'
    });
  }

  // Option 3: Relaxed / Casual Spin
  const top3 = sortedTops.find(t => t.id !== outfits[0]?.top?.id && t.id !== outfits[1]?.top?.id) || sortedTops[0];
  const bot3 = sortedBottoms.find(b => b.id !== outfits[0]?.bottom?.id) || sortedBottoms[1] || sortedBottoms[0];
  const shoes3 = sortedFootwear.find(s => s.id !== outfits[0]?.footwear?.id && s.id !== outfits[1]?.footwear?.id) || sortedFootwear[0];

  if (top3 && bot3) {
    outfits.push({
      id: `outfit-occ-3`,
      title: `Relaxed Silhouette Spin`,
      occasion: normOccasion,
      matchScore: 93,
      top: top3,
      bottom: bot3,
      footwear: shoes3,
      accessory: accessories[2] || accessories[0],
      stylistNote: `Focuses on breathable texture interplay. The ${top3.name} paired with ${bot3.name} creates an easygoing yet curated aesthetic.`,
      vibe: `Airy, relaxed, approachable`,
      weatherAppropriate: 'Warm & sunny'
    });
  }

  // Option 4: Layered Statement Ensemble
  const top4 = sortedTops[Math.min(2, sortedTops.length - 1)] || sortedTops[0];
  const bot4 = sortedBottoms[Math.min(2, sortedBottoms.length - 1)] || sortedBottoms[0];
  const outer4 = sortedOuters[0];
  const shoes4 = sortedFootwear.find(s => s.id !== shoes3?.id) || sortedFootwear[0];

  if (top4 && bot4) {
    outfits.push({
      id: `outfit-occ-4`,
      title: `Structured Layered Edition`,
      occasion: normOccasion,
      matchScore: 95,
      top: top4,
      bottom: bot4,
      outerwear: outer4,
      footwear: shoes4,
      accessory: accessories[0],
      stylistNote: `Adds deliberate architectural dimension with ${outer4 ? outer4.name : 'smart layering'}. Takes you effortlessly from daytime to cooler evening temperatures.`,
      vibe: `Polished, dynamic, structured`,
      weatherAppropriate: 'Indoor climate control or breezy evenings'
    });
  }

  // Option 5: Resort / Minimalist Accent
  const dress5 = dresses.length > 1 ? dresses[1] : undefined;
  if (dress5) {
    outfits.push({
      id: `outfit-occ-5`,
      title: `The Riviera Resort Silhouette`,
      occasion: normOccasion,
      matchScore: 96,
      dress: dress5,
      footwear: footwear[0],
      accessory: accessories[0],
      stylistNote: `The ${dress5.name} provides effortless movement and breezy charm, perfect for capturing memories and strolling in style.`,
      vibe: `Romantic, breezy, picturesque`,
      weatherAppropriate: 'Warm breeze & coastal sunshine'
    });
  } else {
    const top5 = sortedTops[sortedTops.length - 1] || sortedTops[0];
    const bot5 = sortedBottoms.find(b => b.category === 'bottom' && b.id !== bot4?.id) || sortedBottoms[0];
    const shoes5 = sortedFootwear[sortedFootwear.length - 1] || sortedFootwear[0];

    outfits.push({
      id: `outfit-occ-5`,
      title: `The Minimalist Monochromatic Choice`,
      occasion: normOccasion,
      matchScore: 91,
      top: top5,
      bottom: bot5,
      footwear: shoes5,
      accessory: accessories[1] || accessories[0],
      stylistNote: `A clean-cut aesthetic prioritizing timeless proportion. Subtle color notes between ${top5?.name} and ${bot5?.name} keep the outfit elevated without trying too hard.`,
      vibe: `Understated chic, timeless, quiet luxury`,
      weatherAppropriate: 'Versatile all-day wear'
    });
  }

  return outfits;
}

/**
 * Feature 2: Pair a Specific Item with all compatible pieces in the wardrobe
 */
export function pairSpecificGarment(
  targetGarment: Garment,
  wardrobe: Garment[]
): OutfitPair[] {
  const isTop = targetGarment.category === 'top';
  const isBottom = targetGarment.category === 'bottom';
  const isDress = targetGarment.category === 'dress';
  const isOuter = targetGarment.category === 'outerwear';

  const otherItems = wardrobe.filter(g => g.id !== targetGarment.id);
  const footwear = otherItems.filter(g => g.category === 'footwear');
  const accessories = otherItems.filter(g => g.category === 'accessory');
  const outers = otherItems.filter(g => g.category === 'outerwear');

  const pairs: OutfitPair[] = [];

  if (isTop) {
    const bottoms = otherItems.filter(g => g.category === 'bottom');
    bottoms.forEach((bot, idx) => {
      const colorHarmony = evaluateColorHarmony(targetGarment.color, bot.color);
      const shoes = footwear[idx % footwear.length];
      const acc = accessories[idx % accessories.length];
      const outer = idx % 2 === 0 ? outers[idx % outers.length] : undefined;

      pairs.push({
        id: `pair-top-${bot.id}`,
        title: `Pairing with ${bot.name}`,
        occasion: bot.occasions[0] || 'Versatile',
        matchScore: colorHarmony.score,
        top: targetGarment,
        bottom: bot,
        outerwear: outer,
        footwear: shoes,
        accessory: acc,
        stylistNote: `Styling the ${targetGarment.name} with ${bot.name}: ${colorHarmony.reason}. The proportions highlight a flattering waistline and cohesive texture harmony.`,
        vibe: `${bot.subcategory} pairing, ${colorHarmony.score > 93 ? 'Exceptional Match' : 'Smart Pairing'}`,
        weatherAppropriate: 'Trans-seasonal styling'
      });
    });
  } else if (isBottom) {
    const tops = otherItems.filter(g => g.category === 'top');
    tops.forEach((top, idx) => {
      const colorHarmony = evaluateColorHarmony(top.color, targetGarment.color);
      const shoes = footwear[idx % footwear.length];
      const acc = accessories[idx % accessories.length];
      const outer = idx % 2 === 1 ? outers[idx % outers.length] : undefined;

      pairs.push({
        id: `pair-bot-${top.id}`,
        title: `Pairing with ${top.name}`,
        occasion: top.occasions[0] || 'Versatile',
        matchScore: colorHarmony.score,
        top,
        bottom: targetGarment,
        outerwear: outer,
        footwear: shoes,
        accessory: acc,
        stylistNote: `The ${targetGarment.name} serves as the anchor piece, complemented by the ${top.name}. ${colorHarmony.reason}.`,
        vibe: `Effortless coordination`,
        weatherAppropriate: 'All-day comfort'
      });
    });
  } else if (isDress) {
    footwear.forEach((shoe, idx) => {
      const outer = outers[idx % outers.length];
      const acc = accessories[idx % accessories.length];
      const colorHarmony = evaluateColorHarmony(targetGarment.color, shoe.color);

      pairs.push({
        id: `pair-dress-${shoe.id}`,
        title: `Evening Coordination with ${shoe.name}`,
        occasion: targetGarment.occasions[0] || 'Special Event',
        matchScore: colorHarmony.score,
        dress: targetGarment,
        outerwear: outer,
        footwear: shoe,
        accessory: acc,
        stylistNote: `Elevating the ${targetGarment.name} with ${shoe.name} and ${acc?.name || 'statement accents'}. High-elegance symmetry.`,
        vibe: 'Couture elegance',
        weatherAppropriate: 'Formal / Evening temperature'
      });
    });
  } else if (isOuter) {
    const tops = otherItems.filter(g => g.category === 'top');
    const bottoms = otherItems.filter(g => g.category === 'bottom');

    tops.slice(0, 4).forEach((top, idx) => {
      const bot = bottoms[idx % bottoms.length];
      const shoe = footwear[idx % footwear.length];

      pairs.push({
        id: `pair-outer-${idx}`,
        title: `Layered with ${top.name}`,
        occasion: targetGarment.occasions[0] || 'Smart Casual',
        matchScore: 95 - idx,
        top,
        bottom: bot,
        outerwear: targetGarment,
        footwear: shoe,
        stylistNote: `Layering ${targetGarment.name} over ${top.name} creates depth and structural presence. Grounded by ${bot.name}.`,
        vibe: 'Sharp, sartorial silhouette',
        weatherAppropriate: 'Cool weather / Layered warmth'
      });
    });
  }

  // Sort by highest match score
  return pairs.sort((a, b) => b.matchScore - a.matchScore);
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}
