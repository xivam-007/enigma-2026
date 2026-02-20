import { Request, Response } from "express";
import Incident from "../models/Incident";


// Create Incident
export const createIncident = async (req: Request, res: Response) => {
    console.log("Received request to create incident with data:", req.body);
  try {
    const { title, description, location, severity } = req.body;

    const incident = new Incident({
      title,
      description,
      location,
      severity,
    });

    await incident.save();

    res.status(201).json({
      success: true,
      data: incident,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating incident",
      error,
    });
  }
};


// Get all incidents
export const getAllIncidents = async (req: Request, res: Response) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: incidents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching incidents",
      error,
    });
  }
};


// Get incident by ID
export const getIncidentById = async (req: Request, res: Response) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching incident",
      error,
    });
  }
};