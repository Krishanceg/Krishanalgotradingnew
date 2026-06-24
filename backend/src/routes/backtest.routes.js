import { Router } from "express";
import {
  createBacktest,
  listBacktests,
  getBacktest,
  deleteBacktest,
} from "../controllers/backtest.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All backtest routes require a logged-in user.
router.use(requireAuth);

router.post("/backtest", createBacktest);
router.get("/backtests", listBacktests);
router.get("/backtests/:id", getBacktest);
router.delete("/backtests/:id", deleteBacktest);

export default router;
