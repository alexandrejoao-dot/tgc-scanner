/* =========================================================
   TCG SCANNER — pesquisa, detalhe de carta, coleção, definições.
   ========================================================= */
const ecra = document.getElementById("ecra");
const cabecalhoAcoesEl = document.getElementById("cabecalho-acoes");

let estado = {
  jogoPesquisa: "pokemon",
  ultimaPesquisa: "",
  origemDetalhe: "pesquisar",
};

/* ---------- helpers ---------- */
function formatarEUR(valor){
  if(valor === null || valor === undefined) return "—";
  return "€" + Number(valor).toFixed(2);
}

function iconeVariacao(pct){
  if(pct === null || pct === undefined) return `<span class="text-outline text-body-sm">—</span>`;
  const cor = pct > 0 ? "text-tertiary" : pct < 0 ? "text-error" : "text-outline";
  const icone = pct > 0 ? "arrow_upward" : pct < 0 ? "arrow_downward" : "remove";
  return `<span class="font-body-sm ${cor} flex items-center justify-end gap-1">
    <span class="material-symbols-outlined text-sm">${icone}</span>${Math.abs(pct).toFixed(1)}%
  </span>`;
}

function debounce(fn, ms){
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function definirAcoesCabecalho(html){
  cabecalhoAcoesEl.innerHTML = html;
}

function marcarNavAtiva(nome){
  document.querySelectorAll(".nav-item").forEach(btn => {
    const ativo = btn.dataset.ecra === nome;
    btn.classList.toggle("text-primary", ativo);
    btn.classList.toggle("bg-primary-container/20", ativo);
    btn.classList.toggle("rounded-xl", ativo);
    btn.classList.toggle("text-outline", !ativo);
  });
}

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const destino = btn.dataset.ecra;
    if(destino === "pesquisar") mostrarPesquisa();
    else if(destino === "colecao") mostrarColecao("colecao");
    else if(destino === "venda") mostrarColecao("venda");
    else if(destino === "definicoes") mostrarDefinicoes();
  });
});

/* =========================================================
   PESQUISAR
   ========================================================= */
function mostrarPesquisa(){
  marcarNavAtiva("pesquisar");
  definirAcoesCabecalho(`<button onclick="sair()" class="material-symbols-outlined text-primary hover:opacity-80 active:scale-95 transition-transform" title="Sair">logout</button>`);

  ecra.innerHTML = `
    <div class="px-md pt-md">
      <div class="flex gap-sm mb-md">
        <button id="jogo-pokemon" class="jogo-chip flex-1 py-2 rounded-lg font-body-sm font-semibold transition-colors"></button>
        <button id="jogo-magic" class="jogo-chip flex-1 py-2 rounded-lg font-body-sm font-semibold transition-colors"></button>
      </div>
      <div class="relative mb-md">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
        <input id="input-pesquisa" type="text" placeholder="Pesquisar por nome da carta..."
          class="w-full bg-surface-container-high border border-white/10 rounded-xl pl-11 pr-11 py-3 text-on-surface font-body-lg focus:outline-none focus:border-primary"
          value="${estado.ultimaPesquisa ? escaparHTML(estado.ultimaPesquisa) : ""}">
        <button id="btn-limpar-pesquisa" class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors ${estado.ultimaPesquisa ? "" : "hidden"}">close</button>
      </div>
      <div id="resultados-pesquisa"></div>
    </div>
  `;

  const btnPokemon = document.getElementById("jogo-pokemon");
  const btnMagic = document.getElementById("jogo-magic");
  function pintarChips(){
    const ativoClasses = ["bg-primary", "text-on-primary"];
    const inativoClasses = ["bg-surface-container-high", "text-on-surface", "border", "border-white/5"];
    btnPokemon.className = "jogo-chip flex-1 py-2 rounded-lg font-body-sm font-semibold transition-colors " + (estado.jogoPesquisa === "pokemon" ? ativoClasses.join(" ") : inativoClasses.join(" "));
    btnMagic.className = "jogo-chip flex-1 py-2 rounded-lg font-body-sm font-semibold transition-colors " + (estado.jogoPesquisa === "magic" ? ativoClasses.join(" ") : inativoClasses.join(" "));
  }
  btnPokemon.textContent = "Pokémon";
  btnMagic.textContent = "Magic";
  pintarChips();
  btnPokemon.addEventListener("click", () => { estado.jogoPesquisa = "pokemon"; pintarChips(); executarPesquisa(); });
  btnMagic.addEventListener("click", () => { estado.jogoPesquisa = "magic"; pintarChips(); executarPesquisa(); });

  const input = document.getElementById("input-pesquisa");
  const btnLimpar = document.getElementById("btn-limpar-pesquisa");
  const pesquisaAdiada = debounce(executarPesquisa, 450);
  input.addEventListener("input", () => {
    estado.ultimaPesquisa = input.value;
    btnLimpar.classList.toggle("hidden", !input.value);
    pesquisaAdiada();
  });
  btnLimpar.addEventListener("click", () => {
    input.value = "";
    estado.ultimaPesquisa = "";
    btnLimpar.classList.add("hidden");
    input.focus();
    executarPesquisa();
  });

  const resultados = document.getElementById("resultados-pesquisa");
  if(estado.ultimaPesquisa && estado.ultimaPesquisa.trim().length >= 2){
    executarPesquisa();
  }else{
    resultados.innerHTML = `<div class="text-center text-outline font-body-sm mt-xl">Escreve o nome de uma carta para começar.</div>`;
  }
}

