import React, { useState } from 'react';
import { SAMPLE_GOOGLE_PHOTOS } from '../data/samplePhotos';
import { GooglePhotoItem, ExtractedGarmentCandidate, Garment } from '../types';
import { 
  Camera, 
  Scan, 
  Sparkles, 
  Check, 
  Plus, 
  CheckCircle2, 
  Image as ImageIcon, 
  Cloud, 
  Layers, 
  RotateCcw,
  Upload,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface GooglePhotosScannerProps {
  onImportGarments: (garments: Garment[]) => void;
}

export const GooglePhotosScanner: React.FC<GooglePhotosScannerProps> = ({
  onImportGarments,
}) => {
  const [photos] = useState<GooglePhotoItem[]>(SAMPLE_GOOGLE_PHOTOS);
  const [selectedPhoto, setSelectedPhoto] = useState<GooglePhotoItem>(SAMPLE_GOOGLE_PHOTOS[0]);
  const [scanStep, setScanStep] = useState<'idle' | 'scanning_face' | 'parsing_clothes' | 'done'>('done');
  const [selectedGarmentIds, setSelectedGarmentIds] = useState<string[]>(
    SAMPLE_GOOGLE_PHOTOS[0].detectedGarments.map(g => g.id)
  );
  const [importedSuccess, setImportedSuccess] = useState<boolean>(false);

  const handleSelectPhoto = (photo: GooglePhotoItem) => {
    setSelectedPhoto(photo);
    setScanStep('scanning_face');
    setImportedSuccess(false);

    // Simulate real-time face detection & clothing segmentation stages
    setTimeout(() => {
      setScanStep('parsing_clothes');
      setTimeout(() => {
        setScanStep('done');
        setSelectedGarmentIds(photo.detectedGarments.map(g => g.id));
      }, 700);
    }, 700);
  };

  const toggleGarmentSelection = (id: string) => {
    if (selectedGarmentIds.includes(id)) {
      setSelectedGarmentIds(selectedGarmentIds.filter(i => i !== id));
    } else {
      setSelectedGarmentIds([...selectedGarmentIds, id]);
    }
  };

  const handleImportToWardrobe = () => {
    const itemsToImport: Garment[] = selectedPhoto.detectedGarments
      .filter(g => selectedGarmentIds.includes(g.id))
      .map(candidate => ({
        id: `extracted-${Date.now()}-${candidate.id}`,
        name: candidate.name,
        category: candidate.category,
        subcategory: candidate.subcategory,
        color: candidate.color,
        colorHex: candidate.colorHex,
        pattern: 'Solid / Texture',
        material: candidate.material,
        seasons: ['summer', 'spring', 'all-season'],
        occasions: candidate.occasions,
        imageUrl: candidate.flatLayUrl,
        source: 'google_photos',
        sourcePhotoUrl: selectedPhoto.imageUrl,
        tags: ['extracted-from-photo', 'ai-segmented', candidate.category],
        timesWorn: 1,
        isFavorite: false,
        createdAt: new Date().toISOString().split('T')[0],
      }));

    onImportGarments(itemsToImport);
    setImportedSuccess(true);
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#D4AF37', '#00E676', '#FFFFFF']
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-8 border border-white/10 bg-gradient-to-r from-[#151520] via-[#1B1B26] to-[#111116] shadow-2xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
            <Cloud className="w-3.5 h-3.5" />
            Connected to Google Photos Library
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-white tracking-tight mb-2">
            Auto-Extract Clothes from Your Photos
          </h1>
          <p className="text-sm text-stone-300 leading-relaxed">
            No more manual photography! The app scans your album, identifies your face, segments the garments you wore across events, cleans them into flat-lay studio shots, and populates your wardrobe.
          </p>
        </div>

        {/* Photo Album Strip */}
        <div className="mt-6">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
            Select Photo from Google Photos Album:
          </p>
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
            {photos.map((photo) => {
              const isSelected = selectedPhoto.id === photo.id;
              return (
                <button
                  key={photo.id}
                  onClick={() => handleSelectPhoto(photo)}
                  className={`relative flex-shrink-0 w-44 rounded-2xl overflow-hidden border text-left transition-all group ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105 shadow-xl'
                      : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-stone-900">
                    <img
                      src={photo.imageUrl}
                      alt={photo.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-2.5 bg-black/80 backdrop-blur-md">
                    <p className="text-[11px] font-semibold text-white truncate">{photo.caption}</p>
                    <p className="text-[10px] text-stone-400">{photo.location}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Interactive Scanner Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Photo with Face & Garment Bounding Box Overlays */}
        <div className="lg:col-span-7 rounded-3xl bg-[#14141C] border border-white/10 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4 text-amber-400" />
              <h2 className="font-serif text-base font-bold text-white">
                Live Face & Garment Segmentation
              </h2>
            </div>
            <span className="text-xs font-mono text-stone-400">
              {selectedPhoto.caption} • {selectedPhoto.date}
            </span>
          </div>

          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/15 bg-black">
            <img
              src={selectedPhoto.imageUrl}
              alt="Subject"
              className="w-full h-full object-cover"
            />

            {/* Face Detection Bounding Box */}
            <div
              className={`absolute border-2 border-emerald-400 rounded-lg pointer-events-none transition-all duration-500 ${
                scanStep === 'scanning_face' ? 'animate-pulse scale-105 shadow-lg shadow-emerald-500/50' : ''
              }`}
              style={{
                left: `${selectedPhoto.faceBbox.x}%`,
                top: `${selectedPhoto.faceBbox.y}%`,
                width: `${selectedPhoto.faceBbox.width}%`,
                height: `${selectedPhoto.faceBbox.height}%`,
              }}
            >
              <div className="absolute -top-6 left-0 bg-emerald-500 text-black font-bold text-[9px] uppercase px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                <UserCheck className="w-2.5 h-2.5" />
                Verified Face ({(selectedPhoto.faceConfidence * 100).toFixed(0)}%)
              </div>
            </div>

            {/* Segmented Garments Bounding Boxes */}
            {scanStep !== 'scanning_face' &&
              selectedPhoto.detectedGarments.map((garment) => {
                const isSelected = selectedGarmentIds.includes(garment.id);
                return (
                  <div
                    key={garment.id}
                    onClick={() => toggleGarmentSelection(garment.id)}
                    className={`absolute border-2 cursor-pointer transition-all rounded-lg ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/40 shadow-xl'
                        : 'border-white/30 bg-black/20 opacity-60'
                    }`}
                    style={{
                      left: `${garment.bbox.x}%`,
                      top: `${garment.bbox.y}%`,
                      width: `${garment.bbox.width}%`,
                      height: `${garment.bbox.height}%`,
                    }}
                  >
                    <div className="absolute -top-6 left-0 bg-amber-500 text-black font-bold text-[9px] uppercase px-1.5 py-0.5 rounded shadow truncate max-w-[140px]">
                      {garment.subcategory} ({(garment.confidence * 100).toFixed(0)}%)
                    </div>
                  </div>
                );
              })}

            {/* Scanning Laser Animation Line */}
            {scanStep === 'parsing_clothes' && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-lg shadow-amber-500/80 animate-bounce" />
            )}
          </div>

          <p className="mt-3 text-[11px] text-stone-400 text-center">
            Click any bounding box above to toggle selection of that garment for wardrobe import.
          </p>
        </div>

        {/* Right Side: Segmented Garments & Flat-Lay Studio Extractor */}
        <div className="lg:col-span-5 rounded-3xl bg-[#14141C] border border-white/10 p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="font-serif text-base font-bold text-white">
                  Extracted Studio Cuts ({selectedPhoto.detectedGarments.length})
                </h3>
              </div>
              <span className="text-xs text-amber-400 font-semibold">
                {selectedGarmentIds.length} Selected
              </span>
            </div>

            {/* Extracted items cards */}
            <div className="space-y-3">
              {selectedPhoto.detectedGarments.map((garment) => {
                const isSelected = selectedGarmentIds.includes(garment.id);
                return (
                  <div
                    key={garment.id}
                    onClick={() => toggleGarmentSelection(garment.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 ring-1 ring-amber-400/30'
                        : 'bg-white/5 border-white/10 hover:border-white/20 opacity-70'
                    }`}
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-900 border border-white/10 flex-shrink-0">
                      <img
                        src={garment.flatLayUrl}
                        alt={garment.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded text-[7px] font-bold uppercase bg-black/80 text-amber-300">
                        Flat Lay
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-bold text-amber-400">
                          {garment.category}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full border border-white/20"
                          style={{ backgroundColor: garment.colorHex }}
                        />
                      </div>
                      <h4 className="text-xs font-semibold text-white truncate">{garment.name}</h4>
                      <p className="text-[11px] text-stone-400 truncate">{garment.material}</p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-amber-500 border-amber-400 text-black'
                          : 'border-white/20 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Import to Closet CTA */}
          <div className="mt-6 pt-4 border-t border-white/10">
            {importedSuccess ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Successfully Added to Your Digital Wardrobe!
              </div>
            ) : (
              <button
                onClick={handleImportToWardrobe}
                disabled={selectedGarmentIds.length === 0}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Import ({selectedGarmentIds.length}) Pieces to Wardrobe</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
