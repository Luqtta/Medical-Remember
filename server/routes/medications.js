require("dotenv").config(); 
const express = require("express");
const router = express.Router();
const Medication = require("../models/Medication");
const User = require("../models/User");
const twilio = require("twilio");
const cron = require("node-cron");
const rateLimit = require('express-rate-limit');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;
const frontendUrl = process.env.FRONTEND_URL;
const backendUrl = process.env.BACKEND_URL;



// Limite de taxa para requisições
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 60 
});
router.use(limiter);

// Listar todos os medicamentos do usuário
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const meds = await Medication.find({ userId });
  res.json(meds);
});

// Criar novo medicamento
router.post("/", async (req, res) => {
  const med = new Medication(req.body);
  await med.save();
  res.status(201).json(med);
});

// Editar medicamento
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const med = await Medication.findById(id);
  if (!med) return res.status(404).json({ error: "Medicamento não encontrado" });

  const ultimaDose = med.taken < med.duration && req.body.taken >= med.duration;

  med.name = req.body.name ?? med.name;
  med.interval = req.body.interval ?? med.interval;
  med.duration = req.body.duration ?? med.duration;
  med.taken = req.body.taken ?? med.taken;
  med.lastTaken = req.body.lastTaken ?? med.lastTaken;
  med.description = req.body.description ?? med.description;
  await med.save();

  if (ultimaDose) {
    const user = await User.findById(med.userId);
    if (user && user.numero) {
      await client.messages.create({
        from: whatsappFrom,
        to: `whatsapp:${user.numero}`,
        body: `Parabéns ${user.nome}! Você terminou a receita ${med.name}. 🎉`
      });
    }
  }

  res.json(med);
});

// Remover medicamento
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await Medication.findByIdAndDelete(id);
  res.json({ success: true });
});

// ROTA DE CONFIRMAÇÃO VIA WHATSAPP
router.get("/confirm-taken/:medId/:userId", async (req, res) => {
  const { medId, userId } = req.params;
  const med = await Medication.findOne({ _id: medId, userId });
  if (!med) return res.status(404).send("Não encontrado");
  med.taken += 1;
  med.lastTaken = new Date();
  await med.save();

  res.redirect(`${frontendUrl}/dashboard?confirm=1&med=${medId}`);
});

// Rota para simular envio de mensagem WhatsApp com botão
router.post("/simulate-whatsapp/:medId", async (req, res) => {
  const { medId } = req.params;
  const med = await Medication.findById(medId);
  if (!med) return res.status(404).send("Medicamento não encontrado");
  const user = await User.findById(med.userId);
  if (!user || !user.numero) return res.status(404).send("Usuário não encontrado");

  const link = `${backendUrl}/api/medications/confirm-taken/${med._id}/${user._id}`;
  try {
    const code = Math.floor(100000 + Math.random() * 900000); 
    med.currentCode = code;
    await med.save();

    await client.messages.create({
      from: whatsappFrom,
      to: `whatsapp:${user.numero}`,
      body: `Olá ${user.nome}, está na hora de tomar seu remédio: *${med.name}*.\n\nResponda com o código: *${code}* para confirmar que tomou.`,
      provideFeedback: true
    });
    res.send("Mensagem WhatsApp enviada!");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao enviar mensagem WhatsApp.", details: err.message });
  }
});

// Função para enviar mensagem com botão (usada no cron)
async function sendWhatsAppButton(to, userName, medName, link) {
  await client.messages.create({
    from: whatsappFrom,
    to: `whatsapp:${to}`,
    body: `Olá ${userName}, está na hora de tomar seu remédio: ${medName}.`,
    persistentAction: [`url:${link}`],
    provideFeedback: true
  });
}

