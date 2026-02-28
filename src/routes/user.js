import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { upload, uploadToCloudinary } from "../middleware/upload.js";

const router = express.Router();
const prisma = new PrismaClient();

//GET ALL USERS
router.get("/users", authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    return res.json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//CREATE USER
router.post("/users", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
});

//GET USER BY ID
router.get("/users/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    return res.json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//UPDATE USER
router.put("/users/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;

    const user = await prisma.user.update({
      data,
      where: { id },
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//DELETE USER
router.delete("/users/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });

    return res
      .status(200)
      .json({ message: "O usuário foi excluído com sucesso" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});

//UPLOAD USER IMAGE
router.post(
  "/users/:id/image",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma imagem enviada" });
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer, "users");

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { imageUrl },
      select: { id: true, name: true, email: true, imageUrl: true },
    });
    return res.json(updated);
  },
);

export default router;
