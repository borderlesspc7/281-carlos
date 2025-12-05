import { db } from "../lib/firebaseconfig";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import type { Producao } from "../types/producao";

const COLLECTION_NAME = "producoes";

export const producaoService = {
  /**
   * Busca todas as produções de uma obra
   */
  async getProducoesByObra(obraId: string): Promise<Producao[]> {
    try {
      const q = query(
        collection(db, "obras", obraId, COLLECTION_NAME),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const producoes: Producao[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        producoes.push({
          id: docSnapshot.id,
          obraId: data.obraId,
          vagaoId: data.vagaoId,
          unidades: data.unidades || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return producoes;
    } catch (error) {
      console.error("Erro ao buscar produções:", error);
      throw new Error(
        "Não foi possível carregar as produções. Tente novamente."
      );
    }
  },
};

