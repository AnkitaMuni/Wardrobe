import { GooglePhotoItem } from '../types';

export const SAMPLE_GOOGLE_PHOTOS: GooglePhotoItem[] = [
  {
    id: 'gphoto-1',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    caption: 'Santorini Sunset Beachwalk',
    date: 'July 14, 2025',
    location: 'Santorini, Greece',
    faceDetected: true,
    faceConfidence: 0.98,
    faceBbox: { x: 44, y: 18, width: 12, height: 16 },
    detectedGarments: [
      {
        id: 'det-top-1',
        name: 'Breezy Crisp Linen Shirt',
        category: 'top',
        subcategory: 'Linen Shirt',
        color: 'Ivory White',
        colorHex: '#F8F6F0',
        material: 'French Linen',
        occasions: ['beachwear', 'casual_brunch'],
        confidence: 0.96,
        bbox: { x: 38, y: 32, width: 24, height: 28 },
        flatLayUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'det-bot-1',
        name: 'Pleated Sand Linen Trousers',
        category: 'bottom',
        subcategory: 'Wide-Leg Pants',
        color: 'Sand Beige',
        colorHex: '#D5C4A1',
        material: 'Linen Blend',
        occasions: ['beachwear', 'casual_brunch'],
        confidence: 0.94,
        bbox: { x: 40, y: 58, width: 20, height: 32 },
        flatLayUrl: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'det-acc-1',
        name: 'Handwoven Wicker Basket Tote',
        category: 'accessory',
        subcategory: 'Tote Bag',
        color: 'Natural Straw',
        colorHex: '#D1B48C',
        material: 'Palm Leaf & Calfskin',
        occasions: ['beachwear', 'casual_brunch'],
        confidence: 0.92,
        bbox: { x: 58, y: 52, width: 18, height: 22 },
        flatLayUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80'
      }
    ]
  },
  {
    id: 'gphoto-2',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    caption: 'Weekend Rooftop Brunch with Friends',
    date: 'September 22, 2025',
    location: 'SoHo, New York',
    faceDetected: true,
    faceConfidence: 0.99,
    faceBbox: { x: 46, y: 15, width: 14, height: 18 },
    detectedGarments: [
      {
        id: 'det-top-2',
        name: 'Sage Olive Camp Collar Polo',
        category: 'top',
        subcategory: 'Knit Polo',
        color: 'Sage Olive',
        colorHex: '#7A8B7B',
        material: 'Organic Cotton Knit',
        occasions: ['casual_brunch', 'beachwear'],
        confidence: 0.97,
        bbox: { x: 41, y: 31, width: 22, height: 26 },
        flatLayUrl: 'https://images.unsplash.com/photo-1625910513413-57a58a6fcf78?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'det-bot-2',
        name: 'Relaxed Drawstring Linen Shorts',
        category: 'bottom',
        subcategory: 'Linen Shorts',
        color: 'Terracotta Rust',
        colorHex: '#A2583E',
        material: 'Pure Washed Linen',
        occasions: ['beachwear', 'casual_brunch'],
        confidence: 0.91,
        bbox: { x: 43, y: 56, width: 19, height: 24 },
        flatLayUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=600&q=80'
      }
    ]
  },
  {
    id: 'gphoto-3',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
    caption: 'Milan Design Week Cocktail Reception',
    date: 'October 8, 2025',
    location: 'Milan, Italy',
    faceDetected: true,
    faceConfidence: 0.97,
    faceBbox: { x: 45, y: 12, width: 11, height: 15 },
    detectedGarments: [
      {
        id: 'det-top-3',
        name: 'Mulberry Silk Champagne Blouse',
        category: 'top',
        subcategory: 'Silk Blouse',
        color: 'Champagne Gold',
        colorHex: '#E6D7B9',
        material: 'Mulberry Silk',
        occasions: ['cocktail', 'date_night', 'wedding'],
        confidence: 0.98,
        bbox: { x: 40, y: 26, width: 23, height: 29 },
        flatLayUrl: 'https://images.unsplash.com/photo-1551803091-e20673f15770?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'det-bot-3',
        name: 'Bias-Cut Silk Slip Midi Skirt',
        category: 'bottom',
        subcategory: 'Midi Skirt',
        color: 'Champagne Olive',
        colorHex: '#848C74',
        material: 'Silk Satin',
        occasions: ['date_night', 'cocktail'],
        confidence: 0.93,
        bbox: { x: 42, y: 54, width: 21, height: 38 },
        flatLayUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80'
      }
    ]
  }
];
