import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Proxy para API TOTVS RetailStockLevel
 * 
 * Endpoint: https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/getRetailStockLevel
 * 
 * Parâmetros de query:
 * - order?: string[] - Ordenação da coleção
 * - fields?: string - Filtro de campos
 * - page?: number - Paginação
 * - pageSize?: number - Itens por página
 */
export const getRetailStockLevel = functions.https.onRequest(
  async (request, response) => {
    // Configurar CORS
    response.set("Access-Control-Allow-Origin", "*");
    response.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Tratar requisição preflight
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    // Apenas método GET permitido
    if (request.method !== "GET") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      // Obter credenciais do ambiente (configurar no Firebase Console)
      const totvsBaseUrl = functions.config().totvs?.base_url;
      const totvsAuthToken = functions.config().totvs?.auth_token;

      if (!totvsBaseUrl || !totvsAuthToken) {
        console.error("Credenciais TOTVS não configuradas");
        response.status(500).json({
          error: "Credenciais da API TOTVS não configuradas",
        });
        return;
      }

      // Construir URL com parâmetros de query
      const queryParams = new URLSearchParams();
      if (request.query.order) {
        const order = Array.isArray(request.query.order)
          ? request.query.order
          : [request.query.order];
        order.forEach((o) => queryParams.append("order", String(o)));
      }
      if (request.query.fields) {
        queryParams.append("fields", String(request.query.fields));
      }
      if (request.query.page) {
        queryParams.append("page", String(request.query.page));
      }
      if (request.query.pageSize) {
        queryParams.append("pageSize", String(request.query.pageSize));
      }

      const url = `${totvsBaseUrl}/api/retail/v1/retailStockLevel${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      // Fazer requisição para API TOTVS
      const apiResponse = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: totvsAuthToken,
          "Content-Type": "application/json",
        },
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error("Erro na API TOTVS:", apiResponse.status, errorText);
        response.status(apiResponse.status).json({
          error: "Erro na API TOTVS",
          status: apiResponse.status,
          message: errorText,
        });
        return;
      }

      const data = await apiResponse.json();

      // Retornar dados
      response.status(200).json(data);
    } catch (error) {
      console.error("Erro ao chamar API TOTVS:", error);
      response.status(500).json({
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }
);

