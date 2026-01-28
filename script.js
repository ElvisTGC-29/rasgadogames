(() => {
  const qs = (sel, el=document) => el.querySelector(sel);
  const qsa = (sel, el=document) => Array.from(el.querySelectorAll(sel));

  // ---------- Mobile nav ----------
  const navToggle = qs('.nav-toggle');
  const nav = qs('#navMain');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });

    // Close nav when clicking a link (mobile)
    qsa('.nav__link', nav).forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

    // ---------- Dropdown menus (Stardew submenu) ----------
  const dropdowns = qsa('[data-dropdown]');

  function closeAllDropdowns(except=null){
    dropdowns.forEach(dd => {
      if (except && dd === except) return;
      dd.classList.remove('is-open');
      const btn = qs('.nav__dropdownBtn', dd);
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  dropdowns.forEach(dd => {
    const btn = qs('.nav__dropdownBtn', dd);
    const menu = qs('.nav__menu', dd);
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !dd.classList.contains('is-open');
      closeAllDropdowns(dd);
      dd.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // clicking submenu closes dropdown + mobile nav
    qsa('a', menu).forEach(a => {
      a.addEventListener('click', () => {
        closeAllDropdowns();
        nav?.classList.remove('is-open');
        navToggle?.setAttribute('aria-expanded', 'false');
      });
    });
  });

  // click outside closes
  document.addEventListener('click', () => closeAllDropdowns());

// ---------- Game switcher ----------
  const gameButtons = qsa('[data-game]');
  const gameBlocks = qsa('[data-game-section]');

  function setGame(game) {
    gameButtons.forEach(btn => {
      const active = btn.getAttribute('data-game') === game;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    gameBlocks.forEach(block => {
      const isForGame = block.getAttribute('data-game-section') === game;
      block.classList.toggle('is-hidden', !isForGame);
    });
  }

  gameButtons.forEach(btn => {
    btn.addEventListener('click', () => setGame(btn.getAttribute('data-game')));
  });


  // ---------- Nav links can switch game ----------
  qsa('[data-set-game]').forEach(el => {
    el.addEventListener('click', () => setGame(el.getAttribute('data-set-game')));
  });

  // Default
  setGame('stardew');

  // ---------- Accordion ----------
  qsa('[data-accordion] .accordion__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panelId = btn.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) return;

      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      panel.hidden = expanded;

      const icon = qs('.accordion__icon', btn);
      if (icon) icon.textContent = expanded ? '+' : '−';
    });
  });

      // ---------- Auth (Supabase) ----------
  const sb = window.supabaseClient;

  // Sessão em memória (para uso síncrono pelo restante do site)
  let RG_SB_SESSION = null;

  function getPrefix(){
    const p = (location.pathname || '').replace(/\\/g,'/');
    return (p.includes('/forum/') || p.includes('/atualizacoes/')) ? '../' : '';
  }

  function getNextParam(){
    const p = (location.pathname || '').replace(/\\/g,'/');
    const parts = p.split('/').filter(Boolean);
    const file = parts[parts.length-1] || 'index.html';
    if (parts.includes('forum')) return `forum/${file}`;
    if (parts.includes('atualizacoes')) return `atualizacoes/${file}`;
    return file;
  }

  // Compat: mantém a mesma "cara" do getSession antigo (usado no fórum e na navbar)
  function getSession(){
    if(!RG_SB_SESSION?.user) return null;
    const u = RG_SB_SESSION.user;
    const username = (u.user_metadata && u.user_metadata.username) ? u.user_metadata.username : ((u.email || 'usuario').split('@')[0]);
    return { id: u.id, username, email: u.email };
  }

  async function refreshSession(){
    if(!sb) return null;
    const { data } = await sb.auth.getSession();
    RG_SB_SESSION = data?.session || null;
    return RG_SB_SESSION;
  }

  function prettyAuthError(err){
    const msg = (err && err.message) ? err.message : String(err);
    const low = msg.toLowerCase();

    if(low.includes('captcha') && low.includes('failed')){
      return 'Falha no CAPTCHA do Supabase. Desative em Authentication → Attack Protection → CAPTCHA (ou configure Turnstile/hCaptcha e implemente no site).';
    }
    if(low.includes('invalid login credentials')){
      return 'E-mail ou senha inválidos.';
    }
    if(low.includes('email not confirmed') || low.includes('not confirmed')){
      return 'Seu e-mail ainda não foi confirmado. Abra o e-mail de confirmação e tente novamente.';
    }
    if(low.includes('already registered') || low.includes('already exists') || low.includes('user already registered')){
      return 'Esse e-mail já está cadastrado. Use "Entrar" ou recupere a senha.';
    }
    return msg;
  }

  function getEmailRedirectTo(){
    // Base do site (funciona em GitHub Pages e em testes locais)
    const basePath = (location.pathname || '/').replace(/\/g,'/').replace(/\/[^\/]*$/, '/');
    return `${location.origin}${basePath}conta.html#login`;
  }


  async function logout(){
    if(!sb) return;
    await sb.auth.signOut();
    // onAuthStateChange atualiza a UI
  }

  function renderAuthActions(){
    const actions = qs('[data-auth-actions]');
    if(!actions) return;

    const prefix = getPrefix();
    const sess = getSession();

    if(!sess){
      actions.innerHTML = `
        <a class="btn btn--ghost" href="${prefix}conta.html#login">Entrar</a>
        <a class="btn btn--primary" href="${prefix}conta.html#cadastro">Criar conta</a>
      `;
      return;
    }

    const initial = (sess.username || 'U').trim().slice(0,1).toUpperCase();
    actions.innerHTML = `
      <div class="userchip" title="${sess.username}">
        <div class="userchip__avatar" aria-hidden="true">${initial}</div>
        <div class="userchip__name">${sess.username}</div>
        <a class="btn btn--ghost" href="${prefix}conta.html">Conta</a>
        <button class="btn btn--primary" type="button" id="btnLogout">Sair</button>
      </div>
    `;
    const b = qs('#btnLogout', actions);
    if(b) b.addEventListener('click', logout);
  }

  async function requireAuthIfNeeded(){
    const required = document.body?.getAttribute('data-auth-required') === 'true';
    if(!required) return;

    // Espera sessão carregar (evita "piscar")
    if(RG_SB_SESSION === null){
      await refreshSession();
    }

    const sess = getSession();
    if(sess) return;

    const prefix = getPrefix();
    const next = getNextParam();
    const url = `${prefix}conta.html?next=${encodeURIComponent(next)}#login`;

    const gate = qs('#forumGate');
    if(gate) gate.hidden = false;

    window.location.replace(url);
  }

  function initAccountPage(){
    if(!location.pathname.endsWith('conta.html')) return;
    if(!sb) return;

    const tabLogin = qs('#tabLogin');
    const tabSignup = qs('#tabSignup');
    const panelLogin = qs('#panelLogin');
    const panelSignup = qs('#panelSignup');

    const applyTab = (which) => {
      const isLogin = which !== 'cadastro';
      if(panelLogin) panelLogin.hidden = !isLogin;
      if(panelSignup) panelSignup.hidden = isLogin;
      if(tabLogin){
        tabLogin.classList.toggle('btn--primary', isLogin);
        tabLogin.classList.toggle('btn--ghost', !isLogin);
        tabLogin.setAttribute('aria-selected', String(isLogin));
      }
      if(tabSignup){
        tabSignup.classList.toggle('btn--primary', !isLogin);
        tabSignup.classList.toggle('btn--ghost', isLogin);
        tabSignup.setAttribute('aria-selected', String(!isLogin));
      }
    };

    const syncFromHash = () => {
      const h = (location.hash || '#login').replace('#','').toLowerCase();
      applyTab(h === 'cadastro' ? 'cadastro' : 'login');
    };

    window.addEventListener('hashchange', syncFromHash);
    syncFromHash();

    const next = new URLSearchParams(location.search).get('next');

    const loginForm = qs('#loginForm');
    const signupForm = qs('#signupForm');
    const loginMsg = qs('#loginMsg');
    const signupMsg = qs('#signupMsg');

    if(loginForm){
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(loginMsg) loginMsg.textContent = '';
        const fd = new FormData(loginForm);

        try{
          const email = String(fd.get('email') || '').trim();
          const password = String(fd.get('password') || '');
          const { error } = await sb.auth.signInWithPassword({ email, password });
          if(error) throw error;

          await refreshSession();
          renderAuthActions();

          window.location.href = next ? next : 'index.html#home';
        }catch(err){
          if(loginMsg) loginMsg.textContent = prettyAuthError(err);
        }
      });
    }

    if(signupForm){
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(signupMsg) signupMsg.textContent = '';
        const fd = new FormData(signupForm);

        const p1 = String(fd.get('password') || '');
        const p2 = String(fd.get('password2') || '');
        if(p1 !== p2){
          if(signupMsg) signupMsg.textContent = 'As senhas não coincidem.';
          return;
        }

        try{
          const username = String(fd.get('username') || '').trim();
          const email = String(fd.get('email') || '').trim();

          const { data, error } = await sb.auth.signUp({
            email,
            password: p1,
            options: { data: { username }, emailRedirectTo: getEmailRedirectTo() }
          });
          if(error) throw error;

          // Se "Confirm email" estiver ligado, normalmente não há sessão imediata.
          if(data?.session){
            await refreshSession();
            renderAuthActions();
            window.location.href = next ? next : 'index.html#home';
            return;
          }

          if(signupMsg){
            signupMsg.textContent = 'Conta criada! Confira seu e-mail para confirmar e depois volte para entrar.';
          }
          // Move para o login (melhor UX)
          window.location.hash = '#login';
        }catch(err){
          if(signupMsg) signupMsg.textContent = prettyAuthError(err);
        }
      });
    }
  }

  // Boot do auth: mantém navbar e páginas privadas sincronizadas com a sessão Supabase
  async function bootAuth(){
    if(!sb){
      renderAuthActions();
      return;
    }

    await refreshSession();
    renderAuthActions();
    await requireAuthIfNeeded();

    // Reage a login/logout em qualquer aba
    sb.auth.onAuthStateChange((_event, session) => {
      RG_SB_SESSION = session || null;
      renderAuthActions();

      const required = document.body?.getAttribute('data-auth-required') === 'true';
      if(required && !getSession()){
        // se deslogar dentro de área privada, manda pro login
        requireAuthIfNeeded();
      }
    });

    initAccountPage();
  }

  bootAuth();

  // ---------- Checklists with localStorage ----------
  const STORAGE_PREFIX = 'rasgado.checklist.';
  qsa('[data-checklist]').forEach(panel => {
    const key = panel.getAttribute('data-checklist');
    const storageKey = STORAGE_PREFIX + key;

    const checks = qsa('[data-check]', panel);
    const fill = qs('[data-progress-fill]', panel);
    const text = qs('[data-progress-text]', panel);

    // load
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      checks.forEach((input, idx) => {
        input.checked = Boolean(saved[idx]);
      });
    } catch (_) {}

    function update() {
      const total = checks.length;
      const done = checks.filter(c => c.checked).length;
      const pct = total ? Math.round((done / total) * 100) : 0;

      if (fill) fill.style.width = pct + '%';
      if (text) text.textContent = `${done}/${total}`;

      try {
        localStorage.setItem(storageKey, JSON.stringify(checks.map(c => c.checked)));
      } catch (_) {}
    }

    checks.forEach(input => input.addEventListener('change', update));
    update();
  });


  // ---------- Item Guide (Começando) ----------
  const ITEM_GUIDE_DATA = {
    ferramentas: {
      label: "Ferramentas",
      items: [
        {
          id: "axe",
          icon: "assets/icons/items/axe.png",
          name: "Machado",
          short: "Madeira, tocos e acesso a áreas novas.",
          meta: "Upgrades no ferreiro (Clint) — 2 dias.",
          blocks: {
            "O que faz": [
              "Corta galhos, árvores e troncos.",
              "Upgrades reduzem golpes e liberam obstáculos maiores."
            ],
            "Como conseguir": [
              "Você já começa com ele.",
              "Upgrades no Ferreiro: cobre → aço → ouro → irídio."
            ],
            "Progressão": [
              "Cobre: corta Tocos Grandes (hardwood).",
              "Aço: corta Troncos Grandes e abre caminho para a Floresta Secreta.",
              "Ouro/Irídio: mesma função, mais rápido (menos golpes)."
            ],
            "Dica rápida": [
              "O Machado de Aço é um “marco”: ele destrava hardwood constante (Floresta Secreta)."
            ]
          }
        },
        {
          id: "pickaxe",
          icon: "assets/icons/items/pickaxe.png",
          name: "Picareta",
          short: "Mineração mais rápida e pedras maiores.",
          meta: "Upgrades no ferreiro (Clint) — 2 dias.",
          blocks: {
            "O que faz": [
              "Quebra pedras e nós de minério.",
              "Upgrades aceleram mineração e liberam obstáculos."
            ],
            "Como conseguir": [
              "Você já começa com ela.",
              "Upgrades no Ferreiro: cobre → aço → ouro → irídio."
            ],
            "Progressão": [
              "Cobre: quebra rochas comuns mais rápido (principalmente no início das Minas).",
              "Aço: necessária para quebrar os Pedregulhos na fazenda.",
              "Ouro/Irídio: mais velocidade — menos tempo parado levando dano."
            ],
            "Dica rápida": [
              "Se seu objetivo é sprinkler e upgrade, priorize Picareta cedo: minério = tudo."
            ]
          }
        },
        {
          id: "watering",
          icon: "assets/icons/items/watering_can.png",
          name: "Regador",
          short: "Regar mais tiles de uma vez (carregando).",
          meta: "Upgrades no ferreiro (Clint) — 2 dias.",
          blocks: {
            "O que faz": [
              "Rega plantações e terra arada.",
              "Segure o botão para carregar e ampliar a área."
            ],
            "Como conseguir": [
              "Você já começa com ele.",
              "Upgrades aumentam alcance e capacidade."
            ],
            "Progressão": [
              "Cobre: linha de 3 tiles.",
              "Aço: linha de 5 tiles.",
              "Ouro: área 3×3 (9 tiles).",
              "Irídio: área 6×3 (18 tiles)."
            ],
            "Dica rápida": [
              "Upgrade de regador rende MUITO no Dia 1 de cada estação (plantio + rega)."
            ]
          }
        },
        {
          id: "hoe",
          icon: "assets/icons/items/hoe.png",
          name: "Enxada",
          short: "Arar em área (ótimo para plantar e caçar artefatos).",
          meta: "Upgrades no ferreiro (Clint) — 2 dias.",
          blocks: {
            "O que faz": [
              "Ara o solo para plantar e pode revelar itens em spots.",
              "Segure o botão para arar em área."
            ],
            "Como conseguir": [
              "Você já começa com ela.",
              "Upgrades seguem cobre → aço → ouro → irídio."
            ],
            "Progressão": [
              "Ouro: área 3×3 (9 tiles).",
              "Irídio: área 6×3 (18 tiles)."
            ],
            "Dica rápida": [
              "Para plantar muita semente rápido, Enxada Ouro/Irídio economiza um dia inteiro."
            ]
          }
        },
        {
          id: "trashcan",
          icon: "assets/sprites_pack/24px-Trash_(item).png",
          name: "Lixeira (inventário)",
          short: "Apaga itens e (se upada) devolve parte do valor.",
          meta: "Upgrades no ferreiro (Clint) — 2 dias.",
          blocks: {
            "O que faz": [
              "Deleta itens do inventário.",
              "Upgrades devolvem % do valor de venda quando você joga fora."
            ],
            "Como conseguir": [
              "Você já começa com ela.",
              "Upgrades no Ferreiro com barras e ouro."
            ],
            "Progressão": [
              "Cobre: devolve 15% do valor ao deletar.",
              "Aço: 30%.",
              "Ouro: 45%.",
              "Irídio: 60%."
            ],
            "Dica rápida": [
              "Quando você minera/forrageia pesado, lixeira upada vira ‘seguro’ contra inventário lotado."
            ]
          }
        }
      ]
    },

    mochila: {
      label: "Mochila",
      items: [
        {
          id: "pack24",
          icon: "assets/icons/items/backpack_24.png",
          name: "Mochila Grande (24 slots)",
          short: "Segunda fileira do inventário.",
          meta: "Compra na loja do Pierre.",
          blocks: {
            "O que faz": [
              "Aumenta seu inventário em +12 slots (total 24)."
            ],
            "Como conseguir": [
              "Comprar no Pierre por 2.000g (disponível desde o início)."
            ],
            "Progressão": [
              "Depois dela, você pode comprar a Mochila Deluxe (36)."
            ],
            "Dica rápida": [
              "Primeira compra que “não parece”, mas muda o jogo: menos idas e voltas, mais progresso."
            ]
          }
        },
        {
          id: "pack36",
          icon: "assets/icons/items/backpack_36.png",
          name: "Mochila Deluxe (36 slots)",
          short: "Terceira fileira do inventário.",
          meta: "Compra na loja do Pierre (após a de 24).",
          blocks: {
            "O que faz": [
              "Aumenta seu inventário em +12 slots (total 36)."
            ],
            "Como conseguir": [
              "Comprar no Pierre por 10.000g (depois de comprar a Mochila Grande)."
            ],
            "Progressão": [
              "Inventário maior = mineração/pesca/quests sem parar toda hora."
            ],
            "Dica rápida": [
              "Organize por ‘linha’: topo = ferramentas/comida; baixo = loot para vender/guardar."
            ]
          }
        }
      ]
    },

    pesca: {
      label: "Pesca",
      items: [
        {
          id: "training",
          icon: "assets/icons/items/rod_training.png",
          name: "Vara de Treino",
          short: "Facilita a pesca no começo (barra maior).",
          meta: "Boa para aprender e upar o nível.",
          blocks: {
            "O que faz": [
              "Ajusta a barra verde como se você tivesse nível 5 (se estiver abaixo).",
              "A barra de progresso desce mais devagar (mais margem de erro)."
            ],
            "Como conseguir": [
              "Comprar na peixaria do Willy (barata)."
            ],
            "Progressão": [
              "Não aceita isca nem anzol (tackle).",
              "Quando estiver confortável, migre para Fibra de Vidro (isca) e depois Irídio (isca + anzol)."
            ],
            "Dica rápida": [
              "Treino não é vergonha: é otimização. Menos frustração = mais XP = pesca fica fácil rápido."
            ]
          }
        },
        {
          id: "fiberglass",
          icon: "assets/icons/items/rod_fiberglass.png",
          name: "Vara de Fibra de Vidro",
          short: "Permite isca (pega mais rápido).",
          meta: "Desbloqueia no Nível 2 de Pesca.",
          blocks: {
            "O que faz": [
              "Permite usar isca (bait).",
              "Não permite usar anzol (tackle)."
            ],
            "Como conseguir": [
              "Comprar no Willy por 1.800g ao alcançar Pesca nível 2."
            ],
            "Progressão": [
              "Próximo salto é a Vara de Irídio (isca + anzol)."
            ],
            "Dica rápida": [
              "Isca acelera captura e XP/hora. É um upgrade silencioso, mas forte."
            ]
          }
        },
        {
          id: "iridiumrod",
          icon: "assets/icons/items/rod_iridium.png",
          name: "Vara de Irídio",
          short: "Permite isca e anzol (tackle).",
          meta: "Desbloqueia no Nível 6 de Pesca.",
          blocks: {
            "O que faz": [
              "Permite usar isca e anzol (tackle).",
              "Os anzóis resolvem problemas específicos (peixe rápido, barra instável, etc.)."
            ],
            "Como conseguir": [
              "Comprar no Willy por 7.500g ao alcançar Pesca nível 6."
            ],
            "Progressão": [
              "A vara não aumenta a barra verde por si só; o nível de pesca é o que ajuda — os acessórios é que mudam o jogo."
            ],
            "Dica rápida": [
              "Se algum peixe te humilha, não é ódio pessoal: é falta de tackle certo."
            ]
          }
        }
      ]
    },

    automacao: {
      label: "Automação",
      items: [
        {
          id: "sprinkler",
          icon: "assets/sprites_pack/24px-Sprinkler.png",
          name: "Sprinkler (básico)",
          short: "Rega 4 tiles em cruz (↑ ↓ ← →).",
          meta: "Desbloqueia no Nível 2 de Agricultura.",
          blocks: {
            "O que faz": [
              "Rega 4 tiles adjacentes toda manhã (somente terra arada)."
            ],
            "Como conseguir": [
              "Craft (Agricultura nível 2)."
            ],
            "Progressão": [
              "Qualidade: 8 tiles (3×3 sem o centro).",
              "Irídio: 24 tiles (5×5 sem o centro)."
            ],
            "Dica rápida": [
              "O básico é ‘meio estranho’, mas já libera você de regar canteiros pequenos."
            ]
          }
        },
        {
          id: "quality",
          icon: "assets/sprites_pack/24px-Quality_Sprinkler.png",
          name: "Sprinkler de Qualidade",
          short: "Rega 8 tiles ao redor (3×3).",
          meta: "Desbloqueia no Nível 6 de Agricultura.",
          blocks: {
            "O que faz": [
              "Rega 8 tiles adjacentes toda manhã (3×3 sem o centro)."
            ],
            "Como conseguir": [
              "Craft (Agricultura nível 6).",
              "Também pode vir de bundle do Centro Comunitário (dependendo do setup)."
            ],
            "Progressão": [
              "É o primeiro sprinkler ‘de verdade’ para plantação séria."
            ],
            "Dica rápida": [
              "Faça layouts 3×3 repetidos: expande rápido e sem dor."
            ]
          }
        },
        {
          id: "iridium",
          icon: "assets/sprites_pack/24px-Iridium_Sprinkler.png",
          name: "Sprinkler de Irídio",
          short: "Rega 24 tiles (5×5).",
          meta: "Desbloqueia no Nível 9 de Agricultura.",
          blocks: {
            "O que faz": [
              "Rega 24 tiles adjacentes toda manhã (5×5 sem o centro)."
            ],
            "Como conseguir": [
              "Craft (Agricultura nível 9)."
            ],
            "Progressão": [
              "Automação pesada: a partir daqui, regador vira quase opcional na fazenda."
            ],
            "Dica rápida": [
              "Layout 5×5 é o padrão ouro para estufa e roças grandes."
            ]
          }
        },
        {
          id: "scarecrow",
          icon: "assets/icons/items/scarecrow.png",
          name: "Espantalho",
          short: "Protege plantações contra corvos (raio ~8).",
          meta: "Desbloqueia no Nível 1 de Agricultura.",
          blocks: {
            "O que faz": [
              "Impede corvos de comerem sua plantação dentro do alcance."
            ],
            "Como conseguir": [
              "Craft (Agricultura nível 1)."
            ],
            "Progressão": [
              "Espantalho de Luxo dobra o raio para 16 (muito mais cobertura)."
            ],
            "Dica rápida": [
              "Coloque antes de plantar muito. Um corvo não arruina só dinheiro — arruina seu tempo."
            ]
          }
        },
        {
          id: "deluxe",
          icon: "assets/icons/items/scarecrow_deluxe.png",
          name: "Espantalho de Luxo",
          short: "Raio 16 (o dobro do normal).",
          meta: "Receita após coleção completa de raros (Rarecrows).",
          blocks: {
            "O que faz": [
              "Mesma função do espantalho, mas com raio 16 (cobre um mundinho)."
            ],
            "Como conseguir": [
              "Requer obter todos os 8 Rarecrows; depois a receita chega por carta (eventualmente)."
            ],
            "Progressão": [
              "Ideal para roças grandes e para reduzir ‘poluição visual’ de muitos espantalhos."
            ],
            "Dica rápida": [
              "Trocar vários espantalhos normais por 1 Deluxe deixa a fazenda mais bonita e limpa."
            ]
          }
        }
      ]
    },

    combate: {
      label: "Combate",
      items: [
        {
          id: "sword",
          icon: "assets/icons/items/sword.png",
          name: "Espadas",
          short: "Ataque em arco + bloqueio no especial.",
          meta: "Equilíbrio: alcance + controle.",
          blocks: {
            "O que faz": [
              "Ataca em arco (pega mais de um inimigo).",
              "Ataque especial: postura de bloqueio (reduz/nega dano e empurra inimigos)."
            ],
            "Como conseguir": [
              "Você encontra nas Minas, compra na Guilda (depois de desbloquear) ou em eventos/loot."
            ],
            "Progressão": [
              "No começo: foque em dano e velocidade.",
              "No meio: efeitos extras (defesa, velocidade, crit) viram diferencial."
            ],
            "Dica rápida": [
              "Se você apanha muito, aprenda o bloqueio: ele é ‘modo adulto’ de sobreviver."
            ]
          }
        },
        {
          id: "dagger",
          icon: "assets/icons/items/dagger.png",
          name: "Adagas",
          short: "Rápidas, críticas altas, alcance curto.",
          meta: "Boa para ‘burst’ e inimigos isolados.",
          blocks: {
            "O que faz": [
              "Ataques rápidos e diretos na frente.",
              "Ataque especial: sequência de estocadas."
            ],
            "Como conseguir": [
              "Drop/baús nas Minas e loot; algumas vendidas na Guilda."
            ],
            "Progressão": [
              "Crit chance/power importam mais aqui.",
              "Se tiver dificuldade com posicionamento, espada costuma ser mais segura."
            ],
            "Dica rápida": [
              "Adaga brilha quando você aprende a ‘colar e sair’ — bate, reposiciona, repete."
            ]
          }
        },
        {
          id: "club",
          icon: "assets/icons/items/club.png",
          name: "Clavas/Porretes",
          short: "Dano alto, mais lentas, muito knockback.",
          meta: "Boa para controle de grupo (quando você domina timing).",
          blocks: {
            "O que faz": [
              "Ataque mais lento e pesado.",
              "Ataque especial: golpe forte com empurrão/controle."
            ],
            "Como conseguir": [
              "Drop/baús nas Minas e loot; algumas vendidas na Guilda."
            ],
            "Progressão": [
              "Funciona melhor com itens que aumentam velocidade/controle.",
              "Em espaços apertados, o timing decide a luta."
            ],
            "Dica rápida": [
              "Se errar o tempo, você toma dano. Se acertar, o inimigo nem encosta em você."
            ]
          }
        },
        {
          id: "boots",
          icon: "assets/sprites_pack/24px-Leather_Boots.png",
          name: "Botas",
          short: "Defesa e imunidade (menos debuffs).",
          meta: "Sobrevivência invisível.",
          blocks: {
            "O que faz": [
              "Aumenta defesa e, em muitas botas, a estatística de Imunidade."
            ],
            "Como conseguir": [
              "Baús nas Minas, loot e compras na Guilda."
            ],
            "Progressão": [
              "Defesa reduz dano tomado; imunidade reduz chance de sofrer debuffs (lento, fraqueza, etc.)."
            ],
            "Dica rápida": [
              "Quando o jogo te ‘nerfa’ com debuff, você perde tempo e apanha mais. Botas boas evitam isso."
            ]
          }
        },
        {
          id: "immunity",
          icon: "assets/icons/items/shield.png",
          name: "Imunidade (stat)",
          short: "Chance menor de pegar debuffs.",
          meta: "Quanto mais, menos status negativo.",
          blocks: {
            "O que faz": [
              "Reduz a chance de você ser afetado por qualquer debuff."
            ],
            "Como conseguir": [
              "Vem em botas, anéis e alguns equipamentos."
            ],
            "Progressão": [
              "Não aumenta invencibilidade após dano; é sobre evitar status negativos."
            ],
            "Dica rápida": [
              "Se você odeia ficar lento ou ‘amaldiçoado’, procure imunidade."
            ]
          }
        }
      ]
    }
  };

  function isAssetIcon(value){
    return typeof value === "string" && /\.(png|gif|webp|svg)$/i.test(value);
  }

  function makeIconEl(value, cls, alt=""){
    if (isAssetIcon(value)){
      const img = document.createElement('img');
      img.src = value;
      img.alt = alt;
      img.className = cls;
      img.loading = "lazy";
      return img;
    }
    const span = document.createElement('span');
    span.className = cls;
    span.textContent = value || "•";
    return span;
  }

  function initItemGuide(){
    const root = qs('[data-item-guide]');
    if (!root) return;

    const tabsEl = qs('.itemGuide__tabs', root);
    const gridEl = qs('.itemGuide__grid', root);
    const detailEl = qs('.itemGuide__detail', root);

    const keys = Object.keys(ITEM_GUIDE_DATA);
    if (!tabsEl || !gridEl || !detailEl || !keys.length) return;

    const state = { cat: keys[0], item: null };

    const setCat = (key) => {
      state.cat = key;
      const items = ITEM_GUIDE_DATA[key]?.items || [];
      state.item = items.length ? items[0].id : null;
      render();
    };

    const setItem = (id) => {
      state.item = id;
      render();
    };

    const renderTabs = () => {
      tabsEl.innerHTML = "";
      keys.forEach((key) => {
        const btn = document.createElement('button');
        btn.type = "button";
        btn.className = "itemGuide__tab";
        btn.textContent = ITEM_GUIDE_DATA[key].label;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', String(state.cat === key));
        btn.addEventListener('click', () => setCat(key));
        tabsEl.appendChild(btn);
      });
    };

    const renderGrid = () => {
      gridEl.innerHTML = "";
      const items = ITEM_GUIDE_DATA[state.cat]?.items || [];

      items.forEach((it) => {
        const btn = document.createElement('button');
        btn.type = "button";
        btn.className = "itemCard" + (state.item === it.id ? " is-active" : "");
        btn.setAttribute('aria-label', it.name);
        btn.addEventListener('click', () => setItem(it.id));

        const top = document.createElement('div');
        top.className = "itemCard__top";

        const title = document.createElement('h4');
        title.className = "itemCard__title";
        title.textContent = it.name;

        const icon = makeIconEl(it.icon, "itemCard__iconImg", it.name);

        top.appendChild(title);
        top.appendChild(icon);

        const short = document.createElement('p');
        short.className = "itemCard__short";
        short.textContent = it.short || "";

        btn.appendChild(top);
        btn.appendChild(short);

        gridEl.appendChild(btn);
      });
    };

    const renderDetail = () => {
      const items = ITEM_GUIDE_DATA[state.cat]?.items || [];
      const it = items.find(x => x.id === state.item) || items[0];

      if (!it){
        detailEl.innerHTML = '<div class="itemGuide__empty"><h4>Nenhum item</h4><p>Esta categoria ainda não tem itens cadastrados.</p></div>';
        return;
      }

      const wrap = document.createElement('div');

      const h = document.createElement('h4');
      h.className = "itemDetail__title";
      h.innerHTML = "";
      h.appendChild(makeIconEl(it.icon, "itemDetail__icon", it.name));
      h.appendChild(document.createTextNode(" " + it.name));
      wrap.appendChild(h);

      const meta = document.createElement('p');
      meta.className = "itemDetail__meta";
      meta.textContent = it.meta || "";
      wrap.appendChild(meta);

      const blocks = it.blocks || {};
      Object.keys(blocks).forEach((k) => {
        const sec = document.createElement('div');
        sec.className = "itemDetail__block";

        const kk = document.createElement('p');
        kk.className = "itemDetail__k";
        kk.textContent = k;
        sec.appendChild(kk);

        const vv = document.createElement('div');
        vv.className = "itemDetail__v";

        const arr = blocks[k] || [];
        if (arr.length > 1) {
          const ul = document.createElement('ul');
          arr.forEach((line) => {
            const li = document.createElement('li');
            li.textContent = line;
            ul.appendChild(li);
          });
          vv.appendChild(ul);
        } else {
          const p = document.createElement('p');
          p.textContent = arr[0] || "";
          vv.appendChild(p);
        }

        sec.appendChild(vv);
        wrap.appendChild(sec);
      });

      detailEl.innerHTML = "";
      detailEl.appendChild(wrap);
    };

    const render = () => {
      renderTabs();
      renderGrid();
      renderDetail();
    };

    // init
    setCat(keys[0]);
  }

  function initToolGuide(){
    const root = qs('[data-tool-guide]');
    if (!root) return;

    const tabsEl = qs('.toolGuide__tabs', root);
    const tiersEl = qs('.toolGuide__tiers', root);
    const detailEl = qs('.toolGuide__detail', root);

    const keys = Object.keys(TOOL_QUALITY_DATA);
    if (!tabsEl || !tiersEl || !detailEl || !keys.length) return;

    const state = { tool: keys[0], tier: null };

    const setTool = (key) => {
      state.tool = key;
      const tiers = TOOL_QUALITY_DATA[key]?.tiers || [];
      state.tier = tiers.length ? tiers[0].id : null;
      render();
    };

    const setTier = (id) => {
      state.tier = id;
      render();
    };

    const renderTabs = () => {
      tabsEl.innerHTML = "";
      keys.forEach((key) => {
        const t = TOOL_QUALITY_DATA[key];
        const btn = document.createElement('button');
        btn.type = "button";
        btn.className = "toolGuide__tab" + (state.tool === key ? " is-active" : "");
        btn.setAttribute('role','tab');
        btn.setAttribute('aria-selected', String(state.tool === key));

        const icon = makeIconEl(t.icon, "toolGuide__tabIcon", t.label);
        const text = document.createElement('span');
        text.textContent = t.label;

        btn.appendChild(icon);
        btn.appendChild(text);

        btn.addEventListener('click', () => setTool(key));
        tabsEl.appendChild(btn);
      });
    };

    const statRowEl = (label, value, max, suffix="") => {
      const row = document.createElement('div');
      row.className = "statRow";

      const lab = document.createElement('span');
      lab.className = "statRow__label";
      lab.textContent = label;

      const bar = document.createElement('div');
      bar.className = "statBar";
      const fill = document.createElement('div');
      fill.className = "statBar__fill";
      const pct = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
      fill.style.width = pct + "%";
      bar.appendChild(fill);

      const val = document.createElement('span');
      val.className = "statRow__value";
      val.textContent = `${value}${suffix}`;

      row.appendChild(lab);
      row.appendChild(bar);
      row.appendChild(val);
      return row;
    };

    const renderTiers = () => {
      tiersEl.innerHTML = "";
      const tool = TOOL_QUALITY_DATA[state.tool];
      if (!tool) return;

      tool.tiers.forEach((tier) => {
        const btn = document.createElement('button');
        btn.type = "button";
        btn.className = "toolTier" + (state.tier === tier.id ? " is-active" : "");
        btn.addEventListener('click', () => setTier(tier.id));

        const left = document.createElement('div');
        left.className = "toolTier__left";

        const mat = makeIconEl(tier.matIcon, "toolTier__mat", tier.label);
        const title = document.createElement('div');
        title.className = "toolTier__title";
        title.innerHTML = `<strong>${tier.label}</strong>`;

        left.appendChild(mat);
        left.appendChild(title);

        const bars = document.createElement('div');
        bars.className = "toolTier__bars";

        (tool.stats || []).forEach((s) => {
          const v = Number(tier.stats?.[s.key] ?? 0);
          bars.appendChild(statRowEl(s.label, v, s.max, s.suffix || ""));
        });

        const notes = document.createElement('div');
        notes.className = "toolTier__notes";
        const n = tier.notes || [];
        notes.textContent = n.length ? n.join(" · ") : "";

        btn.appendChild(left);
        btn.appendChild(bars);
        btn.appendChild(notes);

        tiersEl.appendChild(btn);
      });
    };

    const renderDetail = () => {
      const tool = TOOL_QUALITY_DATA[state.tool];
      const tier = (tool?.tiers || []).find(t => t.id === state.tier) || (tool?.tiers || [])[0];
      if (!tool || !tier){
        detailEl.innerHTML = '<div class="toolGuide__empty"><h4>Nada aqui ainda</h4><p>Esta ferramenta ainda não tem dados.</p></div>';
        return;
      }

      const wrap = document.createElement('div');

      const h = document.createElement('h4');
      h.className = "toolDetail__title";
      h.appendChild(makeIconEl(tool.icon, "toolDetail__icon", tool.label));
      h.appendChild(document.createTextNode(" " + tool.label));
      wrap.appendChild(h);

      const sub = document.createElement('p');
      sub.className = "toolDetail__meta";
      sub.innerHTML = `Upgrade selecionado: <strong>${tier.label}</strong>`;
      wrap.appendChild(sub);

      const statBox = document.createElement('div');
      statBox.className = "toolDetail__stats";
      (tool.stats || []).forEach((s) => {
        const v = Number(tier.stats?.[s.key] ?? 0);
        statBox.appendChild(statRowEl(s.label, v, s.max, s.suffix || ""));
      });
      wrap.appendChild(statBox);

      const noteBox = document.createElement('div');
      noteBox.className = "toolDetail__notes";
      const p = document.createElement('p');
      p.className = "toolDetail__k";
      p.textContent = "O que muda";
      noteBox.appendChild(p);

      const vv = document.createElement('div');
      vv.className = "toolDetail__v";
      const ul = document.createElement('ul');
      (tier.notes || []).forEach((line) => {
        const li = document.createElement('li');
        li.textContent = line;
        ul.appendChild(li);
      });
      vv.appendChild(ul);
      noteBox.appendChild(vv);
      wrap.appendChild(noteBox);

      detailEl.innerHTML = "";
      detailEl.appendChild(wrap);
    };

    const render = () => {
      renderTabs();
      renderTiers();
      renderDetail();
    };

    setTool(keys[0]);
  }




  // init guides
  function initForum(){
    const app = document.querySelector('[data-forum]');
    if(!app) return;

    const game = app.getAttribute('data-forum-game') || 'stardew';
    const gate = document.getElementById('forumGate');

    const prefix = (window.RG_ASSET_PREFIX || '');

    // Fallback visual: se por algum motivo o redirect não aconteceu,
    // a gate aparece para visitantes sem sessão.
    if(gate){
      const authed = Boolean(getSession());
      gate.hidden = authed;
      document.body.style.overflow = authed ? '' : 'hidden';
    }

    // ---- Data (demo) ----
    const DATA = {
      stardew: {
        name: 'Stardew Valley',
        categories: [
          {id:'comecando', title:'Começando', desc:'Primeiros dias, energia, ferramentas e dinheiro rápido (sem mito).', icon:'assets/icons/games/stardew.gif'},
          {id:'fazenda', title:'Fazenda & Plantio', desc:'Colheitas, estufas, sprinklers, animais e layouts.', icon:'assets/icons/games/stardew.gif'},
          {id:'minas', title:'Minas & Combate', desc:'Andares, builds, armas, anéis e estratégias.', icon:'assets/icons/games/stardew.gif'},
          {id:'amizades', title:'Vila & Relacionamentos', desc:'Presentes, eventos, casamentos e lore.', icon:'assets/icons/games/stardew.gif'},
          {id:'mods', title:'Mods & Ferramentas', desc:'SMAPI, compatibilidade e sugestões (com pé no chão).', icon:'assets/icons/games/stardew.gif'},
          {id:'tech', title:'Ajuda Técnica', desc:'Crash, desempenho, saves e problemas de mod.', icon:'assets/icons/games/stardew.gif'},
          {id:'off', title:'Off-topic', desc:'Memes, papo solto e “o que você jogou ontem?”.', icon:'assets/icons/games/stardew.gif'}
        ],
        topics: [
          {id:'t1', cat:'comecando', title:'Guia do primeiro mês: metas simples que funcionam', excerpt:'Foco em rotina, upgrades e dinheiro sem grind absurdo.', tag:'Guia', replies:34, views:1840, last:{user:'Leah', when:'hoje'}},
          {id:'t2', cat:'fazenda', title:'Layout de estufa (aspersores + caminho) para 1.6', excerpt:'Ideias de organização e por que “bonito” pode ser eficiente.', tag:'Fazenda', replies:19, views:920, last:{user:'Robin', when:'ontem'}},
          {id:'t3', cat:'minas', title:'Mina 40: por que eu sempre morro aqui?', excerpt:'Comidas, botas e como não virar sashimi de slime.', tag:'Combate', replies:12, views:600, last:{user:'Maru', when:'2 dias'}},
          {id:'t4', cat:'mods', title:'Lista de mods “seguro para iniciante” (sem quebrar save)', excerpt:'Compatibilidade, ordem de load e armadilhas clássicas.', tag:'Mods', replies:41, views:2100, last:{user:'Sebastian', when:'3 dias'}},
          {id:'t5', cat:'tech', title:'Jogo travando ao carregar save: checklist rápido', excerpt:'Passo a passo pra diagnosticar sem desespero.', tag:'Tech', replies:8, views:430, last:{user:'Linus', when:'1 semana'}},
          {id:'t6', cat:'amizades', title:'Presentes favoritos vs “presente universal”: vale?', excerpt:'Eficiência social e onde dá pra economizar tempo.', tag:'Social', replies:16, views:770, last:{user:'Emily', when:'1 semana'}},
        ],
        posts: {
          t1: [
            {author:'Leah', role:'Membro', when:'hoje 10:12', body:'Plano simples: **upgrade de regador**, plantar o que dá lucro *sem estourar energia* e juntar recurso pra 2 sprinklers. Se quiser, eu posto uma checklist.'},
            {author:'Elvis', role:'Criador', when:'hoje 10:28', body:'Quero algo bem “pé no chão”, sem papo de speedrun. Dá pra colocar também o que NÃO fazer (tipo gastar tudo em semente no dia 1)?'},
            {author:'Robin', role:'Membro', when:'hoje 10:40', body:'Sim! Eu faria uma seção “armadilhas”: vender madeira cedo, ignorar mochila, etc.'}
          ],
          t2: [
            {author:'Robin', role:'Membro', when:'ontem 21:10', body:'Eu gosto de deixar um corredor central e evitar planta que bloqueia. O layout “limpo” ajuda a colheita.'},
            {author:'Maru', role:'Membro', when:'ontem 21:22', body:'Se você usa sprinklers iridium, dá pra padronizar em blocos de 5x5 e sobra espaço pra decoração.'}
          ]
        }
      },
      haunted: {
        name: 'Haunted Chocolatier',
        categories: [
          {id:'dev', title:'Dev blog & notícias', desc:'Posts oficiais organizados e discutidos com calma.', icon:'assets/icons/games/haunted.gif'},
          {id:'teorias', title:'Teorias & lore', desc:'Hipóteses divertidas — mas marcadas como hipótese.', icon:'assets/icons/games/haunted.gif'},
          {id:'arte', title:'Arte & referências', desc:'Screens, UI, vibe e direção de arte (sem copiar).', icon:'assets/icons/games/haunted.gif'},
          {id:'sugestoes', title:'Sugestões', desc:'Ideias e melhorias (sem spam).', icon:'assets/icons/games/haunted.gif'},
          {id:'tech', title:'Ajuda técnica', desc:'Config, bugs do site, login e conta.', icon:'assets/icons/games/haunted.gif'},
          {id:'off', title:'Off-topic', desc:'Assuntos aleatórios (mas civilizados).', icon:'assets/icons/games/haunted.gif'}
        ],
        topics: [
          {id:'h1', cat:'dev', title:'Onde estamos agora: o que dá pra afirmar com segurança?', excerpt:'Sem datas mágicas — só fatos e links oficiais.', tag:'Dev', replies:22, views:1440, last:{user:'Mak', when:'hoje'}},
          {id:'h2', cat:'dev', title:'Combate: escudos, leitura e “stun”', excerpt:'O que isso sugere sobre ritmo e build?', tag:'Combate', replies:9, views:510, last:{user:'Elvis', when:'3 dias'}},
          {id:'h3', cat:'arte', title:'Paleta “chocolate”: como manter aconchego sem ficar escuro', excerpt:'Referências tipo “mundo de chocolate” e contraste pra legibilidade.', tag:'UI', replies:14, views:780, last:{user:'Marnie', when:'1 semana'}},
          {id:'h4', cat:'teorias', title:'Fantasma é NPC fixo ou sistema dinâmico?', excerpt:'Hipóteses, contradições e o que já foi mostrado.', tag:'Teoria', replies:27, views:1600, last:{user:'Linus', when:'2 semanas'}},
        ],
        posts: {
          h1: [
            {author:'Mak', role:'Moderador', when:'hoje 09:50', body:'Lista do que é **confirmado** vs o que é só interpretação. Vamos manter isso atualizado com links.'},
            {author:'Elvis', role:'Criador', when:'hoje 10:03', body:'Perfeito. Eu quero que o fórum tenha um botão de “expandir” pra cada update e não confundir quem chega.'}
          ],
          h2: [
            {author:'Elvis', role:'Criador', when:'3 dias 22:10', body:'Se tiver leitura de ataque, dá pra imaginar builds defensivas e timing. Isso muda o feeling total.'},
            {author:'Marnie', role:'Membro', when:'3 dias 22:35', body:'Concordo. E escudo sugere que o posicionamento vai importar mais.'}
          ]
        }
      }
    };

    // ---- Rendering ----
    const state = { view:'categories', cat:null, topic:null, q:'', sort:'recent' };

    const crumbs = document.getElementById('forumCrumbs');
    const search = document.getElementById('forumSearch');
    const sortSel = document.getElementById('forumSort');
    const btnNew = document.getElementById('btnNewTopic');

    if(search){
      search.addEventListener('input', () => {
        state.q = (search.value || '').trim().toLowerCase();
        renderFromHash();
      });
    }
    if(sortSel){
      sortSel.addEventListener('change', () => {
        state.sort = sortSel.value;
        renderFromHash();
      });
    }
    if(btnNew){
      btnNew.addEventListener('click', () => {
        // Se estiver trancado, a gate já está por cima. Aqui é só segurança.
        location.hash = '#/novo';
      });
    }

    function setCrumbs(parts){
      if(!crumbs) return;
      const html = parts.map((p, i) => {
        if(p.href) return `<a href="${p.href}">${escapeHtml(p.label)}</a>`;
        return `<span>${escapeHtml(p.label)}</span>`;
      }).join('<span class="sep">›</span>');
      crumbs.innerHTML = html;
    }

    function escapeHtml(str){
      return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
    }

    function getForum(){
      return DATA[game] || DATA.stardew;
    }

    function formatLast(last){
      if(!last) return '—';
      return `por <strong>${escapeHtml(last.user)}</strong> • ${escapeHtml(last.when)}`;
    }

    function countPostsForCat(forum, catId){
      const topicIds = forum.topics.filter(t => t.cat === catId).map(t => t.id);
      let posts = 0;
      topicIds.forEach(id => {
        posts += (forum.posts[id]?.length || 1);
      });
      return posts;
    }

    function sortTopics(list){
      const arr = [...list];
      if(state.sort === 'replies') arr.sort((a,b) => (b.replies||0)-(a.replies||0));
      else if(state.sort === 'views') arr.sort((a,b) => (b.views||0)-(a.views||0));
      else arr.sort((a,b) => (b.views||0)-(a.views||0)); // "recent" em demo usa views como proxy
      return arr;
    }

    function renderCategories(){
      const forum = getForum();
      setCrumbs([{label:'Categorias', href:'#/categorias'}]);

      const rows = forum.categories.map(cat => {
        const topicsCount = forum.topics.filter(t => t.cat === cat.id).length;
        const postsCount = countPostsForCat(forum, cat.id);
        const lastTopic = forum.topics.filter(t=>t.cat===cat.id)[0];
        return `
          <div class="forum-row forum-row--clickable" data-go="#/c/${cat.id}" role="button" tabindex="0" aria-label="Abrir ${escapeHtml(cat.title)}">
            <div class="forum-row__title">
              <div class="forum-icon"><img src="${prefix}${cat.icon}" alt=""></div>
              <div style="min-width:0;">
                <h4>${escapeHtml(cat.title)}</h4>
                <p>${escapeHtml(cat.desc)}</p>
              </div>
            </div>
            <div class="forum-meta"><strong>${topicsCount}</strong><br/>tópicos</div>
            <div class="forum-meta"><strong>${postsCount}</strong><br/>posts</div>
            <div class="forum-row__last">${formatLast(lastTopic?.last)}</div>
          </div>
        `;
      }).join('');

      app.innerHTML = `
        <div class="forum-table">
          ${rows}
        </div>
      `;

      wireGo();
    }

    function renderTopics(catId){
      const forum = getForum();
      const cat = forum.categories.find(c => c.id === catId);
      if(!cat) return renderCategories();

      const baseList = forum.topics.filter(t => t.cat === catId);

      let list = baseList;
      if(state.q){
        list = list.filter(t => (t.title||'').toLowerCase().includes(state.q) || (t.excerpt||'').toLowerCase().includes(state.q) || (t.tag||'').toLowerCase().includes(state.q));
      }
      list = sortTopics(list);

      setCrumbs([
        {label:'Categorias', href:'#/categorias'},
        {label: cat.title, href:`#/c/${cat.id}`}
      ]);

      const rows = list.map(t => `
        <div class="forum-row forum-row--clickable" data-go="#/t/${t.id}" role="button" tabindex="0" aria-label="Abrir tópico ${escapeHtml(t.title)}">
          <div class="forum-row__title">
            <div class="forum-icon"><img src="${prefix}${forum.categories.find(c=>c.id===t.cat)?.icon || forum.categories[0].icon}" alt=""></div>
            <div style="min-width:0;">
              <h4>${escapeHtml(t.title)} <span class="badge">${escapeHtml(t.tag||'') || 'Tópico'}</span></h4>
              <p>${escapeHtml(t.excerpt || '')}</p>
            </div>
          </div>
          <div class="forum-meta"><strong>${t.replies}</strong><br/>respostas</div>
          <div class="forum-meta"><strong>${t.views}</strong><br/>visitas</div>
          <div class="forum-row__last">${formatLast(t.last)}</div>
        </div>
      `).join('') || `
        <div class="forum-row">
          <div class="forum-row__title">
            <div>
              <h4>Nenhum tópico encontrado</h4>
              <p>Tente outro termo de busca.</p>
            </div>
          </div>
          <div class="forum-meta">—</div>
          <div class="forum-meta">—</div>
          <div class="forum-row__last">—</div>
        </div>
      `;

      app.innerHTML = `
        <div class="forum-table">
          ${rows}
        </div>
      `;

      wireGo();
    }

    function renderThread(topicId){
      const forum = getForum();
      const t = forum.topics.find(x => x.id === topicId);
      if(!t) return renderCategories();
      const cat = forum.categories.find(c => c.id === t.cat);

      setCrumbs([
        {label:'Categorias', href:'#/categorias'},
        {label: cat?.title || 'Categoria', href:`#/c/${t.cat}`},
        {label: t.title}
      ]);

      const posts = (forum.posts[topicId] || []).map(p => `
        <article class="post">
          <div class="post__head">
            <div class="post__author">
              <div class="avatar">${escapeHtml((p.author||'?')[0] || '?')}</div>
              <div>
                <strong>${escapeHtml(p.author || 'Usuário')}</strong>
                <div class="post__meta">${escapeHtml(p.role || 'Membro')} • ${escapeHtml(p.when || '')}</div>
              </div>
            </div>
            <span class="badge">${escapeHtml(t.tag || 'Tópico')}</span>
          </div>
          <div class="post__body">${formatBody(p.body || '')}</div>
        </article>
      `).join('');

      app.innerHTML = `
        <div class="thread">
          <div class="card">
            <h3 class="card__title">${escapeHtml(t.title)}</h3>
            <p class="card__text">${escapeHtml(t.excerpt || '')}</p>
          </div>

          ${posts || ''}

          <div class="editor">
            <strong>Responder</strong>
            <textarea id="replyText" placeholder="Escreva sua resposta... (suporta texto simples)"></textarea>
            <div class="editor__bar">
              <button class="btn btn--ghost" type="button" id="btnEmoji">😀 Emojis</button>
              <button class="btn btn--primary" type="button" id="btnReply">Enviar</button>
            </div>
            <div class="emoji-panel" id="emojiPanel">
              <div class="emoji-grid" id="emojiGrid"></div>
            </div>
            <p class="meta" id="replyHint" style="margin-top:10px;"></p>
          </div>
        </div>
      `;

      const replyHint = document.getElementById('replyHint');
      if(replyHint){
        replyHint.textContent = isAuthed()
          ? 'Envio é demo (sem back-end). O layout está pronto; o sistema de conta vem depois.'
          : 'Área de membros: entre para responder.';
      }

      // Emoji picker
      const btnEmoji = document.getElementById('btnEmoji');
      const panel = document.getElementById('emojiPanel');
      if(btnEmoji && panel){
        btnEmoji.addEventListener('click', () => panel.classList.toggle('is-open'));
      }

      const grid = document.getElementById('emojiGrid');
      const textarea = document.getElementById('replyText');

      loadEmojiManifest(prefix).then(list => {
        if(!grid || !textarea) return;
        grid.innerHTML = list.slice(0, 36).map(e => `
          <button class="emoji-btn" type="button" data-emoji=":${escapeHtml(e.id)}:" title="${escapeHtml(e.label)}">
            <img src="${prefix}${escapeHtml(e.file)}" alt="">
          </button>
        `).join('');
        grid.addEventListener('click', (ev) => {
          const btn = ev.target.closest('[data-emoji]');
          if(!btn) return;
          textarea.value += ' ' + btn.getAttribute('data-emoji') + ' ';
          textarea.focus();
        });
      });

      const btnReply = document.getElementById('btnReply');
      if(btnReply){
        btnReply.addEventListener('click', () => {
          if(!isAuthed()){
            if(gate){ gate.hidden = false; }
            return;
          }
          alert('Demo: resposta enviada (não salva).');
        });
      }
    }

    function renderNewTopic(){
      const forum = getForum();
      setCrumbs([{label:'Categorias', href:'#/categorias'},{label:'Criar tópico'}]);

      const options = forum.categories.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.title)}</option>`).join('');

      app.innerHTML = `
        <div class="card">
          <h3 class="card__title">Criar tópico (demo)</h3>
          <p class="card__text">O layout está pronto. Quando o cadastro/login estiver ativo, isso salva de verdade.</p>

          <div class="stack">
            <label class="field">
              <span class="field__label">Categoria</span>
              <select id="newCat" class="select">${options}</select>
            </label>

            <label class="field">
              <span class="field__label">Título</span>
              <input id="newTitle" class="field__input" type="text" placeholder="Ex: Mina 120 — dicas de comida e anéis" />
            </label>

            <label class="field">
              <span class="field__label">Texto</span>
              <textarea id="newBody" class="field__input" placeholder="Escreva aqui..."></textarea>
            </label>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">
            <button class="btn btn--primary" type="button" id="btnPublish">Publicar</button>
            <a class="btn btn--ghost" href="#/categorias">Cancelar</a>
          </div>

          <p class="meta" id="newHint" style="margin-top:10px;"></p>
        </div>
      `;

      const hint = document.getElementById('newHint');
      if(hint){
        hint.textContent = isAuthed()
          ? 'Demo: publicar só mostra um alerta. Backend vem depois.'
          : 'Área de membros: entre para publicar.';
      }

      const btnPublish = document.getElementById('btnPublish');
      if(btnPublish){
        btnPublish.addEventListener('click', () => {
          if(!isAuthed()){
            if(gate){ gate.hidden = false; }
            return;
          }
          alert('Demo: tópico publicado (não salvo).');
        });
      }
    }

    function formatBody(text){
      const safe = escapeHtml(text);
      // micro-formatação: **negrito** e *itálico*
      return safe
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br/>');
    }

    function wireGo(){
      app.querySelectorAll('[data-go]').forEach(node => {
        const go = node.getAttribute('data-go');
        node.addEventListener('click', () => { location.hash = go; });
        node.addEventListener('keydown', (ev) => {
          if(ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); location.hash = go; }
        });
      });
    }

    async function loadEmojiManifest(pref){
      try{
        const url = pref + 'assets/emojis/manifest.json';
        const res = await fetch(url, {cache:'no-store'});
        if(!res.ok) throw new Error('bad status');
        const json = await res.json();
        return Array.isArray(json) ? json : [];
      }catch(e){
        return [];
      }
    }

    function renderFromHash(){
      const hash = (location.hash || '#/categorias').replace(/^#/, '');
      // routes
      if(hash.startsWith('/c/')){
        const catId = hash.split('/c/')[1] || '';
        renderTopics(catId);
        return;
      }
      if(hash.startsWith('/t/')){
        const topicId = hash.split('/t/')[1] || '';
        renderThread(topicId);
        return;
      }
      if(hash.startsWith('/novo')){
        renderNewTopic();
        return;
      }
      if(hash.startsWith('/ajuda')){
        const forum = getForum();
        const techCat = forum.categories.find(c => c.id === 'tech') || forum.categories[0];
        renderTopics(techCat.id);
        return;
      }
      if(hash.startsWith('/recentes')){
        renderCategories();
        return;
      }
      renderCategories();
    }

    window.addEventListener('hashchange', renderFromHash);
    renderFromHash();
  }

  initItemGuide();
  initToolGuide();

})();
