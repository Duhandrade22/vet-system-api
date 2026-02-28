import { PrismaClient } from "@prisma/client";
import express from "express";
import PDFDocument from "pdfkit";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

//GET ALL RECORDS
router.get("/records", authenticateToken, async (req, res) => {
  try {
    const records = await prisma.record.findMany({
      where: {
        animal: {
          owner: {
            userId: req.userId,
          },
        },
      },
      include: {
        animal: {
          include: {
            owner: true,
          },
        },
      },
    });

    return res.json(records);
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

// PDF DOWNLOAD
router.get("/records/:id/pdf", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.record.findFirst({
      where: { id, animal: { owner: { userId: req.userId } } },
      include: {
        animal: {
          include: {
            owner: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });
    if (!record) {
      return res.status(404).json({ error: "Prontuário não encontrado" });
    }

    // CRIA O PDF
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="prontuario-${record.animal.name}-${new Date(record.attendedAt).toLocaleDateString("pt-BR").replace(/\//g, "-")}.pdf"`,
    );

    doc.pipe(res);

    //CONTEÚDO DO PDF

    // CABEÇALHO
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("PRONTUÁRIO DE ATENDIMENTO", { align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
        { align: "center" },
      )
      .moveDown(2);

    //LINHA DE SEPARAÇÃO
    doc
      .strokeColor("#4A90E2")
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .stroke()
      .moveDown(1);

    //INFORMAÇÕES DO ANIMAL
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#333333")
      .text("DADOS DO ANIMAL", { underline: true })
      .moveDown(0.5);

    doc.fontSize(12).font("Helvetica");

    const animalData = [
      ["Nome:", record.animal.name],
      ["Espécie:", record.animal.species],
      ["Raça:", record.animal.breed || "Não informada"],
      [
        "Data de Nascimento:",
        record.animal.birthDate
          ? new Date(record.animal.birthDate).toLocaleDateString("pt-BR")
          : "Não informada",
      ],
    ];

    animalData.forEach(([label, value]) => {
      doc
        .font("Helvetica-Bold")
        .text(label, { continued: true })
        .font("Helvetica")
        .text(` ${value}`);
    });

    doc.moveDown(1.5);

    //INFORMAÇÕES DO TUTOR

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("DADOS DO TUTOR", { underline: true })
      .moveDown(0.5);

    doc.fontSize(12).font("Helvetica");

    const ownerData = [
      ["Nome:", record.animal.owner.name],
      ["Telefone:", record.animal.owner.phone],
      ["Email:", record.animal.owner.email || "Não informado"],
    ];

    ownerData.forEach(([label, value]) => {
      doc
        .font("Helvetica-Bold")
        .text(label, { continued: true })
        .font("Helvetica")
        .text(` ${value}`);
    });

    doc.moveDown(2);

    //INFORMAÇÕES DO ATENDIMENTO
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("DADOS DO ATENDIMENTO", { underline: true })
      .moveDown(1);

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#4A90E2")
      .text(`Data do Atendimento: `, { continued: true })
      .font("Helvetica")
      .fillColor("#333333")
      .text(new Date(record.attendedAt).toLocaleString("pt-BR"));

    doc.moveDown(1);

    const recordData = [
      ["Peso:", `${record.weight}`],
      ["Medicamentos:", record.medications],
      ["Dosagem:", record.dosage],
    ];

    recordData.forEach(([label, value]) => {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(label, { continued: true })
        .font("Helvetica")
        .text(` ${value}`);
    });

    doc.moveDown(1);

    doc.fontSize(12).font("Helvetica-Bold").text("Observações:");

    doc.fontSize(11).font("Helvetica").text(record.notes, {
      width: 500,
      align: "justify",
    });

    doc.moveDown(10);

    //ASSINATURA
    doc
      .fontSize(10)
      .text("_".repeat(50), { align: "center" })
      .moveDown(0.3)
      .text("Assinatura do Veterinário Responsável", { align: "center" });

    doc.moveDown(10); // Espaço extra

    // RODAPE
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
});

export default router;
