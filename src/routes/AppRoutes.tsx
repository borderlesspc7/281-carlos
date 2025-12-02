import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { paths } from "./paths";
import ProtectedRoutes from "./ProtectedRoutes";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import ObraLayout from "../components/layout/ObraLayout";
import Vagoes from "../pages/Obra/Vagoes/Vagoes";
import CustoVagoes from "../pages/Obra/CustoVagoes/CustoVagoes";
import EstoqueInsumos from "../pages/Obra/EstoqueInsumos/EstoqueInsumos";
import Itens from "../pages/Obra/Itens/Itens";
import ContratoPage from "../pages/Obra/Contrato/Contrato";
import ChecklistMensal from "../pages/Obra/ChecklistMensal/ChecklistMensal";
import Medicao from "../pages/Obra/Medicao/Medicao";
import MedicaoForm from "../pages/Obra/Medicao/MedicaoForm";
import MedicaoDetails from "../pages/Obra/Medicao/MedicaoDetails";
import Producao from "../pages/Obra/Producao/Producao";
import ProducaoFaltante from "../pages/Obra/ProducaoFaltante/ProducaoFaltante";
import Kits from "../pages/Obra/Kits/Kits";
import EstoqueKits from "../pages/Obra/EstoqueKits/EstoqueKits";
import MaterialFaltante from "../pages/Obra/MaterialFaltante/MaterialFaltante";
import MapaRestricoes from "../pages/Obra/MapaRestricoes/MapaRestricoes";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={paths.home} element={<Login />} />
        <Route path={paths.login} element={<Login />} />
        <Route path={paths.register} element={<Register />} />
        <Route
          path={paths.dashboard}
          element={
            <ProtectedRoutes>
              <Dashboard />
            </ProtectedRoutes>
          }
        />

        {/* Rotas da Obra */}
        <Route
          path="/obras/:obraId"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <Navigate to="vagoes" replace />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/obras/:obraId/vagoes"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <Vagoes />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/obras/:obraId/custo-vagoes"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <CustoVagoes />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/obras/:obraId/estoque-insumos"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <EstoqueInsumos />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/obras/:obraId/itens"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <Itens />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/obras/:obraId/contrato"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <ContratoPage />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />

        <Route
          path="/obras/:obraId/kits"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <Kits />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />

        <Route
          path="/obras/:obraId/checklist-mensal"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <ChecklistMensal />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/obras/:obraId/medicao"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <Medicao />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/obras/:obraId/medicao/nova"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <MedicaoForm />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/obras/:obraId/medicao/:medicaoId"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <MedicaoDetails />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/obras/:obraId/producao"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <Producao />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/obras/:obraId/producao-faltante"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <ProducaoFaltante />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/obras/:obraId/estoque-kits"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <EstoqueKits />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/obras/:obraId/material-faltante"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <MaterialFaltante />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />
        <Route
          path="/obras/:obraId/mapa-restricoes"
          element={
            <ProtectedRoutes>
              <ObraLayout>
                <MapaRestricoes />
              </ObraLayout>
            </ProtectedRoutes>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
