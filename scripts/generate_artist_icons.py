import os
import zipfile
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# 12 Apps & Suites
APPS = [
    {
        "id": "photocraft",
        "name": "PhotoCraft",
        "code": "Pc",
        "category": "Foto & Piksel (Photoshop-alternativ)",
        "hex": "#38bdf8",
        "file": "01_photocraft_Pc"
    },
    {
        "id": "vectorcraft",
        "name": "VectorCraft",
        "code": "Vc",
        "category": "Vektor & Mønster (Illustrator-alternativ)",
        "hex": "#f59e0b",
        "file": "02_vectorcraft_Vc"
    },
    {
        "id": "filmcraft",
        "name": "FilmCraft",
        "code": "Fc",
        "category": "Video & Klipp (Premiere Pro-alternativ)",
        "hex": "#ec4899",
        "file": "03_filmcraft_Fc"
    },
    {
        "id": "lightcraft",
        "name": "LightCraft",
        "code": "Lc",
        "category": "RAW & Farge (Lightroom-alternativ)",
        "hex": "#06b6d4",
        "file": "04_lightcraft_Lc"
    },
    {
        "id": "pdfcraft",
        "name": "PdfCraft",
        "code": "Pdf",
        "category": "Dokument & PDF (Acrobat-alternativ)",
        "hex": "#ef4444",
        "file": "05_pdfcraft_Pdf"
    },
    {
        "id": "effectcraft",
        "name": "EffectCraft",
        "code": "Ec",
        "category": "VFX & Motion (After Effects-alternativ)",
        "hex": "#a855f7",
        "file": "06_effectcraft_Ec"
    },
    {
        "id": "designcraft",
        "name": "DesignCraft",
        "code": "Dc",
        "category": "Publisering & Layout (InDesign-alternativ)",
        "hex": "#e11d48",
        "file": "07_designcraft_Dc"
    },
    {
        "id": "figcraft",
        "name": "FigCraft",
        "code": "Fg",
        "category": "UI/UX & Prototyping (Figma-alternativ)",
        "hex": "#10b981",
        "file": "08_figcraft_Fg"
    },
    {
        "id": "soundcraft",
        "name": "SoundCraft",
        "code": "Sc",
        "category": "Lyd & Miksing (Audition-alternativ)",
        "hex": "#6366f1",
        "file": "09_soundcraft_Sc"
    },
    {
        "id": "blender",
        "name": "Blender",
        "code": "Blender",
        "category": "3D & Animasjon",
        "hex": "#ea580c",
        "file": "10_blender_3D"
    },
    {
        "id": "krita",
        "name": "Krita",
        "code": "Krita",
        "category": "Digital Maling & Konseptkunst",
        "hex": "#0284c7",
        "file": "11_krita_painting"
    },
    {
        "id": "artcraft-hub",
        "name": "OpenArt Hub",
        "code": "Hub",
        "category": "Kreativ Hub & Desktop Manager",
        "hex": "#6366f1",
        "file": "12_openart_hub_logo"
    }
]

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip("#")
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def render_adobe_icon_1024(code, hex_color, out_png_path):
    size = 1024
    scale = 2  # Render at 2048x2048 and downscale for buttery-smooth anti-aliasing
    w = size * scale
    h = size * scale

    accent_rgb = hex_to_rgb(hex_color)

    # Base image
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = 80 * scale
    radius = 180 * scale
    box = [margin, margin, w - margin, h - margin]

    # Draw dark container background with subtle accent tint
    bg_top = (
        int(accent_rgb[0] * 0.18 + 18),
        int(accent_rgb[1] * 0.18 + 20),
        int(accent_rgb[2] * 0.18 + 28),
        255
    )
    bg_bot = (10, 13, 20, 255)

    # Create gradient
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grad)
    for y in range(margin, h - margin):
        t = (y - margin) / (h - 2 * margin)
        r = int(bg_top[0] * (1 - t) + bg_bot[0] * t)
        g = int(bg_top[1] * (1 - t) + bg_bot[1] * t)
        b = int(bg_top[2] * (1 - t) + bg_bot[2] * t)
        g_draw.line([(margin, y), (w - margin, y)], fill=(r, g, b, 255))

    # Mask for rounded rect
    mask = Image.new("L", (w, h), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.rounded_rectangle(box, radius=radius, fill=255)

    img.paste(grad, (0, 0), mask)

    # Outer border glow
    border_width = 30 * scale
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle(box, radius=radius, outline=(accent_rgb[0], accent_rgb[1], accent_rgb[2], 255), width=border_width)

    # Text rendering (Adobe style: 'Pc', 'Vc', etc.)
    font_size = 460 * scale if len(code) <= 2 else 340 * scale
    font = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", font_size)

    # Center text
    bbox = draw.textbbox((0, 0), code, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    text_x = (w - text_w) // 2 - bbox[0]
    text_y = (h - text_h) // 2 - bbox[1] - (20 * scale)

    # Draw subtle text glow
    glow_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    glow_draw.text((text_x, text_y), code, font=font, fill=(accent_rgb[0], accent_rgb[1], accent_rgb[2], 120))
    glow_blurred = glow_img.filter(ImageFilter.GaussianBlur(radius=25 * scale))
    img.paste(glow_blurred, (0, 0), glow_blurred)

    # Crisp text fill
    draw.text((text_x, text_y), code, font=font, fill=(accent_rgb[0], accent_rgb[1], accent_rgb[2], 255))

    # Downscale for ultra-sharp result
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    final_img.save(out_png_path, "PNG")

def render_svg_icon(code, hex_color, out_svg_path):
    is_long = len(code) > 2
    font_size = "130" if is_long else "180"
    y_pos = "58%" if is_long else "61%"
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1024" height="1024">
  <defs>
    <linearGradient id="bg-grad-{code}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{hex_color}" stop-opacity="0.28" />
      <stop offset="100%" stop-color="#090b10" stop-opacity="1" />
    </linearGradient>
    <filter id="glow-{code}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="{hex_color}" flood-opacity="0.45" />
    </filter>
  </defs>
  <rect x="36" y="36" width="440" height="440" rx="100" fill="url(#bg-grad-{code})" stroke="{hex_color}" stroke-width="18" filter="url(#glow-{code})" />
  <text x="50%" y="{y_pos}" text-anchor="middle" dominant-baseline="middle" fill="{hex_color}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="bold" font-size="{font_size}" letter-spacing="-0.03em">
    {code}
  </text>
</svg>"""
    with open(out_svg_path, "w", encoding="utf-8") as f:
        f.write(svg)

def main():
    png_dir = "assets/app-icons/png-1024"
    svg_dir = "assets/app-icons/svg"
    pub_dir = "public/app-icons"

    os.makedirs(png_dir, exist_ok=True)
    os.makedirs(svg_dir, exist_ok=True)
    os.makedirs(pub_dir, exist_ok=True)

    print("Generating 1024x1024 icons for artist...")

    for app in APPS:
        name = app["name"]
        code = app["code"]
        color = app["hex"]
        fname = app["file"]

        png_path = os.path.join(png_dir, f"{fname}.png")
        svg_path = os.path.join(svg_dir, f"{fname}.svg")
        pub_png = os.path.join(pub_dir, f"{fname}.png")

        if app["id"] == "blender":
            # Blender official icon
            src_png = "public/blender.png"
            if os.path.exists(src_png):
                b_img = Image.open(src_png).convert("RGBA")
                b_canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
                # Draw rounded squircle
                m_draw = ImageDraw.Draw(b_canvas)
                m_draw.rounded_rectangle([80, 80, 944, 944], radius=180, fill=(20, 22, 32, 255), outline=(234, 88, 12, 255), width=30)
                # Resize blender logo to center
                b_logo = b_img.resize((640, 640), Image.Resampling.LANCZOS)
                b_canvas.paste(b_logo, (192, 192), b_logo)
                b_canvas.save(png_path, "PNG")
                b_canvas.save(pub_png, "PNG")
            render_svg_icon("BL", color, svg_path)
            print(f"Created {fname} (Blender 3D)")

        elif app["id"] == "krita":
            # Krita official icon 1024x1024
            src_1024 = r"C:\Program Files\Krita (x64)\share\icons\hicolor\1024x1024\apps\krita.png"
            if os.path.exists(src_1024):
                k_img = Image.open(src_1024).convert("RGBA")
                k_canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
                m_draw = ImageDraw.Draw(k_canvas)
                m_draw.rounded_rectangle([80, 80, 944, 944], radius=180, fill=(18, 24, 36, 255), outline=(2, 132, 199, 255), width=30)
                k_logo = k_img.resize((700, 700), Image.Resampling.LANCZOS)
                k_canvas.paste(k_logo, (162, 162), k_logo)
                k_canvas.save(png_path, "PNG")
                k_canvas.save(pub_png, "PNG")
            render_svg_icon("KR", color, svg_path)
            print(f"Created {fname} (Krita)")

        elif app["id"] == "artcraft-hub":
            # Hub Master Icon
            render_adobe_icon_1024("Hub", color, png_path)
            render_adobe_icon_1024("Hub", color, pub_png)
            render_svg_icon("Hub", color, svg_path)
            print(f"Created {fname} (Hub)")

        else:
            # Adobe-style typography icons (Pc, Vc, Fc, etc.)
            render_adobe_icon_1024(code, color, png_path)
            render_adobe_icon_1024(code, color, pub_png)
            render_svg_icon(code, color, svg_path)
            print(f"Created {fname} ({code} - {color})")

    # Generate artist instructions markdown
    readme_path = "assets/app-icons/README_FOR_ARTIST.md"
    readme_content = """# ArtCraft Suite & OpenArt Hub – Ikon-guide for Grafisk Designer / Artist

Denne mappen inneholder alle de offisielle app-ikonene for OpenArt Hub i høyoppløselig **1024x1024 PNG** og skalerbar **SVG**.

## Oversikt over apper, forkortelser og fargekoder (Adobe CC Stil)

| App | 2-Bokstavskode | Hovedfarge | Kategori | Målfilnavn |
|---|---|---|---|---|
| **PhotoCraft** | `Pc` | `#38bdf8` (Sky Cyan) | Foto & Pikselredigering (Photoshop-alternativ) | `01_photocraft_Pc.png` |
| **VectorCraft** | `Vc` | `#f59e0b` (Amber Gold) | Vektorgrafikk & Mønster (Illustrator-alternativ) | `02_vectorcraft_Vc.png` |
| **FilmCraft** | `Fc` | `#ec4899` (Neon Rose) | Ikke-lineær videoredigering (Premiere Pro-alternativ) | `03_filmcraft_Fc.png` |
| **LightCraft** | `Lc` | `#06b6d4` (Electric Turquoise) | RAW-fremkalling & Fargegradering (Lightroom-alternativ) | `04_lightcraft_Lc.png` |
| **PdfCraft** | `Pdf` | `#ef4444` (Vivid Bright Red) | PDF-arbeid, OCR & Skjemautfylling (Acrobat-alternativ) | `05_pdfcraft_Pdf.png` |
| **EffectCraft** | `Ec` | `#a855f7` (Vivid Purple) | Visuelle effekter & Motion Graphics (After Effects-alternativ) | `06_effectcraft_Ec.png` |
| **DesignCraft** | `Dc` | `#e11d48` (Crimson Pink) | Desktop Publishing & Magasiner (InDesign-alternativ) | `07_designcraft_Dc.png` |
| **FigCraft** | `Fg` | `#10b981` (Emerald Green) | UI/UX & Interaktive Prototyper (Figma-alternativ) | `08_figcraft_Fg.png` |
| **SoundCraft** | `Sc` | `#6366f1` (Indigo Core) | DAW Lydredigering & Mastering (Audition-alternativ) | `09_soundcraft_Sc.png` |
| **Blender** | Offisiell | `#ea580c` (Blender Orange) | 3D Modellering, Sculpting & Animasjon | `10_blender_3D.png` |
| **Krita** | Offisiell | `#0284c7` (Krita Blue) | Digital Maling, Konseptkunst & 2D Animasjon | `11_krita_painting.png` |
| **OpenArt Hub** | Hovedikon | `#6366f1` (Signature Gradient) | Hovedprogrammet / Launcher | `12_openart_hub_logo.png` |

---

## Retningslinjer for kunstneren ved levering av nye ikoner:
1. **Oppløsning:** Minst **1024x1024 piksler** i 32-bit PNG med transparent bakgrunn (eller ren SVG-vektor).
2. **Formfaktor:** Avrundet firkant (squircle) med hjørneradius tilsvarende ~20-22% av bredden (ca. 210-225px på et 1024x1024 lerret).
3. **Plassering i prosjektet:** Leverte ikoner kan legges direkte inn i mappen `public/app-icons/` eller `public/` for automatisk innlasting i applikasjonen.
"""
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)

    with open(os.path.join(pub_dir, "README_FOR_ARTIST.md"), "w", encoding="utf-8") as f:
        f.write(readme_content)

    # Create ZIP archive
    zip_root = "artcraft-icons-artist-pack-1024x1024.zip"
    zip_pub = os.path.join(pub_dir, "artcraft-icons-artist-pack-1024x1024.zip")

    for zip_target in [zip_root, zip_pub]:
        with zipfile.ZipFile(zip_target, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk("assets/app-icons"):
                for file in files:
                    full_p = os.path.join(root, file)
                    rel_p = os.path.relpath(full_p, "assets/app-icons")
                    zf.write(full_p, rel_p)

    print("All icons and ZIP packs generated successfully!")

if __name__ == "__main__":
    main()