import { db, storage } from "../lib/firebaseconfig";
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
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import type {
  ChecklistMensal,
  CreateChecklistMensalData,
  UpdateChecklistStatusData,
} from "../types/checklistMensal";

const COLLECTION_NAME = "checklistsMensais";

/**
 * Envia notificação para webhook do Power Automate (opcional)
 */
async function notifyWebhook(
  action: "novo_checklist" | "aprovacao",
  data: {
    obraId: string;
    checklistId?: string;
    pdfUrl?: string;
    status?: string;
  }
): Promise<void> {
  const webhookUrl = import.meta.env.VITE_POWER_AUTOMATE_WEBHOOK_URL;
  
  if (!webhookUrl) {
    // Se não houver webhook configurado, apenas loga e continua
    console.log("Webhook do Power Automate não configurado. Continuando normalmente.");
    return;
  }

  try {
    const payload =
      action === "novo_checklist"
        ? {
            acao: "novo_checklist",
            obraId: data.obraId,
            checklistId: data.checklistId,
            pdfUrl: data.pdfUrl,
          }
        : {
            obraId: data.obraId,
            checklistId: data.checklistId,
            status: data.status,
            pdfUrl: data.pdfUrl,
          };

    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Não falha a operação se o webhook falhar
    console.error("Erro ao enviar webhook:", error);
  }
}

export const checklistMensalService = {
  /**
   * Cria um novo checklist mensal
   */
  async createChecklist(
    obraId: string,
    data: CreateChecklistMensalData
  ): Promise<ChecklistMensal> {
    try {
      // 1. Upload do PDF para Firebase Storage
      const storagePath = `checklistsMensais/${obraId}/${Date.now()}_${data.pdfFile.name}`;
      const storageRef = ref(storage, storagePath);
      
      await uploadBytes(storageRef, data.pdfFile);
      const pdfUrl = await getDownloadURL(storageRef);

      // 2. Criar documento no Firestore
      const checklistData = {
        obraId,
        mes: data.mes,
        ano: data.ano,
        observacoes: data.observacoes,
        pdfUrl,
        pdfFileName: data.pdfFile.name,
        pdfStoragePath: storagePath, // Armazenar o path para facilitar a exclusão
        status: "pendente" as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, "obras", obraId, COLLECTION_NAME),
        checklistData
      );

      const checklist: ChecklistMensal = {
        id: docRef.id,
        obraId,
        mes: data.mes,
        ano: data.ano,
        observacoes: data.observacoes,
        pdfUrl,
        pdfFileName: data.pdfFile.name,
        status: "pendente",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 3. Notificar webhook (opcional)
      await notifyWebhook("novo_checklist", {
        obraId,
        checklistId: docRef.id,
        pdfUrl,
      });

      return checklist;
    } catch (error) {
      console.error("Erro ao criar checklist:", error);
      throw new Error("Não foi possível criar o checklist. Tente novamente.");
    }
  },

  /**
   * Busca todos os checklists de uma obra
   */
  async getChecklistsByObra(obraId: string): Promise<ChecklistMensal[]> {
    try {
      const q = query(
        collection(db, "obras", obraId, COLLECTION_NAME),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const checklists: ChecklistMensal[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        checklists.push({
          id: docSnapshot.id,
          obraId: data.obraId,
          mes: data.mes,
          ano: data.ano,
          observacoes: data.observacoes || "",
          pdfUrl: data.pdfUrl,
          pdfFileName: data.pdfFileName,
          status: data.status || "pendente",
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      return checklists;
    } catch (error) {
      console.error("Erro ao buscar checklists:", error);
      throw new Error(
        "Não foi possível carregar os checklists. Tente novamente."
      );
    }
  },

  /**
   * Busca um checklist por ID
   */
  async getChecklistById(
    obraId: string,
    checklistId: string
  ): Promise<ChecklistMensal | null> {
    try {
      const docRef = doc(db, "obras", obraId, COLLECTION_NAME, checklistId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        obraId: data.obraId,
        mes: data.mes,
        ano: data.ano,
        observacoes: data.observacoes || "",
        pdfUrl: data.pdfUrl,
        pdfFileName: data.pdfFileName,
        status: data.status || "pendente",
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
      };
    } catch (error) {
      console.error("Erro ao buscar checklist:", error);
      throw new Error("Não foi possível carregar o checklist. Tente novamente.");
    }
  },

  /**
   * Atualiza o status do checklist (aprovação)
   */
  async updateChecklistStatus(
    obraId: string,
    checklistId: string,
    data: UpdateChecklistStatusData
  ): Promise<void> {
    try {
      const docRef = doc(db, "obras", obraId, COLLECTION_NAME, checklistId);
      
      // Buscar o checklist para obter a URL do PDF
      const checklist = await this.getChecklistById(obraId, checklistId);
      
      if (!checklist) {
        throw new Error("Checklist não encontrado");
      }

      await updateDoc(docRef, {
        status: data.status,
        updatedAt: Timestamp.now(),
      });

      // Notificar webhook do Power Automate
      await notifyWebhook("aprovacao", {
        obraId,
        checklistId,
        status: data.status,
        pdfUrl: checklist.pdfUrl,
      });
    } catch (error) {
      console.error("Erro ao atualizar status do checklist:", error);
      throw new Error(
        "Não foi possível atualizar o status do checklist. Tente novamente."
      );
    }
  },

  /**
   * Deleta um checklist e seu PDF
   */
  async deleteChecklist(obraId: string, checklistId: string): Promise<void> {
    try {
      // Buscar o checklist para obter a URL do PDF
      const checklist = await this.getChecklistById(obraId, checklistId);
      
      if (!checklist) {
        throw new Error("Checklist não encontrado");
      }

      // Deletar o PDF do Storage
      try {
        // Tentar usar o path armazenado primeiro, senão extrair da URL
        const data = (await getDoc(doc(db, "obras", obraId, COLLECTION_NAME, checklistId))).data();
        const storagePath = data?.pdfStoragePath;
        
        if (storagePath) {
          const storageRef = ref(storage, storagePath);
          await deleteObject(storageRef);
        } else {
          // Fallback: tentar extrair da URL
          const pdfUrl = checklist.pdfUrl;
          const urlObj = new URL(pdfUrl);
          const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
          if (pathMatch) {
            const decodedPath = decodeURIComponent(pathMatch[1].split("?")[0]);
            const storageRef = ref(storage, decodedPath);
            await deleteObject(storageRef);
          }
        }
      } catch (storageError) {
        // Se falhar ao deletar o arquivo, apenas loga e continua
        console.error("Erro ao deletar arquivo do Storage:", storageError);
      }

      // Deletar o documento do Firestore
      await deleteDoc(doc(db, "obras", obraId, COLLECTION_NAME, checklistId));
    } catch (error) {
      console.error("Erro ao deletar checklist:", error);
      throw new Error("Não foi possível deletar o checklist. Tente novamente.");
    }
  },
};

