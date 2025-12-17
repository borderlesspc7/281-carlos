# Análise de Requisitos - Sistema de Gestão de Obras

Este documento apresenta uma análise comparativa entre os requisitos especificados e o que foi implementado no projeto.

---

## 1. Estrutura Principal e Navegação

### ✅ **FEITO: Botão de Voltar à Janela Inicial**
- **Status**: Implementado
- **Localização**: `src/components/layout/Header.tsx`
- **Detalhes**: Botão de voltar presente no header de cada obra, navegando para `/dashboard`

### ✅ **FEITO: Tela Principal do Aplicativo (Dashboard)**
- **Status**: Implementado
- **Localização**: `src/pages/Dashboard/Dashboard.tsx`
- **Detalhes**: 
  - Lista de obras cadastradas
  - Busca e filtros por status
  - Botão para criar nova obra
  - Cards com informações das obras

### ✅ **FEITO: Tela de Login**
- **Status**: Implementado
- **Localização**: `src/pages/Login/Login.tsx`
- **Detalhes**: 
  - Formulário de login com email e senha
  - Integração com Firebase Authentication
  - Link para registro

---

## 2. Gestão de Obras

### ✅ **FEITO: Obra 1 - Tela Principal com Dashboard e Botões Laterais**
- **Status**: Implementado
- **Localização**: `src/components/layout/ObraLayout.tsx` e `src/components/layout/Sidebar.tsx`
- **Detalhes**: 
  - Layout com sidebar contendo todos os módulos
  - Header com nome da obra e botão de voltar
  - Navegação entre módulos funcional

### ✅ **FEITO: Tela de Visualização de Obras com Função de Cadastro**
- **Status**: Implementado
- **Localização**: `src/pages/Dashboard/Dashboard.tsx`
- **Detalhes**: 
  - Cadastro de obras com:
    - Nome da obra
    - Número de pavimentos
    - Número de torres
  - Visualização em grid de cards
  - Edição e exclusão de obras

### ✅ **FEITO: Obras 2 e Seguintes Iguais à Obra 1**
- **Status**: Implementado
- **Detalhes**: Sistema suporta múltiplas obras, cada uma com sua própria estrutura

### ✅ **FEITO: Botão de Voltar à Janela Inicial (dentro das obras)**
- **Status**: Implementado
- **Localização**: `src/components/layout/Header.tsx`
- **Detalhes**: Botão presente no header de cada obra

---

## 3. Módulo Vagões (Janela 1)

### ✅ **FEITO: Janela Vagões - Cadastro de Vagões**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/Vagoes/Vagoes.tsx`
- **Detalhes**: 
  - Cadastro com:
    - Número do vagão
    - Predecessor
    - Data de início
    - Data de fim
    - Número de apartamentos contemplados
  - Edição e exclusão de vagões
  - Visualização em grid

### ✅ **FEITO: Janela Linha do Tempo - Linha de Balanço Editável**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/Vagoes/Vagoes.tsx` (modal de timeline)
- **Detalhes**: 
  - Visualização de linha de balanço
  - Edição de datas de início e fim ao clicar no vagão
  - Interface visual com barras representando períodos

---

## 4. Módulo Custo Orçado dos Vagões (Janela 2)

### ✅ **FEITO: Formulário de Custo por Vagão**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/CustoVagoes/CustoVagoes.tsx`
- **Detalhes**: 
  - Inserção manual de custos por vagão
  - Classificação em:
    - Material
    - Mão de obra
    - Total (calculado automaticamente)
  - Cálculo de peso em % (valor do vagão / valor total do orçamento)

### ✅ **FEITO: Botão para Gerar Relatório de Fluxo de Caixa**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/CustoVagoes/CustoVagoes.tsx`
- **Detalhes**: 
  - Gera relatório mensal de despesas orçadas
  - Distribui custos proporcionalmente ao período de cada vagão
  - Mostra custos de material, mão de obra e total por mês
  - Lista vagões ativos em cada período

---

## 5. Módulo Estoque de Insumos (Janela 3)

