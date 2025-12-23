const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [144, 192, 512];

async function generateIcons() {
  for (const size of sizes) {
    // Create SVG with POS text
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#0ea5e9"/>
        <text 
          x="50%" 
          y="50%" 
          font-family="Arial, sans-serif" 
          font-size="${size / 3}" 
          font-weight="bold" 
          fill="white" 
          text-anchor="middle" 
          dominant-baseline="middle">
          POS
        </text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    
    console.log(`✓ Created icon-${size}x${size}.png`);
  }
  
  console.log('✓ All icons generated successfully!');
}

generateIcons().catch(console.error);
