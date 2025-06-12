import { useState, useEffect } from "react";
// @ts-expect-error: No types available for canvas-confetti
import confetti from "canvas-confetti";
import { UserIcon } from "@heroicons/react/24/solid";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {
  CheckCircleIcon,
  PencilIcon,
} from "@heroicons/react/24/solid";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api/api"; 

type Medication = {
  _id: string;
  name: string;
  interval: number;
  duration: number;
  taken: number;
  lastTaken: Date;
  description?: string; 
};

const Dashboard = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", interval: "", duration: "", description: "" }); 
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [celebrated, setCelebrated] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileConfig, setShowProfileConfig] = useState(false);

  const [userData, setUserData] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));

  const [profileForm, setProfileForm] = useState({
    nome: userData?.nome || "",
    numero: userData?.numero || "",
    senha: "",
    fotoPerfil: userData?.fotoPerfil || "",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const isLoggedIn = !!userData;
  const userName = userData?.nome || "";

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    toast.success("Logout realizado com sucesso!");
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setMedications((prev) => [...prev]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!userData?._id) return;
    api.get(`/medications/${userData._id}`)
      .then(res => setMedications(res.data))
      .catch(() => setMedications([]));
  }, [userData?._id]);

  useEffect(() => {
    medications.forEach((med) => {
      if (med.taken >= med.duration && !celebrated.includes(med._id)) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setCelebrated((prev) => [...prev, med._id]);
      }
    });
  }, [medications, celebrated]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("confirm") === "1" && params.get("med")) {
      toast.success("Remédio confirmado via WhatsApp!");
      api.get(`/medications/${userData._id}`)
        .then(res => setMedications(res.data))
        .catch(() => {});
      window.history.replaceState({}, document.title, "/dashboard");
    }
  }, [location.search, userData?._id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const { name, interval, duration, description } = form;
    const intVal = Number(interval);
    const durVal = Number(duration);

    if (!name || !intVal || !durVal || intVal <= 0 || durVal <= 0) {
      return toast.error("Preencha todos os campos corretamente.");
    }
    if (name.length > 26) {
      return toast.error("Nome até 26 caracteres.");
    }
    if (description.length > 200) {
      return toast.error("Descrição até 200 caracteres.");
    }
    if (!userData?._id) {
      toast.error("Usuário não autenticado.");
      return;
    }

    if (editId !== null) {
      try {
        const medToEdit = medications.find(m => m._id === editId);
        if (medToEdit && durVal < medToEdit.taken) {
          toast.error("A duração não pode ser menor que o número de dias já tomados.");
          return;
        }
        const res = await api.put(`/medications/${editId}`, {
          name,
          interval: intVal,
          duration: durVal,
          userId: userData._id,
          taken: medToEdit?.taken ?? 0,
          lastTaken: medToEdit?.lastTaken ?? new Date(),
          description,
        });
        setMedications(meds => meds.map(m => m._id === editId ? res.data : m));
        setEditId(null);
        toast.success(`Receita "${name}" editada com sucesso!`);
      } catch {
        toast.error("Erro ao editar medicamento.");
      }
    } else {
      if (medications.length >= 6) {
        toast.error("Limite de cards atingido!");
        return;
      }
      try {
        const res = await api.post("/medications", {
          name,
          interval: intVal,
          duration: durVal,
          userId: userData._id,
          taken: 0,
          lastTaken: new Date(Date.now() - 3600 * 1000 * intVal),
          description,
        });
        setMedications(meds => [...meds, res.data]);
        toast.success("Receita criada com sucesso!");
      } catch {
        toast.error("Erro ao criar medicamento.");
      }
    }

    setForm({ name: "", interval: "", duration: "", description: "" });
    setShowForm(false);
  };

  const handleRemove = async () => {
    if (!confirmId) return;
    const med = medications.find(m => m._id === confirmId);
    if (med && med.name.length > 26) {
      toast.error("Nome até 26 caracteres.");
      setConfirmId(null);
      return;
    }
    try {
      await api.delete(`/medications/${confirmId}`);
      setMedications(meds => meds.filter(m => m._id !== confirmId));
      setConfirmId(null);
      toast.success("Medicamento removido com sucesso");
    } catch {
      toast.error("Erro ao remover medicamento.");
    }
  };

  const canTake = (med: Medication) => {
    if (!med.lastTaken) return true;
    const now = new Date();
    const last = new Date(med.lastTaken);
    const diff = (now.getTime() - last.getTime()) / 1000 / 60 / 60;
    return diff >= med.interval;
  };

  const handleTake = async (id: string) => {
    const med = medications.find(m => m._id === id);
    if (!med) return;
    try {
      const res = await api.put(`/medications/${id}`, {
        ...med,
        taken: med.taken + 1,
        lastTaken: new Date(),
      });
      setMedications(meds => meds.map(m => m._id === id ? res.data : m));
    } catch {
      toast.error("Erro ao atualizar medicamento.");
    }
  };

  const handleConfirmRemove = (id: string) => setConfirmId(id);

  const handleEdit = (med: Medication) => {
    setForm({
      name: med.name,
      interval: med.interval.toString(),
      duration: med.duration.toString(),
      description: med.description || "", 
    });
    setEditId(med._id);
  };

  const getTimeLeft = (med: Medication) => {
    if (med.taken >= med.duration) return "-";
    const next = new Date(med.lastTaken);
    next.setHours(next.getHours() + med.interval);
    const ms = next.getTime() - new Date().getTime();
    if (ms <= 0) return "Hora de tomar 💊";
    const h = Math.floor(ms / 1000 / 60 / 60);
    const m = Math.floor((ms / 1000 / 60) % 60);
    const s = Math.floor((ms / 1000) % 60);
    return `${h}h ${m}m ${s}s`;
  };

  const getNextDoseLabel = (med: Medication) => {
    if (med.taken >= med.duration) return "-";

    const next = new Date(med.lastTaken);
    next.setHours(next.getHours() + med.interval);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfNext = new Date(next.getFullYear(), next.getMonth(), next.getDate());

    const diffMs = startOfNext.getTime() - startOfToday.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let label = "";

    if (diffDays === 0) {
      label = "Horário que você vai tomar hoje";
    } else if (diffDays === 1) {
      label = "Horário que você vai tomar amanhã";
    } else {
      label = `Você vai tomar na ${next.toLocaleDateString("pt-BR", {
        weekday: "long",
      })}`;
    }

    let hour = next.getHours();
    const minute = next.getMinutes();
    let periodo = "";
    if (hour >= 0 && hour < 12) {
      periodo = "da manhã";
    } else if (hour >= 12 && hour < 18) {
      periodo = "da tarde";
    } else {
      periodo = "da noite";
    }
    let hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
    const timeString = `${hour12}:${minute.toString().padStart(2, "0")}`;

    return `${label}: ${timeString} ${periodo}`;
  };

  const handleProfileSave = async () => {
    const nomeIgual = profileForm.nome === userData.nome;
    const numeroIgual = profileForm.numero === userData.numero;
    const senhaVazia = !profileForm.senha;
    const fotoPerfilIgual = profileForm.fotoPerfil === userData.fotoPerfil;

    if (nomeIgual && numeroIgual && senhaVazia && fotoPerfilIgual) {
      setShowProfileConfig(false);
      return; 
    }
 
    const alteracoes: string[] = [];
    if (!nomeIgual) alteracoes.push("nome");
    if (!numeroIgual) alteracoes.push("número");
    if (!senhaVazia) alteracoes.push("senha");
    if (profileForm.fotoPerfil !== userData.fotoPerfil) alteracoes.push("foto de perfil");

    try {
      const res = await api.put(`/auth/users/${userData._id}`, {
        nome: profileForm.nome,
        numero: profileForm.numero,
        senha: profileForm.senha || undefined,
        fotoPerfil: profileForm.fotoPerfil,
      });
      localStorage.setItem("user", JSON.stringify(res.data));
      setUserData(res.data); 
      setProfileForm(f => ({
        ...f,
        senha: "",
        fotoPerfil: res.data.fotoPerfil,
      }));
      setShowProfileConfig(false);
      toast.success(
        `Alteração${alteracoes.length > 1 ? "s" : ""} realizada${alteracoes.length > 1 ? "s" : ""}: ${alteracoes.join(", ")}.`
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao atualizar perfil.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#e0f2fe] via-white to-[#f0f4ff] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-6xl flex flex-col items-center gap-6 pt-14">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Bem-vindo à sua lista de medicamentos 💊
        </h1>

        <header className="w-full bg-white shadow-md px-6 py-4 flex justify-between items-center fixed top-0 left-0 z-50">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-8" />
            <span className="text-lg font-bold text-blue-700">Medical Remember</span>
          </div>

          {isLoggedIn ? (
            <div className="relative">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {profileForm.fotoPerfil ? (
                  <img
                    src={profileForm.fotoPerfil}
                    alt="Foto de perfil"
                    className="h-5 w-5 rounded-full object-cover"
                    style={{ width: 32, height: 32 }}
                  />
                ) : (
                  <UserIcon className="h-5 w-5 text-blue-600" />
                )}
                <span className="text-sm font-medium text-gray-800">Olá, {profileForm.nome || userName}</span>
              </div>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-md shadow-lg py-1 z-10">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowProfileConfig(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 transition"
                  >
                    Configurar Perfil
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 transition"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition"
              >
                Login
              </Link>
              <Link
                to="/registro"
                className="px-4 py-2 rounded-md text-sm font-semibold text-blue-600 border border-blue-600 hover:bg-blue-100 transition"
              >
                Registrar
              </Link>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {medications.map((med) =>
            editId === med._id ? (
              <div
                key={med._id}
                className="border-2 border-dashed border-blue-400 bg-white rounded-lg shadow-xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2 text-yellow-500 font-bold text-lg">
                  <PencilIcon className="w-5 h-5" />
                  Editando: {med.name}
                </div>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Nome do remédio"
                  maxLength={26}
                  className="border px-3 py-2 rounded-md text-sm text-gray-800"
                />
                <input
                  name="interval"
                  value={form.interval}
                  onChange={handleInputChange}
                  placeholder="Intervalo (em horas)"
                  type="number"
                  className="border px-3 py-2 rounded-md text-sm text-gray-800"
                />
                <input
                  name="duration"
                  value={form.duration}
                  onChange={handleInputChange}
                  placeholder="Duração (em dias)"
                  type="number"
                  className="border px-3 py-2 rounded-md text-sm text-gray-800"
                />
                <textarea
                  name="description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição (opcional)"
                  className="border px-3 py-2 rounded-md text-sm text-gray-800 resize-none"
                  rows={2}
                  maxLength={200}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-semibold transition"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setEditId(null);
                      setForm({ name: "", interval: "", duration: "", description: "" });
                      setShowForm(false);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-md font-semibold transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={med._id}
                className="bg-white rounded-lg shadow-xl p-5 flex flex-col justify-between gap-3 min-h-[280px] transition-transform duration-200 hover:scale-105 hover:shadow-2xl"
              >
                <div className="flex items-center gap-2 text-blue-700 text-lg font-semibold">
                  <ClipboardDocumentListIcon className="w-5 h-5" />
                  {med.name}
                </div>

                <p className="text-sm text-gray-600 flex items-center gap-2">
                  Progresso: {med.taken}/{med.duration} dias
                  {med.taken >= med.duration && (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                </p>

                {med.taken < med.duration && (
                  <>
                    <p className="text-sm text-gray-700">
                      Próxima dose em:{" "}
                      <span className="font-medium text-indigo-600">
                        {getTimeLeft(med)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      {getNextDoseLabel(med)}
                    </p>
                  </>
                )}

                {med.description && (
                  <p className="text-sm text-gray-500 ">
                    <span className="font-semibold">Descrição:</span> {med.description}
                  </p>
                )}

                <div className="mt-auto flex flex-col gap-2">
                  {med.taken >= med.duration ? (
                    <>
                      <p className="text-green-600 font-semibold">
                        🎉 Parabéns! Você completou sua receita.
                      </p>
                      <button
                        onClick={() => handleConfirmRemove(med._id)}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition"
                      >
                        Remover da lista
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => canTake(med) && handleTake(med._id)}
                        disabled={!canTake(med)}
                        className={`w-full py-2 ${
                          canTake(med)
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gray-300 cursor-not-allowed"
                        } text-white rounded-md font-medium transition`}
                      >
                        Tomei meu remédio
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(med)}
                          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-md font-medium transition"
                        >
                          <div className="flex justify-center items-center gap-1">
                            <PencilIcon className="h-4 w-4" />
                            Editar
                          </div>
                        </button>
                        <button
                          onClick={() => handleConfirmRemove(med._id)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-md font-medium transition"
                        >
                          Remover
                        </button>
                      </div>
                    </>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        await api.post(`/medications/simulate-whatsapp/${med._id}`);
                        toast.success("Mensagem WhatsApp enviada!");
                      } catch {
                        toast.error("Erro ao enviar mensagem WhatsApp.");
                      }
                    }}
                    className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition"
                    style={{ marginTop: 8 }}
                  >
                    Simular WhatsApp
                  </button>
                </div>
              </div>
            )
          )}

          {showForm && editId === null && medications.length < 6 && (
            <div className="bg-white border-2 border-dashed border-blue-400 rounded-lg shadow-xl p-5 flex flex-col gap-3">
              <h2 className="text-blue-600 font-bold text-lg">Novo Medicamento</h2>
              <input
                name="name"
                value={form.name}
                onChange={handleInputChange}
                placeholder="Nome do remédio"
                maxLength={26}
                className="border px-3 py-2 rounded-md text-sm text-gray-800"
              />
              <input
                name="interval"
                value={form.interval}
                onChange={handleInputChange}
                placeholder="Intervalo (em horas)"
                type="number"
                className="border px-3 py-2 rounded-md text-sm text-gray-800"
              />
              <input
                name="duration"
                value={form.duration}
                onChange={handleInputChange}
                placeholder="Duração (em dias)"
                type="number"
                className="border px-3 py-2 rounded-md text-sm text-gray-800"
              />
              <textarea
                name="description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição (opcional)"
                className="border px-3 py-2 rounded-md text-sm text-gray-800 resize-none"
                rows={2}
                maxLength={200}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-semibold transition"
                >
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setForm({ name: "", interval: "", duration: "", description: "" });
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-md font-semibold transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
        {!showForm && (
          <>
            {medications.length === 0 ? (
              <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md text-center mt-4">
                <p className="text-gray-700 text-md mb-4">
                  Você ainda não adicionou nenhum remédio.
                </p>
                <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      toast.error("Você precisa estar logado para adicionar um medicamento.");
                      navigate("/");
                      return;
                    }

                    if (medications.length >= 6) {
                      toast.error("Você já adicionou o máximo de 6 medicamentos.");
                      return;
                    }

                    setShowForm(true);
                  }}
                  className={`px-6 py-2 rounded-md font-semibold transition-all text-white ${
                    medications.length >= 6
                      ? "bg-blue-300 cursor-not-allowed opacity-60"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Adicionar medicamento
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <button
                  onClick={() => {
                    if (medications.length >= 6) {
                      toast.error("Você já adicionou o máximo de 6 medicamentos.");
                      return;
                    }
                    setShowForm(true);
                  }}
                  className="px-6 py-2 rounded-md font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all"
                >
                  Adicionar novo medicamento
                </button>
              </div>
            )}
          </>
        )}

        {confirmId !== null && (
          <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm w-full">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Tem certeza que deseja remover este remédio?
              </h2>
              <p className="text-gray-600 mb-4">Todo seu progresso será perdido.</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleRemove}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-md font-semibold"
                >
                  Sim
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded-md font-semibold"
                >
                  Não
                </button>
              </div>
            </div>
          </div>
        )}

        {showProfileConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                onClick={() => setShowProfileConfig(false)}
              >
                ×
              </button>
              <h2 className="text-xl font-bold text-blue-700 mb-4">Configurar Perfil</h2>
              {/* Foto de perfil */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-2 overflow-hidden">
                  {profileForm.fotoPerfil ? (
                    <img
                      src={profileForm.fotoPerfil}
                      alt="Foto de perfil"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 shadow"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <UserIcon className="w-10 h-10 text-blue-600" />
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700 transition font-semibold text-sm">
                    Escolher foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfileForm(f => ({ ...f, fotoPerfil: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  {profileForm.fotoPerfil && (
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition font-semibold text-sm"
                      onClick={() => setProfileForm(f => ({ ...f, fotoPerfil: "" }))}
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={profileForm.nome}
                  onChange={e => setProfileForm(f => ({ ...f, nome: e.target.value }))}
                  className="w-full border px-3 py-2 rounded-md text-sm"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Número</label>
                <input
                  type="text"
                  value={profileForm.numero}
                  onChange={e => setProfileForm(f => ({ ...f, numero: e.target.value }))}
                  className="w-full border px-3 py-2 rounded-md text-sm"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={profileForm.senha}
                  onChange={e => setProfileForm(f => ({ ...f, senha: e.target.value }))}
                  className="w-full border px-3 py-2 rounded-md text-sm"
                  placeholder="Deixe em branco para não alterar"
                />
              </div>
              <button
                onClick={handleProfileSave}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold transition"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;