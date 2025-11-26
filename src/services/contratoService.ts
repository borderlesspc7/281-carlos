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
  Contrato,
  CreateContratoData,
  AprovarContratoData,
} from "../types/contratos";
const COLLECTION_NAME = "contratos";

// Gerar token único para aprovação
const generateApprovalToken = () => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

export const contratoService = {
  async createContrato(
    obraId: string,
    data: CreateContratoData
  ): Promise<Contrato> {
    try {
      // Verificar se já existe contrato para este fornecedor
      const existingContracts = await this.getContratosByFornecedor(
        obraId,
        data.fornecedor
      );

      const isAditivo = existingContracts.length > 0;
      const contratoOriginalId = isAditivo
        ? existingContracts[0].id
        : undefined;

      const valorTotal = data.itens.reduce(
        (sum, item) => sum + item.valorTotal,
        0
      );

      const tokenAprovacao = generateApprovalToken();

      const contratoData = {
        obraId,
        fornecedor: data.fornecedor,
        tipo: isAditivo ? "aditivo" : "contrato",
        contratoOriginalId: contratoOriginalId || null,
        numeroContrato: data.numeroContrato,
        itens: data.itens,
        valorTotal,
        status: "pendente",
        aprovadorId: data.aprovadorId,
        aprovadorNome: data.aprovadorNome,
        aprovadorEmail: data.aprovadorEmail,
        tokenAprovacao,
        dataAprovacao: null,
        observacoesAprovacao: null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, COLLECTION_NAME),
        contratoData
      );

      // Enviar e-mail via Power Automate
      await this.enviarEmailAprovacao({
        contratoId: docRef.id,
        fornecedor: data.fornecedor,
        numeroContrato: data.numeroContrato,
        valorTotal,
        aprovadorEmail: data.aprovadorEmail,
        aprovadorNome: data.aprovadorNome,
        tokenAprovacao,
        tipo: isAditivo ? "aditivo" : "contrato",
      });

      return {
        id: docRef.id,
        obraId,
        fornecedor: data.fornecedor,
        tipo: isAditivo ? "aditivo" : "contrato",
        contratoOriginalId,
        numeroContrato: data.numeroContrato,
        itens: data.itens,
        valorTotal,
        status: "pendente",
        aprovadorId: data.aprovadorId,
        aprovadorNome: data.aprovadorNome,
        aprovadorEmail: data.aprovadorEmail,
        tokenAprovacao,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error("Erro ao criar contrato:", error);
      throw new Error("Não foi possível criar o contrato. Tente novamente.");
    }
  },

  async enviarEmailAprovacao(data: {
    contratoId: string;
    fornecedor: string;
    numeroContrato: string;
    valorTotal: number;
    aprovadorEmail: string;
    aprovadorNome: string;
    tokenAprovacao: string;
    tipo: "contrato" | "aditivo";
  }): Promise<void> {
    try {
      // URL do Power Automate Flow
      const powerAutomateUrl = import.meta.env.VITE_POWER_AUTOMATE_APPROVAL_URL;

      if (!powerAutomateUrl) {
        console.warn("URL do Power Automate não configurada");
        return;
      }

      // Link de aprovação (ajuste conforme sua URL de produção)
      const approvalLink = `${window.location.origin}/aprovar-contrato?token=${data.tokenAprovacao}&contratoId=${data.contratoId}`;

      const payload = {
        contratoId: data.contratoId,
        fornecedor: data.fornecedor,
        numeroContrato: data.numeroContrato,
        valorTotal: data.valorTotal.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        aprovadorEmail: data.aprovadorEmail,
        aprovadorNome: data.aprovadorNome,
        approvalLink,
        tipo: data.tipo === "aditivo" ? "Aditivo" : "Contrato",
      };

      await fetch(powerAutomateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Erro ao enviar e-mail de aprovação:", error);
      // Não lançar erro para não bloquear a criação do contrato
    }
  },

  async getContratosByObra(obraId: string): Promise<Contrato[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("obraId", "==", obraId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const contratos: Contrato[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        contratos.push({
          id: docSnapshot.id,
          obraId: data.obraId,
          fornecedor: data.fornecedor,
          tipo: data.tipo,
          contratoOriginalId: data.contratoOriginalId,
          numeroContrato: data.numeroContrato,
          itens: data.itens || [],
          valorTotal: data.valorTotal,
          status: data.status,
          aprovadorId: data.aprovadorId,
          aprovadorNome: data.aprovadorNome,
          aprovadorEmail: data.aprovadorEmail,
          tokenAprovacao: data.tokenAprovacao,
          dataAprovacao: data.dataAprovacao?.toDate(),
          observacoesAprovacao: data.observacoesAprovacao,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return contratos;
    } catch (error) {
      console.error("Erro ao buscar contratos:", error);
      throw new Error(
        "Não foi possível carregar os contratos. Tente novamente."
      );
    }
  },

  async getContratosByFornecedor(
    obraId: string,
    fornecedor: string
  ): Promise<Contrato[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where("obraId", "==", obraId),
        where("fornecedor", "==", fornecedor),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const contratos: Contrato[] = [];

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        contratos.push({
          id: docSnapshot.id,
          obraId: data.obraId,
          fornecedor: data.fornecedor,
          tipo: data.tipo,
          contratoOriginalId: data.contratoOriginalId,
          numeroContrato: data.numeroContrato,
          itens: data.itens || [],
          valorTotal: data.valorTotal,
          status: data.status,
          aprovadorId: data.aprovadorId,
          aprovadorNome: data.aprovadorNome,
          aprovadorEmail: data.aprovadorEmail,
          tokenAprovacao: data.tokenAprovacao,
          dataAprovacao: data.dataAprovacao?.toDate(),
          observacoesAprovacao: data.observacoesAprovacao,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return contratos;
    } catch (error) {
      console.error("Erro ao buscar contratos por fornecedor:", error);
      throw new Error("Não foi possível carregar os contratos.");
    }
  },

  async getContratoById(contratoId: string): Promise<Contrato | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, contratoId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        obraId: data.obraId,
        fornecedor: data.fornecedor,
        tipo: data.tipo,
        contratoOriginalId: data.contratoOriginalId,
        numeroContrato: data.numeroContrato,
        itens: data.itens || [],
        valorTotal: data.valorTotal,
        status: data.status,
        aprovadorId: data.aprovadorId,
        aprovadorNome: data.aprovadorNome,
        aprovadorEmail: data.aprovadorEmail,
        tokenAprovacao: data.tokenAprovacao,
        dataAprovacao: data.dataAprovacao?.toDate(),
        observacoesAprovacao: data.observacoesAprovacao,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error("Erro ao buscar contrato:", error);
      throw new Error("Não foi possível carregar o contrato.");
    }
  },

  async aprovarContrato(data: AprovarContratoData): Promise<void> {
    try {
      const contrato = await this.getContratoById(data.contratoId);

      if (!contrato) {
        throw new Error("Contrato não encontrado");
      }

      if (contrato.tokenAprovacao !== data.token) {
        throw new Error("Token de aprovação inválido");
      }

      if (contrato.status !== "pendente") {
        throw new Error("Este contrato já foi processado");
      }

      const contratoRef = doc(db, COLLECTION_NAME, data.contratoId);
      await updateDoc(contratoRef, {
        status: data.aprovado ? "aprovado" : "rejeitado",
        dataAprovacao: Timestamp.now(),
        observacoesAprovacao: data.observacoes || null,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Erro ao aprovar contrato:", error);
      throw error;
    }
  },

  async deleteContrato(contratoId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, contratoId));
    } catch (error) {
      console.error("Erro ao deletar contrato:", error);
      throw new Error("Não foi possível deletar o contrato. Tente novamente.");
    }
  },

  createItemId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  },
};
