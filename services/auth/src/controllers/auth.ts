import User from "../model/User.js";
import jwt from "jsonwebtoken";
import TryCatch from "../middlewares/trycatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { oauth2client } from "../config/googleConfig.js";
import axios from "axios";
import bcrypt from "bcryptjs";

export const loginUser = TryCatch(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      message: "Authorization code is required",
    });
  }

  const googleRes = await oauth2client.getToken(code);

  oauth2client.setCredentials(googleRes.tokens);

  if (!googleRes.tokens.access_token) {
    return res.status(401).json({ message: "Google did not return an access token" });
  }

  const userRes = await axios.get(
    "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
    { headers: { Authorization: `Bearer ${googleRes.tokens.access_token}` } }
  );
  const { email, name, picture } = userRes.data;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      image: picture,
    });
  }

  const token = jwt.sign(
  {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
    },
  },
  process.env.JWT_SEC as string,
  {
    expiresIn: "15d",
  }
);

  res.status(200).json({
    message: "Logged Success",
    token,
    user,
  });
});


export const registerWithEmail = TryCatch(async (req, res) => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name?.trim()) {
    return res.status(400).json({
      message: "Name is required",
    });
  }

  if (!email?.trim()) {
    return res.status(400).json({
      message: "Email is required",
    });
  }

  if (!password) {
    return res.status(400).json({
      message: "Password is required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({
      message: "Please enter a valid email address",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters",
    });
  }

  const existingUser = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (existingUser) {
    return res.status(409).json({
      message:
        "An account with this email already exists. Please sign in instead.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,

    image: `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name.trim()
    )}&background=f97316&color=fff`,

    password: hashedPassword,

    role: null,
  });

  const token = jwt.sign(
    {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
    },
    process.env.JWT_SEC as string,
    {
      expiresIn: "15d",
    }
  );

  res.status(201).json({
    message: "Account created successfully",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
    },
  });
});




export const loginWithEmail = TryCatch(async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  if (!user.password) {
    return res.status(400).json({
      message:
        "This account uses Google Sign-In. Please continue with Google.",
    });
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const token = jwt.sign(
    {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
    },
    process.env.JWT_SEC as string,
    {
      expiresIn: "15d",
    }
  );

  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
    },
  });
});





const allowedRoles = ["customer", "rider", "seller"] as const;
type Role = (typeof allowedRoles)[number];

export const addUserRole = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user?._id) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const { role } = req.body as { role: Role };

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      message: "Invalid role",
    });
  }

  const currentUser = await User.findById(req.user._id);
  if (!currentUser) {
    return res.status(404).json({ message: "User not found" });
  }
  if (currentUser.role) {
    return res.status(409).json({ message: "Account role has already been selected" });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { role },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const token = jwt.sign({ user }, process.env.JWT_SEC as string, {
    expiresIn: "15d",
  });

  res.json({ user, token });
});

export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  res.json(user);
});
