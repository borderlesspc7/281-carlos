import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { obraService } from "../../services/obraService";
import type { Obra, CreateObraData } from "../../types/obra";
import {
  Building2,
  Plus,
  Search,
  Filter,
  LogOut,
  Layers,
  Home,
  X,
  AlertCircle,
  Loader2,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [obras, setObras] = useState<Obra[]>([]);
  const [filteredObras, setFilteredObras] = useState<Obra[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateObraData>({
    nome: "",
    numeroPavimentos: 1,
    numeroTorres: 1,
  });

  const loadObras = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await obraService.getObrasByUser(user.uid);
      setObras(data);
      setFilteredObras(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar obras");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const filterObras = useCallback(() => {
    let filtered = [...obras];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter((obra) =>
        obra.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de status
    if (filterStatus !== "todas") {
      filtered = filtered.filter((obra) => obra.status === filterStatus);
    }

    setFilteredObras(filtered);
  }, [obras, searchTerm, filterStatus]);

  useEffect(() => {
    loadObras();
  }, [loadObras]);

  useEffect(() => {
    filterObras();
  }, [filterObras]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      setError(null);
      await obraService.createObra(formData, user.uid);
      setShowModal(false);
      setFormData({ nome: "", numeroPavimentos: 1, numeroTorres: 1 });
      await loadObras();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar obra");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  const handleDeleteObra = async (obraId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta obra?")) return;

    try {
      await obraService.deleteObra(obraId);
      await loadObras();
      setMenuOpen(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar obra");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativa":
        return "status-ativa";
      case "pausada":
        return "status-pausada";
      case "concluida":
        return "status-concluida";
      default:
        return "";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ativa":
        return "Ativa";
      case "pausada":
        return "Pausada";
      case "concluida":
        return "Concluída";
      default:
        return status;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <Building2 size={28} />
            </div>
            <div className="header-info">
              <h1>Gestão de Obras</h1>
              <p>Bem-vindo, {user?.name}</p>
            </div>
          </div>
          <div className="header-right">
            <button onClick={handleLogout} className="btn-logout">
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Toolbar */}
          <div className="toolbar">
            <div className="toolbar-left">
              <div className="search-box">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Buscar obra..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-box">
                <Filter size={20} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="todas">Todas</option>
                  <option value="ativa">Ativas</option>
                  <option value="pausada">Pausadas</option>
                  <option value="concluida">Concluídas</option>
                </select>
              </div>
            </div>
            <div className="toolbar-right">
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary-action"
              >
                <Plus size={20} />
                <span>Nova Obra</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <AlertCircle size={20} />
              <span>{error}</span>
              <button onClick={() => setError(null)}>
                <X size={18} />
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="loading-state">
              <Loader2 size={48} className="dashboard-spinner-large" />
              <p>Carregando obras...</p>
            </div>
          ) : filteredObras.length === 0 ? (
            /* Empty State */
            <div className="empty-state">
              <Building2 size={64} />
              <h2>Nenhuma obra encontrada</h2>
              <p>
                {searchTerm || filterStatus !== "todas"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando sua primeira obra"}
              </p>
              {!searchTerm && filterStatus === "todas" && (
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary-action"
                >
                  <Plus size={20} />
                  <span>Criar Primeira Obra</span>
                </button>
              )}
            </div>
          ) : (
            /* Obras Grid */
            <div className="obras-grid">
              {filteredObras.map((obra) => (
                <div key={obra.id} className="obra-card">
                  <div className="obra-card-header">
                    <div className="obra-icon">
                      <Building2 size={24} />
                    </div>
                    <div className="obra-menu">
                      <button
                        onClick={() =>
                          setMenuOpen(menuOpen === obra.id ? null : obra.id)
                        }
                        className="menu-button"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {menuOpen === obra.id && (
                        <div className="dropdown-menu">
                          <button
                            onClick={() => {
                              /* TODO: Implementar edição */
                              setMenuOpen(null);
                            }}
                          >
                            <Edit size={16} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteObra(obra.id)}
                            className="delete-action"
                          >
                            <Trash2 size={16} />
                            <span>Excluir</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="obra-content">
                    <h3>{obra.nome}</h3>
                    <div className="obra-details">
                      <div className="detail-item">
                        <Layers size={16} />
                        <span>
                          {obra.numeroPavimentos}{" "}
                          {obra.numeroPavimentos === 1
                            ? "Pavimento"
                            : "Pavimentos"}
                        </span>
                      </div>
                      <div className="detail-item">
                        <Home size={16} />
                        <span>
                          {obra.numeroTorres}{" "}
                          {obra.numeroTorres === 1 ? "Torre" : "Torres"}
                        </span>
                      </div>
                    </div>
                    <div className="obra-status">
                      <span
                        className={`status-badge ${getStatusColor(
                          obra.status
                        )}`}
                      >
                        {getStatusLabel(obra.status)}
                      </span>
                    </div>
                  </div>

                  <div className="obra-footer">
                    <button
                      onClick={() => navigate(`/obras/${obra.id}`)}
                      className="btn-view-obra"
                    >
                      Acessar Obra
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Cadastro */}
      {showModal && (
        <div
          className="dashboard-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="dashboard-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dashboard-modal-header">
              <h2>Nova Obra</h2>
              <button
                onClick={() => setShowModal(false)}
                className="dashboard-modal-close"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="dashboard-modal-form">
              <div className="dashboard-form-group">
                <label htmlFor="nome">Nome da Obra *</label>
                <input
                  type="text"
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Ex: Residencial Sunset Boulevard"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="dashboard-form-row">
                <div className="dashboard-form-group">
                  <label htmlFor="pavimentos">Nº de Pavimentos *</label>
                  <input
                    type="number"
                    id="pavimentos"
                    min="1"
                    value={formData.numeroPavimentos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numeroPavimentos: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="dashboard-form-group">
                  <label htmlFor="torres">Nº de Torres *</label>
                  <input
                    type="number"
                    id="torres"
                    min="1"
                    value={formData.numeroTorres}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numeroTorres: parseInt(e.target.value) || 1,
                      })
                    }
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="dashboard-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="dashboard-btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="dashboard-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="dashboard-spinner-small" />
                      Criando...
                    </>
                  ) : (
                    "Criar Obra"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
