const mongoose = require("mongoose");

const direccionSchema = new mongoose.Schema({
    calle: {
        type: String,
        required: true
    },
    numero: {
        type: String,
        required: true
    },
    colonia: {
        type: String,
        required: true
    },
    ciudad: {
        type: String,
        required: true
    },
    estado: {
        type: String,
        required: true
    },
    codigo_postal: {
        type: String,
        required: true
    },
    referencias: String
});

const itemPedidoSchema = new mongoose.Schema({
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
    },
    subtotal: {
        type: Number,
        required: true
    }
});

const pedidosSchema = new mongoose.Schema({
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "usuarios",
        required: true
    },
    numero_pedido: {
        type: String,
        required: true,
        unique: true
    },
    items: [itemPedidoSchema],
    subtotal: {
        type: Number,
        required: true
    },
    impuestos: {
        type: Number,
        required: true
    },
    envio: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    direccion_envio: {
        type: direccionSchema,
        required: true
    },
    metodo_pago: {
        type: String,
        required: true,
        enum: ['tarjeta', 'transferencia', 'efectivo', 'paypal']
    },
    estado: {
        type: String,
        required: true,
        enum: ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'],
        default: 'pendiente'
    },
    fecha_pedido: {
        type: Date,
        default: Date.now
    },
    fecha_actualización: {
        type: Date,
        default: Date.now
    },
    notas: String
});

module.exports = mongoose.model("pedidos", pedidosSchema);