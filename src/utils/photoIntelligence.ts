import { Garment } from '../types';
import { normalizeImageUrl } from './imageUtils';

export interface GarmentSignature {
  dominantHex: string;
  dominantName: string;
  hue: number;         // 0 - 360
  saturation: number;  // 0 - 1
  value: number;       // 0 - 1
  histogram: number[]; // 16-bin normalized color distribution
  framingType: 'full_body' | 'waist_up' | 'close_up';
  qualityScore: number;
}

export interface PhotoAnalysisResult {
  faceCount: number;
  isSolo: boolean;
  isGroupPhoto: boolean;
  signature?: GarmentSignature;
}

let blazefaceModel: any = null;
let isModelLoading = false;

/**
 * Lazily loads BlazeFace neural network for high-accuracy face counting
 */
async function getBlazeFaceModel() {
  if (blazefaceModel) return blazefaceModel;
  if (isModelLoading) return null;
  isModelLoading = true;
  try {
    const blazeface = await import('@tensorflow-models/blazeface');
    await import('@tensorflow/tfjs-core');
    await import('@tensorflow/tfjs-backend-webgl');
    blazefaceModel = await blazeface.load();
    return blazefaceModel;
  } catch (err) {
    console.warn('[Photo AI] BlazeFace load failed, using canvas vision engine:', err);
    return null;
  } finally {
    isModelLoading = false;
  }
}

/**
 * Loads an image into an HTMLImageElement with crossOrigin and no-referrer
 */
export function loadHTMLImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback without crossOrigin if tainted
      const fallback = new Image();
      fallback.referrerPolicy = 'no-referrer';
      fallback.onload = () => resolve(fallback);
      fallback.onerror = (e) => reject(e);
      fallback.src = normalizeImageUrl(src);
    };
    img.src = normalizeImageUrl(src);
  });
}

/**
 * Pure Canvas Computer Vision Skin Cluster Heuristic
 * Analyzes YCbCr skin distribution to detect crowd photos vs single portraits
 */
function analyzeSkinClustersOnCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): {
  faceCountEst: number;
  faceYEstimate: number;
} {
  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h).data;

  // Downsample to 20x20 grid to detect face clusters
  const cols = 24;
  const rows = 24;
  const cellW = Math.floor(w / cols);
  const cellH = Math.floor(h / rows);
  const skinGrid: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let skinPixels = 0;
      let totalPixels = 0;

      for (let y = r * cellH; y < (r + 1) * cellH; y += 2) {
        for (let x = c * cellW; x < (c + 1) * cellW; x += 2) {
          const idx = (y * w + x) * 4;
          const red = imgData[idx];
          const green = imgData[idx + 1];
          const blue = imgData[idx + 2];

          // YCbCr skin color transformation
          const Y = 0.299 * red + 0.587 * green + 0.114 * blue;
          const Cb = -0.1687 * red - 0.3313 * green + 0.5 * blue + 128;
          const Cr = 0.5 * red - 0.4187 * green - 0.0813 * blue + 128;

          if (Y > 35 && Cb >= 75 && Cb <= 135 && Cr >= 130 && Cr <= 180) {
            skinPixels++;
          }
          totalPixels++;
        }
      }

      if (totalPixels > 0 && skinPixels / totalPixels > 0.35) {
        skinGrid[r][c] = 1;
      }
    }
  }

  // Count connected skin clusters in upper 65% of image
  const visited: boolean[][] = Array(rows).fill(false).map(() => Array(cols).fill(false));
  let clusters = 0;
  let totalFaceY = 0;

  for (let r = 1; r < Math.floor(rows * 0.7); r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (skinGrid[r][c] === 1 && !visited[r][c]) {
        // BFS to measure cluster size
        let clusterSize = 0;
        const queue: [number, number][] = [[r, c]];
        visited[r][c] = true;

        while (queue.length > 0) {
          const [currR, currC] = queue.shift()!;
          clusterSize++;

          const neighbors = [
            [currR - 1, currC],
            [currR + 1, currC],
            [currR, currC - 1],
            [currR, currC + 1],
          ];

          for (const [nr, nc] of neighbors) {
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && skinGrid[nr][nc] === 1 && !visited[nr][nc]) {
              visited[nr][nc] = true;
              queue.push([nr, nc]);
            }
          }
        }

        // A valid face cluster has between 2 and 15 cells
        if (clusterSize >= 2) {
          clusters++;
          totalFaceY += r / rows;
        }
      }
    }
  }

  return {
    faceCountEst: clusters,
    faceYEstimate: clusters > 0 ? totalFaceY / clusters : 0.25,
  };
}

