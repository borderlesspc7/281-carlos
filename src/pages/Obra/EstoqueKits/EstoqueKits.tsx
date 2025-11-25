import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import {
  Package,
  Plus,
  AlertCircle,
  FileSpreadsheet,
  Edit2,
  Trash2,
  MoreVertical,
  X,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { estoqueInsumoService } from "../../../services/estoqueInsumoService";
import { kitService } from "../../../services/kitService";
import { producaoFaltanteService } from "../../../services/producaoFaltanteService";
import type { EstoqueInsumo, KitAnalise } from "../../../types/estoqueInsumo";
import type { Kit } from "../../../types/kit";
import * as XLSX from "xlsx";
import "./EstoqueKits.css";

const EstoqueKits = () => {
  const { obraId } = useParams();
  const [estoques, setEstoques] = useState<EstoqueInsumo[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [analises, setAnalises] = useState<KitAnalise[]>([]);
  const [producoesFaltantes, setProducoesFaltantes] = useState<
    Map<string, number>
  >(new Map());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEstoqueModal, setShowEstoqueModal] = useState(false);
  const [showProducaoModal, setShowProducaoModal] = useState(false);
  const [editingEstoque, setEditingEstoque] = useState<EstoqueInsumo | null>(
    null
  );

  const [estoqueForm, setEstoqueForm] = useState({
    nome: "",
    unidade: "",
    quantidadeDisponivel: 0,
  });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!obraId) return;

    setLoading(true);
    setError("");

    try {
      const [estoquesData, kitsData, producoesSalvas] = await Promise.all([
        estoqueInsumoService.getEstoquesByObra(obraId),
        kitService.getKitsByObra(obraId),
        producaoFaltanteService.getProducoesFaltantesByObra(obraId),
      ]);

      setEstoques(estoquesData);
      setKits(kitsData);

      // Inicializar com valores salvos ou 0
      const novasProducoes = new Map<string, number>();
      kitsData.forEach((kit) => {
        novasProducoes.set(kit.id, producoesSalvas.get(kit.id) || 0);
      });
      setProducoesFaltantes(novasProducoes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  const realizarAnalise = useCallback(() => {
    if (kits.length === 0 || estoques.length === 0) return;

    const resultado = estoqueInsumoService.analisarKits(
      kits,
      estoques,
      producoesFaltantes
    );
    setAnalises(resultado);
  }, [kits, estoques, producoesFaltantes]);

  useEffect(() => {
    if (obraId) {
      loadData();
    }
  }, [obraId, loadData]);

  useEffect(() => {
    realizarAnalise();
  }, [realizarAnalise]);

  useEffect(() => {
    if (showEstoqueModal || showProducaoModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showEstoqueModal, showProducaoModal]);

  const handleOpenEstoqueModal = (estoque?: EstoqueInsumo) => {
    if (estoque) {
      setEditingEstoque(estoque);
      setEstoqueForm({
        nome: estoque.nome,
        unidade: estoque.unidade,
        quantidadeDisponivel: estoque.quantidadeDisponivel,
      });
    } else {
      setEditingEstoque(null);
      setEstoqueForm({
        nome: "",
        unidade: "",
        quantidadeDisponivel: 0,
      });
    }
    setShowEstoqueModal(true);
    setOpenMenuId(null);
  };

  const handleSubmitEstoque = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!obraId) return;

    setError("");

    try {
      if (editingEstoque) {
        await estoqueInsumoService.updateEstoque(
          editingEstoque.id,
          estoqueForm
        );
      } else {
        await estoqueInsumoService.createEstoque(obraId, estoqueForm);
      }

      await loadData();
      setShowEstoqueModal(false);
      setEstoqueForm({ nome: "", unidade: "", quantidadeDisponivel: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar estoque");
    }
  };

  const handleDeleteEstoque = async (estoqueId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este estoque?")) return;

    try {
      await estoqueInsumoService.deleteEstoque(estoqueId);
      await loadData();
      setOpenMenuId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir estoque");
    }
  };

  const handleUpdateProducaoFaltante = (kitId: string, quantidade: number) => {
    const novasProducoes = new Map(producoesFaltantes);
    novasProducoes.set(kitId, quantidade);
    setProducoesFaltantes(novasProducoes);
  };

  const exportarParaExcel = () => {
    interface ExcelRow {
      Kit: string;
      Vagão: string;
      "Produção Faltante": number;
      Insumo: string;
      Unidade: string;
      "Qtd por Unidade": number;
      "Qtd Total Necessária": number;
      "Qtd Alocada": number;
      Déficit: number;
      Status: string;
    }

    const dados: ExcelRow[] = [];

    analises.forEach((analise) => {
      analise.insumos.forEach((insumo) => {
        dados.push({
          Kit: analise.kitNome,
          Vagão: `Vagão ${analise.vagaoNumero}`,
          "Produção Faltante": analise.producaoFaltante,
          Insumo: insumo.nome,
          Unidade: insumo.unidade,
          "Qtd por Unidade": insumo.quantidadePorUnidade,
          "Qtd Total Necessária": insumo.quantidadeTotal,
          "Qtd Alocada": insumo.quantidadeAlocada,
          Déficit: insumo.deficit,
          Status: insumo.temAlerta ? "ALERTA" : "OK",
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Análise de Estoque");

    XLSX.writeFile(workbook, `analise-estoque-${new Date().getTime()}.xlsx`);
  };

  if (loading) {
    return (
      <div className="estoque-insumos-container">
        <div className="estoque-loading">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="estoque-insumos-container">
      <div className="estoque-header">
        <div className="estoque-header-left">
          <Package size={32} />
          <h1>Analise de Estoque de Insumos</h1>
        </div>
        <div className="estoque-header-actions">
          <button
            className="btn-secondary-estoque"
            onClick={() => setShowProducaoModal(true)}
          >
            <Edit2 size={18} />
            Editar Produção Faltante
          </button>
          <button
            className="btn-add-estoque"
            onClick={() => handleOpenEstoqueModal()}
          >
            <Plus size={20} />
            Adicionar Insumo ao Estoque
          </button>
          <button className="btn-export-estoque" onClick={exportarParaExcel}>
            <FileSpreadsheet size={20} />
            Exportar Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="estoque-error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button
            onClick={() => {
              setError("");
              loadData();
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="estoque-summary">
        <h2>Estoque Disponível</h2>
        <div className="estoque-grid">
          {estoques.length === 0 ? (
            <div className="estoque-empty-card">
              <Package size={40} />
              <p>Nenhum insumo cadastrado no estoque</p>
            </div>
          ) : (
            estoques.map((estoque) => (
              <div key={estoque.id} className="estoque-card">
                <div className="estoque-card-header">
                  <h3>{estoque.nome}</h3>
                  <div className="estoque-card-menu">
                    <button
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === estoque.id ? null : estoque.id
                        )
                      }
                    >
                      <MoreVertical size={20} />
                    </button>
                    {openMenuId === estoque.id && (
                      <div className="estoque-dropdown-menu">
                        <button onClick={() => handleOpenEstoqueModal(estoque)}>
                          <Edit2 size={18} />
                          Editar
                        </button>
                        <button onClick={() => handleDeleteEstoque(estoque.id)}>
                          <Trash2 size={18} />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="estoque-card-body">
                  <span className="estoque-quantidade">
                    {estoque.quantidadeDisponivel.toLocaleString("pt-BR")}
                  </span>
                  <span className="estoque-unidade">{estoque.unidade}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="analise-section">
        <h2>Análise de Necessidade por Kit</h2>
        {analises.length === 0 ? (
          <div className="analise-empty">
            <AlertCircle size={48} />
            <p>Nenhum kit para analisar</p>
          </div>
        ) : (
          <div className="analise-list">
            {analises.map((analise) => (
              <div
                key={analise.kitId}
                className={`analise-card ${
                  analise.temAlerta ? "alerta" : "ok"
                }`}
              >
                <div className="analise-card-header">
                  <div className="analise-info">
                    {analise.temAlerta ? (
                      <AlertTriangle size={24} className="icon-alerta" />
                    ) : (
                      <CheckCircle size={24} className="icon-ok" />
                    )}
                    <div>
                      <h3>{analise.kitNome}</h3>
                      <span className="analise-vagao">
                        Vagão {analise.vagaoNumero}
                      </span>
                      <span className="analise-producao">
                        Produção faltante: {analise.producaoFaltante}{" "}
                        apartamentos
                      </span>
                    </div>
                  </div>
                  <div className="analise-status">
                    {analise.temAlerta ? (
                      <span className="status-badge alerta">ALERTA</span>
                    ) : (
                      <span className="status-badge ok">OK</span>
                    )}
                  </div>
                </div>

                <div className="analise-insumos">
                  <table>
                    <thead>
                      <tr>
                        <th>Insumo</th>
                        <th>Unidade</th>
                        <th>Qtd/Un</th>
                        <th>Necessário</th>
                        <th>Alocado</th>
                        <th>Déficit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analise.insumos.map((insumo, idx) => (
                        <tr
                          key={idx}
                          className={insumo.temAlerta ? "row-alerta" : ""}
                        >
                          <td>{insumo.nome}</td>
                          <td>{insumo.unidade}</td>
                          <td>{insumo.quantidadePorUnidade}</td>
                          <td>
                            {insumo.quantidadeTotal.toLocaleString("pt-BR")}
                          </td>
                          <td>
                            {insumo.quantidadeAlocada.toLocaleString("pt-BR")}
                          </td>
                          <td>
                            {insumo.deficit > 0 ? (
                              <span className="deficit-valor">
                                {insumo.deficit.toLocaleString("pt-BR")}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showEstoqueModal &&
        createPortal(
          <div
            className="estoque-modal-overlay"
            onClick={() => setShowEstoqueModal(false)}
          >
            <div
              className="estoque-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="estoque-modal-header">
                <h2>
                  {editingEstoque ? "Editar" : "Adicionar"} Insumo ao Estoque
                </h2>
                <button
                  className="estoque-modal-close"
                  onClick={() => setShowEstoqueModal(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <form
                className="estoque-modal-form"
                onSubmit={handleSubmitEstoque}
              >
                <div className="estoque-form-row">
                  <div className="estoque-form-group">
                    <label>Nome do insumo *</label>
                    <input
                      type="text"
                      value={estoqueForm.nome}
                      onChange={(e) =>
                        setEstoqueForm({ ...estoqueForm, nome: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="estoque-form-group">
                    <label>Unidade *</label>
                    <input
                      type="text"
                      value={estoqueForm.unidade}
                      onChange={(e) =>
                        setEstoqueForm({
                          ...estoqueForm,
                          unidade: e.target.value,
                        })
                      }
                      required
                      placeholder="m³, kg, peça..."
                    />
                  </div>
                </div>

                <div className="estoque-form-group">
                  <label>Quantidade disponível *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={estoqueForm.quantidadeDisponivel}
                    onChange={(e) =>
                      setEstoqueForm({
                        ...estoqueForm,
                        quantidadeDisponivel: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>

                <div className="estoque-modal-actions">
                  <button
                    type="button"
                    className="btn-secondary-modal"
                    onClick={() => setShowEstoqueModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary-modal">
                    {editingEstoque ? "Atualizar" : "Adicionar"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {showProducaoModal &&
        createPortal(
          <div
            className="estoque-modal-overlay"
            onClick={() => setShowProducaoModal(false)}
          >
            <div
              className="estoque-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="estoque-modal-header">
                <h2>Editar Produção Faltante por Kit</h2>
                <button
                  className="estoque-modal-close"
                  onClick={() => setShowProducaoModal(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="producao-modal-content">
                {kits.map((kit) => (
                  <div key={kit.id} className="producao-item">
                    <div className="producao-item-info">
                      <strong>{kit.nome}</strong>
                      <span>Vagão {kit.vagaoNumero}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={producoesFaltantes.get(kit.id) || 0}
                      onChange={(e) =>
                        handleUpdateProducaoFaltante(
                          kit.id,
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="Apartamentos faltantes"
                    />
                  </div>
                ))}
              </div>

              <div className="estoque-modal-actions">
                <button
                  type="button"
                  className="btn-secondary-modal"
                  onClick={() => setShowProducaoModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary-modal"
                  onClick={async () => {
                    if (!obraId) return;
                    try {
                      setError("");
                      await producaoFaltanteService.saveProducoesFaltantes(
                        obraId,
                        producoesFaltantes
                      );
                      setShowProducaoModal(false);
                    } catch (err) {
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Erro ao salvar produção faltante"
                      );
                    }
                  }}
                >
                  Salvar e Confirmar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default EstoqueKits;