### ⚠️ **PARCIALMENTE FEITO: API com TOTVS para Estoque em Tempo Real**
- **Status**: Parcialmente Implementado
- **Localização**: `src/pages/Obra/EstoqueInsumos/EstoqueInsumos.tsx` e `src/services/totvsService.ts`
- **Detalhes**: 
  - ✅ Estrutura de integração com TOTVS implementada
  - ✅ Atualização automática a cada 5 minutos
  - ⚠️ Requer configuração de credenciais no Firebase Functions
  - ⚠️ Exibe mensagem de erro se credenciais não estiverem configuradas
  - **Nota**: A integração está preparada, mas precisa de configuração das credenciais da API TOTVS

### ✅ **FEITO: Opção de Cadastrar Insumos Manualmente**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/EstoqueInsumos/EstoqueInsumos.tsx`
- **Detalhes**: 
  - Formulário para cadastro manual de insumos
  - Campos: nome, unidade, quantidade disponível
  - Edição e exclusão de insumos cadastrados
  - Atualização em tempo real via Firestore listeners

---

## 6. Módulo ITENS (Janela 4)

### ✅ **FEITO: Formulário de Cadastro de Empresas e Serviços**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/Itens/Itens.tsx`
- **Detalhes**: 
  - Cadastro de empresas fornecedoras
  - Cadastro de serviços negociados
  - Vinculação de cada item a um vagão específico
  - Validação: quantidade não pode ultrapassar a quantidade orçada do vagão
  - Visualização de progresso (quantidade atual / máxima)

---

## 7. Módulo Contrato (Janela 5)

### ✅ **FEITO: Escolher Fornecedor e Inserir Itens do Contrato**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/Contrato/Contrato.tsx`
- **Detalhes**: 
  - Seleção de fornecedor
  - Inserção de itens pertinentes ao contrato
  - Vinculação com itens cadastrados na janela ITENS

### ⚠️ **PARCIALMENTE FEITO: Regra de Aprovação com Power Automate**
- **Status**: Parcialmente Implementado
- **Localização**: `src/services/contratoService.ts`
- **Detalhes**: 
  - ✅ Estrutura de aprovação implementada
  - ✅ Geração de token de aprovação
  - ✅ Envio de email via Power Automate (requer `VITE_POWER_AUTOMATE_APPROVAL_URL`)
  - ✅ Link de aprovação gerado
  - ⚠️ **FALTA**: Página/rota para receber o link e permitir aprovação
  - ⚠️ **FALTA**: Interface de aprovação com campos de aprovação/rejeição
  - **Nota**: O envio do email está implementado, mas falta a interface de aprovação

### ✅ **FEITO: Detecção Automática de Aditivos**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/Contrato/Contrato.tsx` e `src/services/contratoService.ts`
- **Detalhes**: 
  - Sistema detecta automaticamente se fornecedor já tem contrato
  - Novo contrato de fornecedor existente é tratado como aditivo
  - Exibe alerta visual informando o tipo (contrato ou aditivo)

---

## 8. Módulo KITS (Janela 5)

### ✅ **FEITO: Formulário de Cadastro de Kits**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/Kits/Kits.tsx`
- **Detalhes**: 
  - Cadastro de kits vinculados a vagões
  - Nome do kit
  - Aba de Mão de Obra:
    - Escolha de itens já cadastrados na janela ITENS
  - Aba de Materiais:
    - Cadastro de insumos necessários para execução de 1 vagão
    - Campos: nome, unidade, quantidade por unidade

---

## 9. Módulo Checklist Mensal (Janela 6)

### ✅ **FEITO: Botão para Cadastrar Formulário Padrão**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/ChecklistMensal/ChecklistMensalForm.tsx`
- **Detalhes**: 
  - Formulário para upload de PDF
  - Campos: mês, ano, observações
  - Validação de arquivo PDF (máximo 10MB)

### ⚠️ **PARCIALMENTE FEITO: Arquivamento em PDF no Google Drive**
- **Status**: Parcialmente Implementado
- **Localização**: `src/services/checklistMensalService.ts`
- **Detalhes**: 
  - ✅ Upload de PDF para Firebase Storage
  - ❌ **NÃO IMPLEMENTADO**: Upload para Google Drive
  - ✅ Arquivo é armazenado no Firebase Storage
  - **Nota**: O requisito especifica Google Drive, mas foi implementado Firebase Storage

