import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  Package,
  RefreshCw,
  Plus,
  X,
  Edit2,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { totvsService } from "../../../services/totvsService";
import { estoqueInsumoService } from "../../../services/estoqueInsumoService";
import type { EstoqueInsumo } from "../../../types/estoqueInsumo";
import "./EstoqueInsumos.css";

interface StockItem {
  [key: string]: unknown;
}

const EstoqueInsumos = () => {
  const { obraId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [localEstoques, setLocalEstoques] = useState<EstoqueInsumo[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Estados do modal
  const [showModal, setShowModal] = useState(false);
  const [editingEstoque, setEditingEstoque] = useState<EstoqueInsumo | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [estoqueForm, setEstoqueForm] = useState({
    nome: "",
    unidade: "",
    quantidadeDisponivel: 0,
  });

  const loadStockData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const response = await totvsService.getRetailStockLevel({
        page: 1,
        pageSize: 100,
      });

      // A resposta pode ter diferentes estruturas dependendo da API
      // Tentamos diferentes formatos comuns
      const items = response.items || response.data || response || [];
      const itemsArray = Array.isArray(items) ? items : [];
      const total = response.total || itemsArray.length || 0;

      setStockData(itemsArray);
      setTotalItems(total);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      
      // Verificar se é erro de credenciais não configuradas
      const isCredentialsError =
        errorMessage.includes("Credenciais da API TOTVS não configuradas") ||
        errorMessage.includes("Credenciais TOTVS não configuradas") ||
        errorMessage.includes("TOTVS API error: 500") ||
        (errorMessage.includes("500") && 
         (errorMessage.includes("TOTVS") || errorMessage.includes("credenciais")));
      
      if (isCredentialsError) {
        setError(
          "As credenciais da API TOTVS não estão configuradas. " +
          "Por favor, configure as credenciais no Firebase Functions para acessar os dados de estoque. " +
          "Execute: firebase functions:config:set totvs.base_url=\"...\" totvs.auth_token=\"...\""
        );
      } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        setError(
          "Erro de conexão. Verifique sua internet e se o Firebase Functions está configurado corretamente."
        );
      } else {
        setError(
          `Erro ao carregar dados de estoque: ${errorMessage}`
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  // Configurar listener em tempo real para estoques locais
  useEffect(() => {
    if (!obraId) return;

    setLocalError(null);

    // Configurar listener em tempo real
    const unsubscribe = estoqueInsumoService.observeEstoquesByObra(
      obraId,
      (estoques) => {
        setLocalEstoques(estoques);
        setLocalError(null);
      }
    );

    // Cleanup ao desmontar ou mudar obraId
    return () => {
      unsubscribe();
    };
  }, [obraId]);

  // Carregar dados TOTVS inicialmente
  useEffect(() => {
    loadStockData();
  }, []);

  // Polling automático para dados TOTVS (a cada 5 minutos)
  useEffect(() => {
    const interval = setInterval(() => {
      // Só atualizar se a página estiver visível
      if (!document.hidden) {
        loadStockData(true); // silent refresh
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, []);

  // Atualizar quando a página volta a ficar visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Se passou mais de 5 minutos desde a última atualização, atualizar
        if (lastUpdate) {
          const timeSinceUpdate = Date.now() - lastUpdate.getTime();
          if (timeSinceUpdate > 5 * 60 * 1000) {
            loadStockData(true);
          }
        } else {
          // Se nunca atualizou, carregar agora
          loadStockData(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdate]);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  const handleOpenModal = (estoque?: EstoqueInsumo) => {
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
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleSubmitEstoque = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!obraId) return;

    setLocalError(null);

    try {
      if (editingEstoque) {
        await estoqueInsumoService.updateEstoque(
          editingEstoque.id,
          estoqueForm
        );
      } else {
        await estoqueInsumoService.createEstoque(obraId, estoqueForm);
      }

      // Não precisa recarregar, o listener em tempo real já atualiza
      setShowModal(false);
      setEstoqueForm({ nome: "", unidade: "", quantidadeDisponivel: 0 });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Erro ao salvar estoque"
      );
    }
  };

  const handleDeleteEstoque = async (estoqueId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este insumo do estoque?")) return;

    try {
      await estoqueInsumoService.deleteEstoque(estoqueId);
      // Não precisa recarregar, o listener em tempo real já atualiza
      setOpenMenuId(null);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Erro ao excluir estoque"
      );
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Estoque de Insumos</h1>
            <p>Consulta de saldo em estoque via TOTVS</p>
          </div>
          {obraId && (
            <button
              className="btn-add-estoque-header"
              onClick={() => handleOpenModal()}
              type="button"
            >
              <Plus size={18} />
              Cadastrar Insumo
            </button>
          )}
        </div>
        <div className="page-content">
          <div className="estoque-loading">
            <Loader2 className="spinner" size={48} />
            <p>Carregando dados de estoque...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Estoque de Insumos</h1>
            <p>Consulta de saldo em estoque via TOTVS</p>
          </div>
          {obraId && (
            <button
              className="btn-add-estoque-header"
              onClick={() => handleOpenModal()}
              type="button"
            >
              <Plus size={18} />
              Cadastrar Insumo
            </button>
          )}
        </div>
        <div className="page-content">
          <div className="estoque-error">
            <AlertCircle className="error-icon" size={48} />
            <h3>Erro ao carregar estoque</h3>
            <p>{error}</p>
            <button
              className="btn-retry"
              onClick={() => loadStockData(false)}
              type="button"
            >
              <RefreshCw size={16} />
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Se não houver dados, mostrar mensagem
  if (stockData.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Estoque de Insumos</h1>
            <p>Consulta de saldo em estoque via TOTVS</p>
          </div>
          {obraId && (
            <button
              className="btn-add-estoque-header"
              onClick={() => handleOpenModal()}
              type="button"
            >
              <Plus size={18} />
              Cadastrar Insumo
            </button>
          )}
        </div>
        <div className="page-content">
          <div className="estoque-empty">
            <Package size={48} />
            <p>Nenhum item de estoque encontrado.</p>
            <button
              className="btn-retry"
              onClick={() => loadStockData(false)}
              type="button"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Obter as chaves do primeiro item para criar cabeçalhos da tabela
  const headers = Object.keys(stockData[0] || {});

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Estoque de Insumos</h1>
          <p>Consulta de saldo em estoque via TOTVS</p>
        </div>
        {obraId && (
          <button
            className="btn-add-estoque-header"
            onClick={() => handleOpenModal()}
            type="button"
          >
            <Plus size={18} />
            Cadastrar Insumo
          </button>
        )}
      </div>
      <div className="page-content">
        <div className="estoque-header">
          <div className="estoque-info">
            <span className="total-items">
              Total de itens (TOTVS): <strong>{totalItems}</strong>
            </span>
            {localEstoques.length > 0 && (
              <span className="total-items">
                | Insumos cadastrados: <strong>{localEstoques.length}</strong>
              </span>
            )}
          </div>
          <div className="estoque-header-actions">
            {lastUpdate && (
              <span className="last-update-text">
                Última atualização: {lastUpdate.toLocaleTimeString("pt-BR")}
              </span>
            )}
            <button
              className="btn-refresh"
              onClick={() => loadStockData(false)}
              type="button"
              disabled={loading || isRefreshing}
              title="Atualizar dados da TOTVS"
            >
              <RefreshCw size={16} className={loading || isRefreshing ? "spinning" : ""} />
              {isRefreshing ? "Atualizando..." : "Atualizar TOTVS"}
            </button>
          </div>
        </div>

        {localError && (
          <div className="estoque-error-banner">
            <AlertCircle size={20} />
            <span>{localError}</span>
            <button
              onClick={() => {
                setLocalError(null);
              }}
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {localEstoques.length > 0 && (
          <div className="estoque-local-section">
            <div className="section-header-with-indicator">
              <h2>Insumos Cadastrados Localmente</h2>
              <span className="realtime-indicator" title="Atualização em tempo real">
                <span className="realtime-dot"></span>
                Tempo real
              </span>
            </div>
            <div className="estoque-local-grid">
              {localEstoques.map((estoque) => (
                <div key={estoque.id} className="estoque-local-card">
                  <div className="estoque-local-card-header">
                    <h3>{estoque.nome}</h3>
                    <div className="estoque-local-card-menu">
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === estoque.id ? null : estoque.id
                          )
                        }
                        type="button"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openMenuId === estoque.id && (
                        <div className="estoque-dropdown-menu">
                          <button onClick={() => handleOpenModal(estoque)}>
                            <Edit2 size={16} />
                            Editar
                          </button>
                          <button onClick={() => handleDeleteEstoque(estoque.id)}>
                            <Trash2 size={16} />
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="estoque-local-card-body">
                    <span className="estoque-quantidade">
                      {estoque.quantidadeDisponivel.toLocaleString("pt-BR")}
                    </span>
                    <span className="estoque-unidade">{estoque.unidade}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="estoque-totvs-section">
          <h2>Dados de Estoque - TOTVS</h2>

        <div className="estoque-table-container">
          <table className="estoque-table">
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>
                    {header
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())
                      .trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stockData.map((item, index) => (
                <tr key={index}>
                  {headers.map((header) => (
                    <td key={header}>
                      {item[header] !== null && item[header] !== undefined
                        ? String(item[header])
                        : "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>

        {showModal &&
          createPortal(
            <div
              className="estoque-modal-overlay"
              onClick={() => setShowModal(false)}
            >
              <div
                className="estoque-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="estoque-modal-header">
                  <h2>
                    {editingEstoque ? "Editar" : "Cadastrar"} Insumo no Estoque
                  </h2>
                  <button
                    className="estoque-modal-close"
                    onClick={() => setShowModal(false)}
                    type="button"
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
                        placeholder="Ex: Cimento, Areia, Tijolo..."
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
                      onClick={() => setShowModal(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary-modal">
                      {editingEstoque ? "Atualizar" : "Cadastrar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  );
};

export default EstoqueInsumos;
