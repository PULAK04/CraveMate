const env = import.meta.env;

export const brandName = "CraveMate";

export const authService = env.VITE_AUTH_SERVICE || "http://localhost:5000";
export const restaurantService =
  env.VITE_RESTAURANT_SERVICE || "http://localhost:5001";
export const utilsService = env.VITE_UTILS_SERVICE || "http://localhost:5002";
export const realtimeService =
  env.VITE_REALTIME_SERVICE || "http://localhost:5004";
export const riderService = env.VITE_RIDER_SERVICE || "http://localhost:5005";
export const adminService = env.VITE_ADMIN_SERVICE || "http://localhost:5006";

export const googleClientId = env.VITE_GOOGLE_CLIENT_ID || "";
