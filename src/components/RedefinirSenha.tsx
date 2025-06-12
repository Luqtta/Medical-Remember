import { MdAlternateEmail } from "react-icons/md";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { motion } from "framer-motion"; // Adicione este import

const RedefinirSenha = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleReset = async () => {
    if (!email.trim()) {
      toast.error("Informe seu email para redefinir a senha.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/redefinir-senha`,
        { email }
      );
      toast.success("📬 Instruções enviadas para seu email!");
      setTimeout(() => navigate("/"), 2500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao enviar email.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-[#e0f2fe] via-white to-[#f0f4ff]">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-[90%] max-w-sm md:max-w-md p-6 bg-white flex flex-col items-center gap-5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)]"
      >
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo.png" alt="logo" className="w-10 md:w-12" />
          <h2 className="text-gray-800 text-lg md:text-xl font-bold">
            Medical Remember
          </h2>
        </div>

        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold text-black">
            Redefinir Senha 🔐
          </h1>
          <p className="text-md text-gray-800 font-medium">
            Informe seu email abaixo
          </p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <div className="flex flex-col group">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-gray-700 mb-1"
            >
              Email:
            </label>
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-white">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu email"
                className="w-full outline-none text-sm text-gray-800 bg-transparent placeholder-gray-400"
              />
              <MdAlternateEmail className="text-gray-600" />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={loading || !email.trim()}
          className={`w-full py-2 font-semibold rounded-md shadow-md transition-all duration-200 text-white ${
            loading || !email.trim()
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Enviando..." : "Enviar instruções"}
        </button>

        <div className="text-sm text-blue-600 mt-2">
          <Link to="/" className="hover:underline">Voltar ao login</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RedefinirSenha;
