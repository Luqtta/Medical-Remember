import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./components/Login";
import Registro from "./components/Registro";
import Dashboard from "./components/Dashboard";
import RedefinirSenha from "./components/RedefinirSenha";  
import RedefinirSenhaConfirmar from "./components/RedefinirSenhaConfirmar";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} /> 
          <Route path="/redefinir-senha/:token" element={<RedefinirSenhaConfirmar />} />
        </Routes>
      </BrowserRouter>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light" 
        toastClassName="custom-toast"
        progressClassName="custom-progress"
      />
    </>
  );
}

export default App;
