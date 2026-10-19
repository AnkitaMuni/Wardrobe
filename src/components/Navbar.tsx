import React from 'react';
import { 
  Sparkles, 
  Rotate3d, 
  Layers, 
  Cloud, 
  Zap, 
  Heart, 
  User,
  Compass
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'wardrobe' | 'occasion' | 'pair' | 'dressing_room' | 'google_photos';
  setActiveTab: (tab: 'wardrobe' | 'occasion' | 'pair' | 'dressing_room' | 'google_photos') => void;
  wardrobeCount: number;
  savedLooksCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  wardrobeCount,
  savedLooksCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0C0C12]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => setActiveTab('wardrobe')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-[1px] shadow-lg shadow-amber-500/10 group-hover:shadow-amber-500/25 transition-all">
              <div className="w-full h-full bg-[#121218] rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-wider text-white">
                  CLOSET AI
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-widest uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ATELIER
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-mono tracking-tight">
                Wardrobe AI & 360° Dressing Room
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10 shadow-inner">
            <button
              onClick={() => setActiveTab('wardrobe')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'wardrobe'
                  ? 'bg-amber-500 text-black shadow-lg font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Wardrobe</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'wardrobe' ? 'bg-black/20 text-black font-extrabold' : 'bg-white/10 text-stone-400'
              }`}>
                {wardrobeCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('occasion')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'occasion'
                  ? 'bg-amber-500 text-black shadow-lg font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Occasion Stylist</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400/30 text-amber-950">
                5 Pairs
              </span>
            </button>

            <button
              onClick={() => setActiveTab('pair')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'pair'
                  ? 'bg-amber-500 text-black shadow-lg font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Pair a Piece</span>
            </button>

            <button
              onClick={() => setActiveTab('dressing_room')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'dressing_room'
                  ? 'bg-amber-500 text-black shadow-lg font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Rotate3d className="w-3.5 h-3.5" />
              <span>360° Dressing Room</span>
            </button>

            <button
              onClick={() => setActiveTab('google_photos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'google_photos'
                  ? 'bg-amber-500 text-black shadow-lg font-bold'
                  : 'text-stone-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Photos Sync</span>
            </button>
          </nav>

          {/* User Profile & Saved Looks Pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('occasion')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-stone-200 transition-colors"
            >
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Saved ({savedLooksCount})</span>
            </button>

            <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-400 p-[1px]">
                <div className="w-full h-full rounded-full bg-[#1A1A24] flex items-center justify-center text-xs font-bold text-amber-300">
                  AM
                </div>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-white leading-tight">Ankita Muni</p>
                <p className="text-[10px] text-amber-400/90 font-mono">Curated Wardrobe</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around py-2 px-3 border-t border-white/5 bg-black/60 overflow-x-auto">
        <button
          onClick={() => setActiveTab('wardrobe')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
            activeTab === 'wardrobe' ? 'text-amber-400 bg-amber-500/10' : 'text-stone-400'
          }`}
        >
          Wardrobe ({wardrobeCount})
        </button>
        <button
          onClick={() => setActiveTab('occasion')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
            activeTab === 'occasion' ? 'text-amber-400 bg-amber-500/10' : 'text-stone-400'
          }`}
        >
          Occasions
        </button>
        <button
          onClick={() => setActiveTab('pair')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
            activeTab === 'pair' ? 'text-amber-400 bg-amber-500/10' : 'text-stone-400'
          }`}
        >
          Pair Item
        </button>
        <button
          onClick={() => setActiveTab('dressing_room')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
            activeTab === 'dressing_room' ? 'text-amber-400 bg-amber-500/10' : 'text-stone-400'
          }`}
        >
          360° Room
        </button>
        <button
          onClick={() => setActiveTab('google_photos')}
          className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
            activeTab === 'google_photos' ? 'text-blue-400 bg-blue-500/10' : 'text-stone-400'
          }`}
        >
          Photos Sync
        </button>
      </div>
    </header>
  );
};
