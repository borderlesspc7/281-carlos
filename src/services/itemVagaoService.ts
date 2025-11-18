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
  ItemVagao,
  CreateItemVagaoData,
  UpdateItemVagaoData,
} from "../types/itemVagao";
import type { Vagao } from "../types/vagao";

const COLLECTION_NAME = "itens_vagoes";

export const itemVagaoService = {
  async createItem(
    obraId: string,
    vagao: Vagao,
    data: CreateItemVagaoData,
    quantidadeAtual: number
  ): Promise<ItemVagao> {
    if (data.quantidade + quantidadeAtual > vagao.numeroApartamentos) {
      throw new Error("Quantidade excede o limite orçado do vagão.");
    }

    try {
      const itemData = {
        obraId,
        vagaoId: data.vagaoId,
        vagaoNumero: vagao.numero,
        empresa: data.empresa,
        servico: data.servico,
        quantidade: data.quantidade,
        quantidadeMaxima: vagao.numeroApartamentos,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), itemData);

      return {
        id: docRef.id,
        obraId,
        vagaoId: data.vagaoId,
        vagaoNumero: vagao.numero,
        empresa: data.empresa,
        servico: data.servico,
        quantidade: data.quantidade,
        quantidadeMaxima: vagao.numeroApartamentos,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Erro ao criar item:", error);
      throw new Error("Não foi possível criar o item. Tente novamente.");
    }
  },

  async getItensByObra(obraId: string): Promise<ItemVagao[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("obraId", "==", obraId),
        orderBy("vagaoNumero", "asc")
      );

      const querySnapshot = await getDocs(q);
      const itens: ItemVagao[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        itens.push({
          id: docSnapshot.id,
          obraId: data.obraId,
          vagaoId: data.vagaoId,
          vagaoNumero: data.vagaoNumero,
          empresa: data.empresa,
          servico: data.servico,
          quantidade: data.quantidade,
          quantidadeMaxima: data.quantidadeMaxima,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return itens;
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      throw new Error("Não foi possível carregar os itens. Tente novamente.");
    }
  },

  async updateItem(
    itemId: string,
    vagao: Vagao,
    data: UpdateItemVagaoData,
    quantidadeAtual: number,
    quantidadeAnterior: number
  ): Promise<void> {
    const novaQuantidade =
      data.quantidade !== undefined ? data.quantidade : quantidadeAnterior;

    if (
      novaQuantidade + (quantidadeAtual - quantidadeAnterior) >
      vagao.numeroApartamentos
    ) {
      throw new Error("Quantidade excede o limite orçado do vagão.");
    }

    try {
      const updateData: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
      };

      if (data.empresa !== undefined) updateData.empresa = data.empresa;
      if (data.servico !== undefined) updateData.servico = data.servico;
      if (data.quantidade !== undefined)
        updateData.quantidade = data.quantidade;

      const itemRef = doc(db, COLLECTION_NAME, itemId);
      await updateDoc(itemRef, updateData);
    } catch (error) {
      console.error("Erro ao atualizar item:", error);
      throw new Error("Não foi possível atualizar o item. Tente novamente.");
    }
  },

  async deleteItem(itemId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, itemId));
    } catch (error) {
      console.error("Erro ao deletar item:", error);
      throw new Error("Não foi possível deletar o item. Tente novamente.");
    }
  },

  somarQuantidadePorVagao(itens: ItemVagao[], vagaoId: string) {
    return itens
      .filter((item) => item.vagaoId === vagaoId)
      .reduce((sum, item) => sum + item.quantidade, 0);
  },
};
