import { db } from "../lib/firebaseconfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import type {
  CustoVagao,
  CreateCustoVagaoData,
  UpdateCustoVagaoData,
} from "../types/custoVagao";
import type { Vagao } from "../types/vagao";

const COLLECTION_NAME = "custos_vagoes";

export const custoVagaoService = {
  async createCusto(
    obraId: string,
    data: CreateCustoVagaoData,
    vagaoNumero: number
  ): Promise<CustoVagao> {
    try {
      const custoTotal = data.custoMaterial + data.custoMaoObra;

      const custoData = {
        obraId,
        vagaoId: data.vagaoId,
        vagaoNumero,
        custoMaterial: data.custoMaterial,
        custoMaoObra: data.custoMaoObra,
        custoTotal,
        peso: 0, // Será recalculado após obter todos os custos
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), custoData);

      // Recalcular pesos de todos os custos desta obra
      await this.recalcularPesos(obraId);

      return {
        id: docRef.id,
        obraId,
        vagaoId: data.vagaoId,
        vagaoNumero,
        custoMaterial: data.custoMaterial,
        custoMaoObra: data.custoMaoObra,
        custoTotal,
        peso: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Erro ao criar custo:", error);
      throw new Error("Não foi possível criar o custo. Tente novamente.");
    }
  },

  async getCustosByObra(obraId: string): Promise<CustoVagao[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("obraId", "==", obraId),
        orderBy("vagaoNumero", "asc")
      );

      const querySnapshot = await getDocs(q);
      const custos: CustoVagao[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        custos.push({
          id: docSnapshot.id,
          obraId: data.obraId,
          vagaoId: data.vagaoId,
          vagaoNumero: data.vagaoNumero,
          custoMaterial: data.custoMaterial,
          custoMaoObra: data.custoMaoObra,
          custoTotal: data.custoTotal,
          peso: data.peso || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return custos;
    } catch (error) {
      console.error("Erro ao buscar custos:", error);
      throw new Error("Não foi possível carregar os custos. Tente novamente.");
    }
  },

  async updateCusto(
    custoId: string,
    obraId: string,
    data: UpdateCustoVagaoData
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
      };

      if (data.custoMaterial !== undefined) {
        updateData.custoMaterial = data.custoMaterial;
      }
      if (data.custoMaoObra !== undefined) {
        updateData.custoMaoObra = data.custoMaoObra;
      }

      // Recalcular total
      const custoRef = doc(db, COLLECTION_NAME, custoId);
      const custoDoc = await getDoc(custoRef);
      if (custoDoc.exists()) {
        const custoData = custoDoc.data();
        const material = data.custoMaterial ?? custoData.custoMaterial;
        const maoObra = data.custoMaoObra ?? custoData.custoMaoObra;
        updateData.custoTotal = material + maoObra;
      }

      await updateDoc(custoRef, updateData);

      // Recalcular pesos
      await this.recalcularPesos(obraId);
    } catch (error) {
      console.error("Erro ao atualizar custo:", error);
      throw new Error("Não foi possível atualizar o custo. Tente novamente.");
    }
  },

  async deleteCusto(custoId: string, obraId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, custoId));
      // Recalcular pesos
      await this.recalcularPesos(obraId);
    } catch (error) {
      console.error("Erro ao deletar custo:", error);
      throw new Error("Não foi possível deletar o custo. Tente novamente.");
    }
  },

  async recalcularPesos(obraId: string): Promise<void> {
    try {
      const custos = await this.getCustosByObra(obraId);
      const custoTotalObra = custos.reduce(
        (sum, custo) => sum + custo.custoTotal,
        0
      );

      if (custoTotalObra === 0) return;

      // Atualizar peso de cada custo
      const updatePromises = custos.map(async (custo) => {
        const peso = (custo.custoTotal / custoTotalObra) * 100;
        const custoRef = doc(db, COLLECTION_NAME, custo.id);
        return updateDoc(custoRef, {
          peso,
          updatedAt: Timestamp.now(),
        });
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Erro ao recalcular pesos:", error);
    }
  },

  async gerarFluxoCaixa(vagoes: Vagao[], custos: CustoVagao[]) {
    try {
      // Criar mapa de meses baseado nas datas dos vagões
      const fluxoPorMes = new Map<
        string,
        {
          mes: string;
          ano: number;
          custoMaterial: number;
          custoMaoObra: number;
          custoTotal: number;
          vagoes: {
            numero: number;
            custoMaterial: number;
            custoMaoObra: number;
            custoTotal: number;
          }[];
        }
      >();

      vagoes.forEach((vagao) => {
        const custo = custos.find((c) => c.vagaoId === vagao.id);
        if (!custo) return;

        const dataInicio = new Date(vagao.dataInicio);
        const dataFim = new Date(vagao.dataFim);

        // Calcular todos os meses entre início e fim
        const mesesTrabalhados = this.calcularMesesEntreDatas(
          dataInicio,
          dataFim
        );
        const custoMaterialPorMes =
          custo.custoMaterial / mesesTrabalhados.length;
        const custoMaoObraPorMes = custo.custoMaoObra / mesesTrabalhados.length;
        const custoTotalPorMes = custo.custoTotal / mesesTrabalhados.length;

        mesesTrabalhados.forEach((mesAno) => {
          const chave = `${mesAno.ano}-${String(mesAno.mes).padStart(2, "0")}`;

          if (!fluxoPorMes.has(chave)) {
            fluxoPorMes.set(chave, {
              mes: this.getNomeMes(mesAno.mes),
              ano: mesAno.ano,
              custoMaterial: 0,
              custoMaoObra: 0,
              custoTotal: 0,
              vagoes: [],
            });
          }

          const fluxo = fluxoPorMes.get(chave)!;
          fluxo.custoMaterial += custoMaterialPorMes;
          fluxo.custoMaoObra += custoMaoObraPorMes;
          fluxo.custoTotal += custoTotalPorMes;
          fluxo.vagoes.push({
            numero: vagao.numero,
            custoMaterial: custoMaterialPorMes,
            custoMaoObra: custoMaoObraPorMes,
            custoTotal: custoTotalPorMes,
          });
        });
      });

      // Converter para array e ordenar
      const fluxoArray = Array.from(fluxoPorMes.values()).sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return this.getMesNumero(a.mes) - this.getMesNumero(b.mes);
      });

      return fluxoArray;
    } catch (error) {
      console.error("Erro ao gerar fluxo de caixa:", error);
      throw new Error("Não foi possível gerar o fluxo de caixa.");
    }
  },

  calcularMesesEntreDatas(
    inicio: Date,
    fim: Date
  ): { mes: number; ano: number }[] {
    const meses: { mes: number; ano: number }[] = [];
    const dataAtual = new Date(inicio);
    dataAtual.setDate(1); // Primeiro dia do mês

    while (dataAtual <= fim) {
      meses.push({
        mes: dataAtual.getMonth() + 1,
        ano: dataAtual.getFullYear(),
      });
      dataAtual.setMonth(dataAtual.getMonth() + 1);
    }

    return meses;
  },

  getNomeMes(numeroMes: number): string {
    const meses = [
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
    return meses[numeroMes - 1];
  },

  getMesNumero(nomeMes: string): number {
    const meses = [
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
    return meses.indexOf(nomeMes) + 1;
  },
};
