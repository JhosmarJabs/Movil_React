// Guarda esto como generate-secret.js
const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET=' + secret);