import User from "../models/User.js";
import { signToken } from "../middleware/auth.js";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/auth/register */
export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required." });
    }
    if (!emailRe.test(email)) {
      return res.status(400).json({ error: "Invalid email address." });
    }
    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters." });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const user = new User({ name: name || "", email });
    await user.setPassword(password);
    await user.save();

    const token = signToken(user._id.toString());
    return res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    console.error("[auth] register error:", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

/** POST /api/auth/login */
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required." });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user._id.toString());
    return res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    console.error("[auth] login error:", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
}

/** GET /api/auth/me — current user from the Bearer token. */
export async function me(req, res) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({ user: user.toSafeJSON() });
  } catch (err) {
    console.error("[auth] me error:", err.message);
    return res.status(500).json({ error: "Internal server error." });
  }
}
