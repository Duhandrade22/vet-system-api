import { PrismaClient } from "@prisma/client";
import express from "express";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

//GET ALL OWNERS
router.get("/owners", authenticateToken, async (req, res) => {
  try {
    const owners = await prisma.owner.findMany();
    return res.json(owners);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//CREATE OWNER
router.post("/owners", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
    } = req.body;

    const owner = await prisma.owner.create({
      data: {
        name,
        phone,
        email,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        zipCode,
        userId: req.userId,
      },
    });

    return res.status(201).json(owner);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});

//GET OWNER BY ID
router.get("/owners/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const owner = await prisma.owner.findUnique({ where: { id } });
    if (!owner) {
      return res.status(404).json({ error: "Dono não encontrado" });
    }
    return res.json(owner);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//UPDATE OWNER
router.patch("/owners/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
    } = req.body;

    const data = {};
    if (name) data.name = name;
    if (phone) data.phone = phone;
    if (email) data.email = email;
    if (street) data.street = street;
    if (number) data.number = number;
    if (complement) data.complement = complement;
    if (neighborhood) data.neighborhood = neighborhood;
    if (city) data.city = city;
    if (state) data.state = state;
    if (zipCode) data.zipCode = zipCode;

    const owner = await prisma.owner.update({
      data,
      where: { id },
    });

    return res.status(200).json({ message: "Dados atualizado com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//DELETE OWNER
router.delete("/owners/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const owner = await prisma.owner.findUnique({ where: { id } });
    if (!owner) {
      return res.status(404).json({ error: "Dono não encontrado" });
    }
    await prisma.owner.delete({ where: { id } });
    return res.status(200).json({ message: "Dono excluído com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
