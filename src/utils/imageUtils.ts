import { GarmentCategory } from '../types';

/**
 * Normalizes image URLs:
 * If an image points to Google Photos CDN (lh3.googleusercontent.com) directly,
 * route it through the server proxy (/api/image-proxy?url=...) so that
 * HTTP 403 anti-hotlinking blocks and CORS canvas taint errors are completely bypassed.
 */
export function normalizeImageUrl(url: string | undefined): string {
  if (!url) return '';
  // If already proxied, return as-is
  if (url.startsWith('/api/image-proxy')) return url;
  // If it's a direct Google Photos CDN link, wrap with proxy
  if (url.startsWith('https://lh3.googleusercontent.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

/**
 * Resizes an image file using an offscreen canvas to optimize storage size (around 60-100KB per image)
 * and extracts the dominant color (hex + friendly name).
 */
export async function processDroppedImage(file: File): Promise<{
  dataUrl: string;
  dominantColorHex: string;
  dominantColorName: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image'));

      img.onload = () => {
        // Compute resized dimensions (max 800px on longest side for optimal quality & storage)
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve({
            dataUrl: reader.result as string,
            dominantColorHex: '#C5A059',
            dominantColorName: 'Neutral Tan',
          });
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Sample dominant color from center/subject area
        const sampleSize = 40;
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = sampleSize;
        sampleCanvas.height = sampleSize;
        const sCtx = sampleCanvas.getContext('2d');

        let dominantHex = '#C5A059';
        let dominantName = 'Neutral';

        if (sCtx) {
          sCtx.drawImage(canvas, 0, 0, sampleSize, sampleSize);
          const imgData = sCtx.getImageData(0, 0, sampleSize, sampleSize).data;

          let rSum = 0;
          let gSum = 0;
          let bSum = 0;
          let validPixels = 0;

          for (let i = 0; i < imgData.length; i += 4) {
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];
            const a = imgData[i + 3];

            // Ignore transparent pixels or pure white/black background corners
            if (a > 100 && !(r > 248 && g > 248 && b > 248) && !(r < 10 && g < 10 && b < 10)) {
              rSum += r;
              gSum += g;
              bSum += b;
              validPixels++;
            }
          }

          if (validPixels > 0) {
            const avgR = Math.round(rSum / validPixels);
            const avgG = Math.round(gSum / validPixels);
            const avgB = Math.round(bSum / validPixels);
            dominantHex = rgbToHex(avgR, avgG, avgB);
            dominantName = getColorName(avgR, avgG, avgB);
          }
        }

        // Convert to optimized JPEG dataURL (quality 0.84)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.84);

        resolve({
          dataUrl: compressedDataUrl,
          dominantColorHex: dominantHex,
          dominantColorName: dominantName,
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getColorName(r: number, g: number, b: number): string {
  // Simple heuristic mapping for fashion tones
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  if (max < 40) return 'Jet Black';
  if (min > 220) return 'Pure White';
  if (diff < 20) {
    if (max < 110) return 'Charcoal Grey';
    if (max < 190) return 'Heather Grey';
    return 'Off-White / Cream';
  }

  if (r > 180 && g > 150 && b < 120) return 'Gold / Sand';
  if (r > 160 && g < 80 && b < 80) return 'Crimson Red';
  if (r < 80 && g > 120 && b < 90) return 'Olive / Sage Green';
  if (r < 80 && g < 100 && b > 140) return 'Deep Navy Blue';
  if (r > 140 && g > 100 && b > 70) return 'Camel Tan / Brown';
  if (r > 160 && g < 110 && b > 140) return 'Rose / Plum';

  if (r >= g && r >= b) return 'Warm Rust / Terracotta';
  if (g >= r && g >= b) return 'Forest Green';
  return 'Classic Blue';
}

/**
 * Heuristics to auto-detect category and title from image filename
 */
export function guessCategoryAndNameFromFilename(filename: string): {
  category: GarmentCategory;
  subcategory: string;
  suggestedName: string;
} {
  const cleanName = filename
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/[-_]+/g, ' ')   // replace underscores/hyphens with spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // capitalize
    .trim();

  const lower = filename.toLowerCase();

  // Category & subcategory matching
  if (lower.includes('dress') || lower.includes('gown') || lower.includes('frock') || lower.includes('sundress') || lower.includes('slip')) {
    return {
      category: 'dress',
      subcategory: lower.includes('gown') ? 'Evening Gown' : lower.includes('sundress') ? 'Sundress' : 'Midi Dress',
      suggestedName: cleanName || 'Elegant Dress',
    };
  }

  if (lower.includes('jean') || lower.includes('denim') || lower.includes('pant') || lower.includes('trouser') || lower.includes('skirt') || lower.includes('short') || lower.includes('cargo') || lower.includes('slack')) {
    let sub = 'Trousers';
    if (lower.includes('jean') || lower.includes('denim')) sub = 'Jeans';
    else if (lower.includes('skirt')) sub = 'Skirt';
    else if (lower.includes('short')) sub = 'Shorts';
    else if (lower.includes('cargo')) sub = 'Cargo Pants';

    return {
      category: 'bottom',
      subcategory: sub,
      suggestedName: cleanName || `Tailored ${sub}`,
    };
  }

  if (lower.includes('jacket') || lower.includes('coat') || lower.includes('blazer') || lower.includes('trench') || lower.includes('cardigan') || lower.includes('parka') || lower.includes('vest') || lower.includes('bomber')) {
    let sub = 'Blazer';
    if (lower.includes('leather')) sub = 'Leather Jacket';
    else if (lower.includes('trench') || lower.includes('coat')) sub = 'Trench Coat';
    else if (lower.includes('cardigan')) sub = 'Knit Cardigan';

    return {
      category: 'outerwear',
      subcategory: sub,
      suggestedName: cleanName || `Structured ${sub}`,
    };
  }

  if (lower.includes('shoe') || lower.includes('sneaker') || lower.includes('boot') || lower.includes('heel') || lower.includes('sandal') || lower.includes('loafer') || lower.includes('mule') || lower.includes('espadrille')) {
    let sub = 'Footwear';
    if (lower.includes('sneaker')) sub = 'Sneakers';
    else if (lower.includes('boot')) sub = 'Boots';
    else if (lower.includes('heel') || lower.includes('mule')) sub = 'Heeled Mules';
    else if (lower.includes('loafer')) sub = 'Penny Loafers';
    else if (lower.includes('sandal') || lower.includes('espadrille')) sub = 'Sandals / Espadrilles';

    return {
      category: 'footwear',
      subcategory: sub,
      suggestedName: cleanName || `Classic ${sub}`,
    };
  }

  if (lower.includes('bag') || lower.includes('tote') || lower.includes('purse') || lower.includes('sunglass') || lower.includes('belt') || lower.includes('hat') || lower.includes('jewelry') || lower.includes('scarf')) {
    let sub = 'Accessory';
    if (lower.includes('tote') || lower.includes('bag')) sub = 'Tote / Handbag';
    else if (lower.includes('sunglass')) sub = 'Eyewear';
    else if (lower.includes('hat')) sub = 'Sun Hat';

    return {
      category: 'accessory',
      subcategory: sub,
      suggestedName: cleanName || `Chic ${sub}`,
    };
  }

  // Default to Top
  let sub = 'Top';
  if (lower.includes('shirt')) sub = 'Button-down Shirt';
  else if (lower.includes('tee') || lower.includes('tshirt')) sub = 'T-Shirt';
  else if (lower.includes('blouse')) sub = 'Silk Blouse';
  else if (lower.includes('sweater') || lower.includes('knit')) sub = 'Knit Sweater';
  else if (lower.includes('polo')) sub = 'Polo Top';
  else if (lower.includes('hoodie')) sub = 'Hoodie';

  return {
    category: 'top',
    subcategory: sub,
    suggestedName: cleanName || 'Casual Top',
  };
}
