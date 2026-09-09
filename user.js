const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    active: {
        type: Boolean,
        default: false
    },

    totalOrders: {
        type: Number,
        default: 0
    },

    usedOrders: {
        type: Number,
        default: 0
    }
});

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        subscription: {
            type: subscriptionSchema,
            default: () => ({
                active: false,
                totalOrders: 0,
                usedOrders: 0
            })
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);