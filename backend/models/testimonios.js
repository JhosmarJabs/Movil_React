// testimonios.js
const mongoose = require("mongoose");

const testimoniosSchema = new mongoose.Schema({
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "usuarios",
        required: true
    },
    puesto: {
        type: String,
        required: true
    },
    comentario: {
        type: String,
        required: true
    },
    estrellas: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    verificado: {
        type: Boolean,
        default: false
    },
    producto_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Productos"
    }
});

module.exports = mongoose.model("testimonios", testimoniosSchema);