async function executarPesquisa(){
  const resultados = document.getElementById("resultados-pesquisa");
  const q = (estado.ultimaPesquisa || "").trim();
  if(!resultados) return;
  if(q.length < 2){
    resultados.innerHTML = q.length === 0
      ? `<div class="text-center text-outline font-body-sm mt-xl">Escreve o nome de uma carta para começar.</div>`
      : `<div class="text-center text-outline font-body-sm mt-xl">Escreve pelo menos 2 letras.</div>`;
    return;
  }
  resultados.innerHTML = `<div class="text-center text-outline font-body-sm mt-xl">A pesquisar...</div>`;
  try{
    const dados = await pedidoAPI(`/api/pesquisar?jogo=${estado.jogoPesquisa}&q=${encodeURIComponent(q)}`);
    const lista = dados.resultados || [];
    if(!lista.length){
      resultados.innerHTML = `<div class="text-center text-outline font-body-sm mt-xl">Sem resultados para "${escaparHTML(q)}".</div>`;
      return;
    }
    resultados.innerHTML = `<div class="flex flex-col gap-sm pb-md">${lista.map(cartaoResultado).join("")}</div>`;
  }catch(e){
    resultados.innerHTML = `<div class="text-center text-error font-body-sm mt-xl">Não consegui pesquisar. Tenta outra vez.</div>`;
  }
}

function cartaoResultado(c){
  return `
    <button onclick="estado.origemDetalhe='pesquisar';mostrarDetalhe('${c.jogo}','${escaparAttr(c.id)}')"
      class="glass-panel p-md rounded-xl flex items-center gap-md text-left hover:border-primary/40 transition-colors">
      <div class="w-14 h-20 flex-shrink-0 bg-surface-container-lowest rounded overflow-hidden">
        ${c.imagem_pequena ? `<img class="w-full h-full object-cover" src="${c.imagem_pequena}" alt="">` : ""}
      </div>
      <div class="flex-grow min-w-0">
        <h3 class="font-headline-md text-[16px] text-on-surface truncate">${escaparHTML(c.nome)}</h3>
        <p class="font-body-sm text-on-surface-variant truncate">${c.raridade ? escaparHTML(c.raridade) + " • " : ""}${escaparHTML(c.set_nome)}${c.numero ? " • " + escaparHTML(c.numero) : ""}</p>
      </div>
      <div class="text-right flex-shrink-0">
        <p class="font-price-display text-[16px] text-primary">${formatarEUR(c.preco_eur)}</p>
        ${c.preco_foil_eur != null ? `<p class="font-body-sm text-[12px] text-secondary flex items-center justify-end gap-1"><span class="material-symbols-outlined text-[13px]">auto_awesome</span>${formatarEUR(c.preco_foil_eur)}</p>` : ""}
      </div>
    </button>
  `;
}

/* =========================================================
   DETALHE DA CARTA
   ========================================================= */
