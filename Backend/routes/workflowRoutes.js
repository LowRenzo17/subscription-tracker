import { Router } from "express";
import { sendReminders } from "../controllers/workflowController.js";

const workflowRouter = Router();

workflowRouter.post("/subscriptions/reminders", sendReminders);


export default workflowRouter;
