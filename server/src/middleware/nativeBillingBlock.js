const blockNativeBilling = (req, res, next) => {
    const ua = req.get("user-agent") || "";
  
    const isAndroid = ua.includes("Android");
    const isCapacitor = ua.includes("wv") || ua.includes("Capacitor");
  
    // We want to block native apps (Android/Capacitor) from hitting billing endpoints.
    // iOS detection can be added by checking for "iPhone" combined with Capacitor.
    if (isAndroid || isCapacitor) {
      return res.status(403).json({
        error: "Billing unavailable inside native app.",
      });
    }
    
    next();
};
  
module.exports = { blockNativeBilling };
