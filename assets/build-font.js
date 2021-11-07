/**
 * Generates an icon font using a subset of Bootstrap Icons.
 */

/* eslint-disable no-console */

const fs = require('fs/promises');
const path = require('path');
const { generateFonts } = require('fantasticon');

// All icons used by the application.
const icons = [
  'clipboard',
  'arrow-clockwise',
  'check-circle',
  'x-circle',
];

const iconsDir = path.resolve(__dirname, 'icons');

async function main() {
  console.log(`Cleaning up ${iconsDir}...`);
  await fs.rm(iconsDir, { recursive: true, force: true });
  await fs.mkdir(iconsDir);

  const copyTasks = icons.map((icon) => {
    console.log(`Copying icon ${icon} from Bootstrap Icons...`);
    const boostrapIconPath = require.resolve(`bootstrap-icons/icons/${icon}.svg`);
    const dstPath = path.join(iconsDir, `${icon}.svg`);
    return fs.copyFile(boostrapIconPath, dstPath);
  });
  await Promise.all(copyTasks);

  console.log('Generating icon font...');

  await generateFonts({
    inputDir: iconsDir,
    outputDir: iconsDir,
    name: 'bootstrap-icons',
    fontTypes: ['woff', 'woff2'],
    assetTypes: ['scss'],
    tag: 'i',
    prefix: 'bi',
  });

  console.log('Icon font generated!');
}

main().catch(console.error);
