import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { checklistMensalService } from "../../../services/checklistMensalService";
import type { ChecklistMensal } from "../../../types/checklistMensal";
import "./ChecklistMensalDetails.css";

const ChecklistMensalDetails = () => {
  const { obraId, checklistId } = useParams<{
    obraId: string;
    checklistId: string;
  }>();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<ChecklistMensal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approvalType, setApprovalType] = useState<
    "aprovado" | "aprovado_com_restricao" | null
  >(null);

  useEffect(() => {
    const loadData = async () => {
      if (!obraId || !checklistId) return;

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

        setChecklist(checklistData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar checklist"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [obraId, checklistId]);

  const [observacoesAprovacao, setObservacoesAprovacao] = useState("");

  const handleApprove = async (status: "aprovado" | "aprovado_com_restricao") => {
    if (!obraId || !checklistId) return;

    try {
      setApproving(true);
      setError(null);

      await checklistMensalService.updateChecklistStatus(obraId, checklistId, {
        status,
        observacoes: observacoesAprovacao.trim() || undefined,
      });

      // Recarregar dados
      const updatedChecklist = await checklistMensalService.getChecklistById(
        obraId,
        checklistId
      );
      if (updatedChecklist) {
        setChecklist(updatedChecklist);
      }
      setApprovalType(null);
      setObservacoesAprovacao("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao aprovar checklist. Tente novamente."
      );
    } finally {
      setApproving(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pendente":
        return "Aguardando aprovação";
      case "aprovado":
        return "Aprovado";
      case "aprovado_com_restricao":
        return "Aprovado com restrição";
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "pendente":
        return "status-pendente";
      case "aprovado":
        return "status-aprovado";
      case "aprovado_com_restricao":
        return "status-aprovado-restricao";
      default:
        return "";
    }
  };

  const formatDate = (date: Date | string) => {
    if (typeof date === "string") {
      return new Date(date).toLocaleDateString("pt-BR");
    }
    return date.toLocaleDateString("pt-BR");
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
      <div className="checklist-details-loading">
        <Loader2 size={48} className="spinner-rotate" />
        <p>Carregando detalhes do checklist...</p>
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="checklist-details-container">
        <div className="checklist-details-error">
          <AlertCircle size={48} />
          <h2>Erro ao carregar checklist</h2>
          <p>{error || "Checklist não encontrado"}</p>
          <button
            className="btn-back"
            onClick={() => navigate(`/obras/${obraId}/checklist-mensal`)}
          >
            <ArrowLeft size={20} />
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checklist-details-container">
      <div className="checklist-details-header">
        <button
          className="btn-back"
          onClick={() => navigate(`/obras/${obraId}/checklist-mensal`)}
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div className="checklist-details-header-content">
          <ClipboardCheck size={32} />
          <div>
            <h1>Detalhes do Checklist Mensal</h1>
            <p>
              {getMonthName(checklist.mes)}/{checklist.ano}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="checklist-details-error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="checklist-details-content">
        <div className="checklist-details-section">
          <h2>Informações do Checklist</h2>
          <div className="checklist-details-grid">
            <div className="checklist-details-item">
              <span className="checklist-details-label">Mês/Ano:</span>
              <span className="checklist-details-value">
                {getMonthName(checklist.mes)}/{checklist.ano}
              </span>
            </div>
            <div className="checklist-details-item">
              <span className="checklist-details-label">Status:</span>
              <span
                className={`status-badge ${getStatusClass(checklist.status)}`}
              >
                {getStatusLabel(checklist.status)}
              </span>
            </div>
            <div className="checklist-details-item">
              <span className="checklist-details-label">Data de Criação:</span>
              <span className="checklist-details-value">
                {formatDate(checklist.createdAt)}
              </span>
            </div>
            {checklist.updatedAt && (
              <div className="checklist-details-item">
                <span className="checklist-details-label">Última Atualização:</span>
                <span className="checklist-details-value">
                  {formatDate(checklist.updatedAt)}
                </span>
              </div>
            )}
            <div className="checklist-details-item checklist-details-item-full">
              <span className="checklist-details-label">Observações:</span>
              <span className="checklist-details-value">
                {checklist.observacoes || "Nenhuma observação registrada."}
              </span>
            </div>
          </div>
        </div>

        <div className="checklist-details-section">
          <h2>Documento PDF</h2>
          <div className="checklist-details-pdf">
            <div className="checklist-pdf-info">
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

        {checklist.status === "pendente" && (
          <div className="checklist-details-section">
            <h2>Aprovação</h2>
            <p className="checklist-approval-description">
              Revise o checklist e o documento PDF. Após a análise, você pode
              aprovar normalmente ou aprovar com restrição.
            </p>

            {approvalType && (
              <div className="checklist-approval-confirm">
                <p>
                  {approvalType === "aprovado"
                    ? "Deseja aprovar este checklist?"
                    : "Deseja aprovar este checklist com restrição?"}
                </p>
                <div className="checklist-approval-observations">
                  <label htmlFor="observacoes-aprovacao">
                    Observações {approvalType === "aprovado_com_restricao" && "(recomendado)"}
                  </label>
                  <textarea
                    id="observacoes-aprovacao"
                    value={observacoesAprovacao}
                    onChange={(e) => setObservacoesAprovacao(e.target.value)}
                    placeholder={
                      approvalType === "aprovado_com_restricao"
                        ? "Descreva as restrições ou observações sobre este checklist..."
                        : "Adicione observações sobre sua decisão (opcional)..."
                    }
                    rows={4}
                    disabled={approving}
                  />
                </div>
                <div className="checklist-approval-confirm-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setApprovalType(null);
                      setObservacoesAprovacao("");
                    }}
                    disabled={approving}
                  >
                    Cancelar
                  </button>
                  <button
                    className={`btn-approve ${
                      approvalType === "aprovado_com_restricao"
                        ? "btn-approve-restriction"
                        : ""
                    }`}
                    onClick={() => handleApprove(approvalType)}
                    disabled={approving}
                  >
                    {approving ? (
                      <>
                        <Loader2 size={16} className="spinner-rotate" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Confirmar
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {!approvalType && (
              <div className="checklist-approval-actions">
                <button
                  className="btn-approve btn-approve-normal"
                  onClick={() => setApprovalType("aprovado")}
                  disabled={approving}
                >
                  <CheckCircle size={20} />
                  Aprovar Checklist
                </button>
                <button
                  className="btn-approve btn-approve-restriction"
                  onClick={() => setApprovalType("aprovado_com_restricao")}
                  disabled={approving}
                >
                  <AlertTriangle size={20} />
                  Aprovar com Restrição
                </button>
              </div>
            )}
          </div>
        )}

        {checklist.status !== "pendente" && (
          <div className="checklist-details-section">
            <h2>Status de Aprovação</h2>
            <div className="checklist-approval-status">
              <div className={`status-badge-large ${getStatusClass(checklist.status)}`}>
                {checklist.status === "aprovado" ? (
                  <CheckCircle size={24} />
                ) : (
                  <AlertTriangle size={24} />
                )}
                <span>{getStatusLabel(checklist.status)}</span>
              </div>
              <p>
                Este checklist foi{" "}
                {checklist.status === "aprovado"
                  ? "aprovado"
                  : "aprovado com restrição"}{" "}
                em {formatDate(checklist.updatedAt || checklist.createdAt)}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChecklistMensalDetails;




