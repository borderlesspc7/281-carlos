import { useState, useEffect, useCallback } from "react";
import { vagaoService } from "../services/vagaoService";
import { producaoService } from "../services/producaoService";
import { medicaoService } from "../services/medicaoService";
import type { Vagao } from "../types/vagao";
import type { Producao } from "../types/producao";
import type { Medicao } from "../types/medicao";
import type { ProducaoFaltanteVagao } from "../types/producaoFaltanteVagao";

export const useProducaoFaltante = (obraId: string | undefined) => {
  const [dados, setDados] = useState<ProducaoFaltanteVagao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calcularDados = useCallback(
    (
      vagoes: Vagao[],
      producoes: Producao[],
      medicoes: Medicao[]
    ): ProducaoFaltanteVagao[] => {
      return vagoes.map((vagao) => {
        // 1. Calcular total previsto
        // Assumindo que total = numeroApartamentos
        // Se houver qtdPorApartamento, seria: qtdPorApartamento * numeroApartamentos
        const total = vagao.numeroApartamentos;

        // 2. Calcular produzido (soma de unidades das produções deste vagão)
        const producoesDoVagao = producoes.filter(
          (p) => p.vagaoId === vagao.id
        );
        const unidadesProduzidas = new Set<string>();
        producoesDoVagao.forEach((producao) => {
          producao.unidades.forEach((unidade) => {
            unidadesProduzidas.add(unidade);
          });
        });
        const produzido = unidadesProduzidas.size;

        // 3. Calcular medido (soma de unidades das medições deste vagão)
        const medicoesDoVagao = medicoes.filter(
          (m) => m.vagaoId === vagao.id
        );
        const unidadesMedidas = new Set<string>();
        medicoesDoVagao.forEach((medicao) => {
          medicao.unidades.forEach((unidade) => {
            unidadesMedidas.add(unidade);
          });
        });
        const medido = unidadesMedidas.size;

        // 4. A comprometer = produzido - medido
        const aComprometer = produzido - medido;

        // 5. Faltante a produzir = total - produzido
        const faltanteProduzir = total - produzido;

        // 6. Faltante a medir = total - medido
        const faltanteMedir = total - medido;

        return {
          vagaoId: vagao.id,
          vagaoNumero: vagao.numero,
          total,
          produzido,
          medido,
          aComprometer,
          faltanteProduzir,
          faltanteMedir,
        };
      });
    },
    []
  );

  const loadData = useCallback(async () => {
    if (!obraId) return;

    try {
      setLoading(true);
      setError(null);

      const [vagoes, producoes, medicoes] = await Promise.all([
        vagaoService.getVagoesByObra(obraId),
        producaoService.getProducoesByObra(obraId),
        medicaoService.getMedicoesByObra(obraId),
      ]);

      const dadosCalculados = calcularDados(vagoes, producoes, medicoes);
      setDados(dadosCalculados);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar dados de produção faltante"
      );
    } finally {
      setLoading(false);
    }
  }, [obraId, calcularDados]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { dados, loading, error, reload: loadData };
};

