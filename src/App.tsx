import React, { useState, useEffect } from 'react';
import { Garment, OutfitPair } from './types';
import { INITIAL_WARDROBE, DEMO_WARDROBE } from './data/wardrobeSeed';
import { normalizeImageUrl } from './utils/imageUtils';
import { Navbar } from './components/Navbar';
import { WardrobeView } from './components/WardrobeView';
import { OccasionStylist } from './components/OccasionStylist';
import { PairThisItem } from './components/PairThisItem';
import { DressingRoom360 } from './components/DressingRoom360';
import { GooglePhotosScanner } from './components/GooglePhotosScanner';
import { AiStylistChat } from './components/AiStylistChat';

export function App() {
  // Wardrobe State: starts empty so user can drag & drop their clothes from scratch!
  const [wardrobe, setWardrobe] = useState<Garment[]>(() => {
    try {
      const saved = localStorage.getItem('wardrobe_items');
      if (saved) {
        const parsed: Garment[] = JSON.parse(saved);
        return parsed.map(item => ({
          ...item,
          imageUrl: normalizeImageUrl(item.imageUrl),
        }));
      }
      return INITIAL_WARDROBE;
    } catch {
      return INITIAL_WARDROBE;
    }
  });

  // Saved Outfits State
  const [savedOutfits, setSavedOutfits] = useState<OutfitPair[]>(() => {
    try {
      const saved = localStorage.getItem('saved_outfits');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'occasion' | 'pair' | 'dressing_room' | 'google_photos'>('wardrobe');

  // Active outfit being worn in 360° Dressing Room
  const [dressingRoomOutfit, setDressingRoomOutfit] = useState<OutfitPair | null>(null);

  // Individually selected pieces in the dressing room
  const [dressingRoomGarments, setDressingRoomGarments] = useState<{
    top?: Garment;
    bottom?: Garment;
    dress?: Garment;
    outerwear?: Garment;
    footwear?: Garment;
    accessory?: Garment;
  }>({});

  // Selected item ID for the "Pair an Item" tab
  const [pairingGarmentId, setPairingGarmentId] = useState<string | undefined>(undefined);

  // Persist Wardrobe and Outfits
  useEffect(() => {
    try {
      localStorage.setItem('wardrobe_items', JSON.stringify(wardrobe));
    } catch (e) {
      console.error('Storage error', e);
    }
  }, [wardrobe]);

  useEffect(() => {
    try {
      localStorage.setItem('saved_outfits', JSON.stringify(savedOutfits));
    } catch (e) {
      console.error('Storage error', e);
    }
  }, [savedOutfits]);

  // Handler: Try on full outfit in 360°
  const handleTryOnOutfit = (outfit: OutfitPair) => {
    setDressingRoomOutfit(outfit);
    setDressingRoomGarments({
      top: outfit.top,
      bottom: outfit.bottom,
      dress: outfit.dress,
      outerwear: outfit.outerwear,
      footwear: outfit.footwear,
      accessory: outfit.accessory,
    });
    setActiveTab('dressing_room');
  };

  // Handler: Try on a single garment from Wardrobe
  const handleSelectForTryOn = (garment: Garment) => {
    setDressingRoomOutfit(null);
    if (garment.category === 'dress') {
      setDressingRoomGarments(prev => ({
        ...prev,
        dress: garment,
        top: undefined,
        bottom: undefined,
      }));
    } else {
      setDressingRoomGarments(prev => ({
        ...prev,
        [garment.category]: garment,
        ...(garment.category === 'top' || garment.category === 'bottom' ? { dress: undefined } : {}),
      }));
    }
    setActiveTab('dressing_room');
  };

  // Handler: Pair a specific piece
  const handleSelectForPairing = (garmentId: string) => {
    setPairingGarmentId(garmentId);
    setActiveTab('pair');
  };

  // Handler: Toggle Favorite
  const handleToggleFavorite = (garmentId: string) => {
    setWardrobe(prev =>
      prev.map(item =>
        item.id === garmentId ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  // Handler: Delete Garment
  const handleDeleteGarment = (garmentId: string) => {
    setWardrobe(prev => prev.filter(item => item.id !== garmentId));
    // Also remove from dressing room if currently worn
    setDressingRoomGarments(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(k => {
        const cat = k as keyof typeof copy;
        if (copy[cat]?.id === garmentId) {
          delete copy[cat];
        }
      });
      return copy;
    });
  };

  // Handler: Add New Garment
  const handleAddNewGarment = (garment: Garment) => {
    setWardrobe(prev => [garment, ...prev]);
    // If it's the very first garment, pre-select it
    if (!pairingGarmentId) {
      setPairingGarmentId(garment.id);
    }
  };

  // Handler: Clear all clothes to start clean
  const handleClearAllWardrobe = () => {
    setWardrobe([]);
    setDressingRoomOutfit(null);
    setDressingRoomGarments({});
    setPairingGarmentId(undefined);
    setSavedOutfits([]);
    localStorage.removeItem('wardrobe_items');
    localStorage.removeItem('saved_outfits');
  };

  // Handler: Load sample demo clothes if requested
  const handleLoadDemoWardrobe = () => {
    setWardrobe(DEMO_WARDROBE);
    if (DEMO_WARDROBE.length > 0) {
      setPairingGarmentId(DEMO_WARDROBE[0].id);
      setDressingRoomGarments({
        top: DEMO_WARDROBE.find(g => g.id === 'top-1'),
        bottom: DEMO_WARDROBE.find(g => g.id === 'bottom-1'),
        footwear: DEMO_WARDROBE.find(g => g.id === 'shoe-1'),
      });
    }
  };

  // Handler: Import Garments Extracted from Google Photos
  const handleImportFromGooglePhotos = (newGarments: Garment[]) => {
    const normalized = newGarments.map(g => ({
      ...g,
      imageUrl: normalizeImageUrl(g.imageUrl),
    }));
    setWardrobe(prev => [...normalized, ...prev]);
  };

  // Handler: Save / Unsave Outfit
  const handleToggleSaveOutfit = (outfit: OutfitPair) => {
    if (savedOutfits.some(o => o.id === outfit.id)) {
      setSavedOutfits(prev => prev.filter(o => o.id !== outfit.id));
    } else {
      setSavedOutfits(prev => [outfit, ...prev]);
    }
  };

  // Handler: Remove Garment from active dressing room
  const handleRemoveDressingRoomGarment = (category: keyof typeof dressingRoomGarments) => {
    setDressingRoomGarments(prev => {
      const copy = { ...prev };
      delete copy[category];
      return copy;
    });
  };

  return (
    <div className="min-h-screen bg-[#0C0C10] text-[#E8E6E3] flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wardrobeCount={wardrobe.length}
        savedLooksCount={savedOutfits.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'wardrobe' && (
          <WardrobeView
            wardrobe={wardrobe}
            onSelectForTryOn={handleSelectForTryOn}
            onSelectForPairing={handleSelectForPairing}
            onToggleFavorite={handleToggleFavorite}
            onDeleteGarment={handleDeleteGarment}
            onAddNewGarment={handleAddNewGarment}
            onUpdateWardrobe={setWardrobe}
            onClearAllWardrobe={handleClearAllWardrobe}
            onLoadDemoWardrobe={handleLoadDemoWardrobe}
          />
        )}

        {activeTab === 'occasion' && (
          <OccasionStylist
            wardrobe={wardrobe}
            onTryOnOutfit={handleTryOnOutfit}
            savedOutfits={savedOutfits}
            onToggleSaveOutfit={handleToggleSaveOutfit}
            onNavigateToWardrobe={() => setActiveTab('wardrobe')}
          />
        )}

        {activeTab === 'pair' && (
          <PairThisItem
            wardrobe={wardrobe}
            onTryOnOutfit={handleTryOnOutfit}
            selectedGarmentId={pairingGarmentId}
            onNavigateToWardrobe={() => setActiveTab('wardrobe')}
          />
        )}

        {activeTab === 'dressing_room' && (
          <DressingRoom360
            currentOutfit={dressingRoomOutfit}
            selectedGarments={dressingRoomGarments}
            onRemoveGarment={handleRemoveDressingRoomGarment}
            onSelectAlternative={(category) => {
              setActiveTab('wardrobe');
            }}
          />
        )}

        {activeTab === 'google_photos' && (
          <GooglePhotosScanner
            onImportGarments={handleImportFromGooglePhotos}
            onNavigateToWardrobe={() => setActiveTab('wardrobe')}
          />
        )}
      </main>

      {/* AI Stylist Assistant Chat Concierge */}
      <AiStylistChat wardrobe={wardrobe} />

      {/* Minimalist Footer */}
      <footer className="border-t border-white/5 py-6 px-4 text-center text-xs text-stone-500 font-mono">
        CLOSET AI • Intelligent Wardrobe Digitization & 360° Multi-Angle Dressing Room Atelier
      </footer>
    </div>
  );
}

export default App;
