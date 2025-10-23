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
import type { Obra, CreateObraData } from "../types/obra";

const COLLECTION_NAME = "obras";

export const obraService = {
  async createObra(data: CreateObraData, userId: string): Promise<Obra> {
    try {
      const obraData = {
        nome: data.nome,
        numeroPavimentos: data.numeroPavimentos,
        numeroTorres: data.numeroTorres,
        userId,
        status: "ativa" as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), obraData);

      return {
        id: docRef.id,
        ...obraData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Erro ao criar obra:", error);
      throw new Error("Não foi possível criar a obra. Tente novamente.");
    }
  },

  async getObrasByUser(userId: string): Promise<Obra[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const obras: Obra[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        obras.push({
          id: doc.id,
          nome: data.nome,
          numeroPavimentos: data.numeroPavimentos,
          numeroTorres: data.numeroTorres,
          userId: data.userId,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return obras;
    } catch (error) {
      console.error("Erro ao buscar obras:", error);
      throw new Error("Não foi possível carregar as obras. Tente novamente.");
    }
  },

  async updateObra(
    obraId: string,
    data: Partial<CreateObraData>
  ): Promise<void> {
    try {
      const obraRef = doc(db, COLLECTION_NAME, obraId);
      await updateDoc(obraRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Erro ao atualizar obra:", error);
      throw new Error("Não foi possível atualizar a obra. Tente novamente.");
    }
  },

  async deleteObra(obraId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, obraId));
    } catch (error) {
      console.error("Erro ao deletar obra:", error);
      throw new Error("Não foi possível deletar a obra. Tente novamente.");
    }
  },

  async updateObraStatus(
    obraId: string,
    status: "ativa" | "pausada" | "concluida"
  ): Promise<void> {
    try {
      const obraRef = doc(db, COLLECTION_NAME, obraId);
      await updateDoc(obraRef, {
        status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      throw new Error("Não foi possível atualizar o status. Tente novamente.");
    }
  },
};
