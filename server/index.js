import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import eventTypesRoutes from "./routes/eventTypes.js";
import availabilityRoutes from "./routes/availability.js";
import bookingsRoutes from "./routes/bookings.js";
import slotsRoutes from "./routes/slots.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration - allow frontend origin from environment or all origins for development
const corsOptions = {
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/event-types", eventTypesRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/slots", slotsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
