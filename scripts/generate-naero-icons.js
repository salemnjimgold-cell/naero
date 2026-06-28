// Generate Naero-branded Android icon assets
// Run: node scripts/generate-naero-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, bgR, bgG, bgB, fgR, fgG, fgB, withN = true) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw pixel data
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    rawData[y * rowSize] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const offset = y * rowSize + 1 + x * 3;
      if (withN && _isNLetter(x, y, width, height)) {
        rawData[offset] = fgR;
        rawData[offset + 1] = fgG;
        rawData[offset + 2] = fgB;
      } else if (withN && _isGlow(x, y, width, height)) {
        const glow = 0.3;
        rawData[offset] = Math.round(bgR + (fgR - bgR) * glow);
        rawData[offset + 1] = Math.round(bgG + (fgG - bgG) * glow);
        rawData[offset + 2] = Math.round(bgB + (fgB - bgB) * glow);
      } else {
        rawData[offset] = bgR;
        rawData[offset + 1] = bgG;
        rawData[offset + 2] = bgB;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function _isNLetter(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const nw = w * 0.4;  // N width
  const nh = h * 0.55; // N height
  const lx = cx - nw / 2;
  const rx = cx + nw / 2;
  const ty = cy - nh / 2;
  const by = cy + nh / 2;
  const thickness = Math.max(2, w * 0.06);

  // Left vertical bar
  if (x >= lx - thickness / 2 && x <= lx + thickness / 2 && y >= ty && y <= by) return true;
  // Right vertical bar  
  if (x >= rx - thickness / 2 && x <= rx + thickness / 2 && y >= ty && y <= by) return true;
  // Diagonal
  const diagX = lx + (rx - lx) * ((y - ty) / (by - ty));
  if (x >= diagX - thickness / 2 && x <= diagX + thickness / 2 && y >= ty && y <= by) return true;

  return false;
}

function _isGlow(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nHalfW = w * 0.4;
  const nHalfH = h * 0.55;
  const nDiagonal = Math.sqrt(nHalfW * nHalfW + nHalfH * nHalfH);
  return dist > nDiagonal * 0.8 && dist < nDiagonal * 1.15;
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Naero brand colors
const BG_DARK = [7, 11, 20];     // #070B14
const CYAN = [0, 229, 255];       // #00E5FF
const BLUE = [6, 182, 212];       // #06B6D4

const DENSITIES = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192,
};

const projRoot = path.join(__dirname, '..');

// Generate icon for assets/
console.log('Generating Naero-branded icons...');

// assets/icon.png - main app icon (1024x1024)
const assetsDir = path.join(projRoot, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
fs.writeFileSync(path.join(assetsDir, 'icon.png'), createPNG(1024, 1024, BG_DARK[0], BG_DARK[1], BG_DARK[2], CYAN[0], CYAN[1], CYAN[2]));
console.log('  ✓ assets/icon.png');

// assets/adaptive-icon.png - for adaptive icon foreground
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), createPNG(1024, 1024, 0, 0, 0, CYAN[0], CYAN[1], CYAN[2]));
console.log('  ✓ assets/adaptive-icon.png');

// Generate mipmap icons at each density
for (const [density, size] of Object.entries(DENSITIES)) {
  const mipmapDir = path.join(projRoot, 'android', 'app', 'src', 'main', 'res', `mipmap-${density}`);
  if (!fs.existsSync(mipmapDir)) fs.mkdirSync(mipmapDir, { recursive: true });

  // ic_launcher.webp - since we can't write webp, use PNG renamed (Gradle accepts PNG)
  fs.writeFileSync(path.join(mipmapDir, 'ic_launcher.png'), createPNG(size, size, BG_DARK[0], BG_DARK[1], BG_DARK[2], CYAN[0], CYAN[1], CYAN[2]));
  fs.writeFileSync(path.join(mipmapDir, 'ic_launcher_round.png'), createPNG(size, size, BG_DARK[0], BG_DARK[1], BG_DARK[2], CYAN[0], CYAN[1], CYAN[2]));
  // Foreground for adaptive icon - transparent bg
  fs.writeFileSync(path.join(mipmapDir, 'ic_launcher_foreground.png'), createPNG(size, size, 0, 0, 0, CYAN[0], CYAN[1], CYAN[2], true));
  console.log(`  ✓ mipmap-${density}/ic_launcher*.png (${size}px)`);
}

// Delete old webp files
for (const [density] of Object.entries(DENSITIES)) {
  const mipmapDir = path.join(projRoot, 'android', 'app', 'src', 'main', 'res', `mipmap-${density}`);
  const oldWebp = path.join(mipmapDir, 'ic_launcher.webp');
  const oldRound = path.join(mipmapDir, 'ic_launcher_round.webp');
  const oldFg = path.join(mipmapDir, 'ic_launcher_foreground.webp');
  if (fs.existsSync(oldWebp)) fs.unlinkSync(oldWebp);
  if (fs.existsSync(oldRound)) fs.unlinkSync(oldRound);
  if (fs.existsSync(oldFg)) fs.unlinkSync(oldFg);
}

// Splash logo for drawable densities
const DRAWABLE_DENSITIES = {
  'drawable-hdpi': 72,
  'drawable-mdpi': 48,
  'drawable-xhdpi': 96,
  'drawable-xxhdpi': 144,
  'drawable-xxxhdpi': 192,
};

for (const [density, size] of Object.entries(DRAWABLE_DENSITIES)) {
  const drawableDir = path.join(projRoot, 'android', 'app', 'src', 'main', 'res', density);
  if (!fs.existsSync(drawableDir)) fs.mkdirSync(drawableDir, { recursive: true });
  // Splash screen logo - Naero N on dark bg
  fs.writeFileSync(path.join(drawableDir, 'splashscreen_logo.png'), createPNG(size, size, BG_DARK[0], BG_DARK[1], BG_DARK[2], CYAN[0], CYAN[1], CYAN[2]));
  console.log(`  ✓ ${density}/splashscreen_logo.png (${size}px)`);
}

console.log('\nAll Naero-branded icons generated.');
