export interface ItemContrato {
  id: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface Aprovador {
  id: string;
  nome: string;
  email: string;
}

export interface Contrato {
  id: string;
  obraId: string;
  fornecedor: string;
  tipo: "contrato" | "aditivo";
  contratoOriginalId?: string; // Para aditivos
  numeroContrato: string;
  itens: ItemContrato[];
  valorTotal: number;
  status: "pendente" | "aprovado" | "rejeitado";
  aprovadorId: string;
  aprovadorNome: string;
  aprovadorEmail: string;
  dataAprovacao?: Date;
  observacoesAprovacao?: string;
  tokenAprovacao?: string; // Token único para aprovação via link
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContratoData {
  fornecedor: string;
  numeroContrato: string;
  itens: ItemContrato[];
  aprovadorId: string;
  aprovadorNome: string;
  aprovadorEmail: string;
}

export interface AprovarContratoData {
  contratoId: string;
  token: string;
  aprovado: boolean;
  observacoes?: string;
}
