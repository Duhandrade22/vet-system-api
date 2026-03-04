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

      // LOGO
      const logoPath = path.join(__dirname, "..", "assets", "logo.jpg");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50 + 495 / 2 - 100, 50, { width: 200 });
        doc.moveDown(8);
      }

      // CABEÇALHO
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text("RECEITA VETERINÁRIA", { align: "center" })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(
          `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
          { align: "center" },
        )
        .moveDown(2);

      // LINHA DE SEPARAÇÃO
      doc
        .strokeColor("#134e4a")
        .lineWidth(2)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(2);

      // DADOS DO ANIMAL
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#333333")
        .text("DADOS DO ANIMAL", { underline: true, align: "center" })
        .moveDown(1);

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

      const animalData = [
        ["Nome:", prescription.animal.name],
        ["Espécie:", prescription.animal.species],
        ["Raça:", prescription.animal.breed || "Não informada"],
        ["Idade:", idade],
        ["Peso:", prescription.weight],
        ["Sexo:", prescription.animal.sex || "Não informado"],
        ["Tutor:", prescription.animal.owner.name],
      ];

      doc.fontSize(12);
      const col1X = 70;
      const col2X = 320;
      let rowY = doc.y;
      const rowH = 20;

      animalData.forEach(([label, value], i) => {
        const x = i % 2 === 0 ? col1X : col2X;
        doc
          .font("Helvetica-Bold")
          .text(label, x, rowY, { continued: true })
          .font("Helvetica")
          .text(` ${value}`);
        if (i % 2 === 1) rowY += rowH;
      });

      // se número ímpar de itens, avança a linha do último item solitário
      if (animalData.length % 2 !== 0) rowY += rowH;

      doc.y = rowY;
      doc.moveDown(1.5);

      // DADOS DA RECEITA
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("RECEITA", { underline: true })
        .moveDown(1);

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#4338ca")
        .text("Data do Atendimento: ", { continued: true })
        .font("Helvetica")
        .fillColor("#333333")
        .text(new Date(prescription.attendedAt).toLocaleString("pt-BR"));

      doc.moveDown(1);

      doc.fontSize(12).font("Helvetica-Bold").text("Prescrição:");

      doc.fontSize(11).font("Helvetica").text(prescription.content, {
        width: 500,
        align: "justify",
      });

      doc.moveDown(10);

      // NOME DO VETERINÁRIO
      doc
        .fontSize(10)
        .fillColor("#333333")
        .text("_".repeat(50), { align: "center" })
        .moveDown(0.3)
        .text(prescription.user.name, { align: "center" })
        .moveDown(0.2)
        .text("Médico(a) Veterinário(a) Responsável", { align: "center" });

      doc.moveDown(2);

      // RODAPÉ
      doc
        .fontSize(8)
        .fillColor("#999999")
        .text("Vetly - Sistema de Gestão Veterinária", { align: "center" });

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
