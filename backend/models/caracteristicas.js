// caracteristicas.js
const mongoose = require("mongoose");

const caracteristicasSchema = new mongoose.Schema({
    icono: {
        type: String,
        required: true
    },
    titulo: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("caracteristicas", caracteristicasSchema);