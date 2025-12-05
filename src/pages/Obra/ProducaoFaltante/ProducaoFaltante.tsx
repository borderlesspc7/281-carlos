import { useParams } from "react-router-dom";
import { FileDown, Loader2, AlertCircle, Package } from "lucide-react";
import { useProducaoFaltante } from "../../../hooks/useProducaoFaltante";
import { exportToExcel } from "../../../utils/exportExcel";
import "./ProducaoFaltante.css";

const ProducaoFaltante = () => {
  const { obraId } = useParams<{ obraId: string }>();
  const { dados, loading, error } = useProducaoFaltante(obraId);

  const handleExportExcel = () => {
    if (dados.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }
    exportToExcel(dados, "producao_faltante");
  };

  if (loading) {
    return (
      <div className="producao-faltante-loading">
        <Loader2 size={48} className="spinner-rotate" />
        <p>Carregando dados de produção faltante...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="producao-faltante-error">
        <AlertCircle size={48} />
        <h2>Erro ao carregar dados</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="producao-faltante-container">
      <div className="producao-faltante-header">
        <div className="producao-faltante-header-left">
          <Package size={32} />
          <div>
            <h1>Produção Faltante</h1>
            <p>Situação de produção e medição por vagão</p>
          </div>
        </div>
        <button
          className="btn-export-excel"
          onClick={handleExportExcel}
          disabled={dados.length === 0}
        >
          <FileDown size={20} />
          Gerar Excel
        </button>
      </div>

      {dados.length === 0 ? (
        <div className="producao-faltante-empty">
          <Package size={64} />
          <h2>Nenhum vagão cadastrado</h2>
          <p>Cadastre vagões para visualizar a produção faltante.</p>
        </div>
      ) : (
        <div className="producao-faltante-table-container">
          <table className="producao-faltante-table">
            <thead>
              <tr>
                <th>Vagão</th>
                <th>Total</th>
                <th>Produzido</th>
                <th>Medido</th>
                <th>A Comprometer</th>
                <th>Faltante a Produzir</th>
                <th>Faltante a Medir</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((item) => (
                <tr key={item.vagaoId}>
                  <td>
                    <strong>Vagão {item.vagaoNumero}</strong>
                  </td>
                  <td>{item.total}</td>
                  <td>{item.produzido}</td>
                  <td>{item.medido}</td>
                  <td className={item.aComprometer < 0 ? "negative" : ""}>
                    {item.aComprometer}
                  </td>
                  <td className={item.faltanteProduzir > 0 ? "warning" : ""}>
                    {item.faltanteProduzir}
                  </td>
                  <td className={item.faltanteMedir > 0 ? "warning" : ""}>
                    {item.faltanteMedir}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProducaoFaltante;