### ⚠️ **PARCIALMENTE FEITO: Botão de Aprovação com Regra de Aprovação**
- **Status**: Parcialmente Implementado
- **Localização**: `src/pages/Obra/ChecklistMensal/ChecklistMensalDetails.tsx`
- **Detalhes**: 
  - ✅ Campos de aprovação implementados:
    - "Checklist aprovado"
    - "Checklist aprovado com restrição"
  - ✅ Webhook para Power Automate (requer `VITE_POWER_AUTOMATE_WEBHOOK_URL`)
  - ⚠️ **FALTA**: Interface completa de aprovação com link via email
  - ⚠️ **FALTA**: Página para receber link de aprovação e permitir aprovação com restrição
  - **Nota**: A estrutura está pronta, mas falta a integração completa de aprovação via email

---

## 10. Módulo Medição (Janela 7)

### ✅ **FEITO: Abrir Medição Nova**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/Medicao/MedicaoForm.tsx`
- **Detalhes**: 
  - Formulário em etapas (wizard)
  - Escolha de fornecedor e contrato (incluindo aditivos)
  - Data e número da medição
  - Seleção de vagão
  - Seleção de itens cadastrados no vagão vinculados ao contrato

### ✅ **FEITO: Mapa de Unidades - Marcar Apartamentos Concluídos**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/Medicao/MedicaoForm.tsx`
- **Detalhes**: 
  - Visualização de apartamentos por pavimento e torre
  - Marcação de apartamentos concluídos
  - Interface visual com grid

### ⚠️ **PARCIALMENTE FEITO: Template de Visualização de Apartamentos**
- **Status**: Parcialmente Implementado
- **Detalhes**: 
  - ✅ Template básico implementado no formulário de medição
  - ⚠️ **FALTA**: Template separado para visualização geral de todos os apartamentos e vagões medidos
  - ⚠️ **FALTA**: Opção de fazer medição diretamente pelo template (clicar no vagão, escolher item e empresa)

### ✅ **FEITO: Validação ao Sair - Pop-up de Confirmação**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/Medicao/MedicaoForm.tsx`
- **Detalhes**: 
  - Detecta alterações não salvas
  - Exibe pop-up de confirmação ao tentar sair
  - Bloqueia navegação se houver dados não salvos

### ✅ **FEITO: Botão Gerar Medição**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/Medicao/MedicaoForm.tsx`
- **Detalhes**: 
  - Salva a medição no banco de dados
  - Lista de medições criadas
  - Visualização de detalhes

---

## 11. Módulo Produção (Janela 8)

### ❌ **NÃO FEITO: Módulo de Produção**
- **Status**: Não Implementado
- **Localização**: `src/pages/Obra/Producao/Producao.tsx`
- **Detalhes**: 
  - ❌ Apenas estrutura básica (placeholder)
  - ❌ Falta implementação completa
  - **Requisitos não atendidos**:
    - Template de visualização dos apartamentos
    - Marcação de produção (similar à medição)
    - Produção semanal para acompanhamento
    - Diferenciação da medição (produção vs. pagamento)
    - Cálculo de peso em % de cada medição

---

## 12. Módulo Produção Faltante (Janela 9)

### ✅ **FEITO: Lista de Vagões com Métricas**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/ProducaoFaltante/ProducaoFaltante.tsx`
- **Detalhes**: 
  - Lista total de vagões cadastrados
  - Exibe:
    - Quantidade medida
    - Quantidade produzida
    - Quantidade a comprometer (produzido - medido)
    - Quantidade faltante a produzir (total - produzido)
    - Quantidade faltante a medir (total - medido)
  - Formato de lista com tabela

### ✅ **FEITO: Botão Gerar Excel**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/ProducaoFaltante/ProducaoFaltante.tsx`
- **Detalhes**: 
  - Exporta dados para Excel
  - Utiliza biblioteca XLSX

---

## 13. Módulo Estoque de KITS (Janela 10)

### ✅ **FEITO: Lista de KITS com Análise de Estoque**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/EstoqueKits/EstoqueKits.tsx`
- **Detalhes**: 
  - Lista total de kits cadastrados
  - Análise de insumos reais
  - Lógica de alocação de insumos:
    - Calcula quantidade necessária por kit baseado na produção faltante
    - Aloca insumos do estoque disponível
    - Identifica déficit quando insumo se repete em diversos kits
    - Sinaliza kits com déficit em vermelho
  - Exibe:
    - Quantidade necessária
    - Quantidade alocada
    - Déficit (se houver)

