import { PrismaClient } from "@prisma/client";
import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { emailDomainExists } from "../utils/emailDomainExists.js";

const router = express.Router();
const prisma = new PrismaClient();

//GET ALL OWNERS
router.get("/owners", authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const where = {
      userId: req.userId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [owners, total] = await Promise.all([
      prisma.owner.findMany({
        where,
        include: {
          animals: true,
        },
        skip,
        take: limit,
        orderBy: {
          name: "asc",
        },
      }),
      prisma.owner.count({
        where,
      }),
    ]);

    return res.json({
      data: owners,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
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

    if (email) {
      const domainExists = await emailDomainExists(email);
      if (!domainExists) {
        return res.status(400).json({ error: "Domínio de email inválido" });
      }
    }

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
    const owner = await prisma.owner.findUnique({
      where: { id, userId: req.userId },
    });
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

    if (email) {
      const domainExists = await emailDomainExists(email);
      if (!domainExists) {
        return res.status(400).json({ error: "Domínio de email inválido" });
      }
    }

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
      where: { id, userId: req.userId },
    });

    return res.json(owner);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//DELETE OWNER
router.delete("/owners/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const owner = await prisma.owner.findUnique({
      where: { id, userId: req.userId },
    });
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
