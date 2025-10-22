import { BrowserRouter, Routes, Route } from "react-router-dom";
import { paths } from "./paths";
import ProtectedRoutes from "./ProtectedRoutes";
import Login from "../pages/Login";
import Register from "../pages/Register";

export default function AppRoutes() {
  function Dashboard() {
    return <div>Dashboard</div>;
  }

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
      </Routes>
    </BrowserRouter>
  );
}
