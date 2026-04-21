Site LMP/UFC — Versão Melhorada

Versão revisada do sistema de agendamento, com foco em segurança, acessibilidade, mobile, organização e experiência do usuário.

📂 Arquivos

index.html — estrutura semântica e limpa (sem CSS/JS inline misturados).
style.css — todo o CSS organizado, com variáveis e responsivo.
script.js — lógica em módulo, com validações e estado centralizado.
A pasta img/ continua sendo a mesma do site original (mantenha as imagens).
✅ Melhorias aplicadas

Segurança

Removido o campo "senha do lab" do frontend (era cosmético, dava falsa sensação de segurança). Validação de fato deve ficar no Apps Script.
ID único de agendamento agora inclui timestamp + parte aleatória, evitando colisões e adivinhação.
Os links ACEITAR/RECUSAR continuam saindo do Apps Script — recomendo adicionar um token secreto dentro do próprio Apps Script (instruções abaixo).
Validação de e-mail institucional (@ufc.br, @alu.ufc.br, @det.ufc.br).
UX

Resumo do agendamento aparece em tempo real antes de enviar.
Feedback visual com mensagens de erro/sucesso, em vez de alert().
Validação em tempo real dos campos (nome, e-mail, data).
Confirmação ao voltar se houver dados preenchidos.
Loading spinner ao buscar horários.
Status visível ("X horários disponíveis em DD/MM/AAAA").
Botão "Fazer outro agendamento" depois de enviar.
Datas e horários

Não permite mais agendar em datas passadas (min no input).
Bloqueia fins de semana.
Limite de 3 meses à frente.
Estrutura pronta para ler horários ocupados do Apps Script (basta descomentar o bloco fetch em carregarHorarios).
Acessibilidade

HTML semântico: <button> no lugar de <div onclick>, <main>, <section>, aria-label, aria-live.
Foco visível com :focus-visible.
alt descritivos nas imagens.
Suporte a prefers-reduced-motion.
Navegação por teclado funcional em todos os cards.
Mobile

Cabeçalho que empilha logo + texto em telas pequenas.
Cards de ensaios em grid auto-responsivo (2 colunas no celular, 1 em telas muito estreitas).
Tabela com scroll horizontal quando necessário.
Botão de confirmação ocupa largura total no mobile.
Código

CSS e JS movidos para arquivos externos.
Variáveis CSS (:root) para cores, raios e sombras.
IIFE no JS para não vazar variáveis globais.
Configurações centralizadas no objeto CONFIG (URL do Apps Script, horários, e-mails permitidos, contatos).
Erro de digitação corrigido ("APRESENTADOS").
Tratamento de imagem quebrada (mostra placeholder em vez de ícone quebrado).
🛡️ Próximos passos recomendados (no Apps Script)

Adicione ao seu script no Google Apps Script para fechar a brecha de segurança:

const SECRET = 'mude-isto-para-uma-string-longa-aleatoria';
function doGet(e) {
  if (e.parameter.token !== SECRET) {
    return ContentService.createTextOutput('Acesso negado').setMimeType(ContentService.MimeType.TEXT);
  }
  // ...resto da lógica
}

E no script.js, adicione &token=... nas URLs de aceitar/recusar — mas atenção: como elas vão pelo WhatsApp, qualquer pessoa com o link conseguirá clicar. Para realmente proteger, o ideal é exigir login do coordenador ou gerar um token único por agendamento (armazenado em uma planilha) que expira após o primeiro clique.

🔌 Integração com horários reais

No script.js, dentro de carregarHorarios, descomente o bloco fetch quando você criar o endpoint no Apps Script que retorna { ocupados: ["08:00","10:00",...] } para a data escolhida.
