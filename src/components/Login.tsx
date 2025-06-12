import { MdAlternateEmail } from "react-icons/md";
import { FaRegEye, FaRegEyeSlash, FaLock } from "react-icons/fa";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { motion } from "framer-motion";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isDisabled, setIsDisabled] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const togglePasswordView = () => setShowPassword(!showPassword);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    const camposPreenchidos = email.trim() !== "" && senha.trim() !== "";
    setIsDisabled(!camposPreenchidos);
  }, [email, senha]);

  useEffect(() => {
    if (location.state?.fromDashboard) {
      toast.error("Você precisa estar logado para acessar a dashboard.", {
        icon: <FaLock />,
        progress: undefined,
      });
    }
  }, [location]);

  const handleLogin = async () => {
    if (isDisabled) return;

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        {
          email,
          senha,
        }
      );

      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
      toast.success("Login realizado com sucesso!");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao fazer login.";
      toast.error(`${msg}`);
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
            Bem vindo de volta 👋
          </h1>
          <p className="text-md text-gray-800 font-medium">
            faça login em sua conta
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

          <div className="flex flex-col group">
            <label
              htmlFor="senha"
              className="text-sm font-semibold text-gray-700 mb-1"
            >
              Senha:
            </label>
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-white">
              <input
                type={showPassword ? "text" : "password"}
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                className="w-full outline-none text-sm text-gray-800 bg-transparent placeholder-gray-400"
              />
              {showPassword ? (
                <FaRegEyeSlash
                  className="text-gray-600 cursor-pointer"
                  onClick={togglePasswordView}
                />
              ) : (
                <FaRegEye
                  className="text-gray-600 cursor-pointer"
                  onClick={togglePasswordView}
                />
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={isDisabled}
          className={`w-full py-2 font-semibold rounded-md shadow-md transition-all duration-200 text-white ${
            isDisabled
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Login
        </button>

        <div className="flex justify-between w-full text-sm text-blue-600 mt-2">
          <Link to="/redefinir-senha" className="hover:underline">
            Esqueceu a senha?
          </Link>
          <Link to="/registro" className="hover:underline">
            Não tem uma conta?
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
