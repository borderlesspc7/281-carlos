import { db } from "../lib/firebaseconfig";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import type { Medicao, CreateMedicaoData } from "../types/medicao";

const COLLECTION_NAME = "medicoes";

export const medicaoService = {
  async createMedicao(
    obraId: string,
    data: CreateMedicaoData
  ): Promise<Medicao> {
    try {
      const medicaoData = {
        obraId,
        numero: data.numero,
        data: data.data,
        fornecedorId: data.fornecedorId,
        contratoId: data.contratoId,
        aditivosIds: data.aditivosIds,
        vagaoId: data.vagaoId,
        itemsIds: data.itemsIds,
        unidades: data.unidades,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, "obras", obraId, COLLECTION_NAME),
        medicaoData
      );

      return {
        id: docRef.id,
        obraId,
        numero: data.numero,
        data: data.data,
        fornecedorId: data.fornecedorId,
        contratoId: data.contratoId,
        aditivosIds: data.aditivosIds,
        vagaoId: data.vagaoId,
        itemsIds: data.itemsIds,
        unidades: data.unidades,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Erro ao criar medição:", error);
      throw new Error("Não foi possível criar a medição. Tente novamente.");
    }
  },

  async getMedicoesByObra(obraId: string): Promise<Medicao[]> {
    try {
      const q = query(
        collection(db, "obras", obraId, COLLECTION_NAME),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const medicoes: Medicao[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        medicoes.push({
          id: docSnapshot.id,
          obraId: data.obraId,
          numero: data.numero,
          data: data.data,
          fornecedorId: data.fornecedorId,
          contratoId: data.contratoId,
          aditivosIds: data.aditivosIds || [],
          vagaoId: data.vagaoId,
          itemsIds: data.itemsIds || [],
          unidades: data.unidades || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return medicoes;
    } catch (error) {
      console.error("Erro ao buscar medições:", error);
      throw new Error(
        "Não foi possível carregar as medições. Tente novamente."
      );
    }
  },

  async getMedicaoById(obraId: string, medicaoId: string): Promise<Medicao | null> {
    try {
      const docRef = doc(db, "obras", obraId, COLLECTION_NAME, medicaoId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        obraId: data.obraId,
        numero: data.numero,
        data: data.data,
        fornecedorId: data.fornecedorId,
        contratoId: data.contratoId,
        aditivosIds: data.aditivosIds || [],
        vagaoId: data.vagaoId,
        itemsIds: data.itemsIds || [],
        unidades: data.unidades || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error("Erro ao buscar medição:", error);
      throw new Error("Não foi possível carregar a medição. Tente novamente.");
    }
  },

  async deleteMedicao(obraId: string, medicaoId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "obras", obraId, COLLECTION_NAME, medicaoId));
    } catch (error) {
      console.error("Erro ao deletar medição:", error);
      throw new Error("Não foi possível deletar a medição. Tente novamente.");
    }
  },
};

