import fs from 'fs';
import zlib from 'zlib';

// Simple CRC32 table for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(len, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crc = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([lenBuf, toCrc, crcBuf]);
}

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT: Scanlines with filter byte 0 (None)
  const rowSize = width * 4;
  const rawData = Buffer.alloc(height * (rowSize + 1));
  for (let y = 0; y < height; y++) {
    const rawOffset = y * (rowSize + 1);
    rawData[rawOffset] = 0; // Filter None
    rgbaBuffer.copy(rawData, rawOffset + 1, y * rowSize, (y + 1) * rowSize);
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressed);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Draw crisp branded app icon
function renderEarnIcon(size, isMaskable = false) {
  const buffer = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const scale = size / 512;
  const safeScale = isMaskable ? 0.75 : 1.0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = (x - cx) / scale;
      const dy = (y - cy) / scale;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default dark gradient background (#07090e -> #0b111e)
      const gradRatio = (x + y) / (size * 2);
      let r = Math.round(7 + gradRatio * 8);
      let g = Math.round(9 + gradRatio * 10);
      let b = Math.round(14 + gradRatio * 18);
      let a = 255;

      // Squircle corner check for non-maskable (radius 100)
      if (!isMaskable) {
        const cornerR = 90;
        const qx = Math.max(0, Math.abs(dx) - (256 - cornerR));
        const qy = Math.max(0, Math.abs(dy) - (256 - cornerR));
        if (Math.sqrt(qx * qx + qy * qy) > cornerR) {
          a = 0; // Transparent outside rounded corner
          r = 0; g = 0; b = 0;
        }
      }

      if (a > 0) {
        // Inner Coin / Ring
        const coinRadius = 145 * safeScale;
        const ringWidth = 10 * safeScale;

        // Outer glow
        if (dist > coinRadius && dist < coinRadius + 28 * safeScale) {
          const glowAlpha = (1 - (dist - coinRadius) / (28 * safeScale)) * 0.45;
          r = Math.min(255, Math.round(r * (1 - glowAlpha) + 34 * glowAlpha * 255 / 100));
          g = Math.min(255, Math.round(g * (1 - glowAlpha) + 211 * glowAlpha));
          b = Math.min(255, Math.round(b * (1 - glowAlpha) + 238 * glowAlpha));
        }

        // Coin Ring (Cyan to Emerald)
        if (Math.abs(dist - coinRadius) <= ringWidth / 2) {
          const ringGrad = (dx + dy + 200) / 400;
          r = Math.round(34 * (1 - ringGrad) + 16 * ringGrad);
          g = Math.round(211 * (1 - ringGrad) + 185 * ringGrad);
          b = Math.round(238 * (1 - ringGrad) + 129 * ringGrad);
        } else if (dist < coinRadius - ringWidth / 2) {
          // Inside coin disc: rich dark slate blue #0f172a with subtle radial glow
          const innerRatio = dist / coinRadius;
          r = Math.round(15 + (1 - innerRatio) * 12);
          g = Math.round(23 + (1 - innerRatio) * 25);
          b = Math.round(42 + (1 - innerRatio) * 35);

          // Stylized Taka (৳) stem: vertical line at dx = 12 * safeScale, dy between -95 and 95
          const stemX = 12 * safeScale;
          const stemHalfW = 10 * safeScale;
          if (Math.abs(dx - stemX) <= stemHalfW && dy >= -95 * safeScale && dy <= 95 * safeScale) {
            // Emerald/Cyan gradient stem
            r = 34; g = 211; b = 238;
          }

          // Top circle / loop of ৳: centered at dx = -20 * safeScale, dy = -40 * safeScale, radius ~35
          const loopDist = Math.sqrt((dx + 22 * safeScale) ** 2 + (dy + 42 * safeScale) ** 2);
          if (Math.abs(loopDist - 34 * safeScale) <= 9 * safeScale) {
            // Gold gradient
            r = 250; g = 204; b = 21;
          }

          // Bottom curve of ৳: arc from dx=12 to dx=45, dy=30 to 75
          const bottomLoopDist = Math.sqrt((dx - 22 * safeScale) ** 2 + (dy - 40 * safeScale) ** 2);
          if (Math.abs(bottomLoopDist - 36 * safeScale) <= 9 * safeScale && dx > 0) {
            r = 250; g = 204; b = 21;
          }

          // Gold center dot
          if (loopDist < 12 * safeScale) {
            r = 253; g = 224; b = 71;
          }
        }
      }

      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  return encodePNG(size, size, buffer);
}

// Generate files
fs.writeFileSync('public/pwa-192x192.png', renderEarnIcon(192, false));
fs.writeFileSync('public/pwa-512x512.png', renderEarnIcon(512, false));
fs.writeFileSync('public/pwa-maskable-512x512.png', renderEarnIcon(512, true));
fs.writeFileSync('public/apple-touch-icon.png', renderEarnIcon(180, false));
fs.writeFileSync('public/favicon.ico', renderEarnIcon(32, false));
console.log('PWA Icons generated successfully!');
