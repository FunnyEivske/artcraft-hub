# OpenArt Hub (`artcraft-hub`)

<div align="center">

<img src="./src-tauri/icons/128x128.png" alt="OpenArt Hub Logo" width="128" height="128" />

### Modern, Privacy-First Creative Suite Desktop Hub
**A free, open-source alternative to proprietary creative cloud launchers.**  
Manage, launch, and collaborate across 9 open-source creative studios, Blender 3D, and Krita with seamless cross-app workflows.

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

## 🎨 Supported Creative Tools & Studios

OpenArt Hub acts as the centralized launcher, updater, workspace organizer, and file bridge for **Blender 3D**, **Krita**, and the **9 ArtCraft Creative Studios** from the [`storytold`](https://github.com/storytold) organization:

| Tool / Studio | Name | Category | Alternative To | Supported File Formats | Accent Color |
| :--- | :--- | :--- | :--- | :--- | :---: |
| 🧊 **`blender`** | **Blender** | 3D, VFX & Animation | Autodesk Maya / 3ds Max | `.blend`, `.fbx`, `.obj`, `.gltf`, `.glb`, `.stl` | `Orange Flame` |
| 🎨 **`krita`** | **Krita** | Digital Painting & 2D | Photoshop / Corel Painter | `.kra`, `.ora`, `.clip`, `.psd`, `.png` | `Sky Blue` |
| 📸 **`photocraft`** | **PhotoCraft** | Photo & Pixel | Adobe Photoshop | `.png`, `.jpg`, `.jpeg`, `.webp`, `.psd` | `Sky Cyan` |
| ✒️ **`vectorcraft`** | **VectorCraft** | Vector & Pattern | Adobe Illustrator | `.svg`, `.eps`, `.ai` | `Amber Glow` |
| 🎬 **`filmcraft`** | **FilmCraft** | Video Production | Adobe Premiere Pro | `.mp4`, `.mov`, `.mkv`, `.webm` | `Neon Rose` |
| 🎞️ **`lightcraft`** | **LightCraft** | RAW & Color Grading | Adobe Lightroom | `.raw`, `.cr2`, `.nef`, `.dng`, `.jpg` | `Teal Light` |
| 📑 **`pdfcraft`** | **PdfCraft** | Document & Forms | Adobe Acrobat Pro | `.pdf` | `Crimson Red` |
| ✨ **`effectcraft`** | **EffectCraft** | VFX & Motion Graphics | Adobe After Effects | `.mp4`, `.mov`, `.json`, `.exr` | `Purple Glow` |
| 📰 **`designcraft`** | **DesignCraft** | Layout & Publishing | Adobe InDesign | `.pdf`, `.svg`, `.idml` | `Ruby Rose` |
| 📱 **`figcraft`** | **FigCraft** | UI/UX & Prototyping | Figma | `.svg`, `.png`, `.fig`, `.json` | `Emerald UI` |
| 🎧 **`soundcraft`** | **SoundCraft** | Audio & Mastering | Adobe Audition | `.wav`, `.mp3`, `.flac`, `.ogg`, `.aac` | `Indigo Wave` |

---

## ✨ Key Features

### 1. OpenArt Creative Workspace (`Documents/OpenArt`)
Automatically creates and synchronizes a clean, standardized creative folder hierarchy across **Windows, macOS, and Linux**:
- **`OpenArt/Blender/`**: Dedicated environment for 3D creators:
  - `Projects/`: Your individual Blender projects.
  - `Assets/`: Asset libraries, 3D kits, models, and materials.
  - `Textures/`: PBR textures, surface maps, and HDRIs.
  - `Renders/`: Stills, animation output, and sequences.
- **`OpenArt/Textures/`**: Centralized PBR texture library.
- **`OpenArt/Brushes/`**: Krita brush bundles (`.bundle`) and Photoshop/PhotoCraft brushes (`.abr`).
- **`OpenArt/References/`**: Moodboards, concept art, inspiration, and PureRef references.
- **`OpenArt/Projects/`**: General smart projects and creative manifests.
- **`OpenArt/Audio_and_SFX/`**: Sound effects, music tracks, Foley, and voice recordings.
- **`OpenArt/Fonts_and_Vectors/`**: Typography, vector icons, SVG marks, and fonts.
- **Customizable:** Check or uncheck any folder in Settings or during First-Time Setup. Includes an **"Open in File Explorer"** button.

### 2. Dedicated Blender 3D Project Generator
Create production-ready Blender projects in one click with tailored subfolder structures:
- **3D Modelling & Sculpting:** `01_References`, `02_Textures_and_Materials`, `03_HighPoly_Sculpt`, `04_LowPoly_Retopo`, `05_Renders`, `06_Exports_FBX_OBJ`
- **3D Animation & Rigging:** `01_Storyboards_and_References`, `02_Characters_and_Rigs`, `03_Animation_Caches`, `04_Frames_and_Renders`, `05_Audio_and_Voice`, `06_Final_Video`
- **VFX & Physics Simulation:** `01_Footage_and_Plates`, `02_Simulation_Cache_Physics`, `03_Textures_and_Shaders`, `04_Compositing_Nodes`, `05_Renders`
- **Game Assets & Props:** `01_Concept_Art`, `02_HighPoly`, `03_LowPoly`, `04_Baked_PBR_Maps`, `05_Engine_Exports_GLTF_FBX`
- **Live Preview:** See the full folder tree in real-time before creation.
- **Instant Launch:** Automatically opens Blender pointing directly to the new project.

### 3. Native App Discovery & Smart File Scanner
- **Direct Blender & Krita History:** Reads real recent files directly from Blender (`recent-files.txt`) and Krita (`kritarc`) without scanning entire hard drives.
- **Embedded Krita Thumbnail Renderer:** Instantly extracts and displays embedded `.kra` previews via native ZIP byte-streaming.
- **Intelligent Noise Filtering:** Blacklists OS noise, `AppData`, `Temp`, `Windows`, browser caches, hidden files, and tiny image icons (< 15 KB).
- **Custom Watch Folders:** Add any directory or external SSD (e.g. `D:\3D_Work`) for live monitoring.
- **Folder Toggles:** Enable or disable scanning for Pictures, Documents, Desktop, and Downloads.

### 4. In-App Update Center & Release Management
- **Automatic Version Checks:** Live comparison against GitHub Releases for all ArtCraft creative suite tools.
- **Non-Intrusive Update Prompts:** Modal alerts inform you when an installed app has an update ready.
- **Streaming Downloader:** Live download and extraction progress bars powered by Tauri v2 backend events.
- **Bulk Update All:** Update all outdated tools with a single click.

### 5. First-Time Setup (Onboarding Modal)
- Friendly welcome popup on fresh installations allowing users to configure workspace folders and discovery preferences.
- **Update Safe:** Automatically detects existing installations, previous app versions, or projects to ensure existing users are never interrupted upon updating.

### 6. Global Asset Bank & Color Palettes
- Centralized color palette management saved locally at `~/ArtCraftHub/Assets/palettes.json`.
- 1-click clipboard copy for **HEX** and **RGB** values.
- Instant export to **CSS Custom Properties (`:root`)** ready for web and UI design.

---

## 🛠️ Technology Stack

- **Core Framework:** [Tauri v2](https://tauri.app/) (Rust backend for ultra-low memory footprint, fast startup, and native performance)
- **Frontend:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Styling:** Custom dark-mode glassmorphic aesthetics with Tailwind CSS
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

### ⚖️ Trademark, Ownership & Non-Affiliation Disclaimer
> [!NOTE]
> **OpenArt Hub is an independent, open-source desktop management and launching tool.**
> The author (`FunnyEivske`) and OpenArt Hub **do not own, have not modified, and are not affiliated with, sponsored by, or endorsed by** Blender, the Blender Foundation, Krita, the Krita Foundation, Adobe Inc., or any other third-party software, companies, or organizations mentioned.
>
> All registered trademarks, product names, logos, and brands belong exclusively to their respective owners. Any reference to or integration with third-party software is provided solely for convenience, workflow interoperability, and educational purposes.

See the full [LICENSE](LICENSE) file for exact legal terms and conditions.

