
require("dotenv").config({ quiet: true });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// =========================
// MODELS
// =========================

const User = require("./models/user");
const Partner = require("./models/partner");
const Order = require("./models/order");
const Admin = require("./models/admin");

// =========================
// APP
// =========================

const app = express();

// =========================
// MIDDLEWARE
// =========================

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use(express.json());

// =========================
// MONGODB CONNECTION
// =========================

let isConnected = false;

async function connectDB() {
    if (
        isConnected &&
        mongoose.connection.readyState === 1
    ) {
        return;
    }

    if (!process.env.MONGODB_URI) {
        throw new Error(
            "MONGODB_URI is missing in environment variables"
        );
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);

        isConnected = true;

        console.log("MongoDB Connected Successfully");
    } catch (error) {
        isConnected = false;

        console.error(
            "MongoDB Connection Error:",
            error.message
        );

        throw error;
    }
}

// =========================
// JWT CHECK
// =========================

function checkJWTSecret() {
    if (!process.env.JWT_SECRET) {
        throw new Error(
            "JWT_SECRET is missing in environment variables"
        );
    }
}

// =========================
// ROOT ROUTE
// =========================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Gatnora API is running",
        status: "Server is working"
    });
});

// =========================
// API ROOT
// =========================

app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to Gatnora API",
        status: "Server is running"
    });
});

// =========================
// DATABASE MIDDLEWARE
// =========================

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error(
            "Database middleware error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
});

// ======================================================
// DATABASE TEST
// ======================================================

app.get("/api/test-db", async (req, res) => {
    try {
        const users = await User.countDocuments();
        const partners = await Partner.countDocuments();
        const orders = await Order.countDocuments();
        const admins = await Admin.countDocuments();

        res.json({
            success: true,
            message: "MongoDB is connected successfully",
            database: mongoose.connection.name,
            connectionState:
                mongoose.connection.readyState === 1
                    ? "Connected"
                    : "Not Connected",

            totalUsers: users,
            totalPartners: partners,
            totalOrders: orders,
            totalAdmins: admins
        });

    } catch (error) {
        console.error(
            "DATABASE TEST ERROR:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "MongoDB test failed",
            error: error.message
        });
    }
});

// ======================================================
// USER REGISTER
// ======================================================

app.post("/api/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const normalizedEmail =
            email.toLowerCase().trim();

        const existingUser =
            await User.findOne({
                email: normalizedEmail
            });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered"
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            userId: newUser._id
        });

    } catch (error) {
        console.error(
            "REGISTER ERROR:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ======================================================
// USER LOGIN
// ======================================================

app.post("/api/login", async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required"
            });
        }

        const normalizedEmail =
            email.toLowerCase().trim();

        const user =
            await User.findOne({
                email: normalizedEmail
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password"
            });
        }

        checkJWTSecret();

        const token = jwt.sign(
            {
                id: user._id.toString(),
                role: "user"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error(
            "LOGIN ERROR:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ======================================================
// ADMIN REGISTER
// ======================================================
// Use this only to create the first admin.
// ADMIN_SETUP_KEY must be in Vercel Environment Variables.
// After creating your admin, remove this route later.
// ======================================================

app.post("/api/admin/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            setupKey
        } = req.body;

        if (
            !name ||
            !email ||
            !password ||
            !setupKey
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email, password and setup key are required"
            });
        }

        if (!process.env.ADMIN_SETUP_KEY) {
            return res.status(500).json({
                success: false,
                message:
                    "ADMIN_SETUP_KEY is not configured"
            });
        }

        if (
            setupKey !==
            process.env.ADMIN_SETUP_KEY
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Invalid admin setup key"
            });
        }

        const normalizedEmail =
            email.toLowerCase().trim();

        const existingAdmin =
            await Admin.findOne({
                email: normalizedEmail
            });

        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message:
                    "Admin already exists"
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const admin = new Admin({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "admin"
        });

        await admin.save();

        res.status(201).json({
            success: true,
            message:
                "Admin created successfully",

            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error(
            "ADMIN REGISTER ERROR:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ======================================================
// ADMIN LOGIN
// ======================================================

app.post("/api/admin/login", async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required"
            });
        }

        const normalizedEmail =
            email.toLowerCase().trim();

        const admin =
            await Admin.findOne({
                email: normalizedEmail
            });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid admin credentials"
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                admin.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid admin credentials"
            });
        }

        checkJWTSecret();

        const token = jwt.sign(
            {
                id: admin._id.toString(),
                role: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            success: true,
            message:
                "Admin login successful",

            token,

            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error(
            "ADMIN LOGIN ERROR:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ======================================================
// ADMIN AUTHENTICATION
// ======================================================

function adminAuth(req, res, next) {
    try {
        const authHeader =
            req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message:
                    "Authorization token required"
            });
        }

        if (
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid authorization format"
            });
        }

        const token =
            authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message:
                    "Token is missing"
            });
        }

        checkJWTSecret();

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        if (
            decoded.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Admin access required"
            });
        }

        req.admin = decoded;

        next();

    } catch (error) {
        console.error(
            "ADMIN AUTH ERROR:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired admin token"
        });
    }
}