/**
 * Analyzes photo for face count (solo vs group) using BlazeFace with Canvas Fallback
 */
export async function analyzePhoto(img: HTMLImageElement): Promise<PhotoAnalysisResult> {
  let faceCount = 0;
  let isGroup = false;

  // 1. Try BlazeFace Neural Detector
  try {
    const model = await getBlazeFaceModel();
    if (model) {
      const predictions = await model.estimateFaces(img, false);
      faceCount = predictions.length;
      if (faceCount > 0) {
        isGroup = faceCount > 1;
        const signature = extractGarmentSignatureFromCanvas(img, predictions[0]);
        return {
          faceCount,
          isSolo: faceCount === 1,
          isGroupPhoto: isGroup,
          signature,
        };
      }
    }
  } catch (e) {
    console.debug('[Photo AI] Neural estimate error, switching to canvas vision engine:', e);
  }

  // 2. High-speed Canvas Vision Fallback
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = Math.round((240 * img.height) / (img.width || 1));
  const ctx = canvas.getContext('2d');

  if (ctx) {
    try {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const { faceCountEst } = analyzeSkinClustersOnCanvas(canvas, ctx);
      faceCount = faceCountEst;
      isGroup = faceCountEst > 1;
    } catch {
      // If canvas tainted, default to solo
      faceCount = 1;
      isGroup = false;
    }
  } else {
    faceCount = 1;
    isGroup = false;
  }

  const signature = extractGarmentSignatureFromCanvas(img);

  return {
    faceCount,
    isSolo: faceCount === 1,
    isGroupPhoto: isGroup,
    signature,
  };
}

/**
 * Extracts outfit color signature and color distribution for garment deduplication
 */
function extractGarmentSignatureFromCanvas(
  img: HTMLImageElement,
  facePrediction?: any
): GarmentSignature {
  const canvas = document.createElement('canvas');
  const w = 120;
  const h = 160;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const defaultSignature: GarmentSignature = {
    dominantHex: '#C5A059',
    dominantName: 'Neutral Tan',
    hue: 35,
    saturation: 0.4,
    value: 0.7,
    histogram: Array(16).fill(0.06),
    framingType: 'full_body',
    qualityScore: 80,
  };

  if (!ctx) return defaultSignature;

  try {
    ctx.drawImage(img, 0, 0, w, h);

    // Determine torso/clothing region (below face or middle 45% of height)
    let startY = Math.round(h * 0.38);
    let endY = Math.round(h * 0.85);

    if (facePrediction && facePrediction.bottomRight) {
      const faceBottomY = (facePrediction.bottomRight[1] / img.height) * h;
      startY = Math.min(Math.round(faceBottomY + 8), Math.round(h * 0.5));
      endY = Math.min(Math.round(h * 0.95), Math.max(startY + 30, Math.round(h * 0.85)));
    }

    const startX = Math.round(w * 0.2);
    const endX = Math.round(w * 0.8);

    const imgData = ctx.getImageData(startX, startY, endX - startX, endY - startY).data;

    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    const hist = Array(16).fill(0);

    for (let i = 0; i < imgData.length; i += 4) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const a = imgData[i + 3];

      if (a > 150) {
        rSum += r;
        gSum += g;
        bSum += b;
        count++;

        // 16-bin quantization
        const bin = Math.min(15, Math.floor(((r + g + b) / 3) / 16));
        hist[bin]++;
      }
    }

    if (count === 0) return defaultSignature;

    const avgR = Math.round(rSum / count);
    const avgG = Math.round(gSum / count);
    const avgB = Math.round(bSum / count);

    const hex = rgbToHex(avgR, avgG, avgB);
    const [hue, sat, val] = rgbToHsv(avgR, avgG, avgB);

    // Normalize histogram
    const normHist = hist.map(v => v / count);

    // Estimate framing quality: taller aspect ratio usually implies full-body / 3/4 length shot
    const aspect = img.height / (img.width || 1);
    let framing: 'full_body' | 'waist_up' | 'close_up' = 'full_body';
    let quality = 85;

    if (aspect >= 1.3) {
      framing = 'full_body';
      quality = 95; // Prioritize full-length standing shots for wardrobe try-on!
    } else if (aspect >= 0.9) {
      framing = 'waist_up';
      quality = 80;
    } else {
      framing = 'close_up';
      quality = 65;
    }

    return {
      dominantHex: hex,
      dominantName: getDescriptiveColorName(avgR, avgG, avgB),
      hue,
      saturation: sat,
      value: val,
      histogram: normHist,
      framingType: framing,
      qualityScore: quality,
    };
  } catch {
    return defaultSignature;
  }
}

