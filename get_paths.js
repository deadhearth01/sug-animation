const fs = require('fs');

const svg = fs.readFileSync('formatted_logo.svg', 'utf8');
const paths = svg.match(/<path[^>]*d="[^"]*"[^>]*>/g);
if (paths) {
  paths.forEach(p => console.log(p));
}
