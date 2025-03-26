const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: [String],
        required: true
    },
    highlights: {
        type: [String]
    }
});

const policyGroupSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    intro: {
        type: String,
        required: true
    },
    items: {
        type: [itemSchema],
        required: true
    }
});

const politicasSchema = new mongoose.Schema({
    pageTitle: {
        type: String,
        required: true
    },
    pageIntro: {
        type: String,
        required: true
    },
    clientPolicies: {
        type: policyGroupSchema,
        required: true
    },
    companyPolicies: {
        type: policyGroupSchema,
        required: true
    },
    privacyPolicies: {
        type: policyGroupSchema,
        required: true
    }
});

module.exports = mongoose.model("politicas", politicasSchema);

