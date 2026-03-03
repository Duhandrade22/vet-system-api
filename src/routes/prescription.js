import { PrismaClient } from "@prisma/client";
import express from "express";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// CREATE PRESCRIPTION
router.post("/records/:recordId/prescription", authenticateToken, async (req, res) => {
  try {
    const { recordId } = req.params;
    const { content, weight, attendedAt } = req.body;

    const record = await prisma.record.findFirst({
      where: { id: recordId, animal: { owner: { userId: req.userId } } },
    });

    if (!record) {
      return res.status(404).json({ error: "Prontuário não encontrado" });
    }

    const existing = await prisma.prescription.findUnique({
      where: { recordId },
    });

    if (existing) {
      return res.status(409).json({ error: "Já existe uma receita para este prontuário" });
    }

    const prescription = await prisma.prescription.create({
      data: {
        content,
        weight,
        attendedAt: new Date(attendedAt),
        animalId: record.animalId,
        userId: req.userId,
        recordId,
      },
    });

    return res.status(201).json(prescription);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

// GET PRESCRIPTION BY RECORD
router.get("/records/:recordId/prescription", authenticateToken, async (req, res) => {
  try {
    const { recordId } = req.params;

    const prescription = await prisma.prescription.findUnique({
      where: { recordId },
      include: {
        animal: {
          include: {
            owner: { select: { name: true } },
          },
        },
        user: { select: { name: true } },
      },
    });

    if (!prescription) {
      return res.status(404).json({ error: "Receita não encontrada" });
    }

    return res.json(prescription);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
