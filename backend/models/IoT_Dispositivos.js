const mongoose = require("mongoose");

const iotDispositivosSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    modelo: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        required: true,
        enum: ['Controlador', 'Sensor', 'Actuador']
    },
    descripcion: {
        type: String,
        required: true
    },
    compatibilidad: {
        type: [String],
        required: true
    },
    consumo_energia: {
        type: String,
        required: true
    },
    dimensiones: {
        type: String,
        required: true
    },
    peso: {
        type: String,
        required: true
    },
    imagen: {
        type: String,
        required: true
    },
    precio: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model("IoT_Dispositivos", iotDispositivosSchema);
