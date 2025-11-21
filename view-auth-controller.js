const fs = require('fs');
const path = require('path');

console.log('=== VIEWING AUTH CONTROLLER CONTENT ===\n');

const authControllerPath = path.join(__dirname, 'src', 'controllers', 'authController.js');

if (!fs.existsSync(authControllerPath)) {
  console.log('❌ Auth controller file does not exist at:', authControllerPath);
  console.log('\nChecking what files exist in controllers directory:');
  
  const controllersDir = path.join(__dirname, 'src', 'controllers');
  if (fs.existsSync(controllersDir)) {
    const files = fs.readdirSync(controllersDir);
    files.forEach(file => {
      console.log(' -', file);
    });
  } else {
    console.log('Controllers directory does not exist:', controllersDir);
  }
  process.exit(1);
}

// Read the entire file
const content = fs.readFileSync(authControllerPath, 'utf8');
console.log('📄 Full auth controller content:\n');
console.log('========================================');
console.log(content);
console.log('========================================');

// Look for specific patterns
console.log('\n=== SEARCHING FOR SPECIFIC PATTERNS ===\n');

// Look for any function that might be the register function
const functionPattern = /(?:async\s+)?(?:function\s+)?(\w+)\s*\([^)]*\)\s*{[\s\S]*?}(?=\s*(?:async|function|export|module|\/\/|\/\*|$))/g;
let match;
const functions = [];

while ((match = functionPattern.exec(content)) !== null) {
  functions.push({
    name: match[1],
    code: match[0]
  });
}

console.log(`Found ${functions.length} functions:`);
functions.forEach((func, index) => {
  console.log(`\n${index + 1}. ${func.name}:`);
  console.log('First 200 chars:', func.code.substring(0, 200) + '...');
});

// Specifically look for JWT usage
console.log('\n=== SEARCHING FOR JWT USAGE ===\n');
const jwtMatches = content.match(/jwt\.\w+\([\s\S]*?\)/g);
if (jwtMatches) {
  console.log('JWT method calls found:');
  jwtMatches.forEach((call, index) => {
    console.log(`\n${index + 1}. ${call}`);
  });
} else {
  console.log('No JWT method calls found');
}

// Look for exports
console.log('\n=== EXPORTS ===\n');
if (content.includes('module.exports')) {
  const exportMatch = content.match(/module\.exports\s*=[\s\S]*?(?=;|$)/);
  if (exportMatch) {
    console.log('Exports found:');
    console.log(exportMatch[0]);
  }
}