import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Ruler, Loader2, AlertCircle } from "lucide-react";
import { medicaoService } from "../../../services/medicaoService";
import { contratoService } from "../../../services/contratoService";
import { vagaoService } from "../../../services/vagaoService";
import { itemVagaoService } from "../../../services/itemVagaoService";
import type { Medicao } from "../../../types/medicao";
import type { Contrato } from "../../../types/contratos";
import type { Vagao } from "../../../types/vagao";
import type { ItemVagao } from "../../../types/itemVagao";
import "./MedicaoDetails.css";

const MedicaoDetails = () => {
  const { obraId, medicaoId } = useParams<{ obraId: string; medicaoId: string }>();
  const navigate = useNavigate();
  const [medicao, setMedicao] = useState<Medicao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dados relacionados
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [aditivos, setAditivos] = useState<Contrato[]>([]);
  const [vagao, setVagao] = useState<Vagao | null>(null);
  const [itens, setItens] = useState<ItemVagao[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!obraId || !medicaoId) return;

      try {
        setLoading(true);
        setError(null);

        const medicaoData = await medicaoService.getMedicaoById(obraId, medicaoId);

        if (!medicaoData) {
          setError("Medição não encontrada");
          return;
        }

        setMedicao(medicaoData);

        // Carregar dados relacionados
        const [contratoData, vagaoData, itensData, contratosData] = await Promise.all([
          contratoService.getContratoById(medicaoData.contratoId),
          vagaoService.getVagoesByObra(obraId).then((vagoes) =>
            vagoes.find((v) => v.id === medicaoData.vagaoId)
          ),
          itemVagaoService.getItensByObra(obraId).then((itens) =>
            itens.filter((item) => medicaoData.itemsIds.includes(item.id))
          ),
          contratoService.getContratosByObra(obraId),
        ]);

        setContrato(contratoData);
        setVagao(vagaoData || null);

        // Filtrar aditivos
        if (contratoData) {
          const aditivosData = contratosData.filter(
            (c) =>
              c.tipo === "aditivo" &&
              c.contratoOriginalId === contratoData.id &&
              medicaoData.aditivosIds.includes(c.id)
          );
          setAditivos(aditivosData);
        }

        setItens(itensData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar medição");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [obraId, medicaoId]);

  const formatDate = (date: Date | string) => {
    if (typeof date === "string") {
      return new Date(date).toLocaleDateString("pt-BR");
    }
    return date.toLocaleDateString("pt-BR");
  };

  if (loading) {
    return (
      <div className="medicao-details-loading">
        <Loader2 size={48} className="spinner-rotate" />
        <p>Carregando detalhes da medição...</p>
      </div>
    );
  }

  if (error || !medicao) {
    return (
      <div className="medicao-details-container">
        <div className="medicao-details-error">
          <AlertCircle size={48} />
          <h2>Erro ao carregar medição</h2>
          <p>{error || "Medição não encontrada"}</p>
          <button
            className="btn-back"
            onClick={() => navigate(`/obras/${obraId}/medicao`)}
          >
            <ArrowLeft size={20} />
            Voltar para lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="medicao-details-container">
      <div className="medicao-details-header">
        <button
          className="btn-back"
          onClick={() => navigate(`/obras/${obraId}/medicao`)}
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div className="medicao-details-header-content">
          <Ruler size={32} />
          <div>
            <h1>Detalhes da Medição</h1>
            <p>Medição {medicao.numero}</p>
          </div>
        </div>
      </div>

      <div className="medicao-details-content">
        <div className="medicao-details-section">
          <h2>Dados Básicos</h2>
          <div className="medicao-details-grid">
            <div className="medicao-details-item">
              <span className="medicao-details-label">Número da Medição:</span>
              <span className="medicao-details-value">{medicao.numero}</span>
            </div>
            <div className="medicao-details-item">
              <span className="medicao-details-label">Data da Medição:</span>
              <span className="medicao-details-value">{formatDate(medicao.data)}</span>
            </div>
            <div className="medicao-details-item">
              <span className="medicao-details-label">Data de Criação:</span>
              <span className="medicao-details-value">
                {formatDate(medicao.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="medicao-details-section">
          <h2>Fornecedor e Contrato</h2>
          <div className="medicao-details-grid">
            <div className="medicao-details-item">
              <span className="medicao-details-label">Fornecedor:</span>
              <span className="medicao-details-value">{medicao.fornecedorId}</span>
            </div>
            <div className="medicao-details-item">
              <span className="medicao-details-label">Contrato:</span>
              <span className="medicao-details-value">
                {contrato?.numeroContrato || "-"}
              </span>
            </div>
            {aditivos.length > 0 && (
              <div className="medicao-details-item medicao-details-item-full">
                <span className="medicao-details-label">Aditivos:</span>
                <div className="medicao-details-aditivos">
                  {aditivos.map((aditivo) => (
                    <span key={aditivo.id} className="medicao-details-aditivo-tag">
                      {aditivo.numeroContrato}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="medicao-details-section">
          <h2>Vagão</h2>
          <div className="medicao-details-grid">
            <div className="medicao-details-item">
              <span className="medicao-details-label">Vagão:</span>
              <span className="medicao-details-value">
                {vagao ? `Vagão ${vagao.numero}` : "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="medicao-details-section">
          <h2>Itens da Medição</h2>
          {itens.length === 0 ? (
            <p className="medicao-details-empty">Nenhum item selecionado</p>
          ) : (
            <div className="medicao-details-items">
              {itens.map((item) => (
                <div key={item.id} className="medicao-details-item-card">
                  <div className="medicao-details-item-header">
                    <span className="medicao-details-item-servico">
                      {item.servico}
                    </span>
                    <span className="medicao-details-item-empresa">{item.empresa}</span>
                  </div>
                  <div className="medicao-details-item-info">
                    <span>Quantidade: {item.quantidade}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="medicao-details-section">
          <h2>Unidades Medidas</h2>
          <div className="medicao-details-unidades-info">
            <div className="medicao-details-item">
              <span className="medicao-details-label">Total de Unidades:</span>
              <span className="medicao-details-value">
                {medicao.unidades.length} unidade(s)
              </span>
            </div>
            {medicao.unidades.length > 0 && (
              <div className="medicao-details-unidades-list">
                {medicao.unidades.sort().map((unidade) => (
                  <span key={unidade} className="medicao-details-unidade-tag">
                    {unidade}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicaoDetails;


