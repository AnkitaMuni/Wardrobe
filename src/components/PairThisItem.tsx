import React, { useState, useEffect } from 'react';
import { Garment, OutfitPair } from '../types';
import { pairSpecificGarment } from '../utils/outfitEngine';
import { normalizeImageUrl } from '../utils/imageUtils';
import { 
  Sparkles, 
  Search, 
  Rotate3d, 
  Layers, 
  Check, 
  Filter, 
  ArrowRight, 
  Zap,
  Tag,
  CheckCircle2,
  Shirt,
  Plus
} from 'lucide-react';

interface PairThisItemProps {
  wardrobe: Garment[];
  onTryOnOutfit: (outfit: OutfitPair) => void;
  selectedGarmentId?: string;
  onNavigateToWardrobe?: () => void;
}

export const PairThisItem: React.FC<PairThisItemProps> = ({
  wardrobe,
  onTryOnOutfit,
  selectedGarmentId,
  onNavigateToWardrobe,
}) => {
  const [selectedAnchor, setSelectedAnchor] = useState<Garment | undefined>(() => {
    return wardrobe.find(g => g.id === selectedGarmentId) || wardrobe[0];
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Keep anchor in sync if wardrobe changes or selectedGarmentId changes
  useEffect(() => {
    if (selectedGarmentId) {
      const match = wardrobe.find(g => g.id === selectedGarmentId);
      if (match) setSelectedAnchor(match);
    } else if (!selectedAnchor && wardrobe.length > 0) {
      setSelectedAnchor(wardrobe[0]);
    }
  }, [selectedGarmentId, wardrobe]);

  // If wardrobe is empty
  if (wardrobe.length === 0) {
    return (
      <div className="py-20 px-6 max-w-xl mx-auto text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
          <Shirt className="w-10 h-10 stroke-[1.7]" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-white">No Pieces to Pair Yet</h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            Drag & drop images of your clothes in the Wardrobe tab. Once added, you can select any shirt, pants, or jacket to instantly reveal all compatible outfit pairings!
          </p>
        </div>
        {onNavigateToWardrobe && (
          <button
            onClick={onNavigateToWardrobe}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Go to Wardrobe & Add Clothes</span>
          </button>
        )}
      </div>
    );
  }

  // Generated pairings built around this anchor item
  const pairedOutfits = selectedAnchor ? pairSpecificGarment(selectedAnchor, wardrobe) : [];

  // Filter wardrobe list for anchor selection
  const filteredWardrobe = wardrobe.filter(item => {
    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesQuery = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-8 border border-white/10 bg-gradient-to-r from-[#171722] via-[#1B1B26] to-[#121218] shadow-2xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-3">
            <Zap className="w-3.5 h-3.5" />
            Feature 2: Garment-Centric Pairing Engine
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-white tracking-tight mb-2">
            Pair Any Specific Garment
          </h1>
          <p className="text-sm text-stone-300 leading-relaxed">
            Want to wear a specific shirt, trousers, or jacket today? Pick any hero item below and our styling engine will immediately reveal <span className="text-amber-400 font-bold">all cohesive outfits you can pair it with</span>.
          </p>
        </div>

        {/* Anchor Item Selector Filter Controls */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/10">
            {['all', 'top', 'bottom', 'dress', 'outerwear'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  categoryFilter === cat
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Items' : cat}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search your wardrobe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Horizontal Garment Picker Bar */}
        <div className="mt-5 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {filteredWardrobe.map((garment) => {
            const isSelected = selectedAnchor?.id === garment.id;
            return (
              <button
                key={garment.id}
                onClick={() => setSelectedAnchor(garment)}
                className={`relative flex-shrink-0 w-28 p-2 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 scale-105 shadow-xl'
                    : 'bg-black/40 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-1.5 bg-stone-900">
                  <img
                    src={normalizeImageUrl(garment.imageUrl)}
                    alt={garment.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-white truncate">{garment.name}</p>
                <p className="text-[10px] text-stone-400 capitalize">{garment.category}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Showcase of the Selected Anchor Garment */}
      {selectedAnchor && (
        <div className="rounded-3xl bg-[#14141C] border border-amber-500/30 p-6 shadow-2xl flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden border border-amber-500/40 shadow-xl flex-shrink-0">
            <img
              src={normalizeImageUrl(selectedAnchor.imageUrl)}
              alt={selectedAnchor.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-black/80 text-amber-300">
              Anchor Item
            </span>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1.5">
              <Sparkles className="w-3 h-3" />
              Styling Around This Piece
            </div>
            <h2 className="font-serif text-2xl font-bold text-white">
              {selectedAnchor.name}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-2 text-xs text-stone-300">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/20"
                  style={{ backgroundColor: selectedAnchor.colorHex }}
                />
                {selectedAnchor.color}
              </span>
              <span>•</span>
              <span>{selectedAnchor.material}</span>
              <span>•</span>
              <span className="text-amber-400 font-medium">
                {pairedOutfits.length} Pairings Discovered
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Generated Pairings List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <span>Cohesive Pairings with</span>
            <span className="text-amber-400 italic font-medium">"{selectedAnchor?.name}"</span>
          </h3>
          <span className="text-xs text-stone-400 font-mono">
            Ranked by color theory & silhouette balance
          </span>
        </div>

        {pairedOutfits.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#14141C] border border-white/10 text-center space-y-2">
            <p className="text-sm font-semibold text-white">Need more pieces to create pairings</p>
            <p className="text-xs text-stone-400">
              Add more tops, bottoms, or shoes in your wardrobe to pair with this piece.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pairedOutfits.map((pair, index) => {
              const pieces = [
                pair.top,
                pair.bottom,
                pair.dress,
                pair.outerwear,
                pair.footwear,
                pair.accessory,
              ].filter(Boolean) as Garment[];

              return (
                <div
                  key={pair.id}
                  className="group rounded-3xl bg-[#14141C] border border-white/10 hover:border-amber-500/40 transition-all p-5 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-stone-300 border border-white/10">
                        Combo #{index + 1}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        {pair.matchScore}% Match
                      </div>
                    </div>

                    <h4 className="font-serif text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      {pair.title}
                    </h4>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                      {pair.stylistNote}
                    </p>

                    {/* Paired Garments Mini Thumbnails */}
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {pieces.map((piece) => {
                        const isAnchor = selectedAnchor && piece.id === selectedAnchor.id;
                        return (
                          <div
                            key={piece.id}
                            className={`relative rounded-xl overflow-hidden border aspect-[3/4] ${
                              isAnchor
                                ? 'border-amber-400 ring-2 ring-amber-400/40'
                                : 'border-white/10'
                            }`}
                          >
                            <img
                              src={normalizeImageUrl(piece.imageUrl)}
                              alt={piece.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-black/80 text-white">
                              {piece.category}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Try On Button */}
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <button
                      onClick={() => onTryOnOutfit(pair)}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-amber-500/20"
                    >
                      <Rotate3d className="w-4 h-4" />
                      <span>Try On This Combo in 360°</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
