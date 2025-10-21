import { BrowserRouter, Routes, Route } from "react-router-dom";
import { paths } from "./paths";
import ProtectedRoutes from "./ProtectedRoutes";

export default function AppRoutes() {
  function Home() {
    return <div>Home</div>;
  }

  function Login() {
    return <div>Login</div>;
  }

  function Register() {
    return <div>Register</div>;
  }

  function Dashboard() {
    return <div>Dashboard</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path={paths.home} element={<Home />} />
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
