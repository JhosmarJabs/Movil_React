const mongoose = require("mongoose");

const itemCarritoSchema = new mongoose.Schema({
    producto_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Productos",
        required: true
    },
    cantidad: {
        type: Number,
        required: true,
        min: 1
    },
    precio_unitario: {
        type: Number,
        required: true
    },
    descuento: {
        type: Number,
        default: 0
    }
});

const carritoSchema = new mongoose.Schema({
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "usuarios",
        required: true
    },
    items: [itemCarritoSchema],
    fecha_creacion: {
        type: Date,
        default: Date.now
    },
    fecha_actualizacion: {
        type: Date,
        default: Date.now
    },
    estado: {
        type: String,
        enum: ['activo', 'abandonado', 'convertido'],
        default: 'activo'
    }
});

module.exports = mongoose.model("carrito", carritoSchema);

