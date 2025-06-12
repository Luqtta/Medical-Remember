import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { MdLockOutline, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { motion } from "framer-motion";

const RedefinirSenhaConfirmar = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/");
    }
  }, [token]);

  const handleResetPassword = async () => {
    if (!senha || !confirmarSenha) {
      toast.error("Preencha todos os campos.");
      return;
    }

    if (senha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/redefinir-senha-confirmar`,
        { token, senha }
      );
      toast.success("Senha redefinida com sucesso!");
      navigate("/");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao redefinir a senha.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const podeEnviar = senha.trim() && confirmarSenha.trim();

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
            Nova Senha 🔐
          </h1>
          <p className="text-md text-gray-800 font-medium">
            Insira sua nova senha abaixo
          </p>
        </div>

        <div className="w-full flex flex-col gap-4">
          {/* Nova Senha */}
          <div className="flex flex-col group">
            <label
              htmlFor="senha"
              className="text-sm font-semibold text-gray-700 mb-1"
            >
              Nova Senha:
            </label>
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-white">
              <input
                type={senhaVisivel ? "text" : "password"}
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite a nova senha"
                className="w-full outline-none text-sm text-gray-800 bg-transparent placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setSenhaVisivel(!senhaVisivel)}
                className="ml-2 text-gray-600"
              >
                {senhaVisivel ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
          </div>

          {/* Confirmar Senha */}
          <div className="flex flex-col group">
            <label
              htmlFor="confirmarSenha"
              className="text-sm font-semibold text-gray-700 mb-1"
            >
              Confirmar Senha:
            </label>
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-white">
              <input
                type="password"
                id="confirmarSenha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme a nova senha"
                className="w-full outline-none text-sm text-gray-800 bg-transparent placeholder-gray-400"
              />
              <MdLockOutline className="text-gray-600" />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetPassword}
          disabled={loading || !podeEnviar}
          className={`w-full py-2 font-semibold rounded-md shadow-md transition-all duration-200 text-white ${
            loading || !podeEnviar
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Redefinindo..." : "Redefinir Senha"}
        </button>

        <div className="text-sm text-blue-600 mt-2">
          <a href="/" className="hover:underline">
            Voltar ao login
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default RedefinirSenhaConfirmar;
