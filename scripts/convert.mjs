import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

async function convertImages() {
  const files = fs.readdirSync(publicDir);
  const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png'));

  console.log(`Found ${pngFiles.length} PNG files to convert.`);

  for (const file of pngFiles) {
    const inputPath = path.join(publicDir, file);
    const basename = path.basename(file, path.extname(file));
    const outputPath = path.join(publicDir, `${basename}.webp`);

    console.log(`Converting ${file} to ${basename}.webp ...`);
    
    try {
      await sharp(inputPath)
        .webp({ quality: 80, effort: 6 }) // optimization
        .toFile(outputPath);
      
      // Delete original
      fs.unlinkSync(inputPath);
      console.log(`  -> Deleted original ${file}`);
    } catch (err) {
      console.error(`  -> Failed to convert ${file}:`, err);
    }
  }
}

convertImages();
