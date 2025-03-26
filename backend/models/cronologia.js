const mongoose = require("mongoose");

const cronologiaSchema = new mongoose.Schema({
    year: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("cronologia", cronologiaSchema);