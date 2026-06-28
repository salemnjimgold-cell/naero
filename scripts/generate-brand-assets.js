const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const LOGO_SRC = path.resolve(__dirname, '..', 'assets', 'branding', 'naero-logo.png');
const ASSETS_DIR = path.resolve(__dirname, '..', 'assets');
const ANDROID_RES = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

async function main() {
  const logo = sharp(LOGO_SRC);
  const metadata = await logo.metadata();
  console.log(`Logo: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

  const mipmapSizes = {
    'mipmap-mdpi': { launcher: 48, foreground: 108 },
    'mipmap-hdpi': { launcher: 72, foreground: 162 },
    'mipmap-xhdpi': { launcher: 96, foreground: 216 },
    'mipmap-xxhdpi': { launcher: 144, foreground: 324 },
    'mipmap-xxxhdpi': { launcher: 192, foreground: 432 },
  };

  for (const [dir, sizes] of Object.entries(mipmapSizes)) {
    const outDir = path.join(ANDROID_RES, dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    await logo.clone().resize(sizes.launcher, sizes.launcher, { fit: 'inside', withoutReduction: false }).toFile(path.join(outDir, 'ic_launcher.png'));
    await logo.clone().resize(sizes.launcher, sizes.launcher, { fit: 'inside', withoutReduction: false }).toFile(path.join(outDir, 'ic_launcher_round.png'));
    await logo.clone().resize(sizes.foreground, sizes.foreground, { fit: 'inside', withoutReduction: false }).toFile(path.join(outDir, 'ic_launcher_foreground.png'));

    console.log(`  Generated ${dir} (${sizes.launcher}px launcher, ${sizes.foreground}px foreground)`);
  }

  const drawables = {
    'drawable-mdpi': 96,
    'drawable-hdpi': 144,
    'drawable-xhdpi': 192,
    'drawable-xxhdpi': 288,
    'drawable-xxxhdpi': 384,
  };

  for (const [dir, size] of Object.entries(drawables)) {
    const outDir = path.join(ANDROID_RES, dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    await logo.clone().resize(size, size, { fit: 'inside', withoutReduction: false }).toFile(path.join(outDir, 'splashscreen_logo.png'));
    console.log(`  Generated ${dir} (${size}px)`);
  }

  await logo.clone().toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('  Copied to assets/icon.png');

  await logo.clone().toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
  console.log('  Copied to assets/splash-icon.png');

  await logo.clone().toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));
  console.log('  Copied to assets/adaptive-icon.png');

  console.log('\nAll brand assets generated successfully.');
}

main().catch(err => { console.error(err); process.exit(1); });
