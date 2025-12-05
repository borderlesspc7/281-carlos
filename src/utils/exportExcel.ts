import type { ProducaoFaltanteVagao } from "../types/producaoFaltanteVagao";

/**
 * Exporta dados para Excel (formato CSV que abre no Excel)
 */
export const exportToExcel = (dados: ProducaoFaltanteVagao[], filename: string = "producao_faltante") => {
  // Cabeçalhos
  const headers = [
    "Vagão",
    "Total",
    "Produzido",
    "Medido",
    "A Comprometer",
    "Faltante a Produzir",
    "Faltante a Medir",
  ];

  // Criar linhas CSV
  const rows = dados.map((item) => [
    `Vagão ${item.vagaoNumero}`,
    item.total.toString(),
    item.produzido.toString(),
    item.medido.toString(),
    item.aComprometer.toString(),
    item.faltanteProduzir.toString(),
    item.faltanteMedir.toString(),
  ]);

  // Combinar cabeçalhos e dados
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // Adicionar BOM para UTF-8 (Excel reconhece melhor)
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // Criar URL e fazer download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

