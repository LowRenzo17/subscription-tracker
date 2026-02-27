import mongoose from "mongoose";

import {DB_URI, NODE_ENV} from "../config/env.js"

if (!DB_URI) {
    throw new Error("Please define the mongodb connection string")
};

const connectToDatabase = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log(`Connected to the database successfully in ${NODE_ENV} environment`);
    } catch (error) {
        console.error("Failed to connect to the database", error);
        process.exit(1);
    }
}

export default connectToDatabase;