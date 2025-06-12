const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const medicationRoutes = require("./routes/medications");

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" })); 
app.use(express.urlencoded({ extended: true })); 

app.use("/api/auth", authRoutes);
app.use("/api/medications", medicationRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB conectado com sucesso!");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Servidor rodando na porta ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("Erro ao conectar com o MongoDB:", err);
  });
