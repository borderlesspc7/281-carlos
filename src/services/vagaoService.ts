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
import type { Vagao, CreateVagaoData, UpdateVagaoData } from "../types/vagao";

const COLLECTION_NAME = "vagoes";

export const vagaoService = {
  async createVagao(obraId: string, data: CreateVagaoData): Promise<Vagao> {
    try {
      const vagaoData = {
        obraId,
        numero: data.numero,
        predecessorId: data.predecessorId,
        dataInicio: Timestamp.fromDate(data.dataInicio),
        dataFim: Timestamp.fromDate(data.dataFim),
        numeroApartamentos: data.numeroApartamentos,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), vagaoData);

      // Se tem predecessor, busca o número dele
      let predecessorNumero = undefined;
      if (data.predecessorId) {
        const predDoc = await getDoc(
          doc(db, COLLECTION_NAME, data.predecessorId)
        );
        if (predDoc.exists()) {
          predecessorNumero = predDoc.data().numero;
        }
      }

      return {
        id: docRef.id,
        obraId,
        numero: data.numero,
        predecessorId: data.predecessorId,
        predecessorNumero,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        numeroApartamentos: data.numeroApartamentos,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Erro ao criar vagão:", error);
      throw new Error("Não foi possível criar o vagão. Tente novamente.");
    }
  },

  async getVagoesByObra(obraId: string): Promise<Vagao[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("obraId", "==", obraId),
        orderBy("numero", "asc")
      );

      const querySnapshot = await getDocs(q);
      const vagoes: Vagao[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();

        // Se tem predecessor, busca o número dele
        let predecessorNumero = undefined;
        if (data.predecessorId) {
          const predDoc = await getDoc(
            doc(db, COLLECTION_NAME, data.predecessorId)
          );
          if (predDoc.exists()) {
            predecessorNumero = predDoc.data().numero;
          }
        }

        vagoes.push({
          id: docSnapshot.id,
          obraId: data.obraId,
          numero: data.numero,
          predecessorId: data.predecessorId || null,
          predecessorNumero,
          dataInicio: data.dataInicio?.toDate() || new Date(),
          dataFim: data.dataFim?.toDate() || new Date(),
          numeroApartamentos: data.numeroApartamentos,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      }

      return vagoes;
    } catch (error) {
      console.error("Erro ao buscar vagões:", error);
      throw new Error("Não foi possível carregar os vagões. Tente novamente.");
    }
  },

  async updateVagao(vagaoId: string, data: UpdateVagaoData): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        updatedAt: Timestamp.now(),
      };

      if (data.predecessorId !== undefined) {
        updateData.predecessorId = data.predecessorId;
      }
      if (data.dataInicio) {
        updateData.dataInicio = Timestamp.fromDate(data.dataInicio);
      }
      if (data.dataFim) {
        updateData.dataFim = Timestamp.fromDate(data.dataFim);
      }
      if (data.numeroApartamentos !== undefined) {
        updateData.numeroApartamentos = data.numeroApartamentos;
      }

      const vagaoRef = doc(db, COLLECTION_NAME, vagaoId);
      await updateDoc(vagaoRef, updateData);
    } catch (error) {
      console.error("Erro ao atualizar vagão:", error);
      throw new Error("Não foi possível atualizar o vagão. Tente novamente.");
    }
  },

  async deleteVagao(vagaoId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, vagaoId));
    } catch (error) {
      console.error("Erro ao deletar vagão:", error);
      throw new Error("Não foi possível deletar o vagão. Tente novamente.");
    }
  },
};
