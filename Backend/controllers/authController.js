import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";

export async function signUp(req, res) {
    // debug: log incoming request
    // console.log("SIGNUP request body:", req.body);
    // console.log("SIGNUP headers (user-agent):", req.headers['user-agent']);
    // console.log("SIGNUP ip:", req.ip);

    let session = null;
    try {
        // Detect whether the connected MongoDB supports transactions (replica set / mongos)
        let supportsTransactions = false;
        try {
            const admin = mongoose.connection.db.admin();
            const info = await admin.command({ ismaster: 1 });
            supportsTransactions = !!info.setName;
        } catch (detErr) {
            console.warn("Could not determine replica set status, assuming no transactions:", detErr.message);
            supportsTransactions = false;
        }

        if (supportsTransactions) {
            try {
                session = await mongoose.startSession();
                session.startTransaction();
            } catch (sessionErr) {
                console.warn("Transactions not available, continuing without session:", sessionErr.message);
                session = null;
            }
        } else {
            console.warn("Transactions not supported by MongoDB server; proceeding without transactions.");
            session = null;
        }

        if (!req.body || typeof req.body !== "object") {
            throw new Error("Request body is missing or invalid. Ensure Content-Type: application/json and express.json() middleware is enabled.");
        }

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            if (session) { await session.abortTransaction(); session.endSession(); }
            return res.status(400).json({ error: "Missing required fields: name, email, password" });
        }

        // check if the user already exists
        let existingUserQuery = User.findOne({ email });
        if (session) existingUserQuery = existingUserQuery.session(session);
        const existingUser = await existingUserQuery;

        if (existingUser) {
            if (session) { await session.abortTransaction(); session.endSession(); }
            return res.status(409).json({ message: "User already exists" });
        }

        // create a new user (use session only if available)
        let newUser;
        if (session) {
            const newUsers = await User.create([{ name, email, password }], { session });
            newUser = newUsers[0];
        } else {
            newUser = await User.create({ name, email, password });
        }

        const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        if (session) {
            await session.commitTransaction();
            session.endSession();
        }

        res.status(201).json({ success: true, message: "User created successfully", token });
    } catch (err) {
        console.error("SIGNUP error:", err && (err.stack || err));
        try {
            if (session) await session.abortTransaction();
        } catch (e) {
            console.error("Failed to abort session:", e);
        }
        if (session) session.endSession();

        const message = (err && (err.message || String(err))) || "Unknown error";
        return res.status(400).json({ error: message });
    }
}

export const signIn = async (req, res, next) => {
    try {
        if (!req.body || typeof req.body !== "object") {
            return res.status(400).json({ success: false, message: "Request body required" });
        }
        const { email, password } = req.body;
        if (!email || !password || typeof password !== "string") {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        // ensure password field is selected (in case schema uses select:false)
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (!user.password) {
            // clearer client-facing message and a server log for debugging
            console.error("SIGNIN: user has no stored password hash:", user._id);
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.status(200).json({
            success: true,
            message: "User signed in successfully",
            data: { token, user: { id: user._id, name: user.name, email: user.email } }
        });
    } catch (error) {
        console.error("SIGNIN error:", error);
        res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal server error" });
    }
}


export const signOut = async (req, res) => {
    try {
        // Invalidate the token (implementation depends on your token strategy)
        res.status(200).json({ success: true, message: "User signed out successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}