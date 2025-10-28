import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Settings } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import "./Header.css";

interface HeaderProps {
  obraNome: string;
}

const Header = ({ obraNome }: HeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="obra-header">
      <div className="obra-header-content">
        <div className="obra-header-left">
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-back"
            title="Voltar ao Dashboard"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="obra-header-divider"></div>
          <div className="obra-header-icon">
            <Building2 size={24} />
          </div>
          <div className="obra-header-info">
            <h1>{obraNome}</h1>
            <p>Gerenciamento de obra</p>
          </div>
        </div>
        <div className="obra-header-right">
          <div className="obra-header-user">
            <div className="user-avatar">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <span>{user?.name}</span>
          </div>
          <button className="btn-settings" title="Configurações">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
