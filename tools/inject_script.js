const fs = require('fs');

const oldScript = fs.readFileSync('script.js', 'utf-8');
const newFunctions = fs.readFileSync('render-new.js', 'utf-8');

const startIndex = oldScript.indexOf('async function renderHome() {');
const endIndex = oldScript.indexOf('/* Public aliases');

if (startIndex === -1 || endIndex === -1) {
  console.log('Error: Could not find indices');
  process.exit(1);
}

// Ensure we don't accidentally remove articleUrl if it already exists, or wait, articleUrl is defined in our new functions.
// Let's check if articleUrl already exists in script.js
let newFuncsToInject = newFunctions;
if (oldScript.indexOf('function articleUrl(id)') !== -1) {
  // It exists elsewhere, remove it from newFunctions
  newFuncsToInject = newFuncsToInject.replace(/function articleUrl\(id\) {[\s\S]*?}\n\n/, '');
}

const finalScript = oldScript.substring(0, startIndex) + newFuncsToInject + '\n\n' + oldScript.substring(endIndex);

fs.writeFileSync('script.js', finalScript);
console.log('Updated script.js successfully!');
