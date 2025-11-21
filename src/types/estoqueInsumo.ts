export interface EstoqueInsumo {
  id: string;
  obraId: string;
  nome: string;
  unidade: string;
  quantidadeDisponivel: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEstoqueInsumoData {
  nome: string;
  unidade: string;
  quantidadeDisponivel: number;
}

export interface UpdateEstoqueInsumoData {
  nome?: string;
  unidade?: string;
  quantidadeDisponivel?: number;
}

// Para análise de kits
export interface KitAnalise {
  kitId: string;
  kitNome: string;
  vagaoNumero: number;
  producaoFaltante: number; // em apartamentos
  insumos: InsumoNecessidade[];
  temAlerta: boolean;
}

export interface InsumoNecessidade {
  nome: string;
  unidade: string;
  quantidadePorUnidade: number;
  quantidadeTotal: number;
  quantidadeAlocada: number;
  deficit: number;
  temAlerta: boolean;
}
