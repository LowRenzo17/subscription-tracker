import Subscription from "../models/subscriptionModel.js";
import { workflowClient } from "../config/upstash.js"
import { SERVER_URL } from "../config/env.js";

export const createSubscription = async (req, res) => {
    try {
        // prefer authenticated user, fall back to explicit userId in body
        const userId = req.user?.id || req.user?._id || req.body.userId;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Missing user id. Provide authenticated user or include userId in request body.' });
        }

        // map incoming names (interval -> frequency) and validate required fields
        const {
            name,
            price,
            currency = 'USD',
            frequency = req.body.interval, // accept either frequency or interval
            category,
            paymentMethod,
            startDate
        } = req.body;

        if (!name || price == null || !frequency || !category || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Missing required fields: name, price, frequency (or interval), category, paymentMethod' });
        }

        // normalize and validate category (model expects lowercase enum values)
        const allowedCategories = ['sports', 'news', 'entertainment', 'lifestyle', 'technology', 'finance', 'politics', 'other'];
        const categoryNormalized = String(category).trim().toLowerCase();
        if (!allowedCategories.includes(categoryNormalized)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category',
                allowed: allowedCategories
            });
        }

        // create and save to DB
        const subscription = await Subscription.create({
            user: userId,
            name,
            price,
            currency,
            frequency,
            category: categoryNormalized,
            paymentMethod,
            startDate: startDate ? new Date(startDate) : new Date()
        });

        const { workflowRunId } = await workflowClient.trigger({
            url: `${SERVER_URL}/api/v1/workflows/subscriptions/reminders`,
            body: {
                subscriptionId: subscription.id,
            },
            headers: {
                'content-type': 'application/json',
            },
            retries: 0,
        });

        return res.status(201).json({ success: true, data: { subscription, workflowRunId } });
    } catch (err) {
        // Improved error handling for debugging
        console.error('createSubscription error:', err);

        if (err.name === 'ValidationError') {
            const errors = Object.keys(err.errors).reduce((acc, key) => {
                acc[key] = err.errors[key].message;
                return acc;
            }, {});
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        if (err.code && (err.code === 11000 || err.code === 11001)) {
            return res.status(400).json({ success: false, message: 'Duplicate key error', keyValue: err.keyValue });
        }

        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
}

export const getUserSubscriptions = async (req, res, next) => {
    try {
        if (req.user && req.user.id !== req.params.id) {
            const error = new Error("You are not the owner of this account");
            error.status = 401;
            throw error;
        }
        const subscriptions = await Subscription.find({ user: req.params.id }).populate('user', 'name email');
        res.status(200).json({ success: true, data: subscriptions });
    } catch (error) {
        console.error('getUserSubscriptions error:', error);
        if (typeof next === 'function') return next(error);
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
    }
}

export const getAllSubscriptions = async (req, res) => {
    try {
        // find all subscriptions and populate the referenced user document
        const subscriptions = await Subscription.find({})
            .populate('user', 'name email')
            .lean();

        return res.status(200).json({ success: true, data: subscriptions });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

export const getAllSubscriptionsDetails = async (req, res, next) => {
    try {
        // route is GET /:id — return single subscription with populated user
        const subscription = await Subscription.findById(req.params.id).populate('user', 'name email');
        if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found' });
        res.status(200).json({ success: true, data: subscription });
    } catch (error) {
        console.error('getAllSubscriptionsDetails error:', error);
        if (typeof next === 'function') return next(error);
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
    }
}

export const updateSubcription = async (req, res, next) => {
    try {
        const updates = req.body;
        const subscription = await Subscription.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!subscription) {
            return res.status(404).json({ success: false, message: "Subscription not found" });
        }
        res.status(200).json({ success: true, data: subscription });
    } catch (error) {
        console.error('updateSubcription error:', error);
        if (typeof next === 'function') return next(error);
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
    }
}

export const deleteSubscription = async (req, res, next) => {
    try {
        const subscription = await Subscription.findByIdAndDelete(req.params.id);
        if (!subscription) {
            return res.status(404).json({ success: false, message: "Subscription not found" });
        }
        res.status(200).json({ success: true, data: subscription });
    } catch (error) {
        console.error('deleteSubscription error:', error);
        if (typeof next === 'function') return next(error);
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
    }
}

export const cancelSubscription = async (req, res, next) => {
    try {
        // schema uses 'cancelled' — use same spelling
        const subscription = await Subscription.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
        if (!subscription) {
            return res.status(404).json({ success: false, message: "Subscription not found" });
        }
        res.status(200).json({ success: true, data: subscription });
    } catch (error) {
        console.error('cancelSubscription error:', error);
        if (typeof next === 'function') return next(error);
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
    }
}

export const getUpcomingRenewals = async (req, res, next) => {
    try {
        // use renewalDate field and return upcoming renewals from now onward
        const upcomingRenewals = await Subscription.find({ renewalDate: { $gte: new Date() } }).sort('renewalDate').populate('user', 'name email');
        res.status(200).json({ success: true, data: upcomingRenewals });
    } catch (error) {
        console.error('getUpcomingRenewals error:', error);
        if (typeof next === 'function') return next(error);
        return res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
    }
}