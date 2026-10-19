# 👗 CLOSET AI — Smart Digital Wardrobe & 360° Dressing Room

An intelligent AI-powered digital wardrobe, automated photo garment extractor, and interactive 360° multi-angle virtual dressing room atelier.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Engine-black?logo=three.js)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## ✨ Features

### 1. 🏖️ Occasion-Based Outfit Pairing (5 Paired Options)
- Enter **any occasion** (e.g. *Beachwear & Resort, Casual Brunch, Wedding Gala, Romantic Date Night, Executive Formal, Urban Streetwear, Cocktail Party, Festival*) or type your own custom event (e.g., *"Yacht party in Monaco"*).
- The styling intelligence engine analyzes color harmonies, silhouettes, and fabric weights to generate **5 distinct, fully coordinated outfit options** (Top + Bottom / Dress + Shoes + Outerwear + Accessories).
- Each outfit includes a **Match Score**, **Stylist Assessment Notes**, and **Weather Compatibility**.
- **1-Click Try On:** Instantly dress the 3D model with that exact look.

### 2. 👔 Garment-Centric Smart Pairing Engine
- Choose **any specific hero item** in your closet (e.g., your *Breezy Crisp Linen Shirt*, *Silk Slip Skirt*, or *Cashmere Trench*).
- The pairing engine instantly scans your entire wardrobe and generates **all cohesive outfit combinations** that pair with that anchor piece, ranked by color theory and proportion balance.

### 3. 🔄 360° Multi-Angle Virtual Dressing Room (Atelier 3D)
- **Interactive 3D Turntable:** Drag with your mouse or touch to rotate your avatar smoothly across a complete 360-degree rotation.
- **Dedicated Angle Cameras:** Quick-snap buttons for **Front (0°)**, **3/4 Angle (45°)**, **Profile / Side (90°)**, and **Back View (180°)**, plus an auto-spin turntable mode.
- **Custom Figure Proportions:** Customize body build (*Curvy, Slim, Athletic, Regular*), exact height slider (150cm to 195cm), and skin complexion.
- **Dynamic Garment Draping:** Real-time 3D shaders and materials reflecting fabric textures (linen, silk, denim, wool, leather).
- **Photorealistic Studio VTON Mode:** Toggle between the real-time 3D turntable and high-fashion multi-angle studio renders.

### 4. 📸 Google Photos Face Recognition & Garment Extraction
- Eliminates manual closet photography!
- Simulates scanning your connected Google Photos library:
  - **Biometric Face Verification:** Identifies and crops photos where you are present.
  - **Human Parsing & Garment Segmentation:** Detects bounding boxes for Tops, Bottoms, Dresses, Shoes, and Bags.
  - **Studio Flat-Lay Generator:** Removes noisy backgrounds and converts candid worn items into clean, e-commerce catalog cutouts.
  - **1-Click Wardrobe Ingestion:** Adds extracted pieces into your closet with auto-tagged materials, colors, and occasion metadata.

### 5. 💬 Atelier AI Stylist Concierge
- An interactive AI fashion assistant ready to answer questions like:
  - *"How do I style my linen shirt for evening?"*
  - *"What should I wear for a rainy brunch?"*
  - *"Can I wear navy and black together?"*

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation

```bash
# Clone the repository
git clone https://github.com/AnkitaMuni/Wardrobe.git
cd Wardrobe

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Architecture

- **Frontend Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS with custom glassmorphism and luxury fashion design tokens
- **3D Graphics & Physics:** Three.js (Perspective Camera, Directional Key/Fill/Rim lighting, Dynamic PBR Materials, Mesh Geometries)
- **Icons:** Lucide React
- **Celebration Effects:** Canvas Confetti
- **State & Storage:** LocalStorage state synchronization with reactive hooks

---

## 👤 Author

Developed for **Ankita Muni** • [GitHub Repository](https://github.com/AnkitaMuni/Wardrobe)
