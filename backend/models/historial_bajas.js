const mongoose = require("mongoose");

const historialBajasSchema = new mongoose.Schema({
    coleccion: {
        type: String,
        required: true
    },
    documento_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    datos: {
        type: Object,
        required: true
    },
    motivo: {
        type: String,
        required: true
    },
    fecha_baja: {
        type: Date,
        default: Date.now
    },
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "usuarios"
    }
});

module.exports = mongoose.model("historial_bajas", historialBajasSchema);