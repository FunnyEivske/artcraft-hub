const fs = require('fs');
const path = require('path');

function createBMP(width, height, getPixel) {
  const rowSize = width * 3;
  const padding = (4 - (rowSize % 4)) % 4;
  const stride = rowSize + padding;
  const pixelDataSize = stride * height;
  const fileSize = 54 + pixelDataSize;

  const buf = Buffer.alloc(fileSize);

  // File Header (14 bytes)
  buf.write('BM', 0, 2, 'ascii');
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(0, 6);
  buf.writeUInt32LE(54, 10);

  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22); // positive => bottom-up
  buf.writeUInt16LE(1, 26); // planes
  buf.writeUInt16LE(24, 28); // 24-bit
  buf.writeUInt32LE(0, 30); // BI_RGB
  buf.writeUInt32LE(pixelDataSize, 34);
  buf.writeInt32LE(2835, 38);
  buf.writeInt32LE(2835, 42);
  buf.writeUInt32LE(0, 46);
  buf.writeUInt32LE(0, 50);

  // Write pixels (bottom-up: y from height - 1 down to 0)
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(x, y, width, height);
      buf[offset++] = b & 0xff;
      buf[offset++] = g & 0xff;
      buf[offset++] = r & 0xff;
    }
    for (let p = 0; p < padding; p++) {
      buf[offset++] = 0;
    }
  }

  return buf;
}

const rootDir = process.cwd();
const wixDir = path.join(rootDir, 'src-tauri', 'wix');
const nsisDir = path.join(rootDir, 'src-tauri', 'nsis');
fs.mkdirSync(wixDir, { recursive: true });
fs.mkdirSync(nsisDir, { recursive: true });

// --- 1. WiX Dialog Bitmap (493 x 312) ---
// Left 164 px: Dark sleek OpenArt Hub banner
// Right 329 px: White (#FFFFFF) so WiX black text renders perfectly
const wixDialog = createBMP(493, 312, (x, y, w, h) => {
  if (x >= 164) {
    return [255, 255, 255];
  }

  const grad = y / h;
  let r = 16 + Math.round(grad * 12);
  let g = 20 + Math.round(grad * 14);
  let b = 34 + Math.round(grad * 22);

  if (x === 163) return [210, 215, 225];
  if (x === 162) return [60, 68, 92];

  const cx = 82;
  const cy = 110;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 54 && dist >= 38) {
    const alpha = (54 - dist) / 16;
    r = Math.min(255, r + Math.round(alpha * 40));
    g = Math.min(255, g + Math.round(alpha * 70));
    b = Math.min(255, b + Math.round(alpha * 120));
  }

  if (dist <= 38 && dist >= 26) {
    const angle = Math.atan2(dy, dx);
    const t = (angle + Math.PI) / (2 * Math.PI);
    if (t < 0.33) {
      const lt = t / 0.33;
      return [Math.round(56 + lt * (99 - 56)), Math.round(189 + lt * (102 - 189)), Math.round(248 + lt * (241 - 248))];
    } else if (t < 0.66) {
      const lt = (t - 0.33) / 0.33;
      return [Math.round(99 + lt * (236 - 99)), Math.round(102 + lt * (72 - 102)), Math.round(241 + lt * (153 - 241))];
    } else {
      const lt = (t - 0.66) / 0.34;
      return [Math.round(236 + lt * (245 - 236)), Math.round(72 + lt * (158 - 72)), Math.round(153 + lt * (11 - 153))];
    }
  }

  if (dist < 26) {
    const coreGrad = dist / 26;
    return [Math.round(24 + coreGrad * 20), Math.round(28 + coreGrad * 25), Math.round(48 + coreGrad * 35)];
  }

  if (Math.abs(dx) + Math.abs(dy) <= 12) {
    const diamondAlpha = 1 - (Math.abs(dx) + Math.abs(dy)) / 12;
    return [
      Math.min(255, Math.round(56 + diamondAlpha * 199)),
      Math.min(255, Math.round(189 + diamondAlpha * 66)),
      255
    ];
  }

  if (y > 230 && y < 290) {
    const intensity = Math.sin(((y - 230) / 60) * Math.PI) * 0.15;
    r = Math.min(255, r + Math.round(intensity * 99));
    g = Math.min(255, g + Math.round(intensity * 102));
    b = Math.min(255, b + Math.round(intensity * 241));
  }

  return [r, g, b];
});
fs.writeFileSync(path.join(wixDir, 'dialog.bmp'), wixDialog);

// --- 2. WiX Top Banner (493 x 58) ---
const wixBanner = createBMP(493, 58, (x, y, w, h) => {
  if (y >= 56) return [215, 220, 230];
  if (y === 55) return [235, 238, 245];

  let r = 250;
  let g = 251;
  let b = 253;

  const cx = 450;
  const cy = 28;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= 20 && dist >= 13) {
    const angle = Math.atan2(dy, dx);
    const t = (angle + Math.PI) / (2 * Math.PI);
    if (t < 0.5) {
      return [56, 189, 248];
    } else {
      return [99, 102, 241];
    }
  }

  if (dist < 13) {
    return [26, 32, 54];
  }

  if (Math.abs(dx) + Math.abs(dy) <= 6) {
    return [245, 158, 11];
  }

  return [r, g, b];
});
fs.writeFileSync(path.join(wixDir, 'banner.bmp'), wixBanner);

// --- 3. NSIS Sidebar Bitmap (164 x 314) ---
const nsisSidebar = createBMP(164, 314, (x, y, w, h) => {
  const grad = y / h;
  let r = 16 + Math.round(grad * 14);
  let g = 20 + Math.round(grad * 16);
  let b = 34 + Math.round(grad * 26);

  if (x >= 162) return [45, 52, 75];

  const cx = 82;
  const cy = 110;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= 38 && dist >= 26) {
    const angle = Math.atan2(dy, dx);
    const t = (angle + Math.PI) / (2 * Math.PI);
    if (t < 0.33) {
      return [56, 189, 248];
    } else if (t < 0.66) {
      return [99, 102, 241];
    } else {
      return [236, 72, 153];
    }
  }

  if (dist < 26) {
    return [24, 28, 48];
  }

  if (Math.abs(dx) + Math.abs(dy) <= 12) {
    return [255, 255, 255];
  }

  return [r, g, b];
});
fs.writeFileSync(path.join(nsisDir, 'sidebar.bmp'), nsisSidebar);

// --- 4. NSIS Header Bitmap (150 x 57) ---
const nsisHeader = createBMP(150, 57, (x, y, w, h) => {
  if (y >= 55) return [215, 220, 230];

  let r = 250;
  let g = 251;
  let b = 253;

  const cx = 115;
  const cy = 28;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= 18 && dist >= 11) {
    return [99, 102, 241];
  }
  if (dist < 11) {
    return [24, 28, 48];
  }
  if (Math.abs(dx) + Math.abs(dy) <= 5) {
    return [245, 158, 11];
  }

  return [r, g, b];
});
fs.writeFileSync(path.join(nsisDir, 'header.bmp'), nsisHeader);

console.log('Successfully created installer bitmaps.');
