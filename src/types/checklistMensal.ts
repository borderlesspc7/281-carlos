export type ChecklistStatus = "pendente" | "aprovado" | "aprovado_com_restricao";

export interface ChecklistMensal {
  id: string;
  obraId: string;
  mes: number;
  ano: number;
  observacoes: string;
  pdfUrl: string;
  pdfFileName?: string;
  status: ChecklistStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateChecklistMensalData {
  mes: number;
  ano: number;
  observacoes: string;
  pdfFile: File;
}

export interface UpdateChecklistStatusData {
  status: "aprovado" | "aprovado_com_restricao";
}

