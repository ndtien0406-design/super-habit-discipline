import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve('assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1x1 transparent PNG buffer
const tinyPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(tinyPngBase64, 'base64');

['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'].forEach(filename => {
  const filePath = path.join(assetsDir, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, pngBuffer);
    console.log(`Created asset: ${filename}`);
  }
});
