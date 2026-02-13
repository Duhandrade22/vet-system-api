import { PrismaClient } from "@prisma/client";
import express from "express";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

//GET ALL RECORDS
router.get("/records", authenticateToken, async (req, res) => {
  try {
    const records = await prisma.record.findMany();

    const formattedRecords = records.map((record) => ({
      ...record,
      attendedAt: new Date(record.attendedAt).toLocaleDateString("pt-BR"),
    }));

    return res.json(formattedRecords);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//CREATE RECORD
router.post("/records", authenticateToken, async (req, res) => {
  try {
    const { weight, medications, dosage, notes, attendedAt, animalId } =
      req.body;
    const record = await prisma.record.create({
      data: { weight, medications, dosage, notes, attendedAt, animalId },
    });

    return res.json(record);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//GET RECORD BY ID
router.get("/records/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.record.findUnique({ where: { id } });
    return res.json(record);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//UPDATE RECORD
router.patch("/records/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { weight, medications, dosage, notes, attendedAt, animalId } =
      req.body;
    const data = {};
    if (weight) data.weight = weight;
    if (medications) data.medications = medications;
    if (dosage) data.dosage = dosage;
    if (notes) data.notes = notes;
    if (attendedAt) data.attendedAt = attendedAt;
    if (animalId) data.animalId = animalId;
    const record = await prisma.record.update({ where: { id }, data });

    return res.json(record);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//DELETE RECORD
router.delete("/records/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.record.delete({ where: { id } });

    return res.status(200).json({ message: "Registro excluído com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
