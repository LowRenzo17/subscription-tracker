import aj from "../config/arcjet.js";

const SKIP_PATHS = ["/api/v1/auth", "/api/v1/subscriptions"]; // paths to bypass ArcJet checks

const arcjetMiddleware = async (req, res, next) => {
    try {
        // quick skip for known public paths
        if (SKIP_PATHS.some(p => req.path.startsWith(p) || req.originalUrl.startsWith(p))) {
            console.debug("ArcJet: skipping check for", req.method, req.originalUrl);
            return next();
        }

        console.debug("ArcJet check:", req.method, req.originalUrl, "UA:", req.headers["user-agent"]);

        const decision = await aj.protect(req, { requested: 1 });

        // debug log minimal decision info
        try {
            console.debug("ArcJet decision - denied:", decision.isDenied && decision.isDenied(), "reason:", decision.reason && typeof decision.reason.toString === "function" ? decision.reason.toString() : decision.reason);
        } catch (e) {
            console.debug("ArcJet decision: (could not stringify)", e);
        }

        if (decision.isDenied && decision.isDenied()) {
            if (decision.reason && decision.reason.isRateLimit && decision.reason.isRateLimit()) {
                return res.status(429).json({ error: "Rate limit exceeded" });
            }
            if (decision.reason && decision.reason.isBot && decision.reason.isBot()) {
                return res.status(403).json({ error: "Bot detected" });
            }
            return res.status(403).json({ error: "Access denied" });
        }

        return next();

    } catch (error) {
        console.error("Error in ArcJet middleware:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export default arcjetMiddleware;