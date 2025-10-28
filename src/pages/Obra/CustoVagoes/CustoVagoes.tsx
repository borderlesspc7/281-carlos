import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { vagaoService } from "../../../services/vagaoService";
import { custoVagaoService } from "../../../services/custoVagaoService";
import type { Vagao } from "../../../types/vagao";
import type {
  CustoVagao,
  CreateCustoVagaoData,
  FluxoCaixaMes,
} from "../../../types/custoVagao";
import {
  DollarSign,
  Plus,
  Loader2,
  X,
  AlertCircle,
  Edit,
  Trash2,
  MoreVertical,
  FileText,
  TrendingUp,
  PieChart,
} from "lucide-react";
import "./CustoVagoes.css";

const CustoVagoes = () => {
  const { obraId } = useParams<{ obraId: string }>();
  const [vagoes, setVagoes] = useState<Vagao[]>([]);
  const [custos, setCustos] = useState<CustoVagao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCusto, setEditingCusto] = useState<CustoVagao | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixaMes[]>([]);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);

  const [formData, setFormData] = useState<CreateCustoVagaoData>({
    vagaoId: "",
    custoMaterial: 0,
    custoMaoObra: 0,
  });

  const loadData = useCallback(async () => {
    if (!obraId) return;

    try {
      setLoading(true);
      setError(null);
      const [vagoesData, custosData] = await Promise.all([
        vagaoService.getVagoesByObra(obraId),
        custoVagaoService.getCustosByObra(obraId),
      ]);
      setVagoes(vagoesData);
      setCustos(custosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (custo?: CustoVagao) => {
    if (custo) {
      setEditingCusto(custo);
      setFormData({
        vagaoId: custo.vagaoId,
        custoMaterial: custo.custoMaterial,
        custoMaoObra: custo.custoMaoObra,
      });
    } else {
      setEditingCusto(null);
      setFormData({
        vagaoId: "",
        custoMaterial: 0,
        custoMaoObra: 0,
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

      if (editingCusto) {
        await custoVagaoService.updateCusto(editingCusto.id, obraId, {
          custoMaterial: formData.custoMaterial,
          custoMaoObra: formData.custoMaoObra,
        });
      } else {
        const vagao = vagoes.find((v) => v.id === formData.vagaoId);
        if (!vagao) throw new Error("Vagão não encontrado");

        await custoVagaoService.createCusto(obraId, formData, vagao.numero);
      }

      setShowModal(false);
      setEditingCusto(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar custo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (custoId: string) => {
    if (!obraId || !confirm("Tem certeza que deseja excluir este custo?"))
      return;

    try {
      await custoVagaoService.deleteCusto(custoId, obraId);
      await loadData();
      setMenuOpen(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar custo");
    }
  };

  const handleGerarRelatorio = async () => {
    if (!obraId) return;

    try {
      setGerandoRelatorio(true);
      setError(null);
      const fluxo = await custoVagaoService.gerarFluxoCaixa(vagoes, custos);
      setFluxoCaixa(fluxo);
      setShowRelatorio(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar relatório");
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const custoTotalObra = custos.reduce((sum, c) => sum + c.custoTotal, 0);
  const vagoesComCusto = custos.map((c) => c.vagaoId);
  const vagoesSemCusto = vagoes.filter((v) => !vagoesComCusto.includes(v.id));

  return (
    <div className="custo-vagoes-container">
      <div className="custo-vagoes-header">
        <div className="custo-vagoes-header-left">
          <h1>Custo Orçado dos Vagões</h1>
          <p>Gerencie os custos de material e mão de obra</p>
        </div>
        <div className="custo-vagoes-header-right">
          <button
            onClick={handleGerarRelatorio}
            className="btn-relatorio"
            disabled={custos.length === 0 || gerandoRelatorio}
          >
            {gerandoRelatorio ? (
              <>
                <Loader2 size={20} className="custo-spinner-small" />
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <FileText size={20} />
                <span>Gerar Relatório</span>
              </>
            )}
          </button>
          <button onClick={() => handleOpenModal()} className="btn-add-custo">
            <Plus size={20} />
            <span>Adicionar Custo</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="custo-error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Resumo Total */}
      <div className="custo-resumo">
        <div className="custo-resumo-card">
          <div className="custo-resumo-icon">
            <DollarSign size={24} />
          </div>
          <div className="custo-resumo-info">
            <span className="custo-resumo-label">Custo Total da Obra</span>
            <span className="custo-resumo-value">
              {formatCurrency(custoTotalObra)}
            </span>
          </div>
        </div>
        <div className="custo-resumo-card">
          <div className="custo-resumo-icon custo-icon-success">
            <PieChart size={24} />
          </div>
          <div className="custo-resumo-info">
            <span className="custo-resumo-label">Vagões com Custo</span>
            <span className="custo-resumo-value">
              {custos.length} / {vagoes.length}
            </span>
          </div>
        </div>
        <div className="custo-resumo-card">
          <div className="custo-resumo-icon custo-icon-info">
            <TrendingUp size={24} />
          </div>
          <div className="custo-resumo-info">
            <span className="custo-resumo-label">Custo Médio por Vagão</span>
            <span className="custo-resumo-value">
              {formatCurrency(
                custos.length > 0 ? custoTotalObra / custos.length : 0
              )}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="custo-loading">
          <Loader2 size={48} className="custo-spinner" />
          <p>Carregando custos...</p>
        </div>
      ) : custos.length === 0 ? (
        <div className="custo-empty">
          <DollarSign size={64} />
          <h2>Nenhum custo cadastrado</h2>
          <p>Comece adicionando o custo do primeiro vagão</p>
          <button onClick={() => handleOpenModal()} className="btn-add-custo">
            <Plus size={20} />
            <span>Adicionar Primeiro Custo</span>
          </button>
        </div>
      ) : (
        <div className="custo-table-container">
          <table className="custo-table">
            <thead>
              <tr>
                <th>Vagão</th>
                <th>Material</th>
                <th>Mão de Obra</th>
                <th>Total</th>
                <th>Peso (%)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {custos.map((custo, index) => (
                <tr
                  key={custo.id}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td>
                    <span className="custo-vagao-numero">
                      Vagão {custo.vagaoNumero}
                    </span>
                  </td>
                  <td>{formatCurrency(custo.custoMaterial)}</td>
                  <td>{formatCurrency(custo.custoMaoObra)}</td>
                  <td>
                    <strong>{formatCurrency(custo.custoTotal)}</strong>
                  </td>
                  <td>
                    <div className="custo-peso">
                      <div className="custo-peso-bar">
                        <div
                          className="custo-peso-fill"
                          style={{ width: `${custo.peso}%` }}
                        ></div>
                      </div>
                      <span>{custo.peso.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="custo-actions">
                      <button
                        onClick={() =>
                          setMenuOpen(menuOpen === custo.id ? null : custo.id)
                        }
                        className="custo-menu-button"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {menuOpen === custo.id && (
                        <div className="custo-dropdown-menu">
                          <button onClick={() => handleOpenModal(custo)}>
                            <Edit size={16} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDelete(custo.id)}
                            className="delete-action"
                          >
                            <Trash2 size={16} />
                            <span>Excluir</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <strong>TOTAL</strong>
                </td>
                <td>
                  <strong>
                    {formatCurrency(
                      custos.reduce((sum, c) => sum + c.custoMaterial, 0)
                    )}
                  </strong>
                </td>
                <td>
                  <strong>
                    {formatCurrency(
                      custos.reduce((sum, c) => sum + c.custoMaoObra, 0)
                    )}
                  </strong>
                </td>
                <td>
                  <strong>{formatCurrency(custoTotalObra)}</strong>
                </td>
                <td>
                  <strong>100%</strong>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div
          className="custo-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="custo-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="custo-modal-header">
              <h2>{editingCusto ? "Editar Custo" : "Adicionar Custo"}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="custo-modal-close"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="custo-modal-form">
              <div className="custo-form-group">
                <label htmlFor="vagao">Vagão *</label>
                <select
                  id="vagao"
                  value={formData.vagaoId}
                  onChange={(e) =>
                    setFormData({ ...formData, vagaoId: e.target.value })
                  }
                  required
                  disabled={submitting || !!editingCusto}
                >
                  <option value="">Selecione um vagão</option>
                  {(editingCusto ? vagoes : vagoesSemCusto).map((vagao) => (
                    <option key={vagao.id} value={vagao.id}>
                      Vagão {vagao.numero}
                    </option>
                  ))}
                </select>
                {!editingCusto && vagoesSemCusto.length === 0 && (
                  <small className="custo-form-hint">
                    Todos os vagões já possuem custo cadastrado
                  </small>
                )}
              </div>

              <div className="custo-form-group">
                <label htmlFor="material">Custo de Material (R$) *</label>
                <input
                  type="number"
                  id="material"
                  min="0"
                  step="0.01"
                  value={formData.custoMaterial}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      custoMaterial: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                  disabled={submitting}
                  placeholder="0,00"
                />
              </div>

              <div className="custo-form-group">
                <label htmlFor="maoObra">Custo de Mão de Obra (R$) *</label>
                <input
                  type="number"
                  id="maoObra"
                  min="0"
                  step="0.01"
                  value={formData.custoMaoObra}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      custoMaoObra: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                  disabled={submitting}
                  placeholder="0,00"
                />
              </div>

              <div className="custo-form-total">
                <span>Custo Total:</span>
                <strong>
                  {formatCurrency(
                    formData.custoMaterial + formData.custoMaoObra
                  )}
                </strong>
              </div>

              <div className="custo-modal-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="custo-btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="custo-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="custo-spinner-small" />
                      Salvando...
                    </>
                  ) : editingCusto ? (
                    "Salvar Alterações"
                  ) : (
                    "Adicionar Custo"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Relatório */}
      {showRelatorio && (
        <div
          className="relatorio-modal-overlay"
          onClick={() => setShowRelatorio(false)}
        >
          <div
            className="relatorio-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relatorio-modal-header">
              <h2>Relatório de Fluxo de Caixa - Despesas Orçadas</h2>
              <button
                onClick={() => setShowRelatorio(false)}
                className="relatorio-modal-close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="relatorio-container">
              <div className="relatorio-resumo">
                <p>
                  Previsão de despesas mensais ao longo da execução da obra,
                  distribuídas proporcionalmente ao período de cada vagão.
                </p>
              </div>

              <div className="relatorio-table-container">
                <table className="relatorio-table">
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th>Material</th>
                      <th>Mão de Obra</th>
                      <th>Total</th>
                      <th>Vagões Ativos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fluxoCaixa.map((fluxo, index) => (
                      <tr
                        key={`${fluxo.ano}-${fluxo.mes}`}
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <td>
                          <strong>
                            {fluxo.mes}/{fluxo.ano}
                          </strong>
                        </td>
                        <td>{formatCurrency(fluxo.custoMaterial)}</td>
                        <td>{formatCurrency(fluxo.custoMaoObra)}</td>
                        <td>
                          <strong>{formatCurrency(fluxo.custoTotal)}</strong>
                        </td>
                        <td>
                          <div className="relatorio-vagoes">
                            {fluxo.vagoes.map((v) => (
                              <span
                                key={v.numero}
                                className="relatorio-vagao-badge"
                              >
                                V{v.numero}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>
                        <strong>TOTAL</strong>
                      </td>
                      <td>
                        <strong>
                          {formatCurrency(
                            fluxoCaixa.reduce(
                              (sum, f) => sum + f.custoMaterial,
                              0
                            )
                          )}
                        </strong>
                      </td>
                      <td>
                        <strong>
                          {formatCurrency(
                            fluxoCaixa.reduce(
                              (sum, f) => sum + f.custoMaoObra,
                              0
                            )
                          )}
                        </strong>
                      </td>
                      <td>
                        <strong>
                          {formatCurrency(
                            fluxoCaixa.reduce((sum, f) => sum + f.custoTotal, 0)
                          )}
                        </strong>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustoVagoes;
