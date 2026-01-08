import { Router } from "express";
import passport from "passport";
import {
  googleCallback,
  logout,
  me,
  checkUsername,
  updateUsername
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
router.get("/check-username", checkUsername);
router.put("/update-username", requireAuth, updateUsername);

export default router;
