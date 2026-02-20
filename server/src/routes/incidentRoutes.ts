import express from "express";
import {
  createIncident,
  getAllIncidents,
  getIncidentById,
} from "../controllers/incidentController";

const router = express.Router();

router.post("/create", createIncident);

router.get("/all", getAllIncidents);

router.get("/:id", getIncidentById);


export default router;