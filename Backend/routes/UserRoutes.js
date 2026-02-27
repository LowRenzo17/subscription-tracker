import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";

import { getUser, getUsers, createUser, updateUser, deleteUser } from "../controllers/userController.js"

const userRoutes = Router();

userRoutes.get("/", authMiddleware, getUsers);
userRoutes.get("/:id", authMiddleware, getUser);
userRoutes.post("/create", createUser);
userRoutes.put("/update/:id", authMiddleware, updateUser);
userRoutes.delete("/delete/:id", authMiddleware, deleteUser);

export default userRoutes;
