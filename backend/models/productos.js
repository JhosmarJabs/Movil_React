const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
    },
    reviews: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        required: true,
    },
    features: {
        type: [String],
        required: true,
    },
    warranty: {
        type: String,
        required: true,
    },
    availability: {
        type: String,
        required: true,
    },
    specs: {
        material: String,
        conectividad: String,
        bateria: String, // Sin tilde para coincidir con la colección
        motorizacion: String, // Sin tilde para coincidir con la colección
        resistencia: String,
    }
});

module.exports = mongoose.model("Productos", productoSchema);