async function mostrarDetalhe(jogo, id){
  definirAcoesCabecalho(`<button onclick="voltarDeDetalhe()" class="material-symbols-outlined text-primary hover:opacity-80 active:scale-95 transition-transform">arrow_back</button>`);
  document.querySelectorAll(".nav-item").forEach(btn => btn.classList.remove("text-primary", "bg-primary-container/20", "rounded-xl"));

  ecra.innerHTML = `<div class="text-center text-outline font-body-sm mt-xl">A carregar...</div>`;
  try{
    const dados = await pedidoAPI(`/api/carta?jogo=${jogo}&id=${encodeURIComponent(id)}`);
    const c = dados.carta;
    let foilSelecionado = false;
    let listaSelecionada = "colecao";
    ecra.innerHTML = `
      <section class="relative w-full flex items-center justify-center overflow-hidden py-lg px-container-padding">
        <div class="absolute inset-0 flex items-center justify-center opacity-30">
          <div class="w-64 h-64 bg-primary blur-[100px] animate-glow"></div>
        </div>
        <div class="relative z-10">
          ${c.imagem ? `<img class="relative rounded-xl w-64 shadow-2xl border border-white/10" src="${c.imagem}" alt="">` : ""}
        </div>
      </section>
      <div class="px-container-padding -mt-8 relative z-20">
        <div class="glass-panel rounded-xl p-md">
          <div class="flex justify-between items-start gap-sm">
            <div class="min-w-0">
              <h2 class="font-headline-md text-headline-md text-on-surface truncate">${escaparHTML(c.nome)}</h2>
              <p class="font-body-sm text-outline">${escaparHTML(c.set_nome)}${c.numero ? " • " + escaparHTML(c.numero) : ""}${c.ano ? " • " + c.ano : ""}</p>
              ${c.raridade ? `<p class="font-body-sm text-on-surface-variant mt-xs">${escaparHTML(c.raridade)}</p>` : ""}
            </div>
          </div>
          ${c.commander ? `
          <div class="flex flex-wrap gap-xs mt-sm">
            <span class="bg-primary-container/20 text-primary px-sm py-xs rounded-full font-data-label text-data-label uppercase flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">military_tech</span>Pode ser Commander</span>
          </div>` : ""}
        </div>
      </div>
      ${c.preco_foil_eur != null ? `
      <div class="px-container-padding mt-md flex gap-sm">
        <button id="btn-normal" class="flex-1 py-2 rounded-lg font-body-sm font-semibold transition-colors">Normal</button>
        <button id="btn-foil" class="flex-1 py-2 rounded-lg font-body-sm font-semibold transition-colors flex items-center justify-center gap-1"><span class="material-symbols-outlined text-[16px]">auto_awesome</span>Foil</button>
      </div>` : ""}
      <section class="px-container-padding mt-md">
        <div class="grid grid-cols-3 gap-sm">
          <div class="glass-panel p-md rounded-xl flex flex-col items-center">
            <span class="font-data-label text-data-label text-outline uppercase tracking-wider">Preço</span>
            <span id="preco-principal" class="font-price-display text-price-display text-primary mt-xs">${formatarEUR(c.preco_eur)}</span>
          </div>
          <div class="glass-panel p-md rounded-xl flex flex-col items-center">
            <span class="font-data-label text-data-label text-outline uppercase tracking-wider">Mín.</span>
            <span class="font-price-display text-[16px] leading-6 text-on-surface mt-xs">${formatarEUR(c.preco_baixo_eur)}</span>
          </div>
          <div class="glass-panel p-md rounded-xl flex flex-col items-center">
            <span class="font-data-label text-data-label text-outline uppercase tracking-wider">Variação</span>
            <div class="mt-xs">${iconeVariacao(c.variacao_pct)}</div>
          </div>
        </div>
      </section>
      ${graficoTendencia(c.historico)}
      <div class="h-44"></div>
      <div class="fixed bottom-20 left-0 w-full px-container-padding z-40">
        <div class="flex gap-sm mb-sm">
          <button id="btn-lista-colecao" class="flex-1 py-2 rounded-lg font-body-sm font-semibold transition-colors">Coleção</button>
          <button id="btn-lista-venda" class="flex-1 py-2 rounded-lg font-body-sm font-semibold transition-colors flex items-center justify-center gap-1"><span class="material-symbols-outlined text-[16px]">sell</span>Venda</button>
        </div>
        <button id="btn-adicionar" class="w-full h-14 bg-primary-container text-on-primary-container font-headline-md text-[18px] rounded-xl flex items-center justify-center gap-sm shadow-xl active:scale-95 transition-transform">
          <span class="material-symbols-outlined">library_add</span>
          <span id="btn-adicionar-label">Adicionar à coleção</span>
        </button>
      </div>
    `;
    const ativoClasses = ["bg-primary", "text-on-primary"];
    const inativoClasses = ["bg-surface-container-high", "text-on-surface", "border", "border-white/5"];
    if(c.preco_foil_eur != null){
      const btnNormal = document.getElementById("btn-normal");
      const btnFoil = document.getElementById("btn-foil");
      const precoEl = document.getElementById("preco-principal");
      const pintarToggleFoil = () => {
        btnNormal.className = "flex-1 py-2 rounded-lg font-body-sm font-semibold transition-colors " + (!foilSelecionado ? ativoClasses.join(" ") : inativoClasses.join(" "));
        btnFoil.className = "flex-1 py-2 rounded-lg font-body-sm font-semibold transition-colors flex items-center justify-center gap-1 " + (foilSelecionado ? ativoClasses.join(" ") : inativoClasses.join(" "));
        precoEl.textContent = formatarEUR(foilSelecionado ? c.preco_foil_eur : c.preco_eur);
      };
      btnNormal.addEventListener("click", () => { foilSelecionado = false; pintarToggleFoil(); });
      btnFoil.addEventListener("click", () => { foilSelecionado = true; pintarToggleFoil(); });
      pintarToggleFoil();
    }
    const btnListaColecao = document.getElementById("btn-lista-colecao");
    const btnListaVenda = document.getElementById("btn-lista-venda");
    const labelAdicionar = document.getElementById("btn-adicionar-label");
    const pintarToggleLista = () => {
      btnListaColecao.className = "flex-1 py-2 rounded-lg font-body-sm font-semibold transition-colors " + (listaSelecionada === "colecao" ? ativoClasses.join(" ") : inativoClasses.join(" "));
      btnListaVenda.className = "flex-1 py-2 rounded-lg font-body-sm font-semibold transition-colors flex items-center justify-center gap-1 " + (listaSelecionada === "venda" ? ativoClasses.join(" ") : inativoClasses.join(" "));
      labelAdicionar.textContent = listaSelecionada === "venda" ? "Adicionar à venda" : "Adicionar à coleção";
    };
    btnListaColecao.addEventListener("click", () => { listaSelecionada = "colecao"; pintarToggleLista(); });
    btnListaVenda.addEventListener("click", () => { listaSelecionada = "venda"; pintarToggleLista(); });
    pintarToggleLista();
    document.getElementById("btn-adicionar").addEventListener("click", () => adicionarACollecao(c, foilSelecionado, listaSelecionada));
  }catch(e){
    ecra.innerHTML = `<div class="text-center text-error font-body-sm mt-xl">Não consegui carregar esta carta.</div>`;
  }
}

