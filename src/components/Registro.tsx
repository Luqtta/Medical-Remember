import { MdAlternateEmail } from "react-icons/md";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { isValidPhoneNumber } from "libphonenumber-js";
import { motion } from "framer-motion";

const Registro = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    numero: "",
    senha: "",
  });

  const navigate = useNavigate();

  const togglePasswordView = () => setShowPassword(!showPassword);

  const validateForm = () => {
    const { nome, email, numero, senha } = form;

    if (!nome || !email || !numero || !senha) {
      toast.error("Preencha todos os campos.");
      return false;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      toast.error("Email inválido.");
      return false;
    }

    // Garante que o número tenha o "+" no início para validação
    const numeroComMais = numero.startsWith("+") ? numero : `+${numero}`;

    if (!isValidPhoneNumber(numeroComMais)) {
      toast.error("Número de telefone inválido. Use o formato internacional com o prefixo (ex: +55).");
      return false;
    }

    if (senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return false;
    }

    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    const numeroComMais = form.numero.startsWith("+") ? form.numero : `+${form.numero}`;
    const formComNumeroCorrigido = { ...form, numero: numeroComMais };

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/register`,
        formComNumeroCorrigido
      );

      localStorage.setItem("user", JSON.stringify(res.data.user));

      toast.success("Registrado com sucesso!", {
        progress: undefined,
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Erro ao registrar.";
      toast.error(`${msg}`);
    }
  };

  const isDisabled = !form.nome || !form.email || !form.numero || !form.senha;

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
          <h2 className="text-gray-800 text-lg md:text-xl font-bold">Medical Remember</h2>
        </div>

        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold text-black">Crie sua conta 🚀</h1>
          <p className="text-md text-gray-800 font-medium">preencha os dados para se registrar</p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <InputField
            id="nome"
            label="Nome:"
            placeholder="Seu nome completo"
            value={form.nome}
            onChange={handleChange}
          />
          <InputField
            id="email"
            label="Email:"
            placeholder="Seu melhor email"
            value={form.email}
            onChange={handleChange}
            icon={<MdAlternateEmail className="text-gray-600" />}
          />
          <div className="flex flex-col group">
            <label htmlFor="numero" className="text-sm font-semibold text-gray-700 mb-1">Número:</label>
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 transition-all group-hover:border-blue-500">
              <PhoneInput
                country={'br'}
                value={form.numero}
                onChange={(numero) => {
                  setForm({ ...form, numero });
                }}
                inputProps={{
                  name: 'numero',
                  required: true,
                  autoFocus: false,
                  placeholder: "Seu número de telefone",
                  className: "phone-input-placeholder bg-transparent w-full outline-none text-sm text-gray-800",
                }}
                placeholder="+55 (DD) 9XXXXXXXX"
                containerStyle={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  display: "flex",
                  alignItems: "center"
                }}
                inputStyle={{
                  width: "100%",
                  fontSize: "1rem",
                  color: "#1f2937",
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                  boxShadow: "none",
                  paddingLeft: "48px"
                }}
                buttonStyle={{
                  background: "transparent",
                  border: "none",
                  marginRight: "8px",
                  paddingLeft: "0px"
                }}
              />
            </div>
          </div>
          <div className="flex flex-col group">
            <label htmlFor="senha" className="text-sm font-semibold text-gray-700 mb-1">Senha:</label>
            <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 transition-all group-hover:border-blue-500">
              <input
                type={showPassword ? "text" : "password"}
                id="senha"
                value={form.senha}
                onChange={handleChange}
                placeholder="Crie uma senha"
                className="w-full outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent group-hover:placeholder-blue-400"
              />
              {showPassword ? (
                <FaRegEyeSlash className="text-gray-600 cursor-pointer text-base" onClick={togglePasswordView} />
              ) : (
                <FaRegEye className="text-gray-600 cursor-pointer text-base" onClick={togglePasswordView} />
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={isDisabled}
          className={`w-full py-2 font-semibold rounded-md shadow-md transition-all text-white ${
            isDisabled ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Registrar
        </button>

        <div className="flex justify-end w-full text-sm text-blue-600 mt-2">
          <Link to="/" className="hover:underline">Já tem uma conta?</Link>
        </div>
      </motion.div>
    </div>
  );
};

// Reusable input component
const InputField = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  icon,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
}) => (
  <div className="flex flex-col group">
    <label htmlFor={id} className="text-sm font-semibold text-gray-700 mb-1">{label}</label>
    <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 transition-all group-hover:border-blue-500">
      <input
        type={id === "email" ? "email" : "text"}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent group-hover:placeholder-blue-400"
      />
      {icon}
    </div>
  </div>
);

export default Registro;
