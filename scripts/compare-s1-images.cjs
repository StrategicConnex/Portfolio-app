const sharp = require('sharp');
const { writeFileSync } = require('fs');
const path = require('path');

async function main() {
  const baselinePath = 'artwork/living-datacenter/refcheck/baseline-pre-fidelity/gaps-S1-boot.png';
  const currentPath = 'artwork/living-datacenter/refcheck/current-s1-boot.png';

  // Load both images as raw RGB data
  const baselineRaw = await sharp(baselinePath).toFormat('raw').raw().toBuffer();
  const baselineMeta = await sharp(baselinePath).metadata();
  console.log(`Baseline: ${baselineMeta.width}x${baselineMeta.height} channels=${baselineMeta.channels}`);

  // Resize current to match baseline
  let currentRaw = await sharp(currentPath)
    .resize(baselineMeta.width, baselineMeta.height)
    .toFormat('raw')
    .raw()
    .toBuffer();

  const currentMeta = await sharp(currentPath).metadata();
  console.log(`Current:  ${currentMeta.width}x${currentMeta.height} channels=${currentMeta.channels} (resized to match baseline)`);

  const totalPixels = baselineMeta.width * baselineMeta.height;
  let differingPixels = 0;
  const channelCount = 3; // RGB
  const threshold = 15; // pixel difference threshold

  // Create diff overlay data
  const diffData = Buffer.alloc(totalPixels * 4); // RGBA for diff overlay

  for (let i = 0; i < totalPixels; i++) {
    const baseOffset = i * channelCount;
    const curOffset = i * channelCount;
    const diffOffset = i * 4;

    const rDiff = Math.abs(baselineRaw[baseOffset] - currentRaw[curOffset]);
    const gDiff = Math.abs(baselineRaw[baseOffset + 1] - currentRaw[curOffset + 1]);
    const bDiff = Math.abs(baselineRaw[baseOffset + 2] - currentRaw[curOffset + 2]);

    const maxDiff = Math.max(rDiff, gDiff, bDiff);

    if (maxDiff > threshold) {
      differingPixels++;
    }

    // Diff overlay: red where pixels differ
    if (maxDiff > threshold) {
      diffData[diffOffset] = 255;       // R
      diffData[diffOffset + 1] = 0;     // G
      diffData[diffOffset + 2] = 0;     // B
      diffData[diffOffset + 3] = Math.min(255, maxDiff * 3); // A
    } else {
      diffData[diffOffset] = 0;
      diffData[diffOffset + 1] = 0;
      diffData[diffOffset + 2] = 0;
      diffData[diffOffset + 3] = 0; // Transparent
    }
  }

  const diffPercentage = (differingPixels / totalPixels) * 100;

  console.log('\n--- Visual Comparison Results ---');
  console.log(`Total pixels:      ${totalPixels}`);
  console.log(`Differing pixels:   ${differingPixels}`);
  console.log(`Diff percentage:    ${diffPercentage.toFixed(2)}%`);

  // Calculate mean squared error
  let mse = 0;
  for (let i = 0; i < totalPixels * channelCount; i += channelCount) {
    const dr = baselineRaw[i] - currentRaw[i];
    const dg = baselineRaw[i + 1] - currentRaw[i + 1];
    const db = baselineRaw[i + 2] - currentRaw[i + 2];
    mse += (dr * dr + dg * dg + db * db) / 3;
  }
  mse /= totalPixels;
  const psnr = mse > 0 ? 20 * Math.log10(255 / Math.sqrt(mse)) : Infinity;

  console.log(`Mean Squared Error: ${mse.toFixed(2)}`);
  console.log(`PSNR: ${psnr.toFixed(2)} dB`);

  // Save diff overlay
  const diffPath = 'artwork/living-datacenter/refcheck/s1-diff-overlay.png';
  await sharp(diffData, { raw: { width: baselineMeta.width, height: baselineMeta.height, channels: 4 } })
    .toFile(diffPath);
  console.log(`\nDiff overlay saved: ${diffPath}`);

  // Interpretation
  if (diffPercentage < 1) {
    console.log('\n[PASS] Images are visually identical (diff < 1%)');
  } else if (diffPercentage < 10) {
    console.log(`\n[MINOR] Small differences detected (${diffPercentage.toFixed(2)}%)`);
    console.log('  Expected differences: 3D animation frame, particle positions, lighting variations.');
  } else {
    console.log(`\n[SIGNIFICANT] Large differences detected (${diffPercentage.toFixed(2)}%)`);
  }

  console.log('\n--- Notes ---');
  console.log('The 3D canvas has animated particles and lighting, so frame-by-frame');
  console.log('differences are expected. Focus on structural elements:');
  console.log('  - Rack geometry should be present in both');
  console.log('  - Mesh door patterns should be visible');
  console.log('  - Chassis/bezel clearcoat should be applied');
  console.log('  - No GlbMesh crash errors should appear in console');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
