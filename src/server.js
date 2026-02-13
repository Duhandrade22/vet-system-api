import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import animalRoutes from "./routes/animal.js";
import authRoutes from "./routes/auth.js";
import ownerRoutes from "./routes/owner.js";
import recordRoutes from "./routes/record.js";
import userRoutes from "./routes/user.js";
dotenv.config();

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  }),
);

//Segurança = (Previne abuso de requisições)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Muitas requisições de uma vez. Tente novamente mais tarde.",
});

app.use(limiter);

app.use(express.json());

//ROUTES
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", ownerRoutes);
app.use("/", animalRoutes);
app.use("/", recordRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
