import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";

import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import catalogRoutes from "./routes/catalog.routes";
import productsRoutes from "./routes/products.routes";
import customersRoutes from "./routes/customers.routes";
import suppliersRoutes from "./routes/suppliers.routes";
import salesRoutes from "./routes/sales.routes";
import purchaseOrdersRoutes from "./routes/purchaseOrders.routes";
import repairsRoutes from "./routes/repairs.routes";
import dashboardRoutes from "./routes/dashboard.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  if (env.nodeEnv !== "test") {
    app.use(morgan("dev"));
  }

  app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/catalog", catalogRoutes);
  app.use("/api/products", productsRoutes);
  app.use("/api/customers", customersRoutes);
  app.use("/api/suppliers", suppliersRoutes);
  app.use("/api/sales", salesRoutes);
  app.use("/api/purchase-orders", purchaseOrdersRoutes);
  app.use("/api/repair-tickets", repairsRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