/**
 * Computes cosine similarity between two 16-bin histograms
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const mag = Math.sqrt(magA) * Math.sqrt(magB);
  return mag === 0 ? 0 : dot / mag;
}

/**
 * Calculates similarity score (0.0 to 1.0) between two garments to detect duplicates
 */
export function calculateGarmentSimilarity(a: Garment, b: Garment): number {
  const sigA = (a as any).signature as GarmentSignature | undefined;
  const sigB = (b as any).signature as GarmentSignature | undefined;

  // If signatures exist, use color histogram and HSV
  if (sigA && sigB) {
    let hueDiff = Math.abs(sigA.hue - sigB.hue);
    if (hueDiff > 180) hueDiff = 360 - hueDiff;
    const hueScore = Math.max(0, 1 - hueDiff / 40);

    const satDiff = Math.abs(sigA.saturation - sigB.saturation);
    const valDiff = Math.abs(sigA.value - sigB.value);
    const satValScore = Math.max(0, 1 - (satDiff + valDiff) / 1.5);

    const histScore = cosineSimilarity(sigA.histogram, sigB.histogram);

    return hueScore * 0.45 + satValScore * 0.25 + histScore * 0.3;
  }

  // Fallback: compare colorHex distance and category
  if (a.category !== b.category) return 0.2;
  const colorMatch = a.colorHex.toLowerCase() === b.colorHex.toLowerCase();
  return colorMatch ? 0.85 : 0.3;
}

/**
 * Filters out group photos and deduplicates repeating dresses
 */
