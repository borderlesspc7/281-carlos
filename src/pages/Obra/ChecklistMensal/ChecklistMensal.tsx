import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  Plus,
  Loader2,
  Eye,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { checklistMensalService } from "../../../services/checklistMensalService";
import type { ChecklistMensal } from "../../../types/checklistMensal";
import "./ChecklistMensal.css";

const ChecklistMensalPage = () => {
  const { obraId } = useParams<{ obraId: string }>();
  const navigate = useNavigate();
  const [checklists, setChecklists] = useState<ChecklistMensal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!obraId) return;

    try {
      setLoading(true);
      setError(null);
      const checklistsData = await checklistMensalService.getChecklistsByObra(
        obraId
      );
      setChecklists(checklistsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar checklists mensais"
      );
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (checklistId: string) => {
    if (!obraId) return;

    try {
      setDeleting(true);
      await checklistMensalService.deleteChecklist(obraId, checklistId);
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao excluir checklist"
      );
    } finally {
      setDeleting(false);
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
      <div className="checklist-list-loading">
        <Loader2 size={48} className="spinner-rotate" />
        <p>Carregando checklists mensais...</p>
      </div>
    );
  }

  return (
    <div className="checklist-list-container">
      <div className="checklist-list-header">
        <div className="checklist-list-header-left">
          <ClipboardCheck size={32} />
          <div>
            <h1>Checklist Mensal</h1>
            <p>Gerencie os checklists mensais da obra</p>
          </div>
        </div>
        <button
          className="btn-novo-checklist"
          onClick={() => navigate(`/obras/${obraId}/checklist-mensal/novo`)}
        >
          <Plus size={20} />
          Criar Novo Checklist
        </button>
      </div>

      {error && (
        <div className="checklist-list-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {checklists.length === 0 ? (
        <div className="checklist-list-empty">
          <ClipboardCheck size={64} />
          <h2>Nenhum checklist cadastrado</h2>
          <p>Comece criando o primeiro checklist mensal desta obra</p>
          <button
            className="btn-novo-checklist"
            onClick={() => navigate(`/obras/${obraId}/checklist-mensal/novo`)}
          >
            <Plus size={20} />
            Criar Primeiro Checklist
          </button>
        </div>
      ) : (
        <div className="checklist-list-table-container">
          <table className="checklist-list-table">
            <thead>
              <tr>
                <th>Mês/Ano</th>
                <th>Status</th>
                <th>Arquivo PDF</th>
                <th>Data de Criação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {checklists.map((checklist) => (
                <tr key={checklist.id}>
                  <td>
                    <strong>
                      {getMonthName(checklist.mes)}/{checklist.ano}
                    </strong>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(checklist.status)}`}>
                      {getStatusLabel(checklist.status)}
                    </span>
                  </td>
                  <td>
                    {checklist.pdfFileName || "checklist.pdf"}
                  </td>
                  <td>{formatDate(checklist.createdAt)}</td>
                  <td>
                    <div className="checklist-list-actions">
                      <button
                        className="btn-action btn-action-view"
                        onClick={() =>
                          navigate(
                            `/obras/${obraId}/checklist-mensal/${checklist.id}`
                          )
                        }
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="btn-action btn-action-delete"
                        onClick={() => setDeleteConfirm(checklist.id)}
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <div className="checklist-list-modal-overlay">
          <div className="checklist-list-modal">
            <h3>Confirmar Exclusão</h3>
            <p>
              Tem certeza que deseja excluir este checklist? Esta ação não pode
              ser desfeita e o arquivo PDF também será removido.
            </p>
            <div className="checklist-list-modal-actions">
              <button
                className="btn-modal btn-modal-cancel"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="btn-modal btn-modal-confirm"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="spinner-rotate" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistMensalPage;
