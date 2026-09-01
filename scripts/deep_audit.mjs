import fs from 'fs';
import path from 'path';

function getAllFiles(dir, all = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) getAllFiles(full, all);
    else if (full.endsWith('.tsx') || full.endsWith('.ts')) all.push(full);
  }
  return all;
}

const files = getAllFiles('src');

console.log('=== DETAILED CODE SCAN ===');

// Check 1: Button types across all tsx files
console.log('\n--- BUTTON TYPE AUDIT ---');
let missingTypeCount = 0;
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  // Find <button tag occurrences
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<button')) {
      // Look ahead up to 10 lines to see if type= is in this button tag
      let tagContent = '';
      for (let j = i; j < Math.min(i + 10, lines.length); j++) {
        tagContent += ' ' + lines[j];
        if (lines[j].includes('>')) break;
      }
      if (!tagContent.includes('type=')) {
        console.log(`[NO TYPE] ${file}:${i + 1} -> ${lines[i].trim()}`);
        missingTypeCount++;
      }
    }
  }
}
console.log(`Total buttons missing type: ${missingTypeCount}`);

// Check 2: Table rows with onClick and nested buttons (event propagation)
console.log('\n--- TABLE ROWS & CLICK HANDLERS ---');
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('<tr') && content.includes('onClick')) {
    console.log(`[TR with onClick]: ${file}`);
  }
}

// Check 3: Links without rel="noopener noreferrer" for target="_blank"
console.log('\n--- TARGET _BLANK WITHOUT REL ---');
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('target="_blank"') || lines[i].includes("target='_blank'")) {
      let tagContent = '';
      for (let j = Math.max(0, i - 2); j < Math.min(i + 4, lines.length); j++) {
        tagContent += ' ' + lines[j];
      }
      if (!tagContent.includes('rel=') || !tagContent.includes('noopener')) {
        console.log(`[BLANK NO REL] ${file}:${i + 1} -> ${lines[i].trim()}`);
      }
    }
  }
}

// Check 4: Use of Date formatting directly in SSR vs Client (e.g. toLocaleDateString without timezone or suppressHydrationWarning)
console.log('\n--- DATE / HYDRATION MISMATCH RISKS ---');
for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('toLocaleDateString') || lines[i].includes('toLocaleTimeString') || lines[i].includes('toLocaleString')) {
      console.log(`[LOCALE DATE] ${file}:${i + 1} -> ${lines[i].trim()}`);
    }
  }
}
