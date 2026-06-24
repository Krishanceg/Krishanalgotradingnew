import { Router } from "express";
import { getQuotes } from "../controllers/market.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/quotes", getQuotes);

export default router;
