import { PrismaClient } from "@prisma/client";
import express from "express";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

//GET ALL ANIMALS
router.get("/animals", authenticateToken, async (req, res) => {
  try {
    const animals = await prisma.animal.findMany({
      where: {
        owner: {
          userId: req.userId,
        },
      },
      include: {
        owner: true,
        records: true,
      },
    });
    return res.json(animals);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//CREATE ANIMAL
router.post("/animals", authenticateToken, async (req, res) => {
  try {
    const { name, species, breed, birthDate, ownerId } = req.body;
    const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
    if (!owner) {
      return res.status(404).json({ error: "Tutor não encontrado" });
    }
    if (owner.userId !== req.userId) {
      return res.status(403).json({
        error: "Você não tem permissão para criar um animal para este tutor",
      });
    }
    if (birthDate) {
      const birth = new Date(birthDate);
      const today = new Date();
      if (birth > today) {
        return res
          .status(400)
          .json({ error: "A data de nascimento não pode ser no futuro" });
      }
    }
    const animal = await prisma.animal.create({
      data: {
        name,
        species,
        breed,
        birthDate: birthDate ? new Date(birthDate) : null,
        ownerId,
      },
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
    const animal = await prisma.animal.findFirst({
      where: { id, owner: { userId: req.userId } },
      include: { owner: { select: { id: true, name: true } } },
    });
    if (!animal) {
      return res.status(404).json({ error: "Animal não encontrado" });
    }
    return res.json(animal);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//UPDATE ANIMAL
router.patch("/animals/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, species, birthDate, breed } = req.body;

    console.log("Body recebido:", req.body);
    console.log("birthDate:", birthDate);
    console.log("birthDate type:", typeof birthDate);

    const data = {};
    if (name) data.name = name;
    if (species) data.species = species;
    if (breed) data.breed = breed;
    if (birthDate !== undefined)
      data.birthDate = birthDate ? new Date(birthDate) : null;
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
