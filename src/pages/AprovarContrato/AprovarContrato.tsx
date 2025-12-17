import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { contratoService } from "../../services/contratoService";
import type { Contrato } from "../../types/contratos";
import {
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Building2,
  DollarSign,
  Calendar,
  User,
  Mail,
} from "lucide-react";
import "./AprovarContrato.css";

const AprovarContrato = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const contratoId = searchParams.get("contratoId");

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"aprovado" | "rejeitado" | null>(null);
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    const loadContrato = async () => {
      if (!token || !contratoId) {
        setError("Token ou ID do contrato não fornecido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const contratoData = await contratoService.getContratoById(contratoId);

        if (!contratoData) {
          setError("Contrato não encontrado");
          return;
        }

        if (contratoData.tokenAprovacao !== token) {
          setError("Token de aprovação inválido ou expirado");
          return;
        }

        if (contratoData.status !== "pendente") {
          setError(
            `Este contrato já foi ${contratoData.status === "aprovado" ? "aprovado" : "rejeitado"}`
          );
          return;
        }

        setContrato(contratoData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar contrato. Verifique o link de aprovação."
        );
      } finally {
        setLoading(false);
      }
    };

    loadContrato();
  }, [token, contratoId]);

  const handleApprove = async () => {
    if (!token || !contratoId) return;

    try {
      setSubmitting(true);
      setError(null);

      await contratoService.aprovarContrato({
        contratoId,
        token,
        aprovado: approvalAction === "aprovado",
        observacoes: observacoes.trim() || undefined,
      });

      // Recarregar contrato para ver status atualizado
      const updatedContrato = await contratoService.getContratoById(contratoId);
      if (updatedContrato) {
        setContrato(updatedContrato);
        setShowConfirm(false);
        setApprovalAction(null);
        setObservacoes("");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao processar aprovação. Tente novamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <div className="aprovar-contrato-container">
        <div className="aprovar-contrato-loading">
          <Loader2 size={48} className="spinner-rotate" />
          <p>Carregando informações do contrato...</p>
        </div>
      </div>
    );
  }

  if (error && !contrato) {
    return (
      <div className="aprovar-contrato-container">
        <div className="aprovar-contrato-error">
          <AlertCircle size={48} />
          <h2>Erro ao carregar contrato</h2>
          <p>{error}</p>
          <button
            className="btn-back-home"
            onClick={() => navigate("/login")}
          >
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  if (!contrato) {
    return null;
  }

  return (
    <div className="aprovar-contrato-container">
      <div className="aprovar-contrato-header">
        <div className="aprovar-contrato-logo">
          <Building2 size={32} />
          <h1>Aprovação de Contrato</h1>
        </div>
      </div>

      <div className="aprovar-contrato-content">
        {error && (
          <div className="aprovar-contrato-error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {contrato.status !== "pendente" ? (
          <div className="aprovar-contrato-already-processed">
            <div className="status-icon-large">
              {contrato.status === "aprovado" ? (
                <CheckCircle size={64} className="status-approved" />
              ) : (
                <XCircle size={64} className="status-rejected" />
              )}
            </div>
            <h2>
              Contrato {contrato.status === "aprovado" ? "Aprovado" : "Rejeitado"}
            </h2>
            <p>
              Este contrato já foi processado em{" "}
              {contrato.dataAprovacao
                ? formatDate(contrato.dataAprovacao)
                : formatDate(contrato.updatedAt)}
              .
            </p>
            {contrato.observacoesAprovacao && (
              <div className="aprovar-contrato-observations">
                <strong>Observações:</strong>
                <p>{contrato.observacoesAprovacao}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="aprovar-contrato-info-card">
              <div className="aprovar-contrato-info-header">
                <FileText size={32} />
                <div>
                  <h2>
                    {contrato.tipo === "aditivo" ? "Aditivo" : "Contrato"} -{" "}
                    {contrato.fornecedor}
                  </h2>
                  <p className="contrato-number">Nº {contrato.numeroContrato}</p>
                </div>
              </div>

              <div className="aprovar-contrato-info-grid">
                <div className="info-item">
                  <Building2 size={20} />
                  <div>
                    <span className="info-label">Fornecedor</span>
                    <span className="info-value">{contrato.fornecedor}</span>
                  </div>
                </div>
                <div className="info-item">
                  <DollarSign size={20} />
                  <div>
                    <span className="info-label">Valor Total</span>
                    <span className="info-value">
                      {formatCurrency(contrato.valorTotal)}
                    </span>
                  </div>
                </div>
                <div className="info-item">
                  <Calendar size={20} />
                  <div>
                    <span className="info-label">Data de Criação</span>
                    <span className="info-value">
                      {formatDate(contrato.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="info-item">
                  <User size={20} />
                  <div>
                    <span className="info-label">Aprovador</span>
                    <span className="info-value">{contrato.aprovadorNome}</span>
                  </div>
                </div>
                <div className="info-item">
                  <Mail size={20} />
                  <div>
                    <span className="info-label">E-mail</span>
                    <span className="info-value">{contrato.aprovadorEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="aprovar-contrato-items">
              <h3>Itens do Contrato</h3>
              <div className="aprovar-contrato-items-table">
                <table>
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Unidade</th>
                      <th>Quantidade</th>
                      <th>Valor Unitário</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contrato.itens.map((item) => (
                      <tr key={item.id}>
                        <td>{item.descricao}</td>
                        <td>{item.unidade}</td>
                        <td>{item.quantidade}</td>
                        <td>{formatCurrency(item.valorUnitario)}</td>
                        <td>
                          <strong>{formatCurrency(item.valorTotal)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4}>
                        <strong>Total</strong>
                      </td>
                      <td>
                        <strong>{formatCurrency(contrato.valorTotal)}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {!showConfirm ? (
              <div className="aprovar-contrato-actions">
                <div className="aprovar-contrato-actions-header">
                  <h3>Decisão de Aprovação</h3>
                  <p>
                    Revise todas as informações acima antes de tomar sua decisão.
                  </p>
                </div>
                <div className="aprovar-contrato-buttons">
                  <button
                    className="btn-approve"
                    onClick={() => {
                      setApprovalAction("aprovado");
                      setShowConfirm(true);
                    }}
                  >
                    <CheckCircle size={20} />
                    Aprovar Contrato
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => {
                      setApprovalAction("rejeitado");
                      setShowConfirm(true);
                    }}
                  >
                    <XCircle size={20} />
                    Rejeitar Contrato
                  </button>
                </div>
              </div>
            ) : (
              <div className="aprovar-contrato-confirm">
                <h3>
                  {approvalAction === "aprovado"
                    ? "Confirmar Aprovação"
                    : "Confirmar Rejeição"}
                </h3>
                <p>
                  {approvalAction === "aprovado"
                    ? "Deseja realmente aprovar este contrato?"
                    : "Deseja realmente rejeitar este contrato?"}
                </p>

                <div className="aprovar-contrato-observations-input">
                  <label htmlFor="observacoes">
                    Observações (opcional)
                  </label>
                  <textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Adicione observações sobre sua decisão..."
                    rows={4}
                    disabled={submitting}
                  />
                </div>

                <div className="aprovar-contrato-confirm-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setShowConfirm(false);
                      setApprovalAction(null);
                      setObservacoes("");
                    }}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    className={
                      approvalAction === "aprovado" ? "btn-confirm-approve" : "btn-confirm-reject"
                    }
                    onClick={handleApprove}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="spinner-rotate" />
                        Processando...
                      </>
                    ) : (
                      <>
                        {approvalAction === "aprovado" ? (
                          <CheckCircle size={18} />
                        ) : (
                          <XCircle size={18} />
                        )}
                        Confirmar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {contrato.status === "pendente" && !showConfirm && (
              <div className="aprovar-contrato-footer">
                <p>
                  <AlertCircle size={16} />
                  Esta é uma ação irreversível. Certifique-se de revisar todos os
                  detalhes antes de prosseguir.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AprovarContrato;

