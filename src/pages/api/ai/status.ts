import { NextApiRequest, NextApiResponse } from "next";
import { aiServiceManager } from "@/lib/ai-service-manager";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const servicesStatus = await aiServiceManager.getServicesStatus();

    const services = Object.entries(servicesStatus);
    const healthyCount = services.filter(
      ([_, status]) => status.status === "healthy"
    ).length;
    const totalCount = services.length;

    const response = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalCount,
        healthy: healthyCount,
        unhealthy: totalCount - healthyCount,
        status: healthyCount > 0 ? "operational" : "down",
      },
      services: servicesStatus,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error checking AI services status:", error);
    return res.status(500).json({
      error: "Failed to check services status",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
