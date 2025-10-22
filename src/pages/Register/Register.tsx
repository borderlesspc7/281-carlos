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
  User,
  Check,
  AlertCircle,
} from "lucide-react";
import "./Register.css";

const turnIntoAdmin = (email: string) => {
  if (email === "admin@gmail.com") {
    return "admin";
  }
  return "user";
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user" as "user" | "admin",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState("");
  const { register, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError("");
    clearError();
  };

  const validateForm = (): boolean => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setValidationError("Todos os campos são obrigatórios");
      return false;
    }

    if (formData.name.length < 3) {
      setValidationError("O nome deve ter pelo menos 3 caracteres");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setValidationError("Digite um e-mail válido");
      return false;
    }

    if (formData.password.length < 6) {
      setValidationError("A senha deve ter pelo menos 6 caracteres");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError("As senhas não coincidem");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    setValidationError("");

    if (!validateForm()) {
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: turnIntoAdmin(formData.email),
      });
      navigate(paths.dashboard);
    } catch (err) {
      console.error("Erro no registro:", err);
    }
  };

  const displayError = validationError || error;

  return (
    <div className="register-container">
      <div className="register-content">
        <div className="register-left">
          <div className="register-brand">
            <div className="brand-icon">
              <Building2 size={32} />
            </div>
            <h1>Gestão de Obras</h1>
            <p>Sistema Integrado de Controle e Gerenciamento</p>
          </div>

          <div className="register-benefits">
            <h3>Ao criar sua conta, você terá acesso a:</h3>
            <ul className="benefits-list">
              <li>
                <Check size={20} />
                <span>Controle completo de vagões e equipamentos</span>
              </li>
              <li>
                <Check size={20} />
                <span>Gestão de custos e orçamentos em tempo real</span>
              </li>
              <li>
                <Check size={20} />
                <span>Controle de estoque e materiais</span>
              </li>
              <li>
                <Check size={20} />
                <span>Gerenciamento de contratos e documentos</span>
              </li>
              <li>
                <Check size={20} />
                <span>Acompanhamento de medições e produção</span>
              </li>
              <li>
                <Check size={20} />
                <span>Relatórios e análises detalhadas</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="register-right">
          <div className="register-form-wrapper">
            <div className="register-header">
              <h2>Criar nova conta</h2>
              <p>Preencha os dados abaixo para começar</p>
            </div>

            {displayError && (
              <div className="error-message">
                <AlertCircle size={20} />
                <span>{displayError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="name">Nome completo</label>
                <div className="input-wrapper">
                  <User className="input-icon" size={20} />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    required
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">E-mail</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    required
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Senha</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
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

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar senha</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={20} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Criando conta...
                  </>
                ) : (
                  "Criar conta"
                )}
              </button>
            </form>

            <div className="register-footer">
              <p>
                Já tem uma conta?{" "}
                <Link to={paths.login} className="link-primary">
                  Faça login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
