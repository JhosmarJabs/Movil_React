// test-mongodb.js
const mongoose = require('mongoose');
require('dotenv').config();

console.log('Intentando conectar a:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('MongoDB conectado exitosamente');
    mongoose.disconnect();
})
.catch(err => {
    console.error('Error al conectar a MongoDB:', err.message);
});