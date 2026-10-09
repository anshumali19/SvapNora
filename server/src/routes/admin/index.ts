import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { contentAdminRouter } from "./content";
import { contactAdminRouter } from "./contact";
import { paymentsAdminRouter } from "./payments";
import { overviewAdminRouter } from "./overview";
import { auditAdminRouter } from "./audit";
import { adminsAdminRouter } from "./admins";
import { usersAdminRouter } from "./users";

/**
 * Admin API. Every route below requires an authenticated session. Individual
 * sub-routers additionally enforce fine-grained permissions server-side.
 */
export const adminRouter = Router();

adminRouter.use(requireAuth);

adminRouter.use("/overview", overviewAdminRouter);
adminRouter.use("/content", contentAdminRouter);
adminRouter.use("/contact", contactAdminRouter);
adminRouter.use("/payments", paymentsAdminRouter);
adminRouter.use("/users", usersAdminRouter);
adminRouter.use("/audit", auditAdminRouter);
adminRouter.use("/admins", adminsAdminRouter);
