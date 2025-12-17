/**
 * Serviço para integração com API TOTVS via Firebase Functions
 */

interface RetailStockLevelParams {
  order?: string[];
  fields?: string;
  page?: number;
  pageSize?: number;
}

interface RetailStockLevelResponse {
  // Ajustar conforme a resposta real da API TOTVS
  items?: unknown[];
  total?: number;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

const FUNCTIONS_URL =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_URL ||
  "https://us-central1-YOUR_PROJECT.cloudfunctions.net";

export const totvsService = {
  /**
   * Retorna uma lista com todos os Produtos com saldo em estoque
   * @param params - Parâmetros de consulta (opcionais)
   * @returns Dados do estoque
   */
  async getRetailStockLevel(
    params?: RetailStockLevelParams
  ): Promise<RetailStockLevelResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.order) {
        params.order.forEach((o) => queryParams.append("order", o));
      }
      if (params?.fields) {
        queryParams.append("fields", params.fields);
      }
      if (params?.page) {
        queryParams.append("page", String(params.page));
      }
      if (params?.pageSize) {
        queryParams.append("pageSize", String(params.pageSize));
      }

      const url = `${FUNCTIONS_URL}/getRetailStockLevel${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = `TOTVS API error: ${response.status}`;
        
        try {
          const errorData = await response.json();
          // Preservar a mensagem de erro original se disponível
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Se não conseguir parsear JSON, usar a mensagem padrão
          const errorText = await response.text().catch(() => "");
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      console.error("Error fetching retail stock level:", error);
      throw error;
    }
  },
};

