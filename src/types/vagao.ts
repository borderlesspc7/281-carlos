export interface Vagao {
  id: string;
  obraId: string;
  numero: number;
  predecessorId: string | null;
  predecessorNumero?: number;
  dataInicio: Date;
  dataFim: Date;
  numeroApartamentos: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVagaoData {
  numero: number;
  predecessorId: string | null;
  dataInicio: Date;
  dataFim: Date;
  numeroApartamentos: number;
}

export interface UpdateVagaoData {
  predecessorId?: string | null;
  dataInicio?: Date;
  dataFim?: Date;
  numeroApartamentos?: number;
}
