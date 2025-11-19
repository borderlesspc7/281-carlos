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
import type { Kit, CreateKitData } from "../types/kit";
import type { Vagao } from "../types/vagao";

const COLLECTION_NAME = "kits";

const generateId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const kitService = {
  async createKit(
    obraId: string,
    vagao: Vagao,
    data: CreateKitData
  ): Promise<Kit> {
    try {
      const kitData = {
        obraId,
        vagaoId: data.vagaoId,
        vagaoNumero: vagao.numero,
        nome: data.nome,
        maoDeObra: data.maoDeObra,
        materiais: data.materiais,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), kitData);

      return {
        id: docRef.id,
        obraId,
        vagaoId: data.vagaoId,
        vagaoNumero: vagao.numero,
        nome: data.nome,
        maoDeObra: data.maoDeObra,
        materiais: data.materiais,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Erro ao criar kit:", error);
      throw new Error("Não foi possível criar o kit. Tente novamente.");
    }
  },

  async getKitsByObra(obraId: string): Promise<Kit[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("obraId", "==", obraId),
        orderBy("vagaoNumero", "asc")
      );

      const querySnapshot = await getDocs(q);
      const kits: Kit[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        kits.push({
          id: docSnapshot.id,
          obraId: data.obraId,
          vagaoId: data.vagaoId,
          vagaoNumero: data.vagaoNumero,
          nome: data.nome,
          maoDeObra: data.maoDeObra || [],
          materiais: data.materiais || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return kits;
    } catch (error) {
      console.error("Erro ao buscar kits:", error);
      throw new Error("Não foi possível carregar os kits. Tente novamente.");
    }
  },

  async deleteKit(kitId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, kitId));
    } catch (error) {
      console.error("Erro ao deletar kit:", error);
      throw new Error("Não foi possível deletar o kit. Tente novamente.");
    }
  },

  async addMaoDeObraEntry(
    kitId: string,
    entry: CreateKitData["maoDeObra"][number]
  ): Promise<void> {
    try {
      const kitRef = doc(db, COLLECTION_NAME, kitId);
      const kitDoc = await getDoc(kitRef);
      if (!kitDoc.exists()) throw new Error("Kit não encontrado");

      const kitData = kitDoc.data();
      const updatedEntries = [...(kitData.maoDeObra || []), entry];

      await updateDoc(kitRef, {
        maoDeObra: updatedEntries,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Erro ao adicionar mão de obra:", error);
      throw new Error("Não foi possível adicionar a mão de obra.");
    }
  },

  async addMaterialEntry(
    kitId: string,
    entry: CreateKitData["materiais"][number]
  ): Promise<void> {
    try {
      const kitRef = doc(db, COLLECTION_NAME, kitId);
      const kitDoc = await getDoc(kitRef);
      if (!kitDoc.exists()) throw new Error("Kit não encontrado");

      const kitData = kitDoc.data();
      const updatedEntries = [...(kitData.materiais || []), entry];

      await updateDoc(kitRef, {
        materiais: updatedEntries,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Erro ao adicionar material:", error);
      throw new Error("Não foi possível adicionar o material.");
    }
  },

  createEntryId: generateId,
};
