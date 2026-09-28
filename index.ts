import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { config } from "./config";
import { authRouter } from "./auth";
import { campaignsRouter } from "./routes/campaigns";
import { publicRouter } from "./routes/public";
import { errorHandler } from "./http";
import { openapi } from "./openapi";

const app = express();
app.use(cors({ origin: config.clientUrl }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.use("/api/auth", authRouter);
app.use("/api/campaigns", campaignsRouter);
app.use(publicRouter);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`API running on http://localhost:${config.port}  (docs: /api/docs)`);
});
