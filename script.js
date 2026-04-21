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
    { n: 'Extração de ligante', img: 'rotarex.jpeg', eq: 'Rotarex ou Soxhlet' },
    { n: 'Fluir ligante', img: 'fluir.jpeg', eq: 'Bucha de fluidez, Estufa' },
    { n: 'Homogeneização', img: 'quarte.jpeg', eq: 'Quarteador, Bandejas' },
    { n: 'Abrasão Los Angeles', img: 'la.jpeg', eq: 'Máquina Los Angeles' },
    { n: 'Densidade e absorção', img: 'dens.jpeg', eq: 'Balança Hidrostática' },
    { n: 'Adesividade (Tradicional)', img: 'adesiv.jpeg', eq: 'Placas de vidro, Estufa' },
    { n: 'Adesividade (ABS)', img: 'abs.jpeg', eq: 'PAT Tester' },
    { n: 'Granulometria', img: 'granu.jpeg', eq: 'Agitador de peneiras' },
    { n: 'Indice de forma', img: 'if.jpeg', eq: 'Paquímetro, Agulha' },
    { n: 'Sanidade', img: 'sani.jpeg', eq: 'Sulfato, Estufa' },
    { n: 'Secagem / Estufa', img: 'estufa.jpeg', eq: 'Estufa de circulação' }
  ];

  const cardsMecanicos = [
    { n: 'Prensa Marshall', img: 'marsh.jpeg', eq: 'Rompimento Marshall / Estabilidade / Fluência' },
    { n: 'Prensa UTM-25', img: 'utm25.jpeg', eq: 'Ensaios Dinâmicos, Fadiga de Misturas Asfálticas' },
    { n: 'Prensa UTM-30', img: 'utm30.jpeg', eq: 'Módulo de Resiliência, Resistência à Tração (RT)' },
    { n: 'Prensa MTS', img: 'mts.jpeg', eq: 'Ensaios de Alta Precisão e Caracterização Avançada' },
    { n: 'Prensa RiO', img: 'rio.jpeg', eq: 'Ensaios de Compressão Simples e Estáticos' }
  ];

  // ---------- Estado ----------
  const state = {
    categoriaAtiva: '',
    ensaioSelecionado: '',
    equipamentoSelecionado: '',
    subtipoSelecionado: '',
    horariosSelecionados: [],
    horariosOcupados: new Set(),
    ultimoPedido: null
  };

  // ---------- Helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const formatarData = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const validarEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return { ok: false, msg: 'Formato de e-mail inválido.' };
    const dominio = email.split('@')[1].toLowerCase();
    const dominioOk = CONFIG.EMAIL_PERMITIDOS.some(d => dominio === d || dominio.endsWith('.' + d));
    if (!dominioOk) {
      return { ok: false, msg: 'Use um e-mail institucional (@ufc.br, @alu.ufc.br ou @det.ufc.br).' };
    }
    return { ok: true };
  };

  const validarData = (iso) => {
    if (!iso) return { ok: false, msg: 'Selecione uma data.' };
    const data = new Date(iso + 'T00:00:00');
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    if (data < hoje) return { ok: false, msg: 'Não é possível agendar em datas passadas.' };
    const dia = data.getDay();
    if (dia === 0 || dia === 6) return { ok: false, msg: 'Agendamentos só de segunda a sexta-feira.' };
    return { ok: true };
  };

  const setErro = (campo, mensagem) => {
    const input = $('#' + campo);
    const erro = $('#erro-' + campo);
    if (mensagem) {
      input?.classList.add('invalid');
      input?.setAttribute('aria-invalid', 'true');
      if (erro) erro.textContent = mensagem;
    } else {
      input?.classList.remove('invalid');
      input?.removeAttribute('aria-invalid');
      if (erro) erro.textContent = '';
    }
  };

  const mostrarFeedback = (msg, tipo = 'info') => {
    const el = $('#mensagem-feedback');
    el.textContent = msg;
    el.className = 'mensagem-feedback ' + tipo;
    el.hidden = false;
    if (tipo !== 'sucesso') {
      setTimeout(() => { el.hidden = true; }, 6000);
    }
  };

  // ---------- Inicialização ----------
  document.addEventListener('DOMContentLoaded', () => {
    configurarDataMinima();
    bindEventos();
  });

  function configurarDataMinima() {
    const input = $('#data');
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    input.min = `${ano}-${mes}-${dia}`;

    const max = new Date(); max.setMonth(max.getMonth() + 3);
    input.max = max.toISOString().split('T')[0];
  }

  function bindEventos() {
    $$('.categoria-card').forEach(btn => {
      btn.addEventListener('click', () => escolherCategoria(btn.dataset.categoria));
    });

    $('#btn-voltar').addEventListener('click', voltarInicio);

    $('#nome').addEventListener('blur', () => {
      const v = $('#nome').value.trim();
      setErro('nome', v.length < 3 ? 'Informe seu nome completo.' : '');
    });

    $('#email').addEventListener('blur', () => {
      const v = $('#email').value.trim();
      const r = validarEmail(v);
      setErro('email', r.ok ? '' : r.msg);
    });

    $('#data').addEventListener('change', () => {
      const v = $('#data').value;
      const r = validarData(v);
      setErro('data', r.ok ? '' : r.msg);
      if (r.ok) carregarHorarios(v);
      else limparTabela('Selecione uma data válida.');
    });

    $('#qtd-amostras').addEventListener('input', atualizarResumo);
    $('#obs-ensaio').addEventListener('input', atualizarResumo);
    $('#qtd-alunos').addEventListener('input', atualizarResumo);

    $$('.btn-opcao').forEach(btn => {
      btn.addEventListener('click', () => definirSubtipo(btn.dataset.subtipo, btn));
    });

    $('#form-agendamento').addEventListener('submit', (e) => {
      e.preventDefault();
      reservarSelecionados();
    });
  }

  // ---------- Navegação ----------
  function escolherCategoria(nome) {
    state.categoriaAtiva = nome;
    state.ensaioSelecionado = '';
    state.equipamentoSelecionado = '';
    state.subtipoSelecionado = '';

    $('#categoria-display').value = nome;
    $('#selecao-inicial').hidden = true;
    $('#conteudo-principal').hidden = false;

    const containerCards = $('#container-cards-padrao');
    const containerLista = $('#container-lista-aulas');
    const extras = $$('.campos-extras');
    const tituloCards = $('#titulo-selecao-cards');
    const listaInfo = $('#lista-info-geral');
    const grupoAlunos = $('#grupo-qtd-alunos');
    const instrucoes = $('#texto-instrucoes');

    containerCards.innerHTML = '';
    $('#caixa-equipamentos').hidden = true;
    $('#container-detalhes').hidden = true;

    if (nome === 'USO DO LABORATÓRIO PARA AULAS') {
      tituloCards.innerHTML = '<span aria-hidden="true">➤</span> Selecione os ensaios que serão apresentados em aula';
      listaInfo.innerHTML = `
        <li><strong>1.</strong> É proibida a entrada usando chinelos, sandálias ou calçados abertos.</li>
        <li><strong>2.</strong> Não é permitido comer ou beber no laboratório.</li>
        <li><strong>3.</strong> Avise com pelo menos 48h de antecedência.</li>
      `;
      instrucoes.textContent = 'Marque todos os ensaios que serão demonstrados durante a aula. Informe a quantidade de alunos para preparar o espaço.';
      grupoAlunos.hidden = false;
      containerCards.hidden = true;
      containerLista.hidden = false;
      extras.forEach(el => el.hidden = true);
      gerarListaAulas();
    } else {
      listaInfo.innerHTML = `
        <li><strong>1.</strong> Utilizar EPIs obrigatórios (jaleco, óculos e calçado fechado).</li>
        <li><strong>2.</strong> Manter o laboratório limpo e organizado após o uso.</li>
        <li class="aviso"><strong>3.</strong> Reservas até sexta às 12:00 terão prioridade para a próxima semana.</li>
      `;
      instrucoes.textContent = 'Selecione o equipamento ou procedimento desejado, informe quantidade de amostras e horários.';
      grupoAlunos.hidden = true;
      containerCards.hidden = false;
      containerLista.hidden = true;
      extras.forEach(el => el.hidden = false);

      tituloCards.innerHTML = (nome === 'ENSAIOS MECÂNICOS')
        ? '<span aria-hidden="true">➤</span> Selecione o equipamento'
        : '<span aria-hidden="true">➤</span> Selecione o equipamento ou procedimento';

      const lista = (nome === 'ENSAIOS MECÂNICOS') ? cardsMecanicos : cardsCaracterizacao;
      lista.forEach((item, i) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'ensaio-card';
        card.setAttribute('role', 'listitem');
        card.setAttribute('aria-label', `${item.n} - ${item.eq}`);
        card.dataset.nome = item.n;
        card.innerHTML = `
          <img src="img/${item.img}" alt="" loading="lazy"
               onerror="this.style.background='#e1e8ed';this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 60%22><rect fill=%22%23e1e8ed%22 width=%22100%22 height=%2260%22/><text x=%2250%22 y=%2235%22 font-size=%228%22 text-anchor=%22middle%22 fill=%22%231A4A5A%22>Sem imagem</text></svg>'">
          <div class="info"><h5>${i + 1} - ${item.n}</h5></div>
        `;
        card.addEventListener('click', () => selecionarEnsaio(card, item.n, item.eq));
        containerCards.appendChild(card);
      });
    }

    if (!$('#data').value) {
      const proxima = proximoDiaUtil();
      $('#data').value = proxima;
    }
    carregarHorarios($('#data').value);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function proximoDiaUtil() {
    const d = new Date();
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  function voltarInicio() {
    if (state.ensaioSelecionado || state.horariosSelecionados.length) {
      if (!confirm('Tem certeza? Os dados preenchidos serão perdidos.')) return;
    }
    $('#selecao-inicial').hidden = false;
    $('#conteudo-principal').hidden = true;
    $('#form-agendamento').reset();
    state.categoriaAtiva = '';
    state.ensaioSelecionado = '';
    state.subtipoSelecionado = '';
    state.horariosSelecionados = [];
    state.ultimoPedido = null;
    $('#resumo-agendamento').hidden = true;
    $('#mensagem-feedback').hidden = true;

    const areaAcao = $('#area-acao');
    areaAcao.innerHTML = `
      <button type="submit" id="btn-confirmar" class="btn-primario">
        Confirmar Agendamento
      </button>
    `;
  }

  // ---------- Seleções ----------
  function selecionarEnsaio(elemento, nome, eq) {
    $$('.ensaio-card').forEach(c => c.classList.remove('selected'));
    elemento.classList.add('selected');
    state.ensaioSelecionado = nome;
    state.equipamentoSelecionado = eq;

    const precisaOpcoes = /marshall|superpave/i.test(nome);
    $('#container-detalhes').hidden = false;
    $('#opcoes-estado-mistura').hidden = !precisaOpcoes;
    $('#caixa-equipamentos').hidden = false;
    $('#lista-equipamentos').textContent = eq;

    if (!precisaOpcoes) state.subtipoSelecionado = '';
    atualizarResumo();
  }

  function definirSubtipo(tipo, botao) {
    $$('.btn-opcao').forEach(b => b.classList.remove('active'));
    botao.classList.add('active');
    state.subtipoSelecionado = ' (' + tipo + ')';
    atualizarResumo();
  }

  function gerarListaAulas() {
    const container = $('#container-lista-aulas');
    let html = '<h4>Marque os ensaios da aula:</h4>';
    cardsCaracterizacao.forEach(item => {
      html += `
        <label class="item-aula-checkbox">
          <input type="checkbox" class="check-ensaio-aula" value="${item.n}">
          <span>${item.n}</span>
        </label>
      `;
    });
    container.innerHTML = html;
    container.querySelectorAll('.check-ensaio-aula').forEach(c => {
      c.addEventListener('change', atualizarResumo);
    });
  }

  // ---------- Horários ----------
  function limparTabela(msg) {
    $('#corpo-agenda').innerHTML = `<tr><td colspan="3" class="placeholder-horarios">${msg}</td></tr>`;
    $('#status-horarios').textContent = '';
  }

  async function carregarHorarios(data) {
    const corpo = $('#corpo-agenda');
    const statusEl = $('#status-horarios');
    corpo.innerHTML = `<tr><td colspan="3" class="placeholder-horarios"><span class="spinner"></span>Carregando horários...</td></tr>`;
    statusEl.textContent = '';

    let ocupados = new Set();
    try {
      // const r = await fetch(`${CONFIG.APPS_SCRIPT_URL}?acao=listar&data=${encodeURIComponent(data)}`);
      // const json = await r.json();
      // if (Array.isArray(json.ocupados)) ocupados = new Set(json.ocupados);
    } catch (e) {
      console.warn('Não foi possível buscar horários ocupados:', e);
    }
    state.horariosOcupados = ocupados;

    let html = '';
    for (let h = CONFIG.HORA_INICIAL; h <= CONFIG.HORA_FINAL; h++) {
      const hora = h.toString().padStart(2, '0') + ':00';
      const ocupado = ocupados.has(hora);
      html += `
        <tr class="${ocupado ? 'indisponivel' : ''}">
          <td>${hora}</td>
          <td><span class="${ocupado ? 'status-indisponivel' : 'status-disponivel'}">
            ${ocupado ? 'Reservado' : 'Disponível'}
          </span></td>
          <td>
            <input type="checkbox" name="selecionar-hora" value="${hora}"
                   ${ocupado ? 'disabled' : ''}
                   aria-label="Selecionar horário ${hora}">
          </td>
        </tr>`;
    }
    corpo.innerHTML = html;

    corpo.querySelectorAll('input[name="selecionar-hora"]').forEach(c => {
      c.addEventListener('change', () => {
        c.closest('tr')?.classList.toggle('has-checked', c.checked);
        atualizarResumo();
      });
    });

    const totalLivres = (CONFIG.HORA_FINAL - CONFIG.HORA_INICIAL + 1) - ocupados.size;
    statusEl.textContent = `${totalLivres} horário(s) disponível(is) em ${formatarData(data)}.`;
  }

  // ---------- Resumo ----------
  function atualizarResumo() {
    const horarios = Array.from($$('input[name="selecionar-hora"]:checked')).map(c => c.value);
    state.horariosSelecionados = horarios;

    const resumo = $('#resumo-agendamento');
    const lista = $('#lista-resumo');

    let detalhes = '';
    if (state.categoriaAtiva === 'USO DO LABORATÓRIO PARA AULAS') {
      const sel = Array.from($$('.check-ensaio-aula:checked')).map(c => c.value);
      const qtdAlunos = $('#qtd-alunos').value || '0';
      detalhes = `[AULA] Alunos: ${qtdAlunos} | Ensaios: ${sel.join(', ') || 'nenhum'}`;
      $('#maquina').value = detalhes;
    } else {
      const qtd = $('#qtd-amostras').value || '1';
      const obs = $('#obs-ensaio').value.trim();
      detalhes = `${state.ensaioSelecionado || '(nenhum)'}${state.subtipoSelecionado} (${qtd} amostras)`;
      if (obs) detalhes += ` [OBS: ${obs}]`;
      $('#maquina').value = detalhes;
    }

    const algoSelecionado = (
      state.ensaioSelecionado ||
      $$('.check-ensaio-aula:checked').length > 0
    );

    if (horarios.length && algoSelecionado) {
      lista.innerHTML = `
        <li><strong>Categoria:</strong> ${state.categoriaAtiva}</li>
        <li><strong>Detalhes:</strong> ${detalhes}</li>
        <li><strong>Data:</strong> ${formatarData($('#data').value) || '—'}</li>
        <li><strong>Horários:</strong> ${horarios.join(', ')}</li>
      `;
      resumo.hidden = false;
    } else {
      resumo.hidden = true;
    }
  }

  // ---------- Submit ----------
  function reservarSelecionados() {
    const nome = $('#nome').value.trim();
    const email = $('#email').value.trim();
    const data = $('#data').value;
    const horarios = Array.from($$('input[name="selecionar-hora"]:checked')).map(c => c.value);

    let temErro = false;

    if (nome.length < 3) { setErro('nome', 'Informe seu nome completo.'); temErro = true; }
    else setErro('nome', '');

    const re = validarEmail(email);
    if (!re.ok) { setErro('email', re.msg); temErro = true; } else setErro('email', '');

    const rd = validarData(data);
    if (!rd.ok) { setErro('data', rd.msg); temErro = true; } else setErro('data', '');

    if (horarios.length === 0) {
      mostrarFeedback('Selecione pelo menos um horário.', 'erro');
      temErro = true;
    }

    if (state.categoriaAtiva === 'USO DO LABORATÓRIO PARA AULAS') {
      const qtd = parseInt($('#qtd-alunos').value, 10);
      const ensaiosAula = $$('.check-ensaio-aula:checked').length;
      if (!qtd || qtd < 1) {
        mostrarFeedback('Informe a quantidade de alunos.', 'erro'); temErro = true;
      } else if (ensaiosAula === 0) {
        mostrarFeedback('Marque ao menos um ensaio para a aula.', 'erro'); temErro = true;
      }
    } else if (!state.ensaioSelecionado) {
      mostrarFeedback('Escolha um equipamento ou procedimento.', 'erro');
      temErro = true;
    }

    if (temErro) return;

    const ID_UNICO = 'ID-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    const numeroDestino = CONFIG.CONTATOS[state.categoriaAtiva] || CONFIG.CONTATOS['CARACTERIZAÇÃO DE MATERIAIS'];
    const detalhes = $('#maquina').value;

    let mensagem = '\uD83D\uDD2C *Novo Agendamento LMP*\n\n';
    mensagem += `*Nome:* ${nome}\n`;
    mensagem += `*E-mail:* ${email}\n`;
    if ($('#orientador').value) mensagem += `*Orientador:* ${$('#orientador').value}\n`;
    if ($('#projeto').value) mensagem += `*Projeto/Órgão:* ${$('#projeto').value}\n`;
    mensagem += `*Categoria:* ${state.categoriaAtiva}\n`;
    mensagem += `*Detalhes:* ${detalhes}\n`;
    mensagem += `*Data:* ${formatarData(data)}\n`;
    mensagem += `*Horários:* ${horarios.join(', ')}\n\n`;
    mensagem += `*ID:* ${ID_UNICO}\n\n`;
    mensagem += `\u2705 ACEITAR: ${CONFIG.APPS_SCRIPT_URL}?id=${ID_UNICO}&acao=Aceito\n`;
    mensagem += `\u274C RECUSAR: ${CONFIG.APPS_SCRIPT_URL}?id=${ID_UNICO}&acao=Recusado`;

    const urlZap = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(mensagem)}`;

    state.ultimoPedido = {
      id: ID_UNICO,
      nome,
      categoria: state.categoriaAtiva,
      detalhes,
      data: formatarData(data),
      horarios: horarios.join(', '),
      hora_envio: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const janela = window.open(urlZap, '_blank', 'noopener');

    if (!janela) {
      const areaAcao = $('#area-acao');
      areaAcao.innerHTML = `
        <a href="${urlZap}" target="_blank" rel="noopener" class="btn-whatsapp" id="link-zap-manual">
          <span aria-hidden="true">\uD83D\uDCF1</span> Abrir WhatsApp para enviar o pedido
        </a>
      `;
      mostrarFeedback('Seu navegador bloqueou a janela. Clique no botão verde para abrir o WhatsApp e enviar o pedido.', 'erro');
      $('#link-zap-manual').addEventListener('click', () => {
        aguardarRetornoDoZap();
      });
    } else {
      aguardarRetornoDoZap();
    }

    $('#resumo-agendamento').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ---------- Aguarda o retorno do usuário ----------
  function aguardarRetornoDoZap() {
    const areaAcao = $('#area-acao');
    areaAcao.innerHTML = `
      <div class="aguardando-envio">
        <div class="spinner-grande" aria-hidden="true"></div>
        <p><strong>Aguardando você enviar a mensagem no WhatsApp...</strong></p>
        <p class="aguardando-sub">Após enviar, volte a esta página para confirmar seu agendamento.</p>
        <button type="button" class="btn-primario" id="btn-ja-enviei">
          <span aria-hidden="true">\u2714</span> Já enviei a mensagem
        </button>
      </div>
    `;

    $('#btn-ja-enviei').addEventListener('click', mostrarComprovante);

    const handlerVisibilidade = () => {
      if (document.visibilityState === 'visible') {
        document.removeEventListener('visibilitychange', handlerVisibilidade);
        setTimeout(() => {
          const btn = $('#btn-ja-enviei');
          if (btn) btn.classList.add('pulsar');
        }, 400);
      }
    };
    document.addEventListener('visibilitychange', handlerVisibilidade);
  }

  // ---------- Comprovante ----------
  function mostrarComprovante() {
    const p = state.ultimoPedido || {};
    const areaAcao = $('#area-acao');
    areaAcao.innerHTML = `
      <div class="comprovante-envio">
        <div class="comprovante-icone" aria-hidden="true">\u2714</div>
        <h3>Pedido enviado com sucesso!</h3>
        <p class="comprovante-sub">Seu pedido foi encaminhado ao responsável pelo WhatsApp.</p>

        <div class="comprovante-dados">
          <div><span>Protocolo</span><strong>${p.id || '—'}</strong></div>
          <div><span>Solicitante</span><strong>${p.nome || '—'}</strong></div>
          <div><span>Categoria</span><strong>${p.categoria || '—'}</strong></div>
          <div><span>Detalhes</span><strong>${p.detalhes || '—'}</strong></div>
          <div><span>Data</span><strong>${p.data || '—'}</strong></div>
          <div><span>Horários</span><strong>${p.horarios || '—'}</strong></div>
          <div><span>Enviado às</span><strong>${p.hora_envio || '—'}</strong></div>
        </div>

        <p class="comprovante-aviso">
          \u26A0 O agendamento será <strong>confirmado oficialmente</strong> quando o responsável aceitar o pedido no WhatsApp.
          Você receberá a confirmação pelos canais informados.
        </p>

        <button type="button" class="btn-primario" id="btn-novo-agendamento">
          Fazer novo agendamento
        </button>
      </div>
    `;

    $('#btn-novo-agendamento').addEventListener('click', voltarInicio);
    $('#mensagem-feedback').hidden = true;

    areaAcao.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

})();
