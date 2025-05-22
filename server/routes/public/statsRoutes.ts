import { Router } from "express";
import { storage } from "../../storage";

const statsRouter = Router();

// Public stats endpoint for basic dashboard metrics
// This doesn't expose any sensitive data
statsRouter.get("/testimonials", async (req, res) => {
  try {
    const testimonials = await storage.getTestimonials();
    if (!testimonials || testimonials.length === 0) {
      return res.json([]); // Return empty array instead of error if no testimonials
    }
    res.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    // Return empty array with 200 status to prevent client errors
    res.json([]);
  }
});

statsRouter.get("/public", async (req, res) => {
  try {
    const [userCount, productCount, orderCount] = await Promise.all([
      storage.countUsers(),
      storage.countProducts(),
      storage.countOrders()
    ]);

    res.json({
      users: userCount,
      products: productCount,
      orders: orderCount
    });
  } catch (error) {
    console.error("Error fetching public stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export function setupPublicStatsRoutes(app: Router) {
  app.use('/api/stats', statsRouter);
}