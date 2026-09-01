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
console.log('Total files checked:', files.length);

const missingUseClient = [];
const buttonTypeIssues = [];
const navigationIssues = [];
const windowDocumentIssues = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const firstNonComment = lines.find(l => {
    const t = l.trim();
    return t.length > 0 && !t.startsWith('//') && !t.startsWith('/*') && !t.startsWith('*');
  }) || '';

  const isUseClient = firstNonComment.includes('"use client"') || firstNonComment.includes("'use client'");
  const isUseServer = firstNonComment.includes('"use server"') || firstNonComment.includes("'use server'");
  const isTsx = file.endsWith('.tsx');

  const hasHooks = /(use[A-Z]\w+)\s*\(/.test(content);
  const hasEvents = /\s(onClick|onChange|onSubmit|onKeyDown|onKeyUp|onBlur|onFocus|onDragOver|onDrop)\s*=/.test(content);
  const hasBrowserApis = /\b(window\.|document\.|localStorage\.|sessionStorage\.|navigator\.)/.test(content);

  // Check if component has interactivity but no 'use client'
  if (isTsx && (hasHooks || hasEvents || hasBrowserApis) && !isUseClient) {
    missingUseClient.push({ file, hasHooks, hasEvents, hasBrowserApis });
  }

  // Check for browser APIs in files without use client
  if (!isUseClient && !isUseServer && hasBrowserApis) {
    windowDocumentIssues.push({ file, hasBrowserApis });
  }

  // Check for buttons without type="..."
  if (isTsx) {
    const buttonRegex = /<button\b([^>]*?)>/g;
    let match;
    while ((match = buttonRegex.exec(content)) !== null) {
      const attrs = match[1];
      if (!attrs.includes('type=')) {
        const lineNo = content.substring(0, match.index).split('\n').length;
        buttonTypeIssues.push({ file, lineNo, match: match[0] });
      }
    }

    const navClickRegex = /onClick=\{[^}]*(?:router\.push|window\.location|location\.href)[^}]*\}/g;
    let navMatch;
    while ((navMatch = navClickRegex.exec(content)) !== null) {
      const lineNo = content.substring(0, navMatch.index).split('\n').length;
      navigationIssues.push({ file, lineNo, match: navMatch[0] });
    }
  }
}

console.log('\n--- 1. MISSING USE CLIENT ---');
console.log(JSON.stringify(missingUseClient, null, 2));

console.log('\n--- 2. BUTTONS WITHOUT TYPE ATTRIBUTE ---');
console.log(`Found ${buttonTypeIssues.length} buttons without explicit type:`);
buttonTypeIssues.forEach(b => console.log(`  ${b.file}:${b.lineNo} -> ${b.match}`));

console.log('\n--- 3. NAVIGATION ISSUES (onClick navigation) ---');
console.log(JSON.stringify(navigationIssues, null, 2));

console.log('\n--- 4. BROWSER APIS IN NON-CLIENT FILES ---');
console.log(JSON.stringify(windowDocumentIssues, null, 2));
