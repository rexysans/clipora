import { Router } from "express";
import passport from "passport";
import {
  googleCallback,
  logout,
  me
} from "../controllers/auth.controller.js";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false
  }),
  googleCallback
);

router.get("/me", requireAuth, me);
router.post("/logout", logout);

export default router;
