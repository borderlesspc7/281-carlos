export interface CustoVagao {
  id: string;
  obraId: string;
  vagaoId: string;
  vagaoNumero: number;
  custoMaterial: number;
  custoMaoObra: number;
  custoTotal: number;
  peso: number; // Porcentagem do custo total da obra
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustoVagaoData {
  vagaoId: string;
  custoMaterial: number;
  custoMaoObra: number;
}

export interface UpdateCustoVagaoData {
  custoMaterial?: number;
  custoMaoObra?: number;
}

export interface FluxoCaixaMes {
  mes: string;
  ano: number;
  custoMaterial: number;
  custoMaoObra: number;
  custoTotal: number;
  vagoes: {
    numero: number;
    custoMaterial: number;
    custoMaoObra: number;
    custoTotal: number;
  }[];
}
