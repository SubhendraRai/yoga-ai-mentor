import fs from 'fs';
import path from 'path';

const cssDir = '/Users/subhendrarai/.gemini/antigravity/scratch/yoga-ai-mentor/dist/assets';
const files = fs.readdirSync(cssDir);
const cssFile = files.find(f => f.endsWith('.css'));

if (cssFile) {
  const cssPath = path.join(cssDir, cssFile);
  const content = fs.readFileSync(cssPath, 'utf-8');
  
  const searchClasses = ['.flex', '.flex-col', '.items-center', '.bg-canvas', '.min-h-screen'];
  
  searchClasses.forEach(cls => {
    // Escape dots for regex
    const escaped = cls.replace('.', '\\.');
    const regex = new RegExp(`${escaped}\\{([^\\}]+)\\}`, 'g');
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push(match[0]);
    }
    console.log(`${cls} matches:`, matches);
  });
} else {
  console.log('No CSS file found in dist/assets');
}
