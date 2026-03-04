import { PrismaClient } from "@prisma/client";
import express from "express";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// CREATE PRESCRIPTION
router.post(
  "/records/:recordId/prescription",
  authenticateToken,
  async (req, res) => {
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
        return res
          .status(409)
          .json({ error: "Já existe uma receita para este prontuário" });
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
  },
);

// GET PRESCRIPTION BY RECORD
router.get(
  "/records/:recordId/prescription",
  authenticateToken,
  async (req, res) => {
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
  },
);

// PDF DOWNLOAD
router.get(
  "/records/:recordId/prescription/pdf",
  authenticateToken,
  async (req, res) => {
    try {
      const { recordId } = req.params;

      const prescription = await prisma.prescription.findFirst({
        where: { recordId, animal: { owner: { userId: req.userId } } },
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

      const doc = new PDFDocument({ margin: 50, size: "A4" });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="receita-${prescription.animal.name}-${new Date(prescription.attendedAt).toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf"`,
      );

      doc.pipe(res);

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      const cardX = 50;
      const cardY = 50;
      const cardWidth = 495;
      const cardHeight = 700;
      const radius = 12;

      doc
        .roundedRect(cardX, cardY, cardWidth, cardHeight, radius)
        .strokeColor("#000000")
        .lineWidth(1.5)
        .stroke();

      const logoPath = path.join(__dirname, "..", "assets", "logo.jpg");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, cardX + cardWidth / 2 - 40, cardY + 15, {
          width: 80,
          align: "center",
        });
      }

      // NOME DO VET
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text(prescription.user.name.toUpperCase(), cardX, cardY + 105, {
          width: cardWidth,
          align: "center",
        });

      // CALCULAR IDADE
      let idade = "Não informada";
      if (prescription.animal.birthDate) {
        const birth = new Date(prescription.animal.birthDate);
        const now = new Date();
        const years = now.getFullYear() - birth.getFullYear();
        const months =
          now.getMonth() -
          birth.getMonth() +
          (now.getDate() < birth.getDate() ? -1 : 0);
        const totalMonths = years * 12 + months;
        if (totalMonths < 12) {
          idade = `${totalMonths} ${totalMonths === 1 ? "mês" : "meses"}`;
        } else {
          const y = Math.floor(totalMonths / 12);
          idade = `${y} ${y === 1 ? "ano" : "anos"}`;
        }
      }

      // DADOS - COLUNA ESQUERDA E DIREITA
      const leftX = cardX + 20;
      const rightX = cardX + cardWidth / 2 + 10;
      const dataY = cardY + 80;
      const lineHeight = 22;

      const leftData = [
        ["TUTOR:", prescription.animal.owner.name],
        ["PACIENTE:", prescription.animal.name],
        ["RAÇA:", prescription.animal.breed || "Não informada"],
      ];

      const rightData = [
        ["ESPÉCIE:", prescription.animal.species],
        ["IDADE:", idade],
        ["PESO:", prescription.weight],
        ["SEXO:", prescription.animal.sex || "Não informado"],
      ];

      doc.fontSize(11);
      leftData.forEach(([label, value], i) => {
        doc
          .font("Helvetica-Bold")
          .fillColor("#000000")
          .text(label, leftX, dataY + i * lineHeight, { continued: true })
          .font("Helvetica")
          .text(` ${value}`);
      });

      rightData.forEach(([label, value], i) => {
        doc
          .font("Helvetica-Bold")
          .fillColor("#000000")
          .text(label, rightX, dataY + i * lineHeight, { continued: true })
          .font("Helvetica")
          .text(` ${value}`);
      });

      // CAIXA DO CONTEÚDO DA RECEITA
      const boxX = cardX + 20;
      const boxY = cardY + 200;
      const boxWidth = cardWidth - 40;
      const boxHeight = 430;

      doc
        .roundedRect(boxX, boxY, boxWidth, boxHeight, 8)
        .strokeColor("#000000")
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#000000")
        .text(prescription.content, boxX + 10, boxY + 10, {
          width: boxWidth - 20,
          height: boxHeight - 20,
          align: "left",
        });

      doc.end();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    }
  },
);

export default router;
