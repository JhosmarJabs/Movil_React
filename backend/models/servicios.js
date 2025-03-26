const mongoose = require('mongoose');

// Definir el esquema para los servicios
const serviciosSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    listItems: [
        {
            titulo: { type: String, required: true },
            descripcion: { type: String, required: true }
        }
    ],
    imagen: { type: String, required: true }
});

// Crear el modelo
const Servicios = mongoose.model('servicios', serviciosSchema);

module.exports = Servicios;