// ======================================================
// ADMIN PROFILE
// ======================================================

app.get(
    "/api/admin/profile",
    adminAuth,
    async (req, res) => {
        try {
            const admin =
                await Admin.findById(
                    req.admin.id
                ).select("-password");

            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Admin not found"
                });
            }

            res.json({
                success: true,
                admin
            });

        } catch (error) {
            console.error(
                "ADMIN PROFILE ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ======================================================
// ADMIN DASHBOARD
// ======================================================

app.get(
    "/api/admin/dashboard",
    adminAuth,
    async (req, res) => {
        try {
            const totalUsers =
                await User.countDocuments();

            const totalPartners =
                await Partner.countDocuments();

            const totalOrders =
                await Order.countDocuments();

            const pendingOrders =
                await Order.countDocuments({
                    status:
                        "Searching for Delivery Partner"
                });

            const deliveredOrders =
                await Order.countDocuments({
                    status: "Delivered"
                });

            const orders =
                await Order.find()
                    .populate(
                        "user",
                        "name email"
                    )
                    .populate(
                        "partner",
                        "name phone"
                    )
                    .sort({
                        createdAt: -1
                    })
                    .limit(50);

            res.json({
                success: true,

                statistics: {
                    totalUsers,
                    totalPartners,
                    totalOrders,
                    pendingOrders,
                    deliveredOrders
                },

                orders
            });

        } catch (error) {
            console.error(
                "ADMIN DASHBOARD ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message:
                    "Could not load admin dashboard",
                error: error.message
            });
        }
    }
);

// ======================================================
// ADMIN - GET ALL USERS
// ======================================================

app.get(
    "/api/admin/users",
    adminAuth,
    async (req, res) => {
        try {
            const users =
                await User.find()
                    .select("-password")
                    .sort({
                        createdAt: -1
                    });

            res.json({
                success: true,
                users
            });

        } catch (error) {
            console.error(
                "ADMIN USERS ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ======================================================
// ADMIN - GET ALL PARTNERS
// ======================================================

app.get(
    "/api/admin/partners",
    adminAuth,
    async (req, res) => {
        try {
            const partners =
                await Partner.find()
                    .populate(
                        "user",
                        "name email"
                    )
                    .sort({
                        createdAt: -1
                    });

            res.json({
                success: true,
                partners
            });

        } catch (error) {
            console.error(
                "ADMIN PARTNERS ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ======================================================
// ADMIN - GET ALL ORDERS
// ======================================================

app.get(
    "/api/admin/orders",
    adminAuth,
    async (req, res) => {
        try {
            const orders =
                await Order.find()
                    .populate(
                        "user",
                        "name email"
                    )
                    .populate(
                        "partner",
                        "name phone"
                    )
                    .sort({
                        createdAt: -1
                    });

            res.json({
                success: true,
                orders
            });

        } catch (error) {
            console.error(
                "ADMIN ORDERS ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ======================================================
// CREATE ORDER
// ======================================================

app.post(
    "/api/orders",
    async (req, res) => {
        try {
            const {
                userId,
                studentName,
                hostel,
                block,
                room,
                phone,
                deliveryType,
                itemDetails,
                instructions
            } = req.body;

            if (
                !userId ||
                !studentName ||
                !hostel ||
                !block ||
                !room ||
                !phone ||
                !deliveryType
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please fill all required fields"
                });
            }

            const user =
                await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message:
                        "User not found"
                });
            }

            let subscriptionUsed = false;

            let totalFee = 10;
            let platformFee = 3;
            let partnerEarning = 7;

            if (
                user.subscription &&
                user.subscription.active &&
                user.subscription.usedOrders <
                    user.subscription.totalOrders
            ) {
                subscriptionUsed = true;

                totalFee = 0;
                platformFee = 0;
                partnerEarning = 0;

                user.subscription.usedOrders += 1;

                if (
                    user.subscription.usedOrders >=
                    user.subscription.totalOrders
                ) {
                    user.subscription.active = false;
                }

                await user.save();
            }

            const newOrder = new Order({
                user: userId,
                studentName,
                hostel,
                block,
                room,
                phone,
                deliveryType,
                itemDetails,
                instructions,
                partnerEarning,
                platformFee,
                totalFee,
                subscriptionUsed,

                status:
                    "Searching for Delivery Partner"
            });

            await newOrder.save();

            res.status(201).json({
                success: true,
                message:
                    "Delivery request created successfully",
                order: newOrder
            });

        } catch (error) {
            console.error(
                "ORDER ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ======================================================
// GET AVAILABLE ORDERS
// ======================================================

app.get(
    "/api/orders/available",
    async (req, res) => {
        try {
            const orders =
                await Order.find({
                    status:
                        "Searching for Delivery Partner"
                }).sort({
                    createdAt: -1
                });

            res.json(orders);

        } catch (error) {
            console.error(
                "GET AVAILABLE ORDERS ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ======================================================
// GET USER ORDERS
// ======================================================

app.get(
    "/api/orders/user/:userId",
    async (req, res) => {
        try {
            const orders =
                await Order.find({
                    user: req.params.userId
                })
                    .populate("partner")
                    .sort({
                        createdAt: -1
                    });

            res.json(orders);

        } catch (error) {
            console.error(
                "GET USER ORDERS ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ======================================================
// REGISTER PARTNER
// ======================================================

app.post(
    "/api/partners",
    async (req, res) => {
        try {
            const {
                userId,
                name,
                hostel,
                block,
                phone,
                studentId,
                availability
            } = req.body;

            if (
                !userId ||
                !name ||
                !hostel ||
                !block ||
                !phone ||
                !studentId
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please fill all required partner fields"
                });
            }

            const user =
                await User.findById(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message:
                        "User not found"
                });
            }

            const existingPartner =
                await Partner.findOne({
                    user: userId
                });

            if (existingPartner) {
                return res.status(400).json({
                    success: false,
                    message:
                        "You are already a delivery partner"
                });
            }

            const partnerAvailability =
                availability === "Not Available"
                    ? "Not Available"
                    : "Available";

            const newPartner = new Partner({
                user: userId,
                name,
                hostel,
                block,
                phone,
                studentId,
                availability:
                    partnerAvailability
            });

            await newPartner.save();

            res.status(201).json({
                success: true,
                message:
                    "Partner registration successful",
                partner: newPartner
            });

        } catch (error) {
            console.error(
                "PARTNER REGISTER ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ======================================================
// GET PARTNER BY USER
// ======================================================

app.get(
    "/api/partners/user/:userId",
    async (req, res) => {
        try {
            const partner =
                await Partner.findOne({
                    user: req.params.userId
                });

            if (!partner) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Partner not found"
                });
            }

            res.json(partner);

        } catch (error) {
            console.error(
                "GET PARTNER ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ======================================================
// ACCEPT ORDER
// ======================================================

app.put(
    "/api/orders/:orderId/accept",
    async (req, res) => {
        try {
            const { partnerId } = req.body;

            if (!partnerId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Partner ID is required"
                });
            }

            const order =
                await Order.findById(
                    req.params.orderId
                );

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found"
                });
            }

            if (
                order.status !==
                "Searching for Delivery Partner"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Order has already been accepted"
                });
            }

            const partner =
                await Partner.findById(
                    partnerId
                );

            if (!partner) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Partner not found"
                });
            }

            if (
                partner.availability ===
                "Not Available"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Partner is currently unavailable"
                });
            }

            order.partner = partnerId;
            order.status = "Partner Assigned";

            await order.save();

            res.json({
                success: true,
                message:
                    "Order accepted successfully",
                order
            });

        } catch (error) {
            console.error(
                "ACCEPT ORDER ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ======================================================
// GET PARTNER ORDERS
// ======================================================

app.get(
    "/api/orders/partner/:partnerId",
    async (req, res) => {
        try {
            const orders =
                await Order.find({
                    partner:
                        req.params.partnerId
                }).sort({
                    createdAt: -1
                });

            res.json(orders);

        } catch (error) {
            console.error(
                "GET PARTNER ORDERS ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ======================================================
// UPDATE ORDER STATUS
// ======================================================

app.put(
    "/api/orders/:orderId/status",
    async (req, res) => {
        try {
            const { status } = req.body;

            const validStatuses = [
                "Partner Assigned",
                "Picked Up",
                "On the Way",
                "Delivered"
            ];

            if (
                !validStatuses.includes(status)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid status"
                });
            }

            const order =
                await Order.findById(
                    req.params.orderId
                );

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found"
                });
            }

            if (
                status === "Delivered" &&
                !order.earningAdded
            ) {
                if (!order.partner) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "No delivery partner assigned"
                    });
                }

                const partner =
                    await Partner.findById(
                        order.partner
                    );

                if (partner) {
                    partner.totalDeliveries =
                        (partner.totalDeliveries || 0) + 1;

                    partner.totalEarnings =
                        (partner.totalEarnings || 0) +
                        (order.partnerEarning || 0);

                    await partner.save();
                }

                order.earningAdded = true;
            }

            order.status = status;

            await order.save();

            res.json({
                success: true,
                message:
                    "Status updated successfully",
                order
            });

        } catch (error) {
            console.error(
                "UPDATE STATUS ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ======================================================
// BUY GATNORA PASS
// ======================================================

app.post(
    "/api/subscription/:userId",
    async (req, res) => {
        try {
            const user =
                await User.findById(
                    req.params.userId
                );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message:
                        "User not found"
                });
            }

            user.subscription = {
                active: true,
                totalOrders: 10,
                usedOrders: 0
            };

            await user.save();

            res.json({
                success: true,
                message:
                    "Gatnora Pass activated! 10 orders available.",
                subscription:
                    user.subscription
            });

        } catch (error) {
            console.error(
                "SUBSCRIPTION ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ======================================================
// GET USER
// ======================================================

app.get(
    "/api/user/:userId",
    async (req, res) => {
        try {
            const user =
                await User.findById(
                    req.params.userId
                ).select("-password");

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message:
                        "User not found"
                });
            }

            res.json({
                success: true,
                user
            });

        } catch (error) {
            console.error(
                "GET USER ERROR:",
                error.message
            );

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found",
        path: req.originalUrl
    });
});

// ======================================================
// ERROR HANDLER
// ======================================================

app.use(
    (err, req, res, next) => {
        console.error(
            "SERVER ERROR:",
            err.message
        );

        res.status(500).json({
            success: false,
            message:
                "Internal server error",
            error: err.message
        });
    }
);

// ======================================================
// LOCAL SERVER
// ======================================================

if (require.main === module) {

    const PORT =
        process.env.PORT || 5000;

    app.listen(
        PORT,
        () => {
            console.log(
                `Gatnora server running at http://localhost:${PORT}`
            );
        }
    );
}

// ======================================================
// VERCEL EXPORT
// ======================================================

module.exports = app;

