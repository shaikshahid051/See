const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        partner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Partner",
            default: null
        },

        studentName: {
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

        room: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        deliveryType: {
            type: String,
            required: true,
            trim: true
        },

        itemDetails: {
            type: String,
            default: ""
        },

        instructions: {
            type: String,
            default: ""
        },

        partnerEarning: {
            type: Number,
            default: 7
        },

        platformFee: {
            type: Number,
            default: 3
        },

        totalFee: {
            type: Number,
            default: 10
        },

        subscriptionUsed: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: [
                "Searching for Delivery Partner",
                "Partner Assigned",
                "Picked Up",
                "On the Way",
                "Delivered"
            ],
            default: "Searching for Delivery Partner"
        },

        earningAdded: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Order", orderSchema);