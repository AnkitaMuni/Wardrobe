import React, { useState } from 'react';
import { Garment, GarmentCategory } from '../types';
import { 
  Plus, 
  Search, 
  Filter, 
  Heart, 
  Rotate3d, 
  Sparkles, 
  Trash2, 
  Tag, 
  Check, 
  Shirt,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface WardrobeViewProps {
  wardrobe: Garment[];
  onSelectForTryOn: (garment: Garment) => void;
  onSelectForPairing: (garmentId: string) => void;
  onToggleFavorite: (garmentId: string) => void;
  onDeleteGarment: (garmentId: string) => void;
  onAddNewGarment: (garment: Garment) => void;
}

export const WardrobeView: React.FC<WardrobeViewProps> = ({
  wardrobe,
  onSelectForTryOn,
  onSelectForPairing,
  onToggleFavorite,
  onDeleteGarment,
  onAddNewGarment,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New item form state
  const [newItem, setNewItem] = useState<Partial<Garment>>({
    name: '',
    category: 'top',
    subcategory: '',
    color: '',
    colorHex: '#C5A059',
    material: '',
    pattern: 'Solid',
    imageUrl: '',
    seasons: ['all-season'],
    occasions: ['casual_brunch'],
    tags: ['wardrobe-staple'],
    source: 'manual',
  });

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Closet' },
    { id: 'top', label: 'Tops' },
    { id: 'bottom', label: 'Bottoms' },
    { id: 'dress', label: 'Dresses' },
    { id: 'outerwear', label: 'Outerwear' },
    { id: 'footwear', label: 'Footwear' },
    { id: 'accessory', label: 'Accessories' },
  ];

  const filteredItems = wardrobe.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;
    const matchesQuery =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSource && matchesQuery;
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.imageUrl) return;

    const created: Garment = {
      id: `custom-${Date.now()}`,
      name: newItem.name || 'Custom Garment',
      category: (newItem.category as GarmentCategory) || 'top',
      subcategory: newItem.subcategory || 'Garment',
      color: newItem.color || 'Custom Color',
      colorHex: newItem.colorHex || '#B59D82',
      pattern: newItem.pattern || 'Solid',
      material: newItem.material || 'Cotton Blend',
      seasons: newItem.seasons || ['all-season'],
      occasions: newItem.occasions || ['casual_brunch'],
      imageUrl: newItem.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80',
      source: 'manual',
      tags: newItem.tags || ['custom'],
      timesWorn: 0,
      isFavorite: false,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddNewGarment(created);
    setShowAddModal(false);
    setNewItem({
      name: '',
      category: 'top',
      subcategory: '',
      color: '',
      colorHex: '#C5A059',
      material: '',
      pattern: 'Solid',
      imageUrl: '',
      seasons: ['all-season'],
      occasions: ['casual_brunch'],
      tags: ['wardrobe-staple'],
      source: 'manual',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white tracking-tight">
            Your Digital Closet
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            {wardrobe.length} digitized garments indexed with fabric weights, silhouettes, and wear frequencies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-lg"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Add Garment
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 rounded-2xl bg-[#14141C] border border-white/10">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-black font-bold shadow-md'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input & Source filter */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Filter by color, linen, silk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="google_photos">Google Photos</option>
            <option value="camera_roll">Camera Roll</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      {/* Garments Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group relative rounded-3xl bg-[#14141C] border border-white/10 hover:border-amber-500/40 transition-all p-3 shadow-lg flex flex-col justify-between"
          >
            {/* Top image container */}
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-stone-900 mb-3">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Source badge */}
              {item.source === 'google_photos' && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider bg-blue-600/90 text-white backdrop-blur-md">
                  Google Photos Extracted
                </span>
              )}

              {/* Favorite Button */}
              <button
                onClick={() => onToggleFavorite(item.id)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:text-rose-400 transition-colors"
              >
                <Heart
                  className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current text-rose-500' : ''}`}
                />
              </button>

              {/* Color Dot & Category overlay */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-black/80 text-amber-300 backdrop-blur-md">
                  {item.subcategory}
                </span>
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/40 shadow"
                  style={{ backgroundColor: item.colorHex }}
                  title={item.color}
                />
              </div>
            </div>

            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                {item.name}
              </h3>
              <p className="text-[11px] text-stone-400 truncate mt-0.5">{item.material}</p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-stone-500">
                <span>Worn {item.timesWorn}x</span>
                <span>•</span>
                <span className="capitalize">{item.occasions[0]}</span>
              </div>
            </div>

            {/* Action Buttons: Try On in 360° & Pair this item */}
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-1.5">
              <button
                onClick={() => onSelectForTryOn(item)}
                className="flex-1 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                title="Dress 3D Model with this item"
              >
                <Rotate3d className="w-3 h-3" />
                <span>Try On</span>
              </button>

              <button
                onClick={() => onSelectForPairing(item.id)}
                className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 border border-white/10 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                title="Pair this piece"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Pair</span>
              </button>

              <button
                onClick={() => onDeleteGarment(item.id)}
                className="p-1.5 rounded-xl text-stone-500 hover:text-rose-400 hover:bg-white/5 transition-colors"
                title="Delete item"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Garment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#161622] border border-white/15 rounded-3xl p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400 stroke-[3]" />
                <h3 className="font-serif text-lg font-bold text-white">Add Piece to Wardrobe</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4 my-4">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">Garment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raw Hem Silk Camisole"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as GarmentCategory })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="dress">Dress</option>
                    <option value="outerwear">Outerwear</option>
                    <option value="footwear">Footwear</option>
                    <option value="accessory">Accessory</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">Subcategory</label>
                  <input
                    type="text"
                    placeholder="e.g. Linen Blouse, Chinos"
                    value={newItem.subcategory}
                    onChange={(e) => setNewItem({ ...newItem, subcategory: e.target.value })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">Color Name & Hex</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newItem.colorHex}
                      onChange={(e) => setNewItem({ ...newItem, colorHex: e.target.value })}
                      className="w-9 h-9 p-0.5 rounded-lg bg-transparent cursor-pointer border border-white/20"
                    />
                    <input
                      type="text"
                      placeholder="e.g. Olive Green"
                      value={newItem.color}
                      onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
                      className="flex-1 px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">Fabric / Material</label>
                  <input
                    type="text"
                    placeholder="e.g. 100% Linen, Cashmere"
                    value={newItem.material}
                    onChange={(e) => setNewItem({ ...newItem, material: e.target.value })}
                    className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={newItem.imageUrl}
                  onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-lg"
                >
                  Save Piece into Closet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
