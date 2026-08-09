import axios from "axios";
import getBuffer from "../config/datauri.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/trycatch.js";
import Restaurant from "../models/Restaurant.js";
import jwt from "jsonwebtoken";

export const addRestraunt = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const existingRestaunrant = await Restaurant.findOne({
    ownerId: user._id,
  });

  if (existingRestaunrant) {
    return res.status(400).json({
      message: "You already have a restaurant",
    });
  }

  const { name, description, latitude, longitude, formattedAddress, phone } =
    req.body;

  const phoneText = String(phone || "").replace(/\D/g, "");
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!name?.trim() || !/^\d{10}$/.test(phoneText) || !formattedAddress?.trim()) {
    return res.status(400).json({ message: "Name, valid 10-digit phone number and location are required" });
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({ message: "Invalid restaurant location" });
  }

  const file = req.file;

  if (!file) {
    return res.status(400).json({
      message: "Please give image",
    });
  }

  const fileBuffer = getBuffer(file);

  if (!fileBuffer?.content) {
    return res.status(500).json({
      message: "Failed to create file buffer",
    });
  }

  const { data: uploadResult } = await axios.post(
    `${process.env.UTILS_SERVICE}/api/upload`,
    {
      buffer: fileBuffer.content,
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
      },
    }
  );

  const restaurant = await Restaurant.create({
    name: name.trim(),
    description: description?.trim() || "",
    phone: Number(phoneText),
    image: uploadResult.url,
    ownerId: user._id,
    autoLocation: {
      type: "Point",
      coordinates: [lng, lat],
      formattedAddress: formattedAddress.trim(),
    },
    isVerified: false,
  });

  return res.status(201).json({
    message: "Restaurant created successfully",
    restaurant,
  });
});

export const fetchMyRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Please Login",
      });
    }
    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if (!restaurant) {
      return res.status(400).json({
        message: "No Restaurant found",
      });
    }

    if (!req.user.restaurantId) {
      const token = jwt.sign(
        {
          user: {
            ...req.user,
            restaurantId: restaurant._id,
          },
        },
        process.env.JWT_SEC as string,
        {
          expiresIn: "15d",
        }
      );

      return res.json({ restaurant, token });
    }

    res.json({ restaurant });
  }
);

export const updateStatusRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(403).json({
        message: "Please Login",
      });
    }

    const { status } = req.body;

    if (typeof status !== "boolean") {
      return res.status(400).json({
        message: "Status must be boolean",
      });
    }

    const currentRestaurant = await Restaurant.findOne({ ownerId: req.user._id });
    if (!currentRestaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    if (status && !currentRestaurant.isVerified) {
      return res.status(403).json({ message: "Restaurant must be verified before opening" });
    }
    currentRestaurant.isOpen = status;
    await currentRestaurant.save();
    const restaurant = currentRestaurant;

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    res.json({
      message: "Restaurant status Updated",
      restaurant,
    });
  }
);

export const updateRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(403).json({
        message: "Please Login",
      });
    }

    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Restaurant name is required" });
    }

    const restaurant = await Restaurant.findOneAndUpdate(
      { ownerId: req.user._id },
      { name: name.trim(), description: description?.trim() || "" },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    res.json({
      message: "Restaurant Updated",
      restaurant,
    });
  }
);

export const getNearbyRestaurant = TryCatch(async (req, res) => {
  const { latitude, longitude, radius = 5000, search = "" } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      message: "Latitude and longitude are required",
    });
  }

  const query: any = {
    isVerified: true,
  };

  if (search && typeof search === "string") {
    query.name = { $regex: search, $options: "i" };
  }

  const restaurants = await Restaurant.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
        distanceField: "distance",
        maxDistance: Number(radius),
        spherical: true,
        query,
      },
    },
    {
      $sort: {
        isOpen: -1,
        distance: 1,
      },
    },
    {
      $addFields: {
        distanceKm: {
          $round: [{ $divide: ["$distance", 1000] }, 2],
        },
      },
    },
  ]);

  res.json({
    success: true,
    count: restaurants.length,
    restaurants,
  });
});

export const fetchSingleRestaurant = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const isOwner = req.user?._id?.toString() === restaurant.ownerId;
    if (!restaurant.isVerified && !isOwner) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(restaurant);
  }
);
