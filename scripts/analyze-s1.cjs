const sharp = require('sharp');

async function main() {
  const baselinePath = 'artwork/living-datacenter/refcheck/baseline-pre-fidelity/gaps-S1-boot.png';
  const currentPath = 'artwork/living-datacenter/refcheck/current-s1-boot.png';

  // Load both images as raw RGB data (resize to match)
  const baselineRaw = await sharp(baselinePath).toFormat('raw').raw().toBuffer();
  const baselineMeta = await sharp(baselinePath).metadata();

  // Resize current to match baseline
  const currentRaw = await sharp(currentPath)
    .resize(baselineMeta.width, baselineMeta.height)
    .toFormat('raw')
    .raw()
    .toBuffer();

  // Analyze brightness/contrast (structural presence check)
  let baseBright = 0, curBright = 0;
  const totalPixels = baselineMeta.width * baselineMeta.height;
  const step = 1; // sample every pixel

  for (let i = 0; i < totalPixels * 3; i += 3 * step) {
    baseBright += (baselineRaw[i] + baselineRaw[i+1] + baselineRaw[i+2]) / 3;
    curBright += (currentRaw[i] + currentRaw[i+1] + currentRaw[i+1]) / 3;
  }
  baseBright /= (totalPixels / step);
  curBright /= (totalPixels / step);

  console.log('=== Structural Analysis ===');
  console.log(`Baseline avg brightness: ${baseBright.toFixed(1)}`);
  console.log(`Current  avg brightness: ${curBright.toFixed(1)}`);
  console.log(`Brightness delta:          ${(curBright - baseBright).toFixed(1)}`);

  // Check for presence of specific color ranges that indicate:
  // 1. Blue LED strips (clearcoat on chassis) - #1E90FF / #22d3ee
  // 2. Metal/brushed steel (bezel) - #b8c0cc / #c6cdd8
  // 3. Dark steel/blue-gray (chassis) - #0d1524 / #141f33
  // 4. Grid/mesh pattern (door) - alpha cutout areas

  let blueLeds = 0, brushedMetal = 0, darkChassis = 0, orangeAccents = 0;

  for (let i = 0; i < totalPixels * 3; i += 3) {
    const r = currentRaw[i];
    const g = currentRaw[i + 1];
    const b = currentRaw[i + 2];

    // Blue LED areas (cool blue: high blue, decent green, lower red)
    if (b > 150 && b > r + 40 && b > g + 20) blueLeds++;

    // Brushed metal (silver/gray: r≈g≈b, mid-range)
    if (Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && r > 120 && r < 200) brushedMetal++;

    // Dark chassis (very dark, slightly blue-tinted)
    if (r < 40 && g < 40 && b < 60) darkChassis++;

    // Orange accents (data center orange: high red+green, low blue)
    if (r > 150 && g > 80 && g < 180 && b < 100) orangeAccents++;
  }

  console.log('\n=== Material Presence Analysis (current) ===');
  console.log(`Blue LED pixels (clearcoat/LEDs):   ${blueLeds} (${(blueLeds/totalPixels*100).toFixed(2)}%)`);
  console.log(`Brushed metal pixels (bezel):       ${brushedMetal} (${(brushedMetal/totalPixels*100).toFixed(2)}%)`);
  console.log(`Dark chassis pixels (PBR-neutral):  ${darkChassis} (${(darkChassis/totalPixels*100).toFixed(2)}%)`);
  console.log(`Orange accent pixels (UI highlights): ${orangeAccents} (${(orangeAccents/totalPixels*100).toFixed(2)}%)`);

  // Same analysis for baseline
  let baseBlueLeds = 0, baseBrushedMetal = 0, baseDarkChassis = 0, baseOrangeAccents = 0;
  for (let i = 0; i < totalPixels * 3; i += 3) {
    const r = baselineRaw[i];
    const g = baselineRaw[i + 1];
    const b = baselineRaw[i + 2];
    if (b > 150 && b > r + 40 && b > g + 20) baseBlueLeds++;
    if (Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && r > 120 && r < 200) baseBrushedMetal++;
    if (r < 40 && g < 40 && b < 60) baseDarkChassis++;
    if (r > 150 && g > 80 && g < 180 && b < 100) baseOrangeAccents++;
  }

  console.log('\n=== Material Presence Analysis (baseline) ===');
  console.log(`Blue LED pixels:   ${baseBlueLeds} (${(baseBlueLeds/totalPixels*100).toFixed(2)}%)`);
  console.log(`Brushed metal pixels: ${baseBrushedMetal} (${(baseBrushedMetal/totalPixels*100).toFixed(2)}%)`);
  console.log(`Dark chassis pixels:  ${baseDarkChassis} (${(baseDarkChassis/totalPixels*100).toFixed(2)}%)`);
  console.log(`Orange accent pixels:  ${baseOrangeAccents} (${(baseOrangeAccents/totalPixels*100).toFixed(2)}%)`);

  // Summary
  console.log('\n=== Summary ===');
  const blueDelta = blueLeds - baseBlueLeds;
  const metalDelta = brushedMetal - baseBrushedMetal;
  const chassisDelta = darkChassis - baseDarkChassis;

  if (blueLeds > 0) console.log('✅ Blue LED emissive lighting present (S1 boot animation)');
  else console.log('❌ No blue LED lighting detected');

  if (brushedMetal > 1000) console.log('✅ Brushed metal/bezel texture detected');
  else console.log('❌ Brushed metal texture not prominent');

  if (darkChassis > 10000) console.log('✅ Dark PBR chassis geometry detected');
  else console.log('❌ Chassis geometry not prominent');

  if (blueDelta > 500) console.log(`📈 Blue LED presence increased (+${blueDelta} pixels)`);
  if (metalDelta > 500) console.log(`📈 Brushed metal presence increased (+${metalDelta} pixels)`);
  if (chassisDelta > 500) console.log(`📈 Chassis geometry increased (+${chassisDelta} pixels)`);
}

main().catch(console.error);
