/* ============================================
   LMP/UFC - Sistema de Agendamento
   Lógica do cliente
   ============================================ */

(() => {
  'use strict';

  // ---------- Configuração ----------
  const CONFIG = {
    APPS_SCRIPT_URL: 'https://script.google.com/a/det.ufc.br/macros/s/AKfycbx2i7ZcdLE4qyU9RDtIeWZj0bpNIf5Ol2ULlnpy2V3xZfdAVe4kmlApmCbW0DxLQw/exec',
    HORA_INICIAL: 7,
    HORA_FINAL: 17,
    EMAIL_PERMITIDOS: ['ufc.br', 'alu.ufc.br', 'det.ufc.br'],
    CONTATOS: {
      'CARACTERIZAÇÃO DE MATERIAIS': '5585988179510',
      'USO DO LABORATÓRIO PARA AULAS': '5585988179510',
      'ENSAIOS MECÂNICOS': '5585988179510'
    }
  };

  // ---------- Dados ----------
  const cardsCaracterizacao = [
    { n: 'Dosagem Marshall', img: 'Marshall.jpeg', eq: 'Prensa Marshall, Estufas, Compactador' },
    { n: 'Dosagem Superpave', img: 'superpave.jpeg', eq: 'Compactador Giratório, Rice Test, Estufas' },
    { n: 'Extração de ligante', img: 'rotarex.jpeg', eq: 'Rotarex ou Soxhlet' }, **...**

_This response is too long to display in full._