### ✅ **FEITO: Botão Gerar Excel**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/EstoqueKits/EstoqueKits.tsx`
- **Detalhes**: 
  - Exporta análise completa para Excel
  - Inclui todos os insumos e kits

---

## 14. Módulo Material Faltante (Janela 11)

### ✅ **FEITO: Lista de Kits Faltantes**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/MaterialFaltante/MaterialFaltante.tsx`
- **Detalhes**: 
  - Mostra apenas kits sinalizados de vermelho (com déficit)
  - Lista nome do kit e itens faltantes
  - Exibe déficit de cada insumo

### ✅ **FEITO: Botão Gerar Excel**
- **Status**: Implementado
- **Localização**: `src/pages/Obra/MaterialFaltante/MaterialFaltante.tsx`
- **Detalhes**: 
  - Exporta lista de materiais faltantes para Excel

---

## 15. Módulo Mapa de Restrições (Janela 12)

### ❌ **NÃO FEITO: Mapa de Restrições**
- **Status**: Não Implementado
- **Localização**: `src/pages/Obra/MapaRestricoes/MapaRestricoes.tsx`
- **Detalhes**: 
  - ❌ Apenas estrutura básica (placeholder)
  - **Requisitos não atendidos**:
    - Lista de vagões com colunas:
      - Vagão (nome do vagão)
      - Data de início (da linha do tempo)
      - Semana (lógica: (hoje - data inicial) / 7, arredondado para baixo)
      - Projeto (sim/não com tick)
      - Material (verde se não falta material, vermelho se falta - baseado em Estoque de Kits)
      - Mão de obra (verde se tem contrato, vermelho se não tem - baseado em Contratos)
      - SESMT (funcionários liberados na catraca, sim/não com tick)
    - Botão gerar Excel

---

## 16. Funcionalidades Gerais

### ✅ **FEITO: Botão Sair**
- **Status**: Implementado
- **Localização**: `src/pages/Dashboard/Dashboard.tsx` e `src/components/layout/Header.tsx`
- **Detalhes**: 
  - Botão de logout presente no dashboard
  - Função de logout implementada

---

## Resumo Geral

### ✅ **Totalmente Implementado**: 11 módulos
1. Estrutura Principal e Navegação
2. Gestão de Obras
3. Módulo Vagões
4. Módulo Custo Orçado dos Vagões
5. Módulo Estoque de Insumos (cadastro manual)
6. Módulo ITENS
7. Módulo Contrato (estrutura básica)
8. Módulo KITS
9. Módulo Checklist Mensal (estrutura básica)
10. Módulo Medição
11. Módulo Produção Faltante
12. Módulo Estoque de KITS
13. Módulo Material Faltante

### ⚠️ **Parcialmente Implementado**: 3 módulos
1. **Estoque de Insumos - API TOTVS**: Estrutura pronta, requer configuração
2. **Contrato - Aprovação via Power Automate**: Envio de email implementado, falta interface de aprovação
3. **Checklist Mensal - Aprovação e Google Drive**: 
   - Upload para Firebase Storage (não Google Drive)
   - Estrutura de aprovação parcial

### ❌ **Não Implementado**: 2 módulos
1. **Módulo Produção**: Apenas placeholder
2. **Módulo Mapa de Restrições**: Apenas placeholder

---

## Observações Importantes

1. **Integrações Externas**:
   - Power Automate: Estrutura implementada, mas requer configuração de variáveis de ambiente
   - TOTVS API: Estrutura implementada, mas requer configuração de credenciais
   - Google Drive: Não implementado (usando Firebase Storage)

2. **Funcionalidades Pendentes**:
   - Interface de aprovação de contratos via link de email
   - Interface de aprovação de checklist mensal via link de email
   - Módulo completo de Produção
   - Módulo completo de Mapa de Restrições
   - Upload de PDFs para Google Drive (atualmente usando Firebase Storage)

3. **Melhorias Sugeridas**:
   - Implementar página de aprovação de contratos
   - Implementar página de aprovação de checklist
   - Completar módulo de Produção
   - Completar módulo de Mapa de Restrições
   - Considerar migração de Firebase Storage para Google Drive (se necessário)

---

**Data da Análise**: 2024
**Versão do Projeto**: Baseado na estrutura atual do código

