const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const FRONTEND_URL = process.env.FRONTEND_URL;

// Rota de registro
router.post("/register", async (req, res) => {
  const { nome, email, numero, senha } = req.body;
  
  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Email já está em uso" });

    const existingNumero = await User.findOne({ numero });
    if (existingNumero) return res.status(400).json({ message: "Número já está em uso" });

    const hashedPassword = await bcrypt.hash(senha, 10);
    const newUser = new User({
      nome,
      email,
      numero,
      senha: hashedPassword,
    });

    await newUser.save();

    // Enviar e-mail de boas-vindas
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Bem-vindo ao Medical Remember!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border-radius: 8px; border: 1px solid #e0e0e0; padding: 32px 24px; background: #f9fbfc;">
          <h2 style="color: #2563eb; margin-bottom: 16px;">Conta criada com sucesso!</h2>
          <p style="font-size: 16px; color: #333;">
            Olá <b>${nome}</b>,<br><br>
            Sua conta foi registrada com sucesso no <b>Medical Remember</b>.<br>
            Agora você pode acessar o sistema e aproveitar todos os recursos!
          </p>
          <div style="margin-top: 32px; text-align: center; color: #bdbdbd; font-size: 12px;">
            Medical Remember 💊<br>
          </div>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log("Erro ao enviar e-mail de boas-vindas:", err);

      }
    });

    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      user: {
        _id: newUser._id,
        nome: newUser.nome,
        email: newUser.email,
        numero: newUser.numero,
        fotoPerfil: newUser.fotoPerfil, 
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Rota de login
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Credenciais inválidas" });

    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) return res.status(400).json({ message: "Credenciais inválidas" });

    res.status(200).json({
      message: "Login bem-sucedido",
      user: {
        _id: user._id,
        nome: user.nome,
        email: user.email,
        numero: user.numero,
        fotoPerfil: user.fotoPerfil, 
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Rota de redefinir senha
router.post("/redefinir-senha", async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Usuário não encontrado." });

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // O token expira em 1 hora
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Redefinição de Senha - Medical Remember",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border-radius: 8px; border: 1px solid #e0e0e0; padding: 32px 24px; background: #f9fbfc;">
          <h2 style="color: #2563eb; margin-bottom: 16px;">Redefinição de Senha</h2>
          <p style="font-size: 16px; color: #333;">
            Olá <b>${user.nome}</b>,<br><br>
            Recebemos uma solicitação para redefinir a senha da sua conta no <b>Medical Remember</b>.<br>
            Para criar uma nova senha, clique no botão abaixo:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${FRONTEND_URL}/redefinir-senha/${token}" style="background: #2563eb; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
              Redefinir Senha
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">
            Se você não solicitou a redefinição, pode ignorar este e-mail.<br>
            Este link é válido por 1 hora.
          </p>
          <div style="margin-top: 32px; text-align: center; color: #bdbdbd; font-size: 12px;">
            Medical Remember 💊<br>
          </div>
        </div>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Erro ao enviar o e-mail." });
      } else {
        res.status(200).json({
          message: "Instruções de redefinição enviadas para o seu e-mail.",
        });
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Rota para confirmar a redefinição de senha
router.post("/redefinir-senha-confirmar", async (req, res) => {
  const { token, senha } = req.body;
  
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Token inválido ou expirado." });

    const isSame = await bcrypt.compare(senha, user.senha);
    if (isSame) {
      return res.status(400).json({ message: "A nova senha não pode ser igual à anterior." });
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    user.senha = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Senha redefinida com sucesso!" });
  } catch (err) {
    res.status(500).json({ message: "Erro no servidor", error: err.message });
  }
});

// Atualizar perfil do usuário
router.put("/users/:id", async (req, res) => {
  try {
    const { nome, numero, senha, fotoPerfil } = req.body;
    const update = { nome, numero, fotoPerfil };

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado." });

    const alteracoes = [];
    if (nome && nome !== user.nome) alteracoes.push("nome");
    if (numero && numero !== user.numero) alteracoes.push("número");
    let senhaAlterada = false;
    if (senha) {
      const isSame = await bcrypt.compare(senha, user.senha);
      if (isSame) {
        return res.status(400).json({ message: "A nova senha não pode ser igual à anterior." });
      }
      update.senha = await bcrypt.hash(senha, 10);
      alteracoes.push("senha");
      senhaAlterada = true;
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({
      _id: updatedUser._id,
      nome: updatedUser.nome,
      email: updatedUser.email,
      numero: updatedUser.numero,
      fotoPerfil: updatedUser.fotoPerfil,
    });

    // Envia e-mail se houve alteração relevante
    if (alteracoes.length > 0) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: updatedUser.email,
        subject: "Alteração de dados no Medical Remember",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border-radius: 8px; border: 1px solid #e0e0e0; padding: 32px 24px; background: #f9fbfc;">
            <h2 style="color: #2563eb; margin-bottom: 16px;">Dados alterados</h2>
            <p style="font-size: 16px; color: #333;">
              Olá <b>${updatedUser.nome}</b>,<br><br>
              Os seguintes dados da sua conta foram alterados: <b>${alteracoes.join(", ")}</b>.<br>
              ${senhaAlterada ? "Se você não reconhece essa alteração de senha, altere imediatamente sua senha ou entre em contato com o suporte.<br>" : ""}
            </p>
            <div style="margin-top: 32px; text-align: center; color: #bdbdbd; font-size: 12px;">
              Medical Remember 💊<br>
            </div>
          </div>
        `,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log("Erro ao enviar e-mail de alteração de dados:", err);
        }
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Erro ao atualizar perfil." });
  }
});

module.exports = router;
