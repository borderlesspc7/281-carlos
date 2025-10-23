export interface Obra {
  id: string;
  nome: string;
  numeroPavimentos: number;
  numeroTorres: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  status: "ativa" | "pausada" | "concluida";
}

export interface CreateObraData {
  nome: string;
  numeroPavimentos: number;
  numeroTorres: number;
}