function voltarDeDetalhe(){
  if(estado.origemDetalhe === "colecao") mostrarColecao();
  else mostrarPesquisa();
}

// Só a Cardmarket (via pokemontcg.io) expõe algo parecido com histórico —
// médias a 30 e 7 dias, não uma série diária real. O Scryfall (Magic)
// não tem nada disto, por isso esta secção simplesmente não aparece.
function graficoTendencia(historico){
  if(!historico) return "";
  const pontos = [
    { rotulo: "30 dias", valor: historico.d30 },
    { rotulo: "7 dias", valor: historico.d7 },
  ].filter(p => p.valor != null);
  if(pontos.length < 2) return "";

  const maxValor = Math.max(...pontos.map(p => p.valor));
  return `
    <section class="px-container-padding mt-lg">
      <div class="glass-panel p-md rounded-xl">
        <h3 class="font-headline-md text-[16px] text-on-surface mb-md">Média de preço (Cardmarket)</h3>
        <div class="h-32 w-full flex items-end gap-md px-sm">
          ${pontos.map(p => {
            const alturaPct = maxValor ? Math.max(10, (p.valor / maxValor) * 100) : 10;
            return `
            <div class="flex-1 flex flex-col items-center justify-end h-full">
              <span class="font-data-label text-[10px] text-outline mb-1">${formatarEUR(p.valor)}</span>
              <div class="w-full bg-primary/40 rounded-t-sm" style="height:${alturaPct}%"></div>
              <span class="font-data-label text-[10px] text-outline mt-xs uppercase">${p.rotulo}</span>
            </div>`;
          }).join("")}
        </div>
        <p class="font-body-sm text-outline mt-sm">Médias de venda da Cardmarket nestas duas janelas — não é um histórico diário.</p>
      </div>
    </section>
  `;
}

