import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Ruler,
  Plus,
  Loader2,
  Eye,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { medicaoService } from "../../../services/medicaoService";
import { contratoService } from "../../../services/contratoService";
import { vagaoService } from "../../../services/vagaoService";
import type { Medicao } from "../../../types/medicao";
import type { Contrato } from "../../../types/contratos";
import type { Vagao } from "../../../types/vagao";
import "./MedicaoList.css";

const MedicaoPage = () => {
  const { obraId } = useParams<{ obraId: string }>();
  const navigate = useNavigate();
  const [medicoes, setMedicoes] = useState<Medicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Dados auxiliares para exibição
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [vagoes, setVagoes] = useState<Vagao[]>([]);

  const loadData = useCallback(async () => {
    if (!obraId) return;

    try {
      setLoading(true);
      setError(null);

      const [medicoesData, contratosData, vagoesData] = await Promise.all([
        medicaoService.getMedicoesByObra(obraId),
        contratoService.getContratosByObra(obraId),
        vagaoService.getVagoesByObra(obraId),
      ]);

      setMedicoes(medicoesData);
      setContratos(contratosData);
      setVagoes(vagoesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar medições");
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (medicaoId: string) => {
    if (!obraId) return;

    try {
      setDeleting(true);
      await medicaoService.deleteMedicao(obraId, medicaoId);
      setDeleteConfirm(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir medição");
    } finally {
      setDeleting(false);
    }
  };

  const getContratoNumero = (contratoId: string) => {
    const contrato = contratos.find((c) => c.id === contratoId);
    return contrato?.numeroContrato || "-";
  };

  const getVagaoNumero = (vagaoId: string) => {
    const vagao = vagoes.find((v) => v.id === vagaoId);
    return vagao ? `Vagão ${vagao.numero}` : "-";
  };

  const formatDate = (date: Date | string) => {
    if (typeof date === "string") {
      return new Date(date).toLocaleDateString("pt-BR");
    }
    return date.toLocaleDateString("pt-BR");
  };

  if (loading) {
  return (
      <div className="medicao-list-loading">
        <Loader2 size={48} className="spinner-rotate" />
        <p>Carregando medições...</p>
      </div>
    );
  }

  return (
    <div className="medicao-list-container">
      <div className="medicao-list-header">
        <div className="medicao-list-header-left">
          <Ruler size={32} />
          <div>
            <h1>Medições</h1>
            <p>Gerencie as medições da obra</p>
          </div>
        </div>
        <button
          className="btn-nova-medicao"
          onClick={() => navigate(`/obras/${obraId}/medicao/nova`)}
        >
          <Plus size={20} />
          Nova Medição
        </button>
      </div>

      {error && (
        <div className="medicao-list-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {medicoes.length === 0 ? (
        <div className="medicao-list-empty">
          <Ruler size={64} />
          <h2>Nenhuma medição cadastrada</h2>
          <p>Comece criando a primeira medição desta obra</p>
          <button
            className="btn-nova-medicao"
            onClick={() => navigate(`/obras/${obraId}/medicao/nova`)}
          >
            <Plus size={20} />
            Criar Primeira Medição
          </button>
        </div>
      ) : (
        <div className="medicao-list-table-container">
          <table className="medicao-list-table">
            <thead>
              <tr>
                <th>Nº da Medição</th>
                <th>Data</th>
                <th>Fornecedor</th>
                <th>Contrato</th>
                <th>Vagão</th>
                <th>Itens</th>
                <th>Unidades</th>
                <th>Data de Criação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {medicoes.map((medicao) => (
                <tr key={medicao.id}>
                  <td>
                    <strong>{medicao.numero}</strong>
                  </td>
                  <td>{formatDate(medicao.data)}</td>
                  <td>{medicao.fornecedorId}</td>
                  <td>{getContratoNumero(medicao.contratoId)}</td>
                  <td>{getVagaoNumero(medicao.vagaoId)}</td>
                  <td>{medicao.itemsIds.length}</td>
                  <td>{medicao.unidades.length}</td>
                  <td>{formatDate(medicao.createdAt)}</td>
                  <td>
                    <div className="medicao-list-actions">
                      <button
                        className="btn-action btn-action-view"
                        onClick={() =>
                          navigate(`/obras/${obraId}/medicao/${medicao.id}`)
                        }
                        title="Ver detalhes"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="btn-action btn-action-delete"
                        onClick={() => setDeleteConfirm(medicao.id)}
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
        <div className="medicao-list-modal-overlay">
          <div className="medicao-list-modal">
            <h3>Confirmar Exclusão</h3>
            <p>
              Tem certeza que deseja excluir esta medição? Esta ação não pode
              ser desfeita.
            </p>
            <div className="medicao-list-modal-actions">
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

export default MedicaoPage;
