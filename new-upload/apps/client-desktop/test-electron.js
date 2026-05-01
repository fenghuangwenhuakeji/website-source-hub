const e = require('electron');
if (typeof e === 'string') {
  console.log('ERROR: require(electron) returned string:', e);
  process.exit(1);
}
console.log('OK:', Object.keys(e).slice(0,5));
