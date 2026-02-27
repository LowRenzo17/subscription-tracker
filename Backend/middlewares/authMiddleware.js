import jwt from "jsonwebtoken";

import { JWT_SECRET } from "../config/env.js";

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Error in authMiddleware:", error);
        res.status(403).json({ error: "Forbidden" });
    }
};

export default authMiddleware;