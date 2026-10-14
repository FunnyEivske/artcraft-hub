# OpenArt Hub (`artcraft-hub`)

<div align="center">

<img src="./src-tauri/icons/128x128.png" alt="OpenArt Hub Logo" width="128" height="128" />

### Modern, Privacy-First Creative Suite Desktop Hub
**A free, open-source alternative to proprietary creative cloud launchers.**  
Manage, launch, and collaborate across 9 open-source creative studios with seamless cross-app workflows.

[![Latest Release](https://img.shields.io/github/v/release/FunnyEivske/artcraft-hub?style=for-the-badge&color=6366f1&logo=github)](https://github.com/FunnyEivske/artcraft-hub/releases/latest)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-38bdf8?style=for-the-badge&logo=linux)](https://github.com/FunnyEivske/artcraft-hub/releases/latest)
[![Built with Tauri v2](https://img.shields.io/badge/Built%20with-Tauri%20v2%20(Rust)-ea580c?style=for-the-badge&logo=tauri)](https://tauri.app)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![License](https://img.shields.io/badge/License-Non--Commercial-orange?style=for-the-badge)](LICENSE)

</div>

---

## 📥 Download OpenArt Hub

Download the latest stable release (**v1.0.0**) for your operating system:

<div align="center">

| Operating System | Architecture | File Format | Direct Download Button |
| :--- | :--- | :--- | :---: |
| 🪟 **Windows** | 64-bit (`x64`) | `.exe` Installer | [![Download Windows](https://img.shields.io/badge/Download-Windows_EXE-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/FunnyEivske/artcraft-hub/releases/download/v1.0.0/OpenArt.Hub_1.0.0_x64-setup.exe) |
| 🪟 **Windows (MSI)** | 64-bit (`x64`) | `.msi` Package | [![Download MSI](https://img.shields.io/badge/Download-Windows_MSI-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/FunnyEivske/artcraft-hub/releases/download/v1.0.0/OpenArt.Hub_1.0.0_x64_en-US.msi) |
| 🍏 **macOS** | Apple Silicon (`M1/M2/M3/M4`) | `.dmg` Disk Image | [![Download Apple Silicon](https://img.shields.io/badge/Download-macOS_Apple_Silicon-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/FunnyEivske/artcraft-hub/releases/download/v1.0.0/OpenArt.Hub_1.0.0_aarch64.dmg) |
| 🍏 **macOS** | Intel (`x86_64`) | `.dmg` Disk Image | [![Download Intel Mac](https://img.shields.io/badge/Download-macOS_Intel-555555?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/FunnyEivske/artcraft-hub/releases/download/v1.0.0/OpenArt.Hub_1.0.0_x64.dmg) |
| 🐧 **Linux** | Universal (`x86_64`) | `.AppImage` | [![Download AppImage](https://img.shields.io/badge/Download-Linux_AppImage-FCC624?style=for-the-badge&logo=linux&logoColor=black)](https://github.com/FunnyEivske/artcraft-hub/releases/download/v1.0.0/OpenArt.Hub_1.0.0_amd64.AppImage) |
| 🐧 **Linux (Debian/Ubuntu)** | 64-bit (`amd64`) | `.deb` Package | [![Download DEB](https://img.shields.io/badge/Download-Ubuntu%2FDebian_DEB-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)](https://github.com/FunnyEivske/artcraft-hub/releases/download/v1.0.0/OpenArt.Hub_1.0.0_amd64.deb) |
| 🐧 **Linux (Fedora/RHEL)** | 64-bit (`x86_64`) | `.rpm` Package | [![Download RPM](https://img.shields.io/badge/Download-Fedora_RPM-51A2DA?style=for-the-badge&logo=fedora&logoColor=white)](https://github.com/FunnyEivske/artcraft-hub/releases/download/v1.0.0/OpenArt.Hub-1.0.0-1.x86_64.rpm) |

👉 **[View All Release Assets and Checksums on GitHub](https://github.com/FunnyEivske/artcraft-hub/releases/latest)**

</div>

---

## 🎨 The 9 ArtCraft Creative Studios

OpenArt Hub acts as the centralized launcher, updater, and file bridge for the 9 independent creative applications from the [`storytold`](https://github.com/storytold) organization:

| Studio | Name | Category | Alternative To | Supported File Formats | Accent |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **`photocraft`** | **PhotoCraft** | Photo & Pixel | Adobe Photoshop | `.png`, `.jpg`, `.jpeg`, `.webp`, `.psd` | `Sky Cyan` |
| **`vectorcraft`** | **VectorCraft** | Vector & Pattern | Adobe Illustrator | `.svg`, `.eps`, `.ai` | `Amber Glow` |
| **`filmcraft`** | **FilmCraft** | Video Production | Adobe Premiere Pro | `.mp4`, `.mov`, `.mkv`, `.webm` | `Neon Rose` |
| **`lightcraft`** | **LightCraft** | RAW & Color Grading | Adobe Lightroom | `.raw`, `.cr2`, `.nef`, `.dng`, `.jpg` | `Teal Light` |
| **`pdfcraft`** | **PdfCraft** | Document & Forms | Adobe Acrobat Pro | `.pdf` | `Crimson Red` |
| **`effectcraft`** | **EffectCraft** | VFX & Motion Graphics | Adobe After Effects | `.mp4`, `.mov`, `.json`, `.mg` | `Purple Glow` |
| **`designcraft`** | **DesignCraft** | Layout & Publishing | Adobe InDesign | `.pdf`, `.svg`, `.idml` | `Ruby Rose` |
| **`figcraft`** | **FigCraft** | UI/UX & Prototyping | Figma | `.svg`, `.png`, `.fig`, `.json` | `Emerald UI` |
| **`soundcraft`** | **SoundCraft** | Audio & Mastering | Adobe Audition | `.wav`, `.mp3`, `.flac`, `.ogg`, `.aac` | `Indigo Wave` |

---

## ✨ Key Features

### 1. Unified App Hub & Package Manager
- **Zero telemetry & local first:** No forced cloud accounts, no subscription lock-ins.
- **GitHub Release Integration:** Automatically checks `storytold/<app_id>` repository releases in real-time.
- **Dual-Engine Execution:** Choose between running apps as high-performance **Native Desktop Binaries** or sandboxed **In-Hub WebAssembly Studios**.
- **Real-Time Progress Streams:** Live download and extraction progress bars powered by Tauri v2 event streams.

### 2. Smart Projects & Cross-App "Send To..." Pipeline
- **Standardized Creative Folder Hierarchy:**
  - `01_References/`: Project briefs, reference art, moodboards, and notes.
  - `02_Vectors_and_Patterns/`: SVGs, logos, vector icons, patterns.
  - `03_Photos_and_Textures/`: RAW photos, textures, mockups, raster graphics.
  - `04_Audio_and_Video/`: Voiceovers, Foley sounds, background music, raw footage.
  - `05_Exports/`: Final printable PDFs, 4K videos, web assets.
  - `project.artcraft.json`: Project manifest with recommended app pairings.
- **Intelligent File Routing:** Click **"Send To..."** on any file in any project folder to immediately launch the optimal studio with the file pre-loaded.

### 3. Global Asset Bank & Color Palettes
- Centralized color palette management saved locally at `~/ArtCraftHub/Assets/palettes.json`.
- 1-click clipboard copy for **HEX** and **RGB** values.
- Instant export to **CSS Custom Properties (`:root`)** ready for web and UI design.
- Built-in curated palettes: *ArtCraft Signature*, *Cyberpunk Glow*, *Nordic Minimalist*, and *Warm Sunset Editorial*.

### 4. Interactive In-Hub WebAssembly Studio
- Built-in live canvas sandbox directly inside the hub.
- Draw, test brush sizes, create color sketches, and export quick PNG snapshots without opening external editors.

---

## 🛠️ Technology Stack

- **Core Framework:** [Tauri v2](https://tauri.app/) (Rust backend for ultra-low memory footprint and native performance)
- **Frontend:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with custom dark-mode glassmorphic aesthetics
- **Icons:** [Lucide React](https://lucide.dev/)
- **Cross-Platform Release Automation:** [GitHub Actions](https://github.com/features/actions) with multi-target runners for Windows (`x86_64-pc-windows-msvc`), macOS (`aarch64` & `x86_64`), and Linux (`x86_64-unknown-linux-gnu`).

---

## 🚀 Development & Building from Source

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or v22 recommended)
- [Rust & Cargo](https://rustup.rs/) (stable toolchain)
- **Platform-specific dependencies:**
  - **Windows:** Visual Studio C++ Build Tools (Desktop development with C++)
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Linux (Ubuntu/Debian):**
    ```bash
    sudo apt update
    sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libappindicator3-dev librsvg2-dev patchelf
    ```

### Setup & Run Locally
```bash
# Clone the repository
git clone https://github.com/FunnyEivske/artcraft-hub.git
cd artcraft-hub

# Install npm dependencies
npm install

# Run frontend in development mode
npm run dev

# Run full Desktop Hub with hot reload
npx tauri dev

# Build production bundle for your current OS
npm run build
npx tauri build
```

---

## 📄 License & Intellectual Property

This project is licensed under a **Source-Available Non-Commercial License** — free for personal, educational, and academic use only.

> [!CAUTION]
> ### ⛔ Commercial Use Strictly Prohibited
> **Commercial use, monetization, sublicensing, or business redistribution of this software, binaries, source code, or derivative works is strictly prohibited by anyone other than the author, unless explicit prior written permission and an official commercial license have been granted directly by the copyright holder.**

For commercial licensing inquiries or permission requests, please contact the author via [GitHub](https://github.com/FunnyEivske/artcraft-hub).

See the full [LICENSE](LICENSE) file for exact legal terms and conditions.

---

## ⚖️ Credits & Trademark Notices

- **Creative Studios:** The 9 individual creative studio tools (PhotoCraft, VectorCraft, FilmCraft, LightCraft, PdfCraft, EffectCraft, DesignCraft, FigCraft, and SoundCraft) are developed under the `storytold` open-source organization and are licensed under their respective open-source licenses (MIT and/or Apache-2.0). OpenArt Hub acts as an independent orchestrator and launcher that interfaces with their public releases.
- **Third-Party Trademarks:** Adobe, Photoshop, Illustrator, Premiere Pro, Lightroom, Acrobat, After Effects, InDesign, and Figma are trademarks or registered trademarks of their respective holders in the United States and other countries. OpenArt Hub is an independent project and is not affiliated with, sponsored by, or endorsed by Adobe Inc. or Figma Inc. These product names are referenced solely to describe workflow compatibility.

<div align="center">
Copyright © 2026 FunnyEivske. All rights reserved for commercial use.
</div>
