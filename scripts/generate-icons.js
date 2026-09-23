import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, bgColor, drawLogo = true) {
  // RGBA buffer
  const rowSize = width * 4 + 1; // +1 filter byte per scanline
  const rawData = Buffer.alloc(rowSize * height);

  const [br, bg, bb] = bgColor;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Check if pixel is inside logo or background
      // Subtle gradient background
      const gradFactor = (y / height) * 0.2;
      let r = Math.min(255, Math.floor(br * (1 - gradFactor)));
      let g = Math.min(255, Math.floor(bg * (1 - gradFactor)));
      let b = Math.min(255, Math.floor(bb * (1 - gradFactor)));
      let a = 255;

      // Draw rounded card inside (safe zone)
      const cx = width / 2;
      const cy = height / 2;
      const radius = width * 0.38;
      const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));

      // Draw an inner glowing disc
      if (dist < radius) {
        // Inner card highlight
        const innerG = Math.max(0, 1 - (dist / radius));
        r = Math.min(255, Math.floor(r + 20 * innerG));
        g = Math.min(255, Math.floor(g + 30 * innerG));
        b = Math.min(255, Math.floor(b + 40 * innerG));
      }

      // Draw "2" and "O" and "S" simple grid/shapes or cross
      // Let's draw horizontal bar & vertical bar accent (accounting balance / ledger symbol)
      const nx = (x - cx) / (width * 0.28);
      const ny = (y - cy) / (height * 0.28);

      // Rounded center badge:
      if (Math.abs(nx) < 0.85 && Math.abs(ny) < 0.85) {
        // Draw crisp '2OS' geometric shapes
        // Box 1: Left '2'
        const is2Top = (nx >= -0.7 && nx <= -0.1 && ny >= -0.6 && ny <= -0.45);
        const is2Right = (nx >= -0.25 && nx <= -0.1 && ny >= -0.6 && ny <= -0.05);
        const is2Mid = (nx >= -0.7 && nx <= -0.1 && ny >= -0.15 && ny <= 0.0);
        const is2Left = (nx >= -0.7 && nx <= -0.55 && ny >= -0.05 && ny <= 0.5);
        const is2Bot = (nx >= -0.7 && nx <= -0.1 && ny >= 0.35 && ny <= 0.5);

        // Box 2: Center 'O' ring
        const ox = nx - 0.0;
        const oy = ny - 0.0;
        const oDist = Math.sqrt(ox * ox + oy * oy * 1.3);
        const isO = (oDist >= 0.18 && oDist <= 0.36 && Math.abs(ox) < 0.32);

        // Box 3: Right 'S'
        const isSTop = (nx >= 0.25 && nx <= 0.75 && ny >= -0.6 && ny <= -0.45);
        const isSLeft = (nx >= 0.25 && nx <= 0.4 && ny >= -0.55 && ny <= -0.05);
        const isSMid = (nx >= 0.25 && nx <= 0.75 && ny >= -0.15 && ny <= 0.0);
        const isSRight = (nx >= 0.6 && nx <= 0.75 && ny >= -0.05 && ny <= 0.45);
        const isSBot = (nx >= 0.25 && nx <= 0.75 && ny >= 0.35 && ny <= 0.5);

        if (is2Top || is2Right || is2Mid || is2Left || is2Bot || isO || isSTop || isSLeft || isSMid || isSRight || isSBot) {
          r = 255;
          g = 255;
          b = 255;
          a = 255;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);

  // Build PNG chunks
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // ColorType: 6 (RGBA)
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
    }
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(8 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crcTarget = chunk.subarray(4, 8 + len);
  const crcVal = crc32(crcTarget);
  chunk.writeUInt32BE(crcVal, 8 + len);
  return chunk;
}

const publicDir = path.join(process.cwd(), 'public');

// Generate 192x192
const png192 = createPNG(192, 192, [2, 132, 199]); // Deep cyan / brand blue
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// Generate 512x512
const png512 = createPNG(512, 512, [2, 132, 199]);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// Generate 512x512 maskable (with 15% safe zone padding)
const pngMaskable = createPNG(512, 512, [2, 132, 199]);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

// Generate 180x180 apple touch icon
const pngApple = createPNG(180, 180, [2, 132, 199]);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

console.log('Successfully generated PWA icons in /public!');
