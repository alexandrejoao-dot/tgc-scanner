/* =========================================================
   SESSÃO — app de uso pessoal, protegida por um único PIN de acesso
   partilhado (sem contas). Guarda o token no browser e expõe o helper
   pedidoAPI() usado pelo resto da app para falar com /api/*.
   ========================================================= */
const CHAVE_SESSAO = "tcgscanner_sessao";

function obterSessao(){
  try{ return JSON.parse(localStorage.getItem(CHAVE_SESSAO) || "null"); }
  catch{ return null; }
}
function guardarSessao(token){
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ token }));
}
function limparSessao(){
  localStorage.removeItem(CHAVE_SESSAO);
}

async function pedidoAPI(caminho, opcoes = {}){
  const sessao = obterSessao();
  const headers = { "Content-Type": "application/json", ...(opcoes.headers || {}) };
  if(sessao?.token) headers["Authorization"] = "Bearer " + sessao.token;

  const resp = await fetch(caminho, { ...opcoes, headers });
  if(resp.status === 401){
    limparSessao();
    mostrarLogin("A tua sessão expirou. Introduz o PIN outra vez.");
    throw new Error("sessao-invalida");
  }
  const dados = await resp.json().catch(()=>({}));
  if(!resp.ok) throw new Error(dados.erro || "Erro no pedido.");
  return dados;
}

/* ---------- arranque ---------- */
function iniciarApp(){
  const sessao = obterSessao();
  if(sessao?.token){
    mostrarNav();
    mostrarPesquisa();
  }else{
    mostrarLogin();
  }
}

function mostrarNav(){ document.getElementById("nav-inferior").classList.remove("hidden"); document.getElementById("nav-inferior").classList.add("flex"); }
function esconderNav(){ document.getElementById("nav-inferior").classList.add("hidden"); document.getElementById("nav-inferior").classList.remove("flex"); }

function sair(){
  limparSessao();
  esconderNav();
  document.getElementById("cabecalho-acoes").innerHTML = "";
  mostrarLogin();
}

/* ---------- ecrã de login ---------- */
function mostrarLogin(erro){
  esconderNav();
  document.getElementById("cabecalho-acoes").innerHTML = "";
  const ecra = document.getElementById("ecra");
  ecra.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[70vh] px-container-padding">
      <div class="w-full max-w-sm glass-panel rounded-xl p-lg">
        <div class="flex flex-col items-center mb-lg">
          <span class="material-symbols-outlined text-primary text-5xl mb-sm">qr_code_scanner</span>
          <h2 class="font-headline-md text-headline-md text-on-surface">Acesso</h2>
          <p class="font-body-sm text-outline mt-xs text-center">Introduz o PIN para entrar no TCG Scanner</p>
        </div>
        ${erro ? `<div class="mb-md text-center font-body-sm text-error">${erro}</div>` : ""}
        <input id="input-pin" type="password" inputmode="numeric" autocomplete="off"
          class="w-full bg-surface-container-high border border-white/10 rounded-lg px-md py-sm text-on-surface font-price-display text-price-display text-center tracking-widest focus:outline-none focus:border-primary"
          placeholder="••••">
        <button id="btn-entrar" class="w-full mt-md h-12 bg-primary-container text-on-primary-container font-headline-md text-[16px] rounded-xl active:scale-95 transition-transform">
          Entrar
        </button>
      </div>
    </div>
  `;
  const input = document.getElementById("input-pin");
  const entrar = async () => {
    const pin = input.value.trim();
    if(!pin) return;
    try{
      const resp = await fetch("/api/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const dados = await resp.json();
      if(!resp.ok){
        mostrarLogin(dados.erro || "PIN incorreto.");
        return;
      }
      guardarSessao(dados.token);
      mostrarNav();
      mostrarPesquisa();
    }catch(e){
      mostrarLogin("Não consegui ligar ao servidor.");
    }
  };
  document.getElementById("btn-entrar").addEventListener("click", entrar);
  input.addEventListener("keydown", e => { if(e.key === "Enter") entrar(); });
  input.focus();
}
