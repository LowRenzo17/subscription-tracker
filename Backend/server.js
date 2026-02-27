import express from "express";
import cookieParser from "cookie-parser";

import { PORT } from "./config/env.js";
import connectToDatabase from "./database/mongodb.js";
import userRoutes from "./routes/UserRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import authRoutes from "./routes/authRoute.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import arcjetMiddleware from "./middlewares/arcjetMiddleware.js";
import workflowRouter from "./routes/workflowRoutes.js";

const app = express();

// must be before route registration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(arcjetMiddleware);

// register public auth + subscriptions routes before the bot-check middleware
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/workflows", workflowRouter);

app.use(errorMiddleware);

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  await connectToDatabase();
});

export default app;