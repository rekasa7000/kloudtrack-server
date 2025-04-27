import { Router, Request, Response } from "express";
import { asyncHandler } from "../middleware/error-handler.middleware";
import { mqttService } from "../services/mqtt/instance";

const router = Router();

router.post(
  "/:deviceId/command",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.params;
      const { command, parameters } = req.body;

      if (!command) {
        return res.status(400).json({ error: "Command is required" });
      }

      const message = {
        command,
        parameters: parameters || {},
        timestamp: new Date().toISOString(),
      };

      await mqttService.publish(`devices/${deviceId}/commands`, message, {
        qos: 1,
      });

      res
        .status(200)
        .json({ success: true, message: "Command sent successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to send command" });
    }
  })
);

export default router;
