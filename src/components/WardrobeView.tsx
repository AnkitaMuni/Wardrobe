import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Garment, GarmentCategory, OccasionType } from '../types';
import { processDroppedImage, guessCategoryAndNameFromFilename, normalizeImageUrl } from '../utils/imageUtils';
import { filterAndDeduplicateGarments } from '../utils/photoIntelligence';
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
  Layers, 
  Upload, 
  Image as ImageIcon, 
  AlertCircle,
  X,
  ArrowRight,
  RefreshCw,
  FolderOpen,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WardrobeViewProps {
  wardrobe: Garment[];
  onSelectForTryOn: (garment: Garment) => void;
  onSelectForPairing: (garmentId: string) => void;
  onToggleFavorite: (garmentId: string) => void;
  onDeleteGarment: (garmentId: string) => void;
  onAddNewGarment: (garment: Garment) => void;
  onUpdateWardrobe?: (cleaned: Garment[]) => void;
  onClearAllWardrobe: () => void;
  onLoadDemoWardrobe: () => void;
}

export const WardrobeView: React.FC<WardrobeViewProps> = ({
  wardrobe,
  onSelectForTryOn,
  onSelectForPairing,
  onToggleFavorite,
  onDeleteGarment,
  onAddNewGarment,
  onUpdateWardrobe,
  onClearAllWardrobe,
  onLoadDemoWardrobe,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState<boolean>(false);
  const [processingStatusText, setProcessingStatusText] = useState<string>('');
  const [recentlyAddedCount, setRecentlyAddedCount] = useState<number>(0);
  const [dropErrorNotice, setDropErrorNotice] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // AI Cleaning & Deduplication State
  const [isCleaningWardrobe, setIsCleaningWardrobe] = useState<boolean>(false);
  const [cleanProgressText, setCleanProgressText] = useState<string>('');
  const [cleanSummary, setCleanSummary] = useState<{ groupRemoved: number; duplicatesMerged: number } | null>(null);

  // Garment being actively edited/tagged in modal
  const [editingGarment, setEditingGarment] = useState<Garment | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef<number>(0);

  const handleAutoCleanWardrobe = async () => {
    if (wardrobe.length === 0 || isCleaningWardrobe) return;
    setIsCleaningWardrobe(true);
    setCleanSummary(null);
    setCleanProgressText('Preparing photos for AI face & outfit analysis...');

    try {
      const { cleanedGarments, groupPhotosRemoved, duplicateDressesMerged } = await filterAndDeduplicateGarments(
        wardrobe,
        {
          filterGroupPhotos: true,
          deduplicateRepeatingDresses: true,
          onProgress: (curr, total) => {
            setCleanProgressText(`Scanning face count & dresses... (${curr}/${total})`);
          },
        }
      );

      if (onUpdateWardrobe) {
        onUpdateWardrobe(cleanedGarments);
      }

      setCleanSummary({
        groupRemoved: groupPhotosRemoved,
        duplicatesMerged: duplicateDressesMerged,
      });

      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#D4AF37', '#FF758F', '#38BDF8'],
      });
    } catch (err) {
      console.error('Failed to auto-clean wardrobe:', err);
    } finally {
      setIsCleaningWardrobe(false);
      setCleanProgressText('');
    }
  };

  const categories: { id: string; label: string; icon: string }[] = [
    { id: 'all', label: 'All Pieces', icon: '✨' },
    { id: 'top', label: 'Tops', icon: '👕' },
    { id: 'bottom', label: 'Bottoms', icon: '👖' },
    { id: 'dress', label: 'Dresses', icon: '👗' },
    { id: 'outerwear', label: 'Outerwear', icon: '🧥' },
    { id: 'footwear', label: 'Footwear', icon: '👟' },
    { id: 'accessory', label: 'Accessories', icon: '👜' },
  ];

  const occasionOptions: { id: OccasionType; label: string }[] = [
    { id: 'casual_brunch', label: 'Casual Brunch' },
    { id: 'beachwear', label: 'Beachwear' },
    { id: 'date_night', label: 'Date Night' },
    { id: 'office', label: 'Office / Formal' },
    { id: 'streetwear', label: 'Streetwear' },
    { id: 'wedding', label: 'Wedding / Gala' },
    { id: 'cocktail', label: 'Cocktail Party' },
    { id: 'airport', label: 'Airport Travel' },
  ];

  // Process incoming files (via drag & drop or file dialog)
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    // Robust image detection: check MIME or filename extension (handles Windows MIME quirks)
    const imageFiles = fileArray.filter(file => {
      if (file.type && file.type.startsWith('image/')) return true;
      return /\.(jpe?g|png|webp|avif|gif|bmp|heic|jfif|svg)$/i.test(file.name);
    });

    if (imageFiles.length === 0) {
      setDropErrorNotice('Please drop valid clothing images (JPG, PNG, WEBP, AVIF, HEIC)');
      setTimeout(() => setDropErrorNotice(null), 4000);
      return;
    }

    setIsProcessingFiles(true);
    setProcessingStatusText(`Adding ${imageFiles.length} item${imageFiles.length > 1 ? 's' : ''} to your closet...`);

    const newGarments: Garment[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      setProcessingStatusText(`Processing ${i + 1}/${imageFiles.length}: "${file.name}"...`);
      try {
        const { dataUrl, dominantColorHex, dominantColorName } = await processDroppedImage(file);
        const { category, subcategory, suggestedName } = guessCategoryAndNameFromFilename(file.name);

        const newGarment: Garment = {
          id: `garment-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: suggestedName || 'Custom Piece',
          category,
          subcategory: subcategory || 'Garment',
          color: dominantColorName || 'Neutral',
          colorHex: dominantColorHex || '#B59D82',
          pattern: 'Solid / Texture',
          material: 'Quality Fabric',
          seasons: ['all-season'],
          occasions: ['casual_brunch'],
          imageUrl: dataUrl,
          source: 'manual',
          tags: ['drag-drop', category, (subcategory || 'piece').toLowerCase()],
          timesWorn: 0,
          isFavorite: false,
          createdAt: new Date().toISOString().split('T')[0],
        };

        newGarments.push(newGarment);
      } catch (err) {
        console.error('Failed to process image:', file.name, err);
      }
    }

    setIsProcessingFiles(false);
    setProcessingStatusText('');

    if (newGarments.length > 0) {
      if (onUpdateWardrobe) {
        onUpdateWardrobe([...newGarments, ...wardrobe]);
      } else {
        newGarments.forEach(g => onAddNewGarment(g));
      }

      setRecentlyAddedCount(newGarments.length);
      setTimeout(() => setRecentlyAddedCount(0), 6000);

      confetti({
        particleCount: Math.min(120, 40 + newGarments.length * 15),
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#D4AF37', '#FF758F', '#38BDF8', '#FFFFFF'],
      });
    }
  }, [wardrobe, onUpdateWardrobe, onAddNewGarment]);

  // Keep a stable ref so window drag event listeners don't need reattachment
  const handleFilesRef = useRef(handleFiles);
  handleFilesRef.current = handleFiles;

  // Window-level drag-and-drop listener to prevent browser file navigation and capture drops anywhere
  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.length > 0) {
        setIsDragOver(true);
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
      setIsDragOver(true);
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDragOver(false);
      }
    };

    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await handleFilesRef.current(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  // Filter items in wardrobe
  const filteredItems = wardrobe.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-fade-in relative min-h-[600px]">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Screen-wide Drag Overlay when dragging files anywhere over window */}
      {isDragOver && (
        <div 
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounterRef.current = 0;
            setIsDragOver(false);
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              await handleFilesRef.current(e.dataTransfer.files);
            }
          }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md border-4 border-dashed border-amber-400 flex flex-col items-center justify-center animate-fade-in p-6 cursor-copy"
        >
          <div className="w-24 h-24 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mb-4 animate-bounce shadow-2xl">
            <Upload className="w-12 h-12 stroke-[2.5]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-2">
            Drop Your Clothes Anywhere
          </h2>
          <p className="text-stone-300 text-sm sm:text-base max-w-md text-center">
            Release to instantly add to your digital wardrobe. Colors & categories are extracted automatically!
          </p>
          <div className="mt-4 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Accepts JPG, PNG, WEBP, AVIF, HEIC, etc.</span>
          </div>
        </div>
      )}

      {/* Upload & Drag Processing Status Banner */}
      {isProcessingFiles && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3 animate-pulse shadow-lg">
          <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin flex-shrink-0" />
          <span className="font-medium font-mono">{processingStatusText || 'Adding dropped clothes to your closet...'}</span>
        </div>
      )}

      {/* Instant Ingestion Success Banner */}
      {recentlyAddedCount > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Success!</strong> Added <strong>{recentlyAddedCount}</strong> clothing item{recentlyAddedCount > 1 ? 's' : ''} directly to your wardrobe. Dominant colors & categories were extracted automatically!
            </span>
          </div>
          <button
            onClick={() => setRecentlyAddedCount(0)}
            className="text-stone-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notice */}
      {dropErrorNotice && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{dropErrorNotice}</span>
          </div>
          <button
            onClick={() => setDropErrorNotice(null)}
            className="text-stone-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Drag & Drop Closet Ingestion
          </div>
          <h1 className="font-serif text-3xl font-bold text-white tracking-tight">
            Your Digital Closet
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            {wardrobe.length === 0
              ? 'Your wardrobe is currently empty. Drag & drop images of your clothes below!'
              : `${wardrobe.length} custom garments added. Drag and drop more photos anytime to grow your closet.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {wardrobe.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Remove all clothes to start clean"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Closet</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20"
          >
            <Upload className="w-4 h-4 stroke-[3]" />
            <span>Upload Photos</span>
          </button>
        </div>
      </div>

      {/* AI CLEAN BANNER: FILTER GROUP PICS & MERGE REPEATING DRESSES */}
      {wardrobe.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-[#171725] via-[#1E1926] to-[#14141E] border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl animate-fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-serif tracking-wide">
                  Clean Wardrobe: Single Pics & Distinct Outfits
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  AI Filter
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                Filter out group photos with crowds/friends and merge repeating photos of the same dress into single curated pieces.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleAutoCleanWardrobe}
              disabled={isCleaningWardrobe}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all whitespace-nowrap"
            >
              {isCleaningWardrobe ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  <span className="font-mono">{cleanProgressText || 'Cleaning...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Keep Only My Single Pics & Remove Repeating Dresses</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Clean Success Notice */}
      {cleanSummary && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Clean Complete!</strong> Removed <strong>{cleanSummary.groupRemoved}</strong> group photo(s) and merged <strong>{cleanSummary.duplicatesMerged}</strong> repeating dress photo(s). Kept only your best solo shots!
            </span>
          </div>
          <button
            onClick={() => setCleanSummary(null)}
            className="text-stone-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Drag & Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          dragCounterRef.current = 0;
          setIsDragOver(false);
          if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleFilesRef.current(e.dataTransfer.files);
          }
        }}
        className={`group relative rounded-3xl border-2 border-dashed transition-all cursor-pointer p-8 text-center flex flex-col items-center justify-center overflow-hidden ${
          wardrobe.length === 0
            ? 'bg-gradient-to-b from-[#181824] via-[#14141E] to-[#101016] border-amber-500/50 py-16 shadow-2xl hover:border-amber-400'
            : 'bg-[#14141C]/80 border-white/15 hover:border-amber-500/50 hover:bg-[#181824]'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
          <Upload className="w-8 h-8 stroke-[2]" />
        </div>

        <h3 className="font-serif text-lg md:text-xl font-bold text-white mb-1.5">
          Drag & Drop Images of Your Clothes Here
        </h3>
        <p className="text-xs text-stone-400 max-w-md mx-auto mb-4 leading-relaxed">
          Drop photos from your phone or computer one by one (or select multiple). The AI extracts colors and categories so you can style outfits instantly.
        </p>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-stone-300">
            JPG, PNG, WEBP supported
          </span>
          <span className="text-xs text-amber-400 font-semibold group-hover:underline flex items-center gap-1">
            <FolderOpen className="w-3.5 h-3.5" />
            Browse Files
          </span>
        </div>

        {/* Optional demo loader if wardrobe is empty */}
        {wardrobe.length === 0 && (
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
            <span className="text-xs text-stone-400">Want to test with sample garments first?</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLoadDemoWardrobe();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 border border-white/15 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              Load Sample Demo Clothes
            </button>
          </div>
        )}
      </div>

      {/* Wardrobe Items Display (if items exist) */}
      {wardrobe.length > 0 && (
        <div className="space-y-4">
          {/* Category Filter Pills & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 rounded-2xl bg-[#14141C] border border-white/10">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-black font-bold shadow-md'
                      : 'text-stone-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  {cat.id !== 'all' && (
                    <span className="text-[10px] opacity-70">
                      ({wardrobe.filter(w => w.category === cat.id).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Search your clothes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Garments Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-3xl bg-[#14141C] border border-white/10 hover:border-amber-500/40 transition-all p-3 shadow-lg flex flex-col justify-between"
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-stone-900 mb-2.5">
                  <img
                    src={normalizeImageUrl(item.imageUrl)}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (item.imageUrl.startsWith('/api/image-proxy')) {
                        const orig = decodeURIComponent(item.imageUrl.replace('/api/image-proxy?url=', ''));
                        if (target.src !== orig) {
                          target.src = orig;
                        }
                      }
                    }}
                  />

                  {/* Alternate Angles Badge */}
                  {item.alternatePhotos && item.alternatePhotos.length > 0 && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-black shadow-md backdrop-blur-md flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5" />
                      <span>+{item.alternatePhotos.length} angles</span>
                    </span>
                  )}

                  {/* Favorite Toggle */}
                  <button
                    onClick={() => onToggleFavorite(item.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:text-rose-400 transition-colors"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current text-rose-500' : ''}`}
                    />
                  </button>

                  {/* Color & Subcategory Badge */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-black/80 text-amber-300 backdrop-blur-md truncate max-w-[110px]">
                      {item.subcategory}
                    </span>
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/40 shadow flex-shrink-0"
                      style={{ backgroundColor: item.colorHex }}
                      title={item.color}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-stone-400">
                    <span className="truncate">{item.color}</span>
                    <span>•</span>
                    <span className="capitalize">{item.category}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectForTryOn(item)}
                    className="flex-1 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                    title="Try on in 360°"
                  >
                    <Rotate3d className="w-3 h-3" />
                    <span>Try On</span>
                  </button>

                  <button
                    onClick={() => onSelectForPairing(item.id)}
                    className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 border border-white/10 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                    title="Pair this piece"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Pair</span>
                  </button>

                  <button
                    onClick={() => setEditingGarment(item)}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-amber-300 hover:bg-white/5 transition-colors"
                    title="Edit name, color & category tags"
                  >
                    <Tag className="w-3 h-3" />
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
        </div>
      )}

      {/* EDIT / TAG GARMENT MODAL */}
      {editingGarment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#161622] border border-amber-500/30 rounded-3xl p-6 shadow-2xl animate-fade-in flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Top Bar of Edit Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-white">
                    Edit Garment Details & Tags
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Adjust garment name, category, color, or occasions
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditingGarment(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Form Body */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 mb-5 items-start">
              {/* Image Preview & Color Dot */}
              <div className="sm:col-span-5 flex flex-col items-center">
                <div className="relative aspect-[3/4] w-full max-w-[220px] rounded-2xl overflow-hidden border border-white/15 bg-black shadow-lg">
                  <img
                    src={normalizeImageUrl(editingGarment.imageUrl)}
                    alt={editingGarment.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-black/80 text-amber-300">
                    {editingGarment.category}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <span
                    className="w-4 h-4 rounded-full border border-white/30"
                    style={{ backgroundColor: editingGarment.colorHex }}
                  />
                  <span className="text-xs text-stone-300 font-medium">{editingGarment.color}</span>
                  <input
                    type="color"
                    value={editingGarment.colorHex}
                    onChange={(e) => {
                      setEditingGarment({
                        ...editingGarment,
                        colorHex: e.target.value,
                      });
                    }}
                    className="w-5 h-5 bg-transparent cursor-pointer border-0"
                    title="Change color hex"
                  />
                </div>
              </div>

              {/* Tagging Fields */}
              <div className="sm:col-span-7 space-y-4">
                {/* Garment Name */}
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">
                    Garment Name
                  </label>
                  <input
                    type="text"
                    value={editingGarment.name}
                    onChange={(e) => setEditingGarment({ ...editingGarment, name: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-amber-400 rounded-xl text-xs text-white focus:outline-none"
                    placeholder="e.g. Crisp White Linen Shirt"
                  />
                </div>

                {/* Category Selection Chips */}
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['top', 'bottom', 'dress', 'outerwear', 'footwear', 'accessory'] as GarmentCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEditingGarment({ ...editingGarment, category: cat })}
                        className={`py-1.5 px-2 rounded-xl text-xs font-medium capitalize border transition-all ${
                          editingGarment.category === cat
                            ? 'bg-amber-500 text-black font-bold border-amber-400'
                            : 'bg-white/5 text-stone-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategory / Type */}
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    value={editingGarment.subcategory}
                    onChange={(e) => setEditingGarment({ ...editingGarment, subcategory: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-amber-400 rounded-xl text-xs text-white focus:outline-none"
                    placeholder="e.g. Button-down Shirt, Wide-Leg Pants, Sneaker"
                  />
                </div>

                {/* Material */}
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">
                    Fabric / Material
                  </label>
                  <input
                    type="text"
                    value={editingGarment.material}
                    onChange={(e) => setEditingGarment({ ...editingGarment, material: e.target.value })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 focus:border-amber-400 rounded-xl text-xs text-white focus:outline-none"
                    placeholder="e.g. Linen, 100% Silk, Denim, Wool"
                  />
                </div>

                {/* Occasion Tags */}
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                    Best Occasion
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {occasionOptions.map((occ) => {
                      const isSelected = editingGarment.occasions.includes(occ.id);
                      return (
                        <button
                          key={occ.id}
                          type="button"
                          onClick={() => {
                            const newOccasions = isSelected
                              ? editingGarment.occasions.filter(o => o !== occ.id)
                              : [...editingGarment.occasions, occ.id];
                            setEditingGarment({ ...editingGarment, occasions: newOccasions });
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all border ${
                            isSelected
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                              : 'bg-white/5 text-stone-400 border-white/10 hover:text-stone-200'
                          }`}
                        >
                          {occ.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setEditingGarment(null)}
                className="px-4 py-2.5 rounded-xl text-xs text-stone-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onUpdateWardrobe) {
                    onUpdateWardrobe(wardrobe.map(g => g.id === editingGarment.id ? editingGarment : g));
                  }
                  setEditingGarment(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#181824] border border-red-500/30 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-white mb-2">
              Remove All Existing Clothes?
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed mb-6">
              This will clear your closet completely so you can start dragging and dropping your own clothes from scratch.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllWardrobe();
                  setShowClearConfirm(false);
                }}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