async function adicionarACollecao(c, foil, lista){
  const btn = document.getElementById("btn-adicionar");
  const original = btn.innerHTML;
  try{
    await pedidoAPI("/api/colecao", {
      method: "POST",
      body: JSON.stringify({
        jogo: c.jogo,
        provider_id: c.id,
        nome: c.nome,
        set_nome: c.set_nome,
        numero: c.numero,
        raridade: c.raridade,
        ano: c.ano,
        foil: !!foil,
        lista: lista === "venda" ? "venda" : "colecao",
        imagem: c.imagem,
        preco_eur: foil ? c.preco_foil_eur : c.preco_eur,
      }),
    });
    btn.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Adicionada!`;
    btn.classList.replace("bg-primary-container", "bg-tertiary-container");
    setTimeout(() => {
      btn.innerHTML = original;
      btn.classList.replace("bg-tertiary-container", "bg-primary-container");
    }, 2000);
  }catch(e){
    alert("Não consegui adicionar à coleção.");
  }
}

/* =========================================================
   A MINHA COLEÇÃO
   ========================================================= */
function ordenarItens(lista, ordem){
  const copia = [...lista];
  if(ordem === "ano") return copia.sort((a,b) => (b.ano ?? -Infinity) - (a.ano ?? -Infinity));
  if(ordem === "valor") return copia.sort((a,b) => (Number(b.preco_atual_eur) || 0) - (Number(a.preco_atual_eur) || 0));
  return copia; // "recentes": já vem ordenado por criado_em desc da API
}

async function mostrarColecao(tipoLista, filtro, ordem){
  tipoLista = tipoLista || estado.tipoLista || "colecao";
  filtro = filtro || estado.filtroColecao || "todos";
  ordem = ordem || estado.ordemColecao || "recentes";
  estado.tipoLista = tipoLista;
  estado.filtroColecao = filtro;
  estado.ordemColecao = ordem;
  const titulo = tipoLista === "venda" ? "Valor a vender" : "Valor da coleção";
  marcarNavAtiva(tipoLista);
  definirAcoesCabecalho(`<button onclick="sair()" class="material-symbols-outlined text-primary hover:opacity-80 active:scale-95 transition-transform" title="Sair">logout</button>`);

  ecra.innerHTML = `<div class="text-center text-outline font-body-sm mt-xl px-md">A carregar...</div>`;
  try{
    const dados = await pedidoAPI(`/api/colecao?lista=${tipoLista}`);
    const itens = dados.colecao || [];
    const filtrados = ordenarItens(filtro === "todos" ? itens : itens.filter(i => i.jogo === filtro), ordem);

    const valorTotal = itens.reduce((s, i) => s + (Number(i.preco_atual_eur) || 0), 0);
    const valorAnteriorTotal = itens.reduce((s, i) => s + (Number(i.preco_anterior_eur ?? i.preco_atual_eur) || 0), 0);
    const variacaoTotal = valorAnteriorTotal ? ((valorTotal - valorAnteriorTotal) / valorAnteriorTotal) * 100 : null;
    const contagemPokemon = itens.filter(i => i.jogo === "pokemon").length;
    const contagemMagic = itens.filter(i => i.jogo === "magic").length;
    const valorPokemon = itens.filter(i => i.jogo === "pokemon").reduce((s, i) => s + (Number(i.preco_atual_eur) || 0), 0);
    const valorMagic = itens.filter(i => i.jogo === "magic").reduce((s, i) => s + (Number(i.preco_atual_eur) || 0), 0);
    const valorAnteriorPokemon = itens.filter(i => i.jogo === "pokemon").reduce((s, i) => s + (Number(i.preco_anterior_eur ?? i.preco_atual_eur) || 0), 0);
    const valorAnteriorMagic = itens.filter(i => i.jogo === "magic").reduce((s, i) => s + (Number(i.preco_anterior_eur ?? i.preco_atual_eur) || 0), 0);
    const variacaoPokemon = valorAnteriorPokemon ? ((valorPokemon - valorAnteriorPokemon) / valorAnteriorPokemon) * 100 : null;
    const variacaoMagic = valorAnteriorMagic ? ((valorMagic - valorAnteriorMagic) / valorAnteriorMagic) * 100 : null;

    ecra.innerHTML = `
      <div class="px-md mt-md">
        <section class="mb-lg">
          <div class="glass-panel rounded-xl p-lg">
            <p class="font-data-label text-data-label text-on-surface-variant uppercase tracking-widest mb-xs">${titulo}</p>
            <div class="flex items-center gap-sm">
              <span class="font-price-display text-4xl text-primary">${formatarEUR(valorTotal)}</span>
              ${iconeVariacao(variacaoTotal)}
            </div>
            <div class="mt-md flex gap-lg">
              <div>
                <p class="font-data-label text-[10px] text-outline uppercase">Pokémon</p>
                <p class="font-headline-md text-headline-md">${contagemPokemon}</p>
                <div class="flex items-center gap-xs">
                  <p class="font-body-sm text-on-surface-variant">${formatarEUR(valorPokemon)}</p>
                  ${iconeVariacao(variacaoPokemon)}
                </div>
              </div>
              <div class="border-l border-white/10 pl-lg">
                <p class="font-data-label text-[10px] text-outline uppercase">Magic</p>
                <p class="font-headline-md text-headline-md">${contagemMagic}</p>
                <div class="flex items-center gap-xs">
                  <p class="font-body-sm text-on-surface-variant">${formatarEUR(valorMagic)}</p>
                  ${iconeVariacao(variacaoMagic)}
                </div>
              </div>
            </div>
          </div>
        </section>
        <section class="flex gap-sm overflow-x-auto pb-md no-scrollbar mb-sm">
          ${["todos","pokemon","magic"].map(f => `
            <button onclick="mostrarColecao('${tipoLista}','${f}','${ordem}')" class="px-md py-sm ${filtro===f ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface border border-white/5"} font-body-sm rounded-full whitespace-nowrap transition-colors">
              ${f === "todos" ? "Todos" : f === "pokemon" ? "Pokémon" : "Magic"}
            </button>
          `).join("")}
        </section>
        <section class="flex items-center gap-sm overflow-x-auto pb-md no-scrollbar mb-md">
          <span class="material-symbols-outlined text-outline text-[18px] flex-shrink-0">sort</span>
          ${[["recentes","Recentes"],["ano","Ano"],["valor","Valor"]].map(([o,rotulo]) => `
            <button onclick="mostrarColecao('${tipoLista}','${filtro}','${o}')" class="px-md py-xs ${ordem===o ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface border border-white/5"} font-body-sm text-[13px] rounded-full whitespace-nowrap transition-colors">
              ${rotulo}
            </button>
          `).join("")}
        </section>
        <section>
          ${filtrados.length ? `<div class="grid grid-cols-1 gap-md pb-md">${filtrados.map(itemColecao).join("")}</div>` : `<div class="text-center text-outline font-body-sm mt-xl">Ainda não tens cartas ${filtro !== "todos" ? "deste jogo " : ""}${tipoLista === "venda" ? "para vender" : "na coleção"}.</div>`}
        </section>
      </div>
    `;
  }catch(e){
    ecra.innerHTML = `<div class="text-center text-error font-body-sm mt-xl px-md">Não consegui carregar a coleção.</div>`;
  }
}

function itemColecao(i){
  const variacao = i.preco_anterior_eur ? ((i.preco_atual_eur - i.preco_anterior_eur) / i.preco_anterior_eur) * 100 : null;
  return `
    <div class="glass-panel p-md rounded-xl flex gap-md items-center group">
      <button onclick="estado.origemDetalhe='colecao';mostrarDetalhe('${i.jogo}','${escaparAttr(i.provider_id)}')" class="relative w-16 h-24 flex-shrink-0 bg-surface-container-lowest rounded overflow-hidden">
        ${i.imagem ? `<img class="w-full h-full object-cover" src="${i.imagem}" alt="">` : ""}
      </button>
      <button onclick="estado.origemDetalhe='colecao';mostrarDetalhe('${i.jogo}','${escaparAttr(i.provider_id)}')" class="flex-grow flex flex-col justify-between h-24 text-left min-w-0">
        <div>
          <h3 class="font-headline-md text-[16px] text-on-surface truncate group-hover:text-primary transition-colors">${escaparHTML(i.nome)}${i.foil ? ` <span class="material-symbols-outlined text-[14px] text-secondary align-middle" title="Foil">auto_awesome</span>` : ""}</h3>
          <p class="font-body-sm text-on-surface-variant truncate">${i.raridade ? escaparHTML(i.raridade) + " • " : ""}${escaparHTML(i.set_nome)}${i.ano ? " • " + i.ano : ""}${i.numero ? " • " + escaparHTML(i.numero) : ""}</p>
        </div>
        <div class="flex items-center gap-xs">
          <p class="font-price-display text-[16px] text-on-surface">${formatarEUR(i.preco_atual_eur)}</p>
          ${iconeVariacao(variacao)}
        </div>
      </button>
      <button onclick="removerDaColecao('${i.id}')" class="material-symbols-outlined text-outline hover:text-error transition-colors flex-shrink-0" title="Remover">delete</button>
    </div>
  `;
}

async function removerDaColecao(id){
  if(!confirm("Remover esta carta da coleção?")) return;
  try{
    await pedidoAPI("/api/colecao", { method: "DELETE", body: JSON.stringify({ id }) });
    mostrarColecao();
  }catch(e){
    alert("Não consegui remover.");
  }
}

/* =========================================================
   DEFINIÇÕES
   ========================================================= */
function mostrarDefinicoes(){
  marcarNavAtiva("definicoes");
  definirAcoesCabecalho("");
  ecra.innerHTML = `
    <div class="px-md py-lg">
      <section class="mb-xl">
        <div class="flex items-center justify-between mb-md">
          <h3 class="font-headline-md text-headline-md text-on-surface">Jogos</h3>
        </div>
        <div class="space-y-sm">
          ${linhaJogo("Pokémon TCG", "Preços via pokemontcg.io (Cardmarket)", true, true)}
          ${linhaJogo("Magic: The Gathering", "Preços via Scryfall (Cardmarket)", true, true)}
          ${linhaJogo("Yu-Gi-Oh!", "Brevemente", false, false)}
        </div>
      </section>
      <section class="mb-xl">
        <h3 class="font-headline-md text-headline-md text-on-surface mb-md">Moeda</h3>
        <div class="glass-panel p-md rounded-xl">
          <div class="flex gap-sm">
            <button class="flex-1 py-2 rounded-lg bg-primary-container/20 border border-primary text-primary font-price-display text-price-display">EUR</button>
            <button disabled class="flex-1 py-2 rounded-lg bg-surface-container-high border border-white/5 text-outline/50 font-price-display text-price-display cursor-not-allowed">USD</button>
            <button disabled class="flex-1 py-2 rounded-lg bg-surface-container-high border border-white/5 text-outline/50 font-price-display text-price-display cursor-not-allowed">GBP</button>
          </div>
          <p class="font-body-sm text-outline mt-sm">Os preços vêm diretamente da Cardmarket, em euros.</p>
        </div>
      </section>
      <button onclick="sair()" class="w-full h-12 glass-panel text-error font-headline-md text-[16px] rounded-xl flex items-center justify-center gap-sm active:scale-95 transition-transform">
        <span class="material-symbols-outlined">logout</span> Sair
      </button>
      <footer class="text-center pt-xl pb-md">
        <p class="font-data-label text-data-label text-outline uppercase tracking-[0.2em]">TCG Scanner v1</p>
      </footer>
    </div>
  `;
}

function linhaJogo(nome, nota, ativo, disponivel){
  return `
    <div class="glass-panel px-md py-md rounded-xl flex items-center justify-between ${disponivel ? "" : "opacity-60"}">
      <div>
        <p class="font-body-lg text-body-lg font-semibold">${nome}</p>
        <p class="font-body-sm text-body-sm text-outline">${nota}</p>
      </div>
      <label class="switch">
        <input type="checkbox" ${ativo ? "checked" : ""} disabled>
        <span class="slider"></span>
      </label>
    </div>
  `;
}

/* ---------- escape helpers ---------- */
function escaparHTML(texto){
  const div = document.createElement("div");
  div.textContent = String(texto ?? "");
  return div.innerHTML;
}
function escaparAttr(texto){
  return String(texto ?? "").replace(/'/g, "\\'");
}

iniciarApp();
