import { db } from "../lib/firebaseconfig";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import type {
  ProducaoFaltante,
  CreateProducaoFaltanteData,
} from "../types/producaoFaltante";

const COLLECTION_NAME = "producao_faltante";

export const producaoFaltanteService = {
  /**
   * Salva ou atualiza a produção faltante de um kit
   */
  async saveProducaoFaltante(
    obraId: string,
    data: CreateProducaoFaltanteData
  ): Promise<ProducaoFaltante> {
    try {
      // Verificar se já existe uma produção faltante para este kit
      const q = query(
        collection(db, COLLECTION_NAME),
        where("obraId", "==", obraId),
        where("kitId", "==", data.kitId)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Atualizar existente
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          quantidade: data.quantidade,
          updatedAt: Timestamp.now(),
        });

        const docData = querySnapshot.docs[0].data();
        return {
          id: docRef.id,
          obraId: docData.obraId,
          kitId: docData.kitId,
          quantidade: data.quantidade,
          createdAt: docData.createdAt?.toDate() || new Date(),
          updatedAt: new Date(),
        };
      } else {
        // Criar novo
        const producaoData = {
          obraId,
          kitId: data.kitId,
          quantidade: data.quantidade,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(
          collection(db, COLLECTION_NAME),
          producaoData
        );

        return {
          id: docRef.id,
          obraId,
          kitId: data.kitId,
          quantidade: data.quantidade,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    } catch (error) {
      console.error("Erro ao salvar produção faltante:", error);
      throw new Error(
        "Não foi possível salvar a produção faltante. Tente novamente."
      );
    }
  },

  /**
   * Salva múltiplas produções faltantes de uma vez
   */
  async saveProducoesFaltantes(
    obraId: string,
    producoes: Map<string, number> // kitId -> quantidade
  ): Promise<void> {
    try {
      const promises: Promise<ProducaoFaltante>[] = [];

      producoes.forEach((quantidade, kitId) => {
        promises.push(this.saveProducaoFaltante(obraId, { kitId, quantidade }));
      });

      await Promise.all(promises);
    } catch (error) {
      console.error("Erro ao salvar produções faltantes:", error);
      throw new Error(
        "Não foi possível salvar as produções faltantes. Tente novamente."
      );
    }
  },

  /**
   * Busca todas as produções faltantes de uma obra
   */
  async getProducoesFaltantesByObra(
    obraId: string
  ): Promise<Map<string, number>> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("obraId", "==", obraId)
      );

      const querySnapshot = await getDocs(q);
      const producoes = new Map<string, number>();

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        producoes.set(data.kitId, data.quantidade || 0);
      });

      return producoes;
    } catch (error) {
      console.error("Erro ao buscar produções faltantes:", error);
      throw new Error(
        "Não foi possível carregar as produções faltantes. Tente novamente."
      );
    }
  },

  /**
   * Busca a produção faltante de um kit específico
   */
  async getProducaoFaltanteByKit(
    obraId: string,
    kitId: string
  ): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("obraId", "==", obraId),
        where("kitId", "==", kitId)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return 0;
      }

      const data = querySnapshot.docs[0].data();
      return data.quantidade || 0;
    } catch (error) {
      console.error("Erro ao buscar produção faltante:", error);
      return 0;
    }
  },

  /**
   * Remove a produção faltante de um kit
   */
  async deleteProducaoFaltante(producaoId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, producaoId));
    } catch (error) {
      console.error("Erro ao deletar produção faltante:", error);
      throw new Error(
        "Não foi possível deletar a produção faltante. Tente novamente."
      );
    }
  },

  /**
   * Remove todas as produções faltantes de uma obra
   */
  async deleteProducoesFaltantesByObra(obraId: string): Promise<void> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("obraId", "==", obraId)
      );

      const querySnapshot = await getDocs(q);
      const promises = querySnapshot.docs.map((docSnapshot) =>
        deleteDoc(docSnapshot.ref)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error("Erro ao deletar produções faltantes:", error);
      throw new Error(
        "Não foi possível deletar as produções faltantes. Tente novamente."
      );
    }
  },
};
