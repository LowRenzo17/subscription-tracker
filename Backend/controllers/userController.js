import User from "../models/userModel.js";
import bcrypt from 'bcrypt';

export const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json({ success: true, data: users })
    } catch (error) {
        console.error("GET USERS error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password")
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ success: true, data: user })
    } catch (error) {
        console.error("GET USER error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const createUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ message: 'Email already in use' });

        const user = await User.create({ name, email, password });

        return res.status(201).json({ success: true, id: user._id, name: user.name, email: user.email });
    } catch (err) {
        console.error("CREATE USER error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ success: true, data: user })
    } catch (error) {
        console.error("UPDATE USER error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
        res.status(204).json({ success: true, data: null, message: "User deleted successfully" })
    } catch (error) {
        console.error("DELETE USER error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}