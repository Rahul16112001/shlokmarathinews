const fs = require('fs');

const scriptStr = fs.readFileSync('script.js', 'utf-8');
const apiInt = fs.readFileSync('api-integration.js', 'utf-8');

// The original safeFetchNews starts around line 375: `async function safeFetchNews(category, limit) {`
// and ends around line 427: `}` before `async function safeFetchArticle(id) {`
// Let's use regex to replace it.

let newScript = scriptStr.replace(
  /async function safeFetchNews\(category, limit\) {[\s\S]*?async function safeFetchArticle\(id\) {/,
  '/* [INJECTED BY API-INTEGRATION] */\nasync function safeFetchArticle(id) {'
);

// We also need to replace renderHome. In script.js, renderHome was injected by our previous run.
// It starts with `async function renderHome() {` and ends before `function renderTicker() {`
newScript = newScript.replace(
  /async function renderHome\(\) {[\s\S]*?function renderTicker\(\) {/,
  'function renderTicker() {'
);

// Prepend the new api-integration logic to the file, or insert it where safeFetchNews used to be.
// We can just append it before `/* ---------- Helpers ---------- */` or at the end of the file.
// Let's insert it before `async function safeFetchArticle`
newScript = newScript.replace(
  '/* [INJECTED BY API-INTEGRATION] */\nasync function safeFetchArticle(id) {',
  apiInt + '\n\nasync function safeFetchArticle(id) {'
);

fs.writeFileSync('script.js', newScript);
console.log('Successfully injected API integration into script.js');