export async function filterAndDeduplicateGarments(
  garments: Garment[],
  options: {
    filterGroupPhotos: boolean;
    deduplicateRepeatingDresses: boolean;
    onProgress?: (processed: number, total: number) => void;
  }
): Promise<{
  cleanedGarments: Garment[];
  groupPhotosRemoved: number;
  duplicateDressesMerged: number;
}> {
  const total = garments.length;
  if (total === 0) {
    return { cleanedGarments: [], groupPhotosRemoved: 0, duplicateDressesMerged: 0 };
  }

  const analyzedList: { garment: Garment; analysis: PhotoAnalysisResult }[] = [];

  // 1. Analyze each garment photo
  for (let i = 0; i < garments.length; i++) {
    const item = garments[i];
    try {
      const img = await loadHTMLImage(item.imageUrl);
      const analysis = await analyzePhoto(img);
      analyzedList.push({ garment: item, analysis });
    } catch {
      // Default to solo if image fails to decode
      analyzedList.push({
        garment: item,
        analysis: { faceCount: 1, isSolo: true, isGroupPhoto: false },
      });
    }

    if (options.onProgress) {
      options.onProgress(i + 1, total);
    }
  }

  // 2. Filter out group photos if requested
  let soloList = analyzedList;
  let groupPhotosRemoved = 0;

  if (options.filterGroupPhotos) {
    const filtered = analyzedList.filter(({ analysis }) => !analysis.isGroupPhoto);
    groupPhotosRemoved = analyzedList.length - filtered.length;
    // Safety check: if all were detected as groups (false positives), keep original
    soloList = filtered.length > 0 ? filtered : analyzedList;
  }

  // 3. Deduplicate repeating dresses / outfits
  let duplicateDressesMerged = 0;
  const uniqueGarments: Garment[] = [];
  const processedIndices = new Set<number>();

  for (let i = 0; i < soloList.length; i++) {
    if (processedIndices.has(i)) continue;

    const current = soloList[i];
    const cluster = [current];
    processedIndices.add(i);

    if (options.deduplicateRepeatingDresses) {
      for (let j = i + 1; j < soloList.length; j++) {
        if (processedIndices.has(j)) continue;
        const candidate = soloList[j];

        // Check similarity
        const sim = calculateGarmentSimilarity(current.garment, candidate.garment);

        // If similarity > 0.76 and same category, it's the same outfit!
        if (sim >= 0.76 && current.garment.category === candidate.garment.category) {
          cluster.push(candidate);
          processedIndices.add(j);
        }
      }
    }

    if (cluster.length > 1) {
      duplicateDressesMerged += cluster.length - 1;
    }

    // Pick the best representative photo in this cluster (highest quality/full-body score)
    cluster.sort((a, b) => {
      const qA = a.analysis.signature?.qualityScore || 80;
      const qB = b.analysis.signature?.qualityScore || 80;
      return qB - qA;
    });

    const best = cluster[0];
    const alternates = cluster.slice(1).map(c => c.garment.imageUrl);

    // Clean naming for distinct dress
    const colorName = best.analysis.signature?.dominantName || best.garment.color || 'Custom';
    const subcat = best.garment.category === 'dress' ? 'Dress' : 'Top';

    uniqueGarments.push({
      ...best.garment,
      name: `${colorName} ${subcat}`,
      subcategory: subcat,
      color: colorName,
      colorHex: best.analysis.signature?.dominantHex || best.garment.colorHex,
      alternatePhotos: alternates,
    } as any);
  }

  return {
    cleanedGarments: uniqueGarments,
    groupPhotosRemoved,
    duplicateDressesMerged,
  };
}

// Helpers
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), s, v];
}

function getDescriptiveColorName(r: number, g: number, b: number): string {
  const [h, s, v] = rgbToHsv(r, g, b);

  if (v < 0.18) return 'Jet Black';
  if (v > 0.88 && s < 0.12) return 'Crisp White';
  if (s < 0.15) {
    if (v < 0.5) return 'Charcoal';
    return 'Heather Grey';
  }

  // Hue-based naming
  if (h >= 335 || h < 12) {
    if (s > 0.35 && v > 0.75) return 'Blush Pink';
    return 'Ruby Red';
  }
  if (h >= 12 && h < 38) {
    if (s < 0.5) return 'Terracotta';
    return 'Warm Rust';
  }
  if (h >= 38 && h < 65) {
    if (s < 0.45) return 'Champagne Gold';
    return 'Warm Ochre';
  }
  if (h >= 65 && h < 165) {
    if (s < 0.4) return 'Sage Green';
    return 'Emerald Green';
  }
  if (h >= 165 && h < 260) {
    if (s < 0.4) return 'Powder Blue';
    if (v < 0.45) return 'Midnight Navy';
    return 'Royal Blue';
  }
  if (h >= 260 && h < 335) {
    if (s < 0.45) return 'Lilac / Lavender';
    return 'Plum Berry';
  }

  return 'Blush Pink';
}