// Cron job a cada minuto para verificar e notificar
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const meds = await Medication.find();
  for (const med of meds) {
    if (med.taken >= med.duration) continue;
    const user = await User.findById(med.userId);
    if (!user || !user.numero) continue;

    const lastTaken = new Date(med.lastTaken);
    lastTaken.setHours(lastTaken.getHours() + med.interval);

    if (
      now >= lastTaken &&
      now - lastTaken < 60000 
    ) {
      const code = Math.floor(100000 + Math.random() * 900000);
      med.currentCode = code;
      await med.save();

      await client.messages.create({
        from: whatsappFrom,
        to: `whatsapp:${user.numero}`,
        body: `Olá ${user.nome}, está na hora de tomar seu remédio: *${med.name}*.\n\nResponda com o código: *${code}* para confirmar que tomou.`,
        provideFeedback: true
      });
    }

    if (med.taken === med.duration - 1) {
      // Nenhuma ação extra aqui, já tratado em outras rotas
    }
  }
});

router.post("/webhook/whatsapp", async (req, res) => {
  try {
    console.log("Webhook recebido:", req.body);

    const from = req.body.From?.replace("whatsapp:", "");
    const body = req.body.Body?.trim();

    if (!from || !body) {
      return res.send("<Response><Message>Dados inválidos recebidos do Twilio.</Message></Response>");
    }

    const user = await User.findOne({ numero: from });
    if (!user) return res.send("<Response><Message>Usuário não encontrado.</Message></Response>");

    const med = await Medication.findOne({ userId: user._id, currentCode: body });
    if (!med) return res.send("<Response><Message>Código inválido ou já utilizado.</Message></Response>");

    if (med.taken >= med.duration) {
      return res.send("<Response><Message>Você já completou sua receita!</Message></Response>");
    }

    const now = new Date();
    const lastTaken = new Date(med.lastTaken);
    lastTaken.setHours(lastTaken.getHours() + med.interval);
    if (now < lastTaken) {
      const next = lastTaken;
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfNext = new Date(next.getFullYear(), next.getMonth(), next.getDate());
      const diffMs = startOfNext.getTime() - startOfToday.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      let label = "";
      if (diffDays === 0) {
        label = "Horário que você vai tomar hoje";
      } else if (diffDays === 1) {
        label = "Horário que você vai tomar amanhã";
      } else {
        label = `Você vai tomar na ${next.toLocaleDateString("pt-BR", { weekday: "long" })}`;
      }
      const hour = next.getHours();
      const timeString = next.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const periodo = hour < 12 ? "da manhã" : "da noite";
      const previsao = `${label}: ${timeString} ${periodo}`;

      return res.send(
        `<Response><Message>Olá ${user.nome}, você já confirmou essa dose. Aguarde o próximo horário. (${previsao})</Message></Response>`
      );
    }

    const ultimaDose = med.taken === med.duration - 1; 
    med.taken += 1;
    med.lastTaken = now;
    med.currentCode = null; 
    await med.save();

    let previsaoMsg = "";
    if (!ultimaDose) {
      const proximaDose = new Date(now);
      proximaDose.setHours(proximaDose.getHours() + med.interval);

      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfNext = new Date(proximaDose.getFullYear(), proximaDose.getMonth(), proximaDose.getDate());
      const diffMs = startOfNext.getTime() - startOfToday.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      let label = "";
      if (diffDays === 0) {
        label = "Horário que você vai tomar hoje";
      } else if (diffDays === 1) {
        label = "Horário que você vai tomar amanhã";
      } else {
        label = `Você vai tomar na ${proximaDose.toLocaleDateString("pt-BR", { weekday: "long" })}`;
      }
      const hour = proximaDose.getHours();
      const timeString = proximaDose.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const periodo = hour < 12 ? "da manhã" : hour < 18 ? "da tarde" : "da noite";
      previsaoMsg = `\nPróxima dose de *${med.name}*: ${label}, ${timeString} ${periodo}.`;
    }

    if (ultimaDose) {
      await client.messages.create({
        from: whatsappFrom,
        to: `whatsapp:${user.numero}`,
        body: `Parabéns ${user.nome}! Você terminou a receita ${med.name}. 🎉`
      });
    }

    res.send(`<Response><Message>Olá ${user.nome}, confirmação recebida para o remédio *${med.name}*! Dose registrada com sucesso.${previsaoMsg}</Message></Response>`);
  } catch (err) {
    console.error("Erro no webhook:", err);
    res.status(500).send("<Response><Message>Erro interno do servidor.</Message></Response>");
  }
});

module.exports = router;