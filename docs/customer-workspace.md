# Clientes e ativação comercial — 29/09/2026

PROSPEÇÃO reúne o Kanban, missões e propostas em curso. Clientes integra as mensalidades; Performance mantém o histórico. Nenhum registo é eliminado pela reorganização.

Em Cliente ativo, abrir Configurar serviço e ativação. A ficha tem gravação nas alterações válidas e botão explícito de guardar. Os dados são guardados pelo mecanismo crm_state existente. `customer` no lead mantém os dados de ativação e `proposalId`; a proposta ligada contém serviços e montantes para alimentar métricas existentes. Conversões repetidas reutilizam sourceProspectId/id. É possível associar explicitamente uma proposta da mesma empresa.

Mensalidade contratada não é faturação nem dinheiro recebido. As novas vendas são Aceite, não Faturado; adjudicação e DD são confirmações manuais, sem transações financeiras. Preços não definidos obrigam a introdução de valor antes de guardar. O contrato gerado é rascunho; contratos existentes são abertos e não substituídos.

Kickoff mantém a implementação anterior. Presença, Marcações e Leads abrem o fluxo existente. High Ticket/Outros abrem um guia de preparação sem preços, sem submissões e sem registar pagamentos.

Os dados de contactos não são transmitidos em parâmetros de URL. GoCardless é um atalho para gestão, não integração de mandatos. As luzes indicam o estado comercial registado, não a verificação bancária.
