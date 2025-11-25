import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle,
  FileSpreadsheet,
  Loader2,
  X,
  CheckCircle,
} from "lucide-react";
import { estoqueInsumoService } from "../../../services/estoqueInsumoService";
import { kitService } from "../../../services/kitService";
import { producaoFaltanteService } from "../../../services/producaoFaltanteService";
import type { EstoqueInsumo, KitAnalise } from "../../../types/estoqueInsumo";
import type { Kit } from "../../../types/kit";
import * as XLSX from "xlsx";
import "./MaterialFaltante.css";

const MaterialFaltante = () => {
  const { obraId } = useParams();
  const [estoques, setEstoques] = useState<EstoqueInsumo[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [kitsFaltantes, setKitsFaltantes] = useState<KitAnalise[]>([]);
  const [producoesFaltantes, setProducoesFaltantes] = useState<
    Map<string, number>
  >(new Map());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!obraId) return;

    setLoading(true);
    setError("");

    try {
      const [estoquesData, kitsData, producoesSalvas] = await Promise.all([
        estoqueInsumoService.getEstoquesByObra(obraId),
        kitService.getKitsByObra(obraId),
        producaoFaltanteService.getProducoesFaltantesByObra(obraId),
      ]);

      setEstoques(estoquesData);
      setKits(kitsData);

      // Carregar produções faltantes salvas ou inicializar com 0
      const novasProducoes = new Map<string, number>();
      kitsData.forEach((kit) => {
        novasProducoes.set(kit.id, producoesSalvas.get(kit.id) || 0);
      });
      setProducoesFaltantes(novasProducoes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  const realizarAnalise = useCallback(() => {
    if (kits.length === 0 || estoques.length === 0) {
      setKitsFaltantes([]);
      return;
    }

    const resultado = estoqueInsumoService.analisarKits(
      kits,
      estoques,
      producoesFaltantes
    );

    // Filtrar apenas kits com alerta (material faltante)
    const kitComFalta = resultado.filter((analise) => analise.temAlerta);
    setKitsFaltantes(kitComFalta);
  }, [kits, estoques, producoesFaltantes]);

  useEffect(() => {
    if (obraId) {
      loadData();
    }
  }, [obraId, loadData]);

  useEffect(() => {
    realizarAnalise();
  }, [realizarAnalise]);

  const exportarParaExcel = () => {
    interface ExcelRow {
      Kit: string;
      Vagão: string;
      "Produção Faltante": number;
      Insumo: string;
      Unidade: string;
      "Qtd por Unidade": number;
      "Qtd Total Necessária": number;
      "Qtd Alocada": number;
      Déficit: number;
    }

    const dados: ExcelRow[] = [];

    kitsFaltantes.forEach((analise) => {
      // Filtrar apenas insumos com déficit
      const insumosFaltantes = analise.insumos.filter(
        (insumo) => insumo.temAlerta
      );

      insumosFaltantes.forEach((insumo) => {
        dados.push({
          Kit: analise.kitNome,
          Vagão: `Vagão ${analise.vagaoNumero}`,
          "Produção Faltante": analise.producaoFaltante,
          Insumo: insumo.nome,
          Unidade: insumo.unidade,
          "Qtd por Unidade": insumo.quantidadePorUnidade,
          "Qtd Total Necessária": insumo.quantidadeTotal,
          "Qtd Alocada": insumo.quantidadeAlocada,
          Déficit: insumo.deficit,
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Material Faltante");

    // Ajustar largura das colunas
    const columnWidths = [
      { wch: 25 }, // Kit
      { wch: 12 }, // Vagão
      { wch: 18 }, // Produção Faltante
      { wch: 25 }, // Insumo
      { wch: 10 }, // Unidade
      { wch: 18 }, // Qtd por Unidade
      { wch: 20 }, // Qtd Total Necessária
      { wch: 15 }, // Qtd Alocada
      { wch: 12 }, // Déficit
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.writeFile(workbook, `material-faltante-${new Date().getTime()}.xlsx`);
  };

  if (loading) {
    return (
      <div className="material-faltante-container">
        <div className="material-faltante-loading">
          <Loader2 size={48} />
          <p>Carregando análise de materiais faltantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="material-faltante-container">
      <div className="material-faltante-header">
        <div className="material-faltante-header-left">
          <AlertTriangle size={32} />
          <div>
            <h1>Material Faltante</h1>
            <p>Kits com déficit de insumos identificados</p>
          </div>
        </div>
        <div className="material-faltante-header-actions">
          <button
            className="btn-export-material"
            onClick={exportarParaExcel}
            disabled={kitsFaltantes.length === 0}
          >
            <FileSpreadsheet size={20} />
            Exportar Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="material-faltante-error">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button
            onClick={() => {
              setError("");
              loadData();
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {kitsFaltantes.length === 0 ? (
        <div className="material-faltante-empty">
          <CheckCircle size={64} />
          <h2>Nenhum Material Faltante!</h2>
          <p>
            Todos os kits têm insumos suficientes no estoque. Não há déficit
            identificado no momento.
          </p>
        </div>
      ) : (
        <>
          <div className="material-faltante-summary">
            <AlertTriangle size={40} />
            <div className="material-faltante-summary-content">
              <h2>Atenção Necessária</h2>
              <p>
                <strong>{kitsFaltantes.length}</strong>{" "}
                {kitsFaltantes.length === 1 ? "kit possui" : "kits possuem"}{" "}
                falta de materiais. Revise e providencie os insumos necessários.
              </p>
            </div>
          </div>

          <div className="material-faltante-list">
            {kitsFaltantes.map((analise) => {
              // Filtrar apenas insumos com déficit para exibição
              const insumosFaltantes = analise.insumos.filter(
                (insumo) => insumo.temAlerta
              );

              return (
                <div key={analise.kitId} className="material-faltante-card">
                  <div className="material-faltante-card-header">
                    <div className="material-faltante-info">
                      <AlertTriangle size={24} />
                      <div>
                        <h3>{analise.kitNome}</h3>
                        <span className="material-faltante-vagao">
                          Vagão {analise.vagaoNumero}
                        </span>
                        <span className="material-faltante-producao">
                          Produção faltante: {analise.producaoFaltante}{" "}
                          apartamentos
                        </span>
                      </div>
                    </div>
                    <div className="material-faltante-badge">ALERTA</div>
                  </div>

                  <div className="material-faltante-insumos">
                    <table>
                      <thead>
                        <tr>
                          <th>Insumo Faltante</th>
                          <th>Unidade</th>
                          <th>Qtd/Un</th>
                          <th>Necessário</th>
                          <th>Alocado</th>
                          <th>Déficit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insumosFaltantes.map((insumo, idx) => (
                          <tr key={idx}>
                            <td>
                              <strong>{insumo.nome}</strong>
                            </td>
                            <td>{insumo.unidade}</td>
                            <td>{insumo.quantidadePorUnidade}</td>
                            <td>
                              {insumo.quantidadeTotal.toLocaleString("pt-BR")}
                            </td>
                            <td>
                              {insumo.quantidadeAlocada.toLocaleString("pt-BR")}
                            </td>
                            <td>
                              <span className="deficit-valor-material">
                                {insumo.deficit.toLocaleString("pt-BR")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MaterialFaltante;
