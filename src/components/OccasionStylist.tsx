import React, { useState, useEffect } from 'react';
import { Garment, OutfitPair, OccasionType } from '../types';
import { OCCASIONS_LIST, OccasionConfig } from '../data/occasions';
import { generateOccasionOutfits } from '../utils/outfitEngine';
import { 
  Sparkles, 
  Search, 
  Rotate3d, 
  Heart, 
  Bookmark, 
  CheckCircle2, 
  SlidersHorizontal,
  Compass,
  ArrowRight,
  Sun,
  Flame,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OccasionStylistProps {
  wardrobe: Garment[];
  onTryOnOutfit: (outfit: OutfitPair) => void;
  savedOutfits: OutfitPair[];
  onToggleSaveOutfit: (outfit: OutfitPair) => void;
}

export const OccasionStylist: React.FC<OccasionStylistProps> = ({
  wardrobe,
  onTryOnOutfit,
  savedOutfits,
  onToggleSaveOutfit,
}) => {
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionType>('beachwear');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [activeOccasionLabel, setActiveOccasionLabel] = useState<string>('Beachwear & Resort');
  const [outfitOptions, setOutfitOptions] = useState<OutfitPair[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Generate 5 options whenever occasion changes
  const runStylistEngine = (occasionKey: string, customName?: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      const results = generateOccasionOutfits(wardrobe, occasionKey);
      setOutfitOptions(results);
      setIsGenerating(false);
      setActiveOccasionLabel(customName || capitalize(occasionKey));
    }, 450);
  };

  useEffect(() => {
    runStylistEngine('beachwear', 'Beachwear & Resort');
  }, [wardrobe]);

  const handleOccasionSelect = (occ: OccasionConfig) => {
    setSelectedOccasion(occ.id);
    setCustomQuery('');
    runStylistEngine(occ.id, occ.label);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    runStylistEngine(customQuery.trim(), customQuery.trim());
  };

  const handleSaveWithConfetti = (outfit: OutfitPair) => {
    onToggleSaveOutfit(outfit);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#D4AF37', '#F5E6D3', '#E8A598', '#98A892']
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-8 border border-white/10 bg-gradient-to-r from-[#171722] via-[#1F1F2C] to-[#14141B] shadow-2xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Feature 1: Occasion-Based Styling Engine
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-white tracking-tight mb-2">
            What's the Occasion?
          </h1>
          <p className="text-sm text-stone-300 leading-relaxed">
            Pick any occasion or enter a vibe. Our AI stylist analyzes fabric drape, silhouette proportion, and color harmonies from your wardrobe to present <span className="text-amber-400 font-bold">5 tailored outfit pairs</span>.
          </p>
        </div>

        {/* Custom Occasion Input Bar */}
        <form onSubmit={handleCustomSubmit} className="mt-6 max-w-xl flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Or type custom event (e.g., Yacht party in Monaco, Rainy day museum date)..."
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-black/50 border border-white/15 focus:border-amber-400 rounded-2xl text-xs text-white placeholder-stone-500 focus:outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            Style Me
          </button>
        </form>

        {/* Quick Occasion Chips */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {OCCASIONS_LIST.map((occ) => {
            const isSelected = selectedOccasion === occ.id && !customQuery;
            return (
              <button
                key={occ.id}
                onClick={() => handleOccasionSelect(occ)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md scale-105'
                    : 'bg-white/5 hover:bg-white/10 text-stone-300 border-white/10 hover:border-white/20'
                }`}
              >
                <span>{occ.emoji}</span>
                <span>{occ.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
            <span>5 Curated Outfits for:</span>
            <span className="text-amber-400 italic">"{activeOccasionLabel}"</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Carefully curated combinations balanced for silhouette, contrast, and dress code.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-white/5 border border-white/10 text-stone-300">
          Showing 5 of 5 pairs
        </span>
      </div>

      {/* 5 Outfit Cards Grid */}
      {isGenerating ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-400 animate-spin" />
          <p className="text-xs font-mono text-stone-400 uppercase tracking-widest animate-pulse">
            Analyzing Closet Silhouettes & Color Harmonies...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {outfitOptions.map((outfit, index) => {
            const isSaved = savedOutfits.some((o) => o.id === outfit.id);
            const pieces = [
              outfit.top,
              outfit.bottom,
              outfit.dress,
              outfit.outerwear,
              outfit.footwear,
              outfit.accessory,
            ].filter(Boolean) as Garment[];

            return (
              <div
                key={outfit.id}
                className="group relative rounded-3xl bg-[#14141C] border border-white/10 hover:border-amber-500/40 transition-all p-6 shadow-xl hover:shadow-2xl hover:shadow-amber-500/5 flex flex-col lg:flex-row gap-6 items-stretch"
              >
                {/* Left Column: Option Tag & Hero Garments Stack */}
                <div className="w-full lg:w-96 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10 pb-4 lg:pb-0 lg:pr-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Option #{index + 1}
                      </span>
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {outfit.matchScore}% Match
                      </div>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      {outfit.title}
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 italic">
                      Vibe: {outfit.vibe}
                    </p>
                  </div>

                  {/* Stylist Assessment */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-black/40 border border-white/5">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                      <Sparkles className="w-3 h-3" />
                      Stylist Notes
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      {outfit.stylistNote}
                    </p>
                    {outfit.weatherAppropriate && (
                      <div className="mt-2 text-[11px] text-stone-400 flex items-center gap-1">
                        <Sun className="w-3 h-3 text-amber-400" />
                        <span>{outfit.weatherAppropriate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Center Column: Visual Display of Paired Pieces */}
                <div className="flex-1 flex flex-col justify-center">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {pieces.map((piece) => (
                      <div
                        key={piece.id}
                        className="group/piece relative rounded-2xl bg-black/40 border border-white/10 hover:border-amber-500/40 p-2.5 flex flex-col transition-all"
                      >
                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-900 mb-2">
                          <img
                            src={piece.imageUrl}
                            alt={piece.name}
                            className="w-full h-full object-cover group-hover/piece:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-black/70 text-white backdrop-blur-md">
                            {piece.category}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{piece.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-stone-400">
                            <span
                              className="w-2 h-2 rounded-full border border-white/20"
                              style={{ backgroundColor: piece.colorHex }}
                            />
                            <span className="truncate">{piece.color}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Try On CTA & Actions */}
                <div className="w-full lg:w-48 flex flex-col justify-center gap-2.5 pt-4 lg:pt-0 lg:border-l border-white/10 lg:pl-6">
                  <button
                    onClick={() => onTryOnOutfit(outfit)}
                    className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20 group/btn"
                  >
                    <Rotate3d className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
                    <span>Try On 360°</span>
                  </button>

                  <button
                    onClick={() => handleSaveWithConfetti(outfit)}
                    className={`w-full py-2.5 px-4 rounded-2xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                      isSaved
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-white/5 hover:bg-white/10 text-stone-300 border-white/10'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current text-rose-400' : ''}`} />
                    <span>{isSaved ? 'Saved in Looks' : 'Save Look'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}
