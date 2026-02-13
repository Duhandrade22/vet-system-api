import { PrismaClient } from "@prisma/client";
import express from "express";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

//GET ALL ANIMALS
router.get("/animals", authenticateToken, async (req, res) => {
  try {
    const animals = await prisma.animal.findMany();
    return res.json(animals);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//CREATE ANIMAL
router.post("/animals", authenticateToken, async (req, res) => {
  try {
    const { name, species, breed, ownerId } = req.body;
    const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner) {
      return res.status(404).json({ error: "Dono não encontrado" });
    }
    if (owner.userId !== req.userId) {
      return res.status(403).json({
        error: "Você não tem permissão para criar um animal para este tutor",
      });
    }
    const animal = await prisma.animal.create({
      data: { name, species, breed, ownerId },
    });

    return res.status(201).json(animal);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});

//GET ANIMAL BY ID
router.get("/animals/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const animal = await prisma.animal.findUnique({ where: { id } });
    if (!animal) {
      return res.status(404).json({ error: "Animal não encontrado" });
    }
    return res.status(201).json(animal);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//UPDATE ANIMAL
router.patch("/animals/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, species, breed } = req.body;
    const data = {};
    if (name) data.name = name;
    if (species) data.species = species;
    if (breed) data.breed = breed;
    const animal = await prisma.animal.update({
      data,
      where: { id },
    });

    return res.status(200).json(animal);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//DELETE ANIMAL
router.delete("/animals/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const animal = await prisma.animal.delete({ where: { id } });
    if (!animal) {
      return res.status(404).json({ error: "Animal não encontrado" });
    }

    return res.status(200).json({ message: "Animal excluído com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
