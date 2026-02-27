import { Router } from "express";

import authMiddleware from "../middlewares/authMiddleware.js";

import { createSubscription, getUserSubscriptions, getAllSubscriptions, getAllSubscriptionsDetails, updateSubcription, deleteSubscription, cancelSubscription, getUpcomingRenewals } from "../controllers/subcriptionController.js";

const subscriptionRouter = Router();

// debug middleware - add at top (before auth middleware/routes)
const subsDebug = (req, res, next) => {
  console.log("SUBS DEBUG =>", req.method, req.originalUrl);
  console.log("HEADERS:", {
    authorization: req.headers.authorization,
    cookie: req.headers.cookie,
    "user-agent": req.headers["user-agent"],
    host: req.headers.host
  });
  // if token may be sent in cookies:
  if (req.cookies) console.log("COOKIES:", req.cookies);
  // small body preview
  console.log("BODY:", req.body && Object.keys(req.body).length ? req.body : "(empty)");
  next();
};

subscriptionRouter.use(subsDebug);

subscriptionRouter.get('/', getAllSubscriptions);

// Provide both /subscribe and /create (or use one of them)
subscriptionRouter.post('/subscribe', authMiddleware, createSubscription);
subscriptionRouter.post('/create', authMiddleware, createSubscription);

// Put static/specific routes before the param route
subscriptionRouter.get('/upcoming-renewals', authMiddleware, getUpcomingRenewals);
subscriptionRouter.get('/user/:id', authMiddleware, getUserSubscriptions);
subscriptionRouter.put('/:id/cancel', authMiddleware, cancelSubscription);

// Param routes (id) last
subscriptionRouter.get('/:id', authMiddleware, getAllSubscriptionsDetails);
subscriptionRouter.put('/update/:id', authMiddleware, updateSubcription);
subscriptionRouter.delete('/delete/:id', authMiddleware, deleteSubscription);

export default subscriptionRouter;