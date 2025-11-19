export interface MaoDeObraEntry {
  id: string;
  itemId: string;
  itemNome: string;
  quantidade: number;
}

export interface MaterialEntry {
  id: string;
  nome: string;
  unidade: string;
  quantidade: number;
}

export interface Kit {
  id: string;
  obraId: string;
  vagaoId: string;
  vagaoNumero: number;
  nome: string;
  maoDeObra: MaoDeObraEntry[];
  materiais: MaterialEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateKitData {
  vagaoId: string;
  nome: string;
  maoDeObra: MaoDeObraEntry[];
  materiais: MaterialEntry[];
}
