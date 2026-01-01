import jwt from "jsonwebtoken";

export function signJwt(userId) {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
      issuer: "video-streaming-backend"
    }
  );
}

export function verifyJwt(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
