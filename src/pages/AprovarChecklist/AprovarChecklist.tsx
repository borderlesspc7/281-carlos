import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { checklistMensalService } from "../../services/checklistMensalService";
import type { ChecklistMensal } from "../../types/checklistMensal";
import {
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Calendar,
  FileText,
  ExternalLink,
  User,
  Mail,
} from "lucide-react";
import "./AprovarChecklist.css";

const AprovarChecklist = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const checklistId = searchParams.get("checklistId");
  const obraId = searchParams.get("obraId");

  const [checklist, setChecklist] = useState<ChecklistMensal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [approvalAction, setApprovalAction] = useState<
    "aprovado" | "aprovado_com_restricao" | null
  >(null);
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    const loadChecklist = async () => {
      if (!token || !checklistId || !obraId) {
        setError("Token, ID do checklist ou ID da obra não fornecido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const checklistData = await checklistMensalService.getChecklistById(
          obraId,
          checklistId
        );

        if (!checklistData) {
          setError("Checklist não encontrado");
          return;
        }

        if (checklistData.tokenAprovacao !== token) {
          setError("Token de aprovação inválido ou expirado");
          return;
        }

        if (checklistData.status !== "pendente") {
          setError(
            `Este checklist já foi ${
              checklistData.status === "aprovado"
                ? "aprovado"
                : checklistData.status === "aprovado_com_restricao"
                ? "aprovado com restrição"
                : "processado"
            }`
          );
          return;
        }

        setChecklist(checklistData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar checklist. Verifique o link de aprovação."
        );
      } finally {
        setLoading(false);
      }
    };

    loadChecklist();
  }, [token, checklistId, obraId]);

  const handleApprove = async () => {
    if (!token || !checklistId || !obraId || !approvalAction) return;

    try {
      setSubmitting(true);
      setError(null);

      await checklistMensalService.aprovarChecklist({
        checklistId,
        obraId,
        token,
        aprovado: approvalAction === "aprovado",
        observacoes: observacoes.trim() || undefined,
      });

      // Recarregar checklist para ver status atualizado
      const updatedChecklist = await checklistMensalService.getChecklistById(
        obraId,
        checklistId
      );
      if (updatedChecklist) {
        setChecklist(updatedChecklist);
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getMonthName = (mes: number) => {
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return months[mes - 1] || mes.toString();
  };

  if (loading) {
    return (
      <div className="aprovar-checklist-container">
        <div className="aprovar-checklist-loading">
          <Loader2 size={48} className="spinner-rotate" />
          <p>Carregando informações do checklist...</p>
        </div>
      </div>
    );
  }

  if (error && !checklist) {
    return (
      <div className="aprovar-checklist-container">
        <div className="aprovar-checklist-error">
          <AlertCircle size={48} />
          <h2>Erro ao carregar checklist</h2>
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

  if (!checklist) {
    return null;
  }

  return (
    <div className="aprovar-checklist-container">
      <div className="aprovar-checklist-header">
        <div className="aprovar-checklist-logo">
          <ClipboardCheck size={32} />
          <h1>Aprovação de Checklist Mensal</h1>
        </div>
      </div>

      <div className="aprovar-checklist-content">
        {error && (
          <div className="aprovar-checklist-error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {checklist.status !== "pendente" ? (
          <div className="aprovar-checklist-already-processed">
            <div className="status-icon-large">
              {checklist.status === "aprovado" ? (
                <CheckCircle size={64} className="status-approved" />
              ) : (
                <AlertTriangle size={64} className="status-restriction" />
              )}
            </div>
            <h2>
              Checklist{" "}
              {checklist.status === "aprovado"
                ? "Aprovado"
                : "Aprovado com Restrição"}
            </h2>
            <p>
              Este checklist já foi processado em{" "}
              {checklist.dataAprovacao
                ? formatDate(checklist.dataAprovacao)
                : checklist.updatedAt
                ? formatDate(checklist.updatedAt)
                : formatDate(checklist.createdAt)}
              .
            </p>
            {checklist.observacoesAprovacao && (
              <div className="aprovar-checklist-observations">
                <strong>Observações:</strong>
                <p>{checklist.observacoesAprovacao}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="aprovar-checklist-info-card">
              <div className="aprovar-checklist-info-header">
                <ClipboardCheck size={32} />
                <div>
                  <h2>
                    Checklist Mensal - {getMonthName(checklist.mes)}/{checklist.ano}
                  </h2>
                  <p className="checklist-period">
                    Período de referência
                  </p>
                </div>
              </div>

              <div className="aprovar-checklist-info-grid">
                <div className="info-item">
                  <Calendar size={20} />
                  <div>
                    <span className="info-label">Mês/Ano</span>
                    <span className="info-value">
                      {getMonthName(checklist.mes)}/{checklist.ano}
                    </span>
                  </div>
                </div>
                <div className="info-item">
                  <Calendar size={20} />
                  <div>
                    <span className="info-label">Data de Criação</span>
                    <span className="info-value">
                      {formatDate(checklist.createdAt)}
                    </span>
                  </div>
                </div>
                {checklist.aprovadorNome && (
                  <div className="info-item">
                    <User size={20} />
                    <div>
                      <span className="info-label">Aprovador</span>
                      <span className="info-value">
                        {checklist.aprovadorNome}
                      </span>
                    </div>
                  </div>
                )}
                {checklist.aprovadorEmail && (
                  <div className="info-item">
                    <Mail size={20} />
                    <div>
                      <span className="info-label">E-mail</span>
                      <span className="info-value">
                        {checklist.aprovadorEmail}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {checklist.observacoes && (
                <div className="aprovar-checklist-observations-section">
                  <h3>Observações do Checklist</h3>
                  <p>{checklist.observacoes}</p>
                </div>
              )}
            </div>

            <div className="aprovar-checklist-pdf">
              <h3>Documento PDF</h3>
              <div className="aprovar-checklist-pdf-card">
                <div className="pdf-info">
                  <FileText size={32} />
                  <div>
                    <strong>
                      {checklist.pdfFileName || "checklist.pdf"}
                    </strong>
                    <p>Arquivo PDF do checklist mensal</p>
                  </div>
                </div>
                <a
                  href={checklist.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-view-pdf"
                >
                  <ExternalLink size={20} />
                  Abrir PDF
                </a>
              </div>
            </div>

            {!showConfirm ? (
              <div className="aprovar-checklist-actions">
                <div className="aprovar-checklist-actions-header">
                  <h3>Decisão de Aprovação</h3>
                  <p>
                    Revise o documento PDF e as informações acima antes de tomar
                    sua decisão.
                  </p>
                </div>
                <div className="aprovar-checklist-buttons">
                  <button
                    className="btn-approve"
                    onClick={() => {
                      setApprovalAction("aprovado");
                      setShowConfirm(true);
                    }}
                  >
                    <CheckCircle size={20} />
                    Aprovar Checklist
                  </button>
                  <button
                    className="btn-approve-restriction"
                    onClick={() => {
                      setApprovalAction("aprovado_com_restricao");
                      setShowConfirm(true);
                    }}
                  >
                    <AlertTriangle size={20} />
                    Aprovar com Restrição
                  </button>
                </div>
              </div>
            ) : (
              <div className="aprovar-checklist-confirm">
                <h3>
                  {approvalAction === "aprovado"
                    ? "Confirmar Aprovação"
                    : "Confirmar Aprovação com Restrição"}
                </h3>
                <p>
                  {approvalAction === "aprovado"
                    ? "Deseja realmente aprovar este checklist?"
                    : "Deseja realmente aprovar este checklist com restrição?"}
                </p>

                <div className="aprovar-checklist-observations-input">
                  <label htmlFor="observacoes">
                    Observações {approvalAction === "aprovado_com_restricao" && "(recomendado)"}
                  </label>
                  <textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder={
                      approvalAction === "aprovado_com_restricao"
                        ? "Descreva as restrições ou observações sobre este checklist..."
                        : "Adicione observações sobre sua decisão (opcional)..."
                    }
                    rows={4}
                    disabled={submitting}
                  />
                </div>

                <div className="aprovar-checklist-confirm-actions">
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
                      approvalAction === "aprovado"
                        ? "btn-confirm-approve"
                        : "btn-confirm-restriction"
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
                          <AlertTriangle size={18} />
                        )}
                        Confirmar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {checklist.status === "pendente" && !showConfirm && (
              <div className="aprovar-checklist-footer">
                <p>
                  <AlertCircle size={16} />
                  Esta é uma ação irreversível. Certifique-se de revisar o documento
                  PDF antes de prosseguir.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AprovarChecklist;

