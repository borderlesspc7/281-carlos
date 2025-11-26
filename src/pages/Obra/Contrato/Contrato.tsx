import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import {
  FileText,
  Plus,
  AlertCircle,
  X,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { contratoService } from "../../../services/contratoService";
import type { Contrato, ItemContrato } from "../../../types/contratos";
import "./Contrato.css";

const Contrato = () => {
  const { obraId } = useParams<{ obraId: string }>();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(
    null
  );

  const [contratoForm, setContratoForm] = useState({
    fornecedor: "",
    numeroContrato: "",
    aprovadorNome: "",
    aprovadorEmail: "",
  });

  const [itens, setItens] = useState<ItemContrato[]>([]);
  const [itemForm, setItemForm] = useState({
    descricao: "",
    unidade: "",
    quantidade: 0,
    valorUnitario: 0,
  });

  const loadContratos = useCallback(async () => {
    if (!obraId) return;

    setLoading(true);
    setError("");

    try {
      const data = await contratoService.getContratosByObra(obraId);
      setContratos(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar contratos"
      );
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    if (obraId) {
      loadContratos();
    }
  }, [obraId, loadContratos]);

  useEffect(() => {
    if (showModal || showViewModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal, showViewModal]);

  const handleOpenModal = () => {
    setContratoForm({
      fornecedor: "",
      numeroContrato: "",
      aprovadorNome: "",
      aprovadorEmail: "",
    });
    setItens([]);
    setShowModal(true);
  };

  const handleAddItem = () => {
    if (
      !itemForm.descricao ||
      !itemForm.unidade ||
      itemForm.quantidade <= 0 ||
      itemForm.valorUnitario <= 0
    ) {
      setError("Preencha todos os campos do item corretamente");
      return;
    }

    const novoItem: ItemContrato = {
      id: contratoService.createItemId(),
      descricao: itemForm.descricao,
      unidade: itemForm.unidade,
      quantidade: itemForm.quantidade,
      valorUnitario: itemForm.valorUnitario,
      valorTotal: itemForm.quantidade * itemForm.valorUnitario,
    };

    setItens([...itens, novoItem]);
    setItemForm({
      descricao: "",
      unidade: "",
      quantidade: 0,
      valorUnitario: 0,
    });
    setError("");
  };

  const handleRemoveItem = (itemId: string) => {
    setItens(itens.filter((item) => item.id !== itemId));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!obraId) return;

    if (itens.length === 0) {
      setError("Adicione pelo menos um item ao contrato");
      return;
    }

    setError("");

    try {
      await contratoService.createContrato(obraId, {
        ...contratoForm,
        itens,
        aprovadorId: "aprovador-id", // Ajustar conforme sistema de usuários
      });

      await loadContratos();
      setShowModal(false);
      setContratoForm({
        fornecedor: "",
        numeroContrato: "",
        aprovadorNome: "",
        aprovadorEmail: "",
      });
      setItens([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar contrato");
    }
  };

  const handleViewContrato = (contrato: Contrato) => {
    setSelectedContrato(contrato);
    setShowViewModal(true);
  };

  const handleDeleteContrato = async (contratoId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este contrato?"))
      return;

    try {
      await contratoService.deleteContrato(contratoId);
      await loadContratos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir contrato");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovado":
        return <CheckCircle size={20} className="status-icon aprovado" />;
      case "rejeitado":
        return <XCircle size={20} className="status-icon rejeitado" />;
      default:
        return <Clock size={20} className="status-icon pendente" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "aprovado":
        return "Aprovado";
      case "rejeitado":
        return "Rejeitado";
      default:
        return "Pendente";
    }
  };

  const valorTotalItens = itens.reduce((sum, item) => sum + item.valorTotal, 0);

  if (loading) {
    return (
      <div className="contrato-container">
        <div className="contrato-loading">Carregando contratos...</div>
      </div>
    );
  }

  return (
    <div className="contrato-container">
      <div className="contrato-header">
        <div className="contrato-header-left">
          <FileText size={32} />
          <h1>Contratos</h1>
        </div>
        <button className="btn-add-contrato" onClick={handleOpenModal}>
          <Plus size={20} />
          Novo Contrato
        </button>
      </div>

      {error && (
        <div className="contrato-error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}

      {contratos.length === 0 ? (
        <div className="contrato-empty">
          <FileText size={48} />
          <h2>Nenhum contrato cadastrado</h2>
          <p>Crie um novo contrato para começar</p>
        </div>
      ) : (
        <div className="contrato-list">
          {contratos.map((contrato) => (
            <div key={contrato.id} className="contrato-card">
              <div className="contrato-card-header">
                <div className="contrato-card-info">
                  <div className="contrato-tipo-badge">
                    {contrato.tipo === "aditivo" ? "Aditivo" : "Contrato"}
                  </div>
                  <h3>{contrato.fornecedor}</h3>
                  <span className="contrato-numero">
                    Nº {contrato.numeroContrato}
                  </span>
                </div>
                <div className="contrato-card-status">
                  {getStatusIcon(contrato.status)}
                  <span className={`status-text ${contrato.status}`}>
                    {getStatusText(contrato.status)}
                  </span>
                </div>
              </div>

              <div className="contrato-card-body">
                <div className="contrato-info-row">
                  <span className="info-label">Valor Total:</span>
                  <span className="info-value">
                    {contrato.valorTotal.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div className="contrato-info-row">
                  <span className="info-label">Aprovador:</span>
                  <span className="info-value">{contrato.aprovadorNome}</span>
                </div>
                <div className="contrato-info-row">
                  <span className="info-label">Itens:</span>
                  <span className="info-value">{contrato.itens.length}</span>
                </div>
              </div>

              <div className="contrato-card-footer">
                <button
                  className="btn-view"
                  onClick={() => handleViewContrato(contrato)}
                >
                  <Eye size={16} />
                  Visualizar
                </button>
                {contrato.status === "pendente" && (
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteContrato(contrato.id)}
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      {showModal &&
        createPortal(
          <div
            className="contrato-modal-overlay"
            onClick={() => setShowModal(false)}
          >
            <div
              className="contrato-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="contrato-modal-header">
                <h2>Novo Contrato</h2>
                <button
                  className="contrato-modal-close"
                  onClick={() => setShowModal(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <form className="contrato-modal-form" onSubmit={handleSubmit}>
                <div className="contrato-form-section">
                  <h3>Dados do Contrato</h3>
                  <div className="contrato-form-row">
                    <div className="contrato-form-group">
                      <label>Fornecedor *</label>
                      <input
                        type="text"
                        value={contratoForm.fornecedor}
                        onChange={(e) =>
                          setContratoForm({
                            ...contratoForm,
                            fornecedor: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="contrato-form-group">
                      <label>Número do Contrato *</label>
                      <input
                        type="text"
                        value={contratoForm.numeroContrato}
                        onChange={(e) =>
                          setContratoForm({
                            ...contratoForm,
                            numeroContrato: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="contrato-form-row">
                    <div className="contrato-form-group">
                      <label>Nome do Aprovador *</label>
                      <input
                        type="text"
                        value={contratoForm.aprovadorNome}
                        onChange={(e) =>
                          setContratoForm({
                            ...contratoForm,
                            aprovadorNome: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="contrato-form-group">
                      <label>E-mail do Aprovador *</label>
                      <input
                        type="email"
                        value={contratoForm.aprovadorEmail}
                        onChange={(e) =>
                          setContratoForm({
                            ...contratoForm,
                            aprovadorEmail: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="contrato-form-section">
                  <h3>Adicionar Itens</h3>
                  <div className="item-form-grid">
                    <div className="contrato-form-group">
                      <label>Descrição</label>
                      <input
                        type="text"
                        value={itemForm.descricao}
                        onChange={(e) =>
                          setItemForm({
                            ...itemForm,
                            descricao: e.target.value,
                          })
                        }
                        placeholder="Ex: Cimento Portland"
                      />
                    </div>

                    <div className="contrato-form-group">
                      <label>Unidade</label>
                      <input
                        type="text"
                        value={itemForm.unidade}
                        onChange={(e) =>
                          setItemForm({ ...itemForm, unidade: e.target.value })
                        }
                        placeholder="m³, kg, un..."
                      />
                    </div>

                    <div className="contrato-form-group">
                      <label>Quantidade</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={itemForm.quantidade}
                        onChange={(e) =>
                          setItemForm({
                            ...itemForm,
                            quantidade: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="contrato-form-group">
                      <label>Valor Unitário</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={itemForm.valorUnitario}
                        onChange={(e) =>
                          setItemForm({
                            ...itemForm,
                            valorUnitario: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <div className="contrato-form-group add-button">
                      <button type="button" onClick={handleAddItem}>
                        <Plus size={16} />
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {itens.length > 0 && (
                    <div className="itens-list">
                      <table>
                        <thead>
                          <tr>
                            <th>Descrição</th>
                            <th>Unidade</th>
                            <th>Qtd</th>
                            <th>Valor Unit.</th>
                            <th>Total</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {itens.map((item) => (
                            <tr key={item.id}>
                              <td>{item.descricao}</td>
                              <td>{item.unidade}</td>
                              <td>{item.quantidade}</td>
                              <td>
                                {item.valorUnitario.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </td>
                              <td>
                                {item.valorTotal.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-remove-item"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={4} style={{ textAlign: "right" }}>
                              <strong>Total:</strong>
                            </td>
                            <td>
                              <strong>
                                {valorTotalItens.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </strong>
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                <div className="contrato-modal-actions">
                  <button
                    type="button"
                    className="btn-secondary-modal"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary-modal">
                    Criar Contrato
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal de Visualização */}
      {showViewModal &&
        selectedContrato &&
        createPortal(
          <div
            className="contrato-modal-overlay"
            onClick={() => setShowViewModal(false)}
          >
            <div
              className="contrato-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="contrato-modal-header">
                <h2>Detalhes do Contrato</h2>
                <button
                  className="contrato-modal-close"
                  onClick={() => setShowViewModal(false)}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="contrato-view-content">
                <div className="contrato-view-section">
                  <h3>Informações Gerais</h3>
                  <div className="contrato-view-grid">
                    <div className="contrato-view-item">
                      <span className="view-label">Tipo:</span>
                      <span className="view-value">
                        {selectedContrato.tipo === "aditivo"
                          ? "Aditivo"
                          : "Contrato"}
                      </span>
                    </div>
                    <div className="contrato-view-item">
                      <span className="view-label">Fornecedor:</span>
                      <span className="view-value">
                        {selectedContrato.fornecedor}
                      </span>
                    </div>
                    <div className="contrato-view-item">
                      <span className="view-label">Número:</span>
                      <span className="view-value">
                        {selectedContrato.numeroContrato}
                      </span>
                    </div>
                    <div className="contrato-view-item">
                      <span className="view-label">Status:</span>
                      <span
                        className={`view-value status ${selectedContrato.status}`}
                      >
                        {getStatusText(selectedContrato.status)}
                      </span>
                    </div>
                    <div className="contrato-view-item">
                      <span className="view-label">Aprovador:</span>
                      <span className="view-value">
                        {selectedContrato.aprovadorNome}
                      </span>
                    </div>
                    <div className="contrato-view-item">
                      <span className="view-label">E-mail:</span>
                      <span className="view-value">
                        {selectedContrato.aprovadorEmail}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="contrato-view-section">
                  <h3>Itens do Contrato</h3>
                  <div className="itens-list">
                    <table>
                      <thead>
                        <tr>
                          <th>Descrição</th>
                          <th>Unidade</th>
                          <th>Qtd</th>
                          <th>Valor Unit.</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedContrato.itens.map((item) => (
                          <tr key={item.id}>
                            <td>{item.descricao}</td>
                            <td>{item.unidade}</td>
                            <td>{item.quantidade}</td>
                            <td>
                              {item.valorUnitario.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </td>
                            <td>
                              {item.valorTotal.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4} style={{ textAlign: "right" }}>
                            <strong>Total:</strong>
                          </td>
                          <td>
                            <strong>
                              {selectedContrato.valorTotal.toLocaleString(
                                "pt-BR",
                                {
                                  style: "currency",
                                  currency: "BRL",
                                }
                              )}
                            </strong>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {selectedContrato.dataAprovacao && (
                  <div className="contrato-view-section">
                    <h3>Informações de Aprovação</h3>
                    <div className="contrato-view-grid">
                      <div className="contrato-view-item">
                        <span className="view-label">Data de Aprovação:</span>
                        <span className="view-value">
                          {selectedContrato.dataAprovacao.toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </div>
                      {selectedContrato.observacoesAprovacao && (
                        <div className="contrato-view-item full-width">
                          <span className="view-label">Observações:</span>
                          <span className="view-value">
                            {selectedContrato.observacoesAprovacao}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Contrato;
