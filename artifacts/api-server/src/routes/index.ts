import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import videosRouter from "./videos.js";
import titlesRouter from "./titles.js";
import scriptsRouter from "./scripts.js";
import historyRouter from "./history.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/videos", videosRouter);
router.use("/titles", titlesRouter);
router.use("/scripts", scriptsRouter);
router.use("/history", historyRouter);
router.use("/stats", historyRouter);

export default router;
