import { useState, useEffect, useCallback, useMemo } from "react";
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
  MailCheck,
  Info,
} from "lucide-react";
import { contratoService } from "../../../services/contratoService";
import { itemVagaoService } from "../../../services/itemVagaoService";
import type {
  Contrato as ContratoType,
  ItemContrato,
} from "../../../types/contratos";
import type { ItemVagao } from "../../../types/itemVagao";
import "./Contrato.css";

const Contrato = () => {
  const { obraId } = useParams<{ obraId: string }>();
  const [contratos, setContratos] = useState<ContratoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedContrato, setSelectedContrato] = useState<ContratoType | null>(
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

  const [itensDisponiveis, setItensDisponiveis] = useState<ItemVagao[]>([]);
  const [selectedBaseItemId, setSelectedBaseItemId] = useState("");
  const [savingContrato, setSavingContrato] = useState(false);
  const [itemFormError, setItemFormError] = useState("");
  const [fornecedorInsight, setFornecedorInsight] = useState<{
    tipo: "contrato" | "aditivo";
    contratoNumero?: string;
  } | null>(null);

  const fornecedoresDisponiveis = useMemo(() => {
    const fornecedores = new Set<string>();
    itensDisponiveis.forEach((item) => {
      if (item.empresa) {
        fornecedores.add(item.empresa);
      }
    });
    return Array.from(fornecedores).sort();
  }, [itensDisponiveis]);

  const itensVinculados = useMemo(() => {
    return itensDisponiveis.map((item) => ({
      id: item.id,
      label: `Vagão ${item.vagaoNumero} • ${item.servico} (${item.empresa})`,
    }));
  }, [itensDisponiveis]);

  const selectedBaseItem = useMemo(
    () => itensDisponiveis.find((item) => item.id === selectedBaseItemId),
    [itensDisponiveis, selectedBaseItemId]
  );

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

  const loadItens = useCallback(async () => {
    if (!obraId) return;
    try {
      const data = await itemVagaoService.getItensByObra(obraId);
      setItensDisponiveis(data);
    } catch (err) {
      console.error("Erro ao carregar itens da Tela 4:", err);
    }
  }, [obraId]);

  useEffect(() => {
    if (obraId) {
      loadContratos();
      loadItens();
    }
  }, [obraId, loadContratos, loadItens]);

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

  const handleFornecedorChange = (value: string) => {
    setContratoForm((prev) => ({ ...prev, fornecedor: value }));
    if (!value) {
      setFornecedorInsight(null);
      return;
    }

    const contratoExistente = contratos.find(
      (contrato) => contrato.fornecedor.toLowerCase() === value.toLowerCase()
    );

    if (contratoExistente) {
      setFornecedorInsight({
        tipo: "aditivo",
        contratoNumero: contratoExistente.numeroContrato,
      });
    } else {
      setFornecedorInsight({ tipo: "contrato" });
    }
  };

  const handleSelectBaseItem = (itemId: string) => {
    setSelectedBaseItemId(itemId);
    if (!itemId) return;

    const baseItem = itensDisponiveis.find((item) => item.id === itemId);
    if (!baseItem) return;

    setItemForm((prev) => ({
      ...prev,
      descricao: baseItem.servico,
      unidade: prev.unidade || "un",
      quantidade: baseItem.quantidade,
    }));

    handleFornecedorChange(baseItem.empresa);
  };

  const handleOpenModal = () => {
    setContratoForm({
      fornecedor: "",
      numeroContrato: "",
      aprovadorNome: "",
      aprovadorEmail: "",
    });
    setItens([]);
    setSelectedBaseItemId("");
    setFornecedorInsight(null);
    setItemFormError("");
    setShowModal(true);
  };

  const handleAddItem = () => {
    setItemFormError("");

    const descricao =
      itemForm.descricao.trim() || selectedBaseItem?.servico?.trim() || "";

    const unidade = itemForm.unidade.trim() || "un";

    const quantidade =
      itemForm.quantidade > 0
        ? itemForm.quantidade
        : selectedBaseItem && selectedBaseItem.quantidade > 0
        ? selectedBaseItem.quantidade
        : 0;

    if (!descricao) {
      setItemFormError(
        "Selecione um serviço cadastrado ou informe a descrição manualmente."
      );
      return;
    }

    if (!unidade) {
      setItemFormError("Informe a unidade do item.");
      return;
    }

    if (quantidade <= 0) {
      setItemFormError("Defina uma quantidade maior que zero.");
      return;
    }

    if (itemForm.valorUnitario <= 0) {
      setItemFormError("Informe o valor unitário do item.");
      return;
    }

    const novoItem: ItemContrato = {
      id: contratoService.createItemId(),
      descricao,
      unidade,
      quantidade,
      valorUnitario: itemForm.valorUnitario,
      valorTotal: quantidade * itemForm.valorUnitario,
    };

    setItens([...itens, novoItem]);
    setItemForm({
      descricao: "",
      unidade: "",
      quantidade: 0,
      valorUnitario: 0,
    });
    setItemFormError("");
  };

  const handleRemoveItem = (itemId: string) => {
    setItens(itens.filter((item) => item.id !== itemId));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!obraId) return;
    if (savingContrato) return;

    if (itens.length === 0) {
      setError("Adicione pelo menos um item ao contrato");
      return;
    }

    setError("");
    setSavingContrato(true);

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
    } finally {
      setSavingContrato(false);
    }
  };

  const handleViewContrato = (contrato: ContratoType) => {
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

  const getApprovalSteps = (status: string) => {
    return [
      { id: "criado", label: "Criação", state: "completed" },
      { id: "email", label: "E-mail enviado", state: "completed" },
      {
        id: "aguardando",
        label: "Aguardando aprovação",
        state: status === "pendente" ? "current" : "completed",
      },
      {
        id: "conclusao",
        label:
          status === "aprovado"
            ? "Aprovado"
            : status === "rejeitado"
            ? "Rejeitado"
            : "Conclusão",
        state: status === "pendente" ? "upcoming" : "completed",
        highlight:
          status === "pendente"
            ? undefined
            : status === "aprovado"
            ? "aprovado"
            : "rejeitado",
      },
    ];
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

      <div className="contrato-highlights">
        <div className="highlight-card">
          <strong>Dependência – Tela 4 (Itens)</strong>
          <p>
            Os contratos aproveitam fornecedores e serviços já aprovados na tela
            de Itens. Vincule o serviço antes de definir valores contratuais.
          </p>
        </div>
        <div className="highlight-card">
          <strong>Workflow de Aprovação</strong>
          <p>
            Após a criação, o aprovador recebe um link via Power Automate para
            aprovar ou rejeitar o contrato/aditivo.
          </p>
        </div>
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

                <div className="contrato-approval-timeline">
                  {getApprovalSteps(contrato.status).map((step) => (
                    <div
                      key={`${contrato.id}-${step.id}`}
                      className={`timeline-step ${step.state} ${
                        step.highlight ? `timeline-${step.highlight}` : ""
                      }`}
                    >
                      <div className="timeline-dot" />
                      <span>{step.label}</span>
                    </div>
                  ))}
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
                        list="fornecedoresOptions"
                        value={contratoForm.fornecedor}
                        onChange={(e) => handleFornecedorChange(e.target.value)}
                        placeholder="Ex: Fornecedor de Cimento"
                        required
                      />
                      {fornecedoresDisponiveis.length > 0 && (
                        <datalist id="fornecedoresOptions">
                          {fornecedoresDisponiveis.map((fornecedor) => (
                            <option key={fornecedor} value={fornecedor} />
                          ))}
                        </datalist>
                      )}
                      {fornecedorInsight && (
                        <div
                          className={`fornecedor-alert ${fornecedorInsight.tipo}`}
                        >
                          <Info size={16} />
                          {fornecedorInsight.tipo === "aditivo" ? (
                            <span>
                              Fornecedor já possui contrato Nº{" "}
                              {fornecedorInsight.contratoNumero}. Este registro
                              será tratado como aditivo automaticamente.
                            </span>
                          ) : (
                            <span>
                              Nenhum contrato anterior encontrado. Este será um
                              novo contrato base.
                            </span>
                          )}
                        </div>
                      )}
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
                        placeholder="Ex: 1234567890"
                        required
                      />
                    </div>

                    <div className="contrato-info-banner">
                      <MailCheck size={20} />
                      <div>
                        <strong>Power Automate</strong>
                        <p>
                          Ao salvar, um e-mail automático com link seguro de
                          aprovação será enviado para o aprovador informado.
                        </p>
                      </div>
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
                        placeholder="Ex: João da Silva"
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
                        placeholder="Ex: joao@gmail.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="contrato-form-section">
                  <h3>Adicionar Itens</h3>
                  <div className="contrato-form-group full-width">
                    <label>Serviço cadastrado (Tela 4)</label>
                    <select
                      value={selectedBaseItemId}
                      onChange={(e) => handleSelectBaseItem(e.target.value)}
                    >
                      <option value="">
                        Selecione um serviço existente para vincular
                      </option>
                      {itensVinculados.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {selectedBaseItem && (
                      <div className="contrato-base-item">
                        <span>
                          Fornecedor:{" "}
                          <strong>{selectedBaseItem.empresa}</strong>
                        </span>
                        <span>
                          Vagão: <strong>{selectedBaseItem.vagaoNumero}</strong>
                        </span>
                        <span>
                          Qtde orçada:{" "}
                          <strong>
                            {selectedBaseItem.quantidade}/
                            {selectedBaseItem.quantidadeMaxima}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
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
                        required
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
                        required
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
                        placeholder="Ex: 100"
                        required
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
                        placeholder="Ex: 100.00"
                        required
                      />
                    </div>

                    <div className="contrato-form-group add-button">
                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={savingContrato}
                      >
                        <Plus size={16} />
                        {savingContrato ? "Aguarde..." : "Adicionar"}
                      </button>
                    </div>
                  </div>

                  {itemFormError && (
                    <div className="contrato-item-error">
                      <AlertCircle size={16} />
                      <span>{itemFormError}</span>
                    </div>
                  )}

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
                  <button
                    type="submit"
                    className="btn-primary-modal"
                    disabled={savingContrato}
                  >
                    {savingContrato ? "Criando..." : "Criar Contrato"}
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
