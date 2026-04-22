const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('gong134135', 10);
console.log('New hash for gong134135:', hash);
console.log('Verification:', bcrypt.compareSync('gong134135', hash));