import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { paths } from "../../routes/paths";
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Activity,
  LayoutGrid,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      return;
    }

    try {
      await login({ email, password });
      navigate(paths.dashboard);
    } catch (err) {
      // Erro já tratado no contexto
      console.error("Erro no login:", err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-left">
          <div className="login-brand">
            <div className="brand-icon">
              <Building2 size={32} />
            </div>
            <h1>Gestão de Obras</h1>
            <p>Sistema Integrado de Controle e Gerenciamento</p>
          </div>
          <div className="login-features">
            <div className="feature-item">
              <div className="feature-icon">
                <Activity size={24} />
              </div>
              <div>
                <h3>Controle Total</h3>
                <p>Gerencie vagões, custos e estoque em tempo real</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <LayoutGrid size={24} />
              </div>
              <div>
                <h3>Gestão de Contratos</h3>
                <p>Acompanhe medições, kits e checklists</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <DollarSign size={24} />
              </div>
              <div>
                <h3>Análise Financeira</h3>
                <p>Relatórios detalhados de custos e produção</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-wrapper">
            <div className="login-header">
              <h2>Bem-vindo de volta</h2>
              <p>Entre com suas credenciais para acessar o sistema</p>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">E-mail</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Senha</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>

            <div className="login-footer">
              <p>
                Não tem uma conta?{" "}
                <Link to={paths.register} className="link-primary">
                  Cadastre-se
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
