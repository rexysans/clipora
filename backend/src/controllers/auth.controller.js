import { signJwt } from "../utils/jwt.js";

export const googleCallback = (req, res) => {
  const token = signJwt(req.user.id);

  res.cookie("access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Only secure in production
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // Use 'lax' in development
    maxAge: 15 * 60 * 1000,
  });

  res.redirect(process.env.FRONTEND_URL);
};

export const me = (req, res) => {
  res.json(req.user);
};

export const logout = (req, res) => {
  res.clearCookie("access_token");
  res.sendStatus(204);
};