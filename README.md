# OpenArt Hub (`artcraft-hub`)

> **En moderne, personvernfokusert "Creative Cloud"-launcher, pakkebehandler og prosjekt-hub for det åpne ArtCraft-økosystemet.**  
> Bygget med **Tauri v2 (Rust)** + **React 18** + **TypeScript** + **Tailwind CSS**.

---

## 🎨 Oversikt over de 9 ArtCraft-studioene

OpenArt Hub styrer, oppdaterer og lanserer følgende 9 frittstående kreative apper fra GitHub-organisasjonen [`storytold`](https://github.com/storytold):

| App | Navn | Kategori | Alternativ til | Støttede filformater |
| :--- | :--- | :--- | :--- | :--- |
| **`photocraft`** | **PhotoCraft** | Foto & Piksel | Adobe Photoshop | `.png`, `.jpg`, `.jpeg`, `.webp`, `.psd` |
| **`vectorcraft`** | **VectorCraft** | Vektor & Mønster | Adobe Illustrator | `.svg`, `.eps`, `.ai` |
| **`filmcraft`** | **FilmCraft** | Video | Adobe Premiere Pro | `.mp4`, `.mov`, `.mkv`, `.webm` |
| **`lightcraft`** | **LightCraft** | RAW & Farge | Adobe Lightroom | `.raw`, `.cr2`, `.nef`, `.dng`, `.jpg` |
| **`pdfcraft`** | **PdfCraft** | Dokument & Mønsterark | Adobe Acrobat Pro | `.pdf` |
| **`effectcraft`** | **EffectCraft** | VFX & Motion | Adobe After Effects | `.mp4`, `.mov`, `.json`, `.mg` |
| **`designcraft`** | **DesignCraft** | Layout & Trykk | Adobe InDesign | `.pdf`, `.svg`, `.idml` |
| **`figcraft`** | **FigCraft** | UI/UX & Prototyping | Figma | `.svg`, `.png`, `.fig`, `.json` |
| **`soundcraft`** | **SoundCraft** | Lyd & Miksing | Adobe Audition | `.wav`, `.mp3`, `.flac`, `.ogg`, `.aac` |

---

## 🚀 Hovedfunksjoner

1. **App Hub (Launcher & Manager):**
   - Sanntids versjonssjekk mot `storytold/<app_id>` releases via GitHub REST API.
   - Ett-klikks valg mellom **"Åpne App (Native)"**, **"Kjør i Hub (WebAssembly)"** og **"Installer / Oppdater"**.
   - Sanntids fremdriftslinje for nedlasting, utpakking og klargjøring via Tauri event-streams.
2. **Smart-Prosjekter & Cross-App Pipeline ("Send til..."):**
   - Opprett nye prosjekter med standardisert 5-delt struktur:
     - `01_References/` (prosjektnotater og inspirasjon)
     - `02_Vectors_and_Patterns/` (SVG, vektor-elementer)
     - `03_Photos_and_Textures/` (bilder, textures, pikselkunst)
     - `04_Audio_and_Video/` (lydspor, råopptak, animasjoner)
     - `05_Exports/` (ferdigstilte trykksaker, videoer og eksportfiler)
     - `project.artcraft.json` (prosjektkonfigurasjon og metadata)
   - Intelligent filruting: Klikk **"Send til..."** på en hvilken som helst fil for å åpne den direkte i kompatible ArtCraft-apper.
3. **Felles Ressursbank & Fargepaletter:**
   - Lagre og administrer globale fargepaletter i `~/ArtCraftHub/Assets/palettes.json`.
   - 1-klikks kopiering av HEX- og RGB-fargekoder til utklippstavlen.
   - Eksport som CSS-variabler (`:root`).
4. **Oppdateringssenter:**
   - Automatisk kontroll av alle 9 apper mot GitHub releases.
   - "Oppdater alle"-knapp for batch-installasjon.
5. **In-Hub WebAssembly Studio:**
   - Interaktivt innebygd lerret som lar deg tegne, skissere og teste funksjoner uten å forlate huben.

---

## 🛠️ Arkitektur & Teknologistabel

- **Backend:** [Tauri v2](https://v2.tauri.app/) (Rust 2021)
  - `reqwest` med `default-features = false` og `rustls-tls` (unngår OpenSSL-kompileringsproblemer på kryssplattformer).
  - `tokio` (asynkron I/O, streaming nedlastinger)
  - `zip` (utpakking av WebAssembly-distribusjoner)
  - `dirs` (plattformuavhengig `~/ArtCraftHub`-hjemmemappe)
- **Frontend:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/)
- **Design & Styling:** [Tailwind CSS](https://tailwindcss.com/) med skreddersydd Adobe Creative Cloud-inspirert Dark Mode, glassmorphism og neon-aksenter.
- **Ikoner:** [Lucide React](https://lucide.dev/)

---

## 📦 Filstruktur på brukerens maskin (`~/ArtCraftHub/`)

```text
~/ArtCraftHub/
├── Apps/                      # Native binærfiler og installerte apper
│   ├── photocraft/
│   ├── vectorcraft/
│   └── ...
├── WebApps/                   # Lokale WebAssembly/HTML5-distribusjoner
│   ├── photocraft/index.html
│   └── ...
├── Projects/                  # Brukerens Smart-Prosjekter
│   └── <Prosjektnavn>/
│       ├── 01_References/
│       ├── 02_Vectors_and_Patterns/
│       ├── 03_Photos_and_Textures/
│       ├── 04_Audio_and_Video/
│       ├── 05_Exports/
│       └── project.artcraft.json
├── Assets/                    # Globale fargepaletter og ressurser
│   └── palettes.json
└── installed_versions.json    # Versjonsregister for installerte apper
```

---

## ⚙️ GitHub Actions Automatisk Release Workflow

Prosjektet inneholder en ferdig konfigurert `.github/workflows/release.yml` som automatisk bygger og publiserer installasjonsfiler:

- **Windows:** `.msi` og `-setup.exe` (via `windows-latest`)
- **macOS:** `.dmg` for både Apple Silicon (`aarch64-apple-darwin`) og Intel Mac (`x86_64-apple-darwin`) (via `macos-latest`)
- **Linux:** `.deb` og `.AppImage` (via `ubuntu-22.04` med GTK4/Webkit2gtk-avhengigheter)
- **Opplasting:** Både til en GitHub Release (`v*`) og som direkte nedlastbare artefakter i Actions-fanen.

---

## 💻 Kjøre og bygge lokalt

### Forutsetninger
- Node.js 18+ og `npm`
- Rust toolchain (`rustup`)

### Utviklingsmodus
```bash
# Installer avhengigheter
npm install

# Start frontend i dev-modus
npm run dev

# Start hele desktop-applikasjonen med Tauri v2
npm run tauri dev
```

### Produksjonsbygg
```bash
# Bygg frontend
npm run build

# Bygg kryssplattform desktop-installasjonspakke
npm run tauri build
```
