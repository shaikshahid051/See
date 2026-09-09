const mongoose = require("mongoose");

const partnerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        hostel: {
            type: String,
            required: true,
            trim: true
        },

        block: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        studentId: {
            type: String,
            required: true,
            trim: true
        },

        availability: {
            type: String,
            enum: ["Available", "Not Available"],
            default: "Available"
        },

        totalDeliveries: {
            type: Number,
            default: 0
        },

        totalEarnings: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Partner", partnerSchema);
