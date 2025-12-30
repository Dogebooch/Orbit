import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.join(__dirname, '..', 'build');
const svgPath = path.join(buildDir, 'icon.svg');
const pngPath = path.join(buildDir, 'icon.png');
const icoPath = path.join(buildDir, 'icon.ico');

async function generateIcon() {
  console.log('🎨 Generating icon from SVG...');
  
  // Ensure build directory exists
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Convert SVG to 256x256 PNG
  await sharp(svgPath)
    .resize(256, 256)
    .png()
    .toFile(pngPath);
  
  console.log('✅ Created PNG icon (256x256)');
  
  // Convert PNG to ICO
  const pngBuffer = fs.readFileSync(pngPath);
  const icoBuffer = await pngToIco([pngBuffer]);
  fs.writeFileSync(icoPath, icoBuffer);
  
  console.log('✅ Created ICO icon');
  console.log(`📁 Icons saved to: ${buildDir}`);
}

generateIcon().catch(console.error);

