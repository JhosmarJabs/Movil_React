// redes_sociales.js
const mongoose = require("mongoose");

const redesSocialesSchema = new mongoose.Schema({
    icon: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    handle: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("redes_sociales", redesSocialesSchema);