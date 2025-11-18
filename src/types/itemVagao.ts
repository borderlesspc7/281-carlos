export interface ItemVagao {
  id: string;
  obraId: string;
  vagaoId: string;
  vagaoNumero: number;
  empresa: string;
  servico: string;
  quantidade: number;
  quantidadeMaxima: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateItemVagaoData {
  vagaoId: string;
  empresa: string;
  servico: string;
  quantidade: number;
}

export interface UpdateItemVagaoData {
  empresa?: string;
  servico?: string;
  quantidade?: number;
}
