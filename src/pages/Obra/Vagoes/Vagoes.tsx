import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { vagaoService } from "../../../services/vagaoService";
import type { Vagao, CreateVagaoData } from "../../../types/vagao";
import {
  Plus,
  Calendar,
  Building,
  GitBranch,
  Loader2,
  X,
  AlertCircle,
  Edit,
  Trash2,
  MoreVertical,
  Clock,
} from "lucide-react";
import "./Vagoes.css";

const Vagoes = () => {
  const { obraId } = useParams<{ obraId: string }>();
  const [vagoes, setVagoes] = useState<Vagao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingVagao, setEditingVagao] = useState<Vagao | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [timelineEditingVagao, setTimelineEditingVagao] =
    useState<Vagao | null>(null);

  const [formData, setFormData] = useState<CreateVagaoData>({
    numero: 1,
    predecessorId: null,
    dataInicio: new Date(),
    dataFim: new Date(),
    numeroApartamentos: 1,
  });

  const loadVagoes = useCallback(async () => {
    if (!obraId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await vagaoService.getVagoesByObra(obraId);
      setVagoes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar vagões");
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    loadVagoes();
  }, [loadVagoes]);

  const handleOpenModal = (vagao?: Vagao) => {
    if (vagao) {
      setEditingVagao(vagao);
      setFormData({
        numero: vagao.numero,
        predecessorId: vagao.predecessorId,
        dataInicio: vagao.dataInicio,
        dataFim: vagao.dataFim,
        numeroApartamentos: vagao.numeroApartamentos,
      });
    } else {
      setEditingVagao(null);
      const nextNumero =
        vagoes.length > 0 ? Math.max(...vagoes.map((v) => v.numero)) + 1 : 1;
      setFormData({
        numero: nextNumero,
        predecessorId: null,
        dataInicio: new Date(),
        dataFim: new Date(),
        numeroApartamentos: 1,
      });
    }
    setShowModal(true);
    setMenuOpen(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!obraId) return;

    try {
      setSubmitting(true);
      setError(null);

      if (editingVagao) {
        await vagaoService.updateVagao(editingVagao.id, {
          predecessorId: formData.predecessorId,
          dataInicio: formData.dataInicio,
          dataFim: formData.dataFim,
          numeroApartamentos: formData.numeroApartamentos,
        });
      } else {
        await vagaoService.createVagao(obraId, formData);
      }

      setShowModal(false);
      setEditingVagao(null);
      await loadVagoes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar vagão");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vagaoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este vagão?")) return;

    try {
      await vagaoService.deleteVagao(vagaoId);
      await loadVagoes();
      setMenuOpen(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar vagão");
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const calculateDuration = (inicio: Date, fim: Date) => {
    const diff = new Date(fim).getTime() - new Date(inicio).getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleTimelineDateUpdate = async (
    vagao: Vagao,
    newDataInicio: Date,
    newDataFim: Date
  ) => {
    try {
      await vagaoService.updateVagao(vagao.id, {
        dataInicio: newDataInicio,
        dataFim: newDataFim,
      });
      await loadVagoes();
      setTimelineEditingVagao(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar datas");
    }
  };

  return (
    <div className="vagoes-container">
      <div className="vagoes-header">
        <div className="vagoes-header-left">
          <h1>Vagões</h1>
          <p>Gerencie os vagões e suas atividades</p>
        </div>
        <div className="vagoes-header-right">
          <button
            onClick={() => setShowTimeline(true)}
            className="btn-timeline"
            disabled={vagoes.length === 0}
          >
            <Clock size={20} />
            <span>Linha do Tempo</span>
          </button>
          <button onClick={() => handleOpenModal()} className="btn-add-vagao">
            <Plus size={20} />
            <span>Novo Vagão</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="vagoes-error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="vagoes-loading">
          <Loader2 size={48} className="vagoes-spinner" />
          <p>Carregando vagões...</p>
        </div>
      ) : vagoes.length === 0 ? (
        <div className="vagoes-empty">
          <Building size={64} />
          <h2>Nenhum vagão cadastrado</h2>
          <p>Comece criando o primeiro vagão desta obra</p>
          <button onClick={() => handleOpenModal()} className="btn-add-vagao">
            <Plus size={20} />
            <span>Criar Primeiro Vagão</span>
          </button>
        </div>
      ) : (
        <div className="vagoes-grid">
          {vagoes.map((vagao) => (
            <div key={vagao.id} className="vagao-card">
              <div className="vagao-card-header">
                <div className="vagao-numero">
                  <Building size={20} />
                  <span>Vagão {vagao.numero}</span>
                </div>
                <div className="vagao-menu">
                  <button
                    onClick={() =>
                      setMenuOpen(menuOpen === vagao.id ? null : vagao.id)
                    }
                    className="vagao-menu-button"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {menuOpen === vagao.id && (
                    <div className="vagao-dropdown-menu">
                      <button onClick={() => handleOpenModal(vagao)}>
                        <Edit size={16} />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(vagao.id)}
                        className="delete-action"
                      >
                        <Trash2 size={16} />
                        <span>Excluir</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="vagao-card-body">
                <div className="vagao-info-row">
                  <GitBranch size={16} />
                  <span className="vagao-label">Predecessor:</span>
                  <span className="vagao-value">
                    {vagao.predecessorNumero
                      ? `Vagão ${vagao.predecessorNumero}`
                      : "Nenhum"}
                  </span>
                </div>

                <div className="vagao-info-row">
                  <Calendar size={16} />
                  <span className="vagao-label">Período:</span>
                  <span className="vagao-value">
                    {formatDate(vagao.dataInicio)} - {formatDate(vagao.dataFim)}
                  </span>
                </div>

                <div className="vagao-info-row">
                  <Clock size={16} />
                  <span className="vagao-label">Duração:</span>
                  <span className="vagao-value">
                    {calculateDuration(vagao.dataInicio, vagao.dataFim)} dias
                  </span>
                </div>

                <div className="vagao-info-row">
                  <Building size={16} />
                  <span className="vagao-label">Apartamentos:</span>
                  <span className="vagao-value">
                    {vagao.numeroApartamentos}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div
          className="vagoes-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="vagoes-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vagoes-modal-header">
              <h2>{editingVagao ? "Editar Vagão" : "Novo Vagão"}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="vagoes-modal-close"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="vagoes-modal-form">
              <div className="vagoes-form-group">
                <label htmlFor="numero">Número do Vagão *</label>
                <input
                  type="number"
                  id="numero"
                  min="1"
                  value={formData.numero}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numero: parseInt(e.target.value) || 1,
                    })
                  }
                  required
                  disabled={submitting || !!editingVagao}
                />
              </div>

              <div className="vagoes-form-group">
                <label htmlFor="predecessor">Predecessor</label>
                <select
                  id="predecessor"
                  value={formData.predecessorId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      predecessorId: e.target.value || null,
                    })
                  }
                  disabled={submitting}
                >
                  <option value="">Nenhum</option>
                  {vagoes
                    .filter((v) => v.id !== editingVagao?.id)
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        Vagão {v.numero}
                      </option>
                    ))}
                </select>
              </div>

              <div className="vagoes-form-row">
                <div className="vagoes-form-group">
                  <label htmlFor="dataInicio">Data de Início *</label>
                  <input
                    type="date"
                    id="dataInicio"
                    value={
                      formData.dataInicio instanceof Date
                        ? formData.dataInicio.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dataInicio: new Date(e.target.value),
                      })
                    }
                    required
                    disabled={submitting}
                  />
                </div>

                <div className="vagoes-form-group">
                  <label htmlFor="dataFim">Data de Fim *</label>
                  <input
                    type="date"
                    id="dataFim"
                    value={
                      formData.dataFim instanceof Date
                        ? formData.dataFim.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dataFim: new Date(e.target.value),
                      })
                    }
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="vagoes-form-group">
                <label htmlFor="apartamentos">Número de Apartamentos *</label>
                <input
                  type="number"
                  id="apartamentos"
                  min="1"
                  value={formData.numeroApartamentos}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numeroApartamentos: parseInt(e.target.value) || 1,
                    })
                  }
                  required
                  disabled={submitting}
                />
              </div>

              <div className="vagoes-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="vagoes-btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="vagoes-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="vagoes-spinner-small" />
                      Salvando...
                    </>
                  ) : editingVagao ? (
                    "Salvar Alterações"
                  ) : (
                    "Criar Vagão"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Timeline */}
      {showTimeline && (
        <div
          className="timeline-modal-overlay"
          onClick={() => setShowTimeline(false)}
        >
          <div
            className="timeline-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="timeline-modal-header">
              <h2>Linha do Tempo - Linha de Balanço</h2>
              <button
                onClick={() => setShowTimeline(false)}
                className="timeline-modal-close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="timeline-container">
              <div className="timeline-legend">
                <div className="timeline-legend-item">
                  <div className="timeline-legend-color timeline-color-active"></div>
                  <span>Clique para editar datas</span>
                </div>
              </div>

              <div className="timeline-content">
                {vagoes.map((vagao) => (
                  <div key={vagao.id} className="timeline-row">
                    <div className="timeline-row-label">
                      <Building size={16} />
                      <span>Vagão {vagao.numero}</span>
                      {vagao.predecessorNumero && (
                        <span className="timeline-predecessor">
                          ← V{vagao.predecessorNumero}
                        </span>
                      )}
                    </div>
                    <div className="timeline-row-content">
                      <div
                        className={`timeline-bar ${
                          timelineEditingVagao?.id === vagao.id ? "editing" : ""
                        }`}
                        onClick={() => setTimelineEditingVagao(vagao)}
                        title="Clique para editar"
                      >
                        <span className="timeline-bar-label">
                          {formatDate(vagao.dataInicio)} -{" "}
                          {formatDate(vagao.dataFim)}
                        </span>
                        <span className="timeline-bar-duration">
                          {calculateDuration(vagao.dataInicio, vagao.dataFim)}d
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {timelineEditingVagao && (
                <div className="timeline-editor">
                  <h3>Editando Vagão {timelineEditingVagao.numero}</h3>
                  <div className="timeline-editor-form">
                    <div className="timeline-editor-field">
                      <label>Data de Início:</label>
                      <input
                        type="date"
                        value={
                          timelineEditingVagao.dataInicio
                            .toISOString()
                            .split("T")[0]
                        }
                        onChange={(e) =>
                          setTimelineEditingVagao({
                            ...timelineEditingVagao,
                            dataInicio: new Date(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="timeline-editor-field">
                      <label>Data de Fim:</label>
                      <input
                        type="date"
                        value={
                          timelineEditingVagao.dataFim
                            .toISOString()
                            .split("T")[0]
                        }
                        onChange={(e) =>
                          setTimelineEditingVagao({
                            ...timelineEditingVagao,
                            dataFim: new Date(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="timeline-editor-actions">
                      <button
                        onClick={() => setTimelineEditingVagao(null)}
                        className="timeline-btn-cancel"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() =>
                          handleTimelineDateUpdate(
                            timelineEditingVagao,
                            timelineEditingVagao.dataInicio,
                            timelineEditingVagao.dataFim
                          )
                        }
                        className="timeline-btn-save"
                      >
                        Salvar Datas
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vagoes;
