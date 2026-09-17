import { Router } from "express";
import express from "express";
import { generateWebsite } from "../controllers/website.controller.js";
import { safePath } from "../tools/website/safe-path.js";

const router = Router();

router.post("/", generateWebsite);

router.use("/preview/:projectId", (req, res, next) => {
	try {
		const projectDirectory = safePath(req.params.projectId);
		return express.static(projectDirectory)(req, res, next);
	} catch (error) {
		return res.status(404).json({
			success: false,
			message: "Website preview not found",
		});
	}
});

export default router;