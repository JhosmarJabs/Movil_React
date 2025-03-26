// contactos.js
const mongoose = require("mongoose");

const contactoSchema = new mongoose.Schema({
    icon: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    link: {
        type: String
    },
    linkText: {
        type: String
    }
});

module.exports = mongoose.model("contactos", contactoSchema);
