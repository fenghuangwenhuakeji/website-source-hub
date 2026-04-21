const fs = require('fs');
const file = '/var/www/fenghuang-backend/src/routes/orders.js';
let content = fs.readFileSync(file, 'utf8');

// Fix the syntax errors
content = content.replace(/router\.post\( \/,/g, 'router.post("/",');
content = content.replace(/req\.url = \/create;/g, 'req.url = "/create";');

fs.writeFileSync(file, content);
console.log('Fixed orders.js');
