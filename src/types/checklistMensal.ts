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
  aprovadorNome?: string;
  aprovadorEmail?: string;
  tokenAprovacao?: string;
  dataAprovacao?: Date;
  observacoesAprovacao?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateChecklistMensalData {
  mes: number;
  ano: number;
  observacoes: string;
  pdfFile?: File;
  aprovadorNome?: string;
  aprovadorEmail?: string;
}

export interface UpdateChecklistStatusData {
  status: "aprovado" | "aprovado_com_restricao";
  observacoes?: string;
}

export interface AprovarChecklistData {
  checklistId: string;
  obraId: string;
  token: string;
  aprovado: boolean;
  observacoes?: string;
}




