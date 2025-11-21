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
} from "firebase/firestore";
import type {
  EstoqueInsumo,
  CreateEstoqueInsumoData,
  UpdateEstoqueInsumoData,
  KitAnalise,
  InsumoNecessidade,
} from "../types/estoqueInsumo";
import type { Kit } from "../types/kit";

const COLLECTION_NAME = "estoque_insumos";

export const estoqueInsumoService = {
  async createEstoque(
    obraId: string,
    data: CreateEstoqueInsumoData
  ): Promise<EstoqueInsumo> {
    try {
      const estoqueData = {
        obraId,
        nome: data.nome,
        unidade: data.unidade,
        quantidadeDisponivel: data.quantidadeDisponivel,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), estoqueData);

      return {
        id: docRef.id,
        obraId,
        nome: data.nome,
        unidade: data.unidade,
        quantidadeDisponivel: data.quantidadeDisponivel,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Erro ao criar estoque:", error);
      throw new Error("Não foi possível criar o estoque. Tente novamente.");
    }
  },

  async getEstoquesByObra(obraId: string): Promise<EstoqueInsumo[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("obraId", "==", obraId),
        orderBy("nome", "asc")
      );

      const querySnapshot = await getDocs(q);
      const estoques: EstoqueInsumo[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        estoques.push({
          id: docSnapshot.id,
          obraId: data.obraId,
          nome: data.nome,
          unidade: data.unidade,
          quantidadeDisponivel: data.quantidadeDisponivel,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return estoques;
    } catch (error) {
      console.error("Erro ao buscar estoques:", error);
      throw new Error(
        "Não foi possível carregar os estoques. Tente novamente."
      );
    }
  },

  async updateEstoque(
    estoqueId: string,
    data: UpdateEstoqueInsumoData
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
      };

      if (data.nome !== undefined) updateData.nome = data.nome;
      if (data.unidade !== undefined) updateData.unidade = data.unidade;
      if (data.quantidadeDisponivel !== undefined)
        updateData.quantidadeDisponivel = data.quantidadeDisponivel;

      const estoqueRef = doc(db, COLLECTION_NAME, estoqueId);
      await updateDoc(estoqueRef, updateData);
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
      throw new Error("Não foi possível atualizar o estoque. Tente novamente.");
    }
  },

  async deleteEstoque(estoqueId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, estoqueId));
    } catch (error) {
      console.error("Erro ao deletar estoque:", error);
      throw new Error("Não foi possível deletar o estoque. Tente novamente.");
    }
  },

  // Análise de kits e alocação de estoque
  analisarKits(
    kits: Kit[],
    estoques: EstoqueInsumo[],
    producoesFaltantes: Map<string, number> // kitId -> quantidade de apartamentos faltantes
  ): KitAnalise[] {
    // Criar mapa de estoque disponível (será consumido durante alocação)
    const estoqueDisponivel = new Map<string, number>();
    estoques.forEach((est) => {
      const key = `${est.nome.toLowerCase()}-${est.unidade.toLowerCase()}`;
      estoqueDisponivel.set(key, est.quantidadeDisponivel);
    });

    const analises: KitAnalise[] = [];

    // Processar cada kit em ordem
    for (const kit of kits) {
      const producaoFaltante = producoesFaltantes.get(kit.id) || 0;
      const insumos: InsumoNecessidade[] = [];
      let temAlerta = false;

      // Processar materiais do kit
      for (const material of kit.materiais) {
        const key = `${material.nome.toLowerCase()}-${material.unidade.toLowerCase()}`;
        const quantidadeTotal = material.quantidade * producaoFaltante;
        const disponivelAtual = estoqueDisponivel.get(key) || 0;

        const quantidadeAlocada = Math.min(quantidadeTotal, disponivelAtual);
        const deficit = Math.max(0, quantidadeTotal - disponivelAtual);

        // Atualizar estoque disponível
        estoqueDisponivel.set(
          key,
          Math.max(0, disponivelAtual - quantidadeTotal)
        );

        insumos.push({
          nome: material.nome,
          unidade: material.unidade,
          quantidadePorUnidade: material.quantidade,
          quantidadeTotal,
          quantidadeAlocada,
          deficit,
          temAlerta: deficit > 0,
        });

        if (deficit > 0) {
          temAlerta = true;
        }
      }

      analises.push({
        kitId: kit.id,
        kitNome: kit.nome,
        vagaoNumero: kit.vagaoNumero,
        producaoFaltante,
        insumos,
        temAlerta,
      });
    }

    return analises;
  },
};
