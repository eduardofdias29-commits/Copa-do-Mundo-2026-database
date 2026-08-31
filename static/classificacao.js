const SVG_ICONE_PESSOAS = `<svg class="icone-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const SVG_ICONE_ESTADIO_GRANDE = `<svg class="icone-placeholder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="30" height="30"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 21 8 3 8"/></svg>`;

const cacheDetalhesPorGrupo = {};
let grupoAtivo = null;

async function buscarJson(caminho) {
    const resposta = await fetch(caminho);
    if (!resposta.ok) {
        throw new Error(`A API respondeu com erro ${resposta.status} em ${caminho}`);
    }
    return resposta.json();
}

async function iniciarClassificacao() {
    try {
        const todasAsLinhas = await buscarJson("/api/classificacao");
        const grupos = [...new Set(todasAsLinhas.map((linha) => linha.grupo))].sort();
        montarAbasDeGrupo(grupos);
        mostrarGrupo(grupos[0]);
    } catch (erro) {
        document.getElementById("corpo-classificacao").innerHTML =
            `<tr><td colspan="7" class="erro-carregamento">Não consegui carregar a classificação. A API está rodando?</td></tr>`;
        console.error("Erro ao buscar /api/classificacao:", erro);
    }
}

function montarAbasDeGrupo(grupos) {
    const container = document.getElementById("grupos-tabs");
    container.innerHTML = "";

    grupos.forEach((grupo) => {
        const botao = document.createElement("button");
        botao.className = "grupo-tab";
        botao.textContent = grupo.replace("Grupo ", "");
        botao.title = grupo;
        botao.dataset.grupo = grupo;
        botao.addEventListener("click", () => mostrarGrupo(grupo));
        container.appendChild(botao);
    });
}

function mostrarEstadoCarregando() {
    document.getElementById("corpo-classificacao").innerHTML =
        `<tr><td colspan="7" class="item-carregando">Carregando…</td></tr>`;
    document.getElementById("sedes-lista").innerHTML =
        `<div class="item-carregando">Carregando…</div>`;
    document.getElementById("rodadas-lista").innerHTML =
        `<div class="item-carregando">Carregando…</div>`;
}

function mostrarEstadoDeErro(erro) {
    document.getElementById("corpo-classificacao").innerHTML =
        `<tr><td colspan="7" class="erro-carregamento">Não consegui carregar este grupo. A API está rodando?</td></tr>`;
    document.getElementById("sedes-lista").innerHTML =
        `<p class="erro-carregamento">Não consegui carregar as sedes.</p>`;
    document.getElementById("rodadas-lista").innerHTML =
        `<p class="erro-carregamento">Não consegui carregar as rodadas.</p>`;
    console.error(erro);
}

async function mostrarGrupo(grupoSelecionado) {
    grupoAtivo = grupoSelecionado;

    document.querySelectorAll(".grupo-tab").forEach((botao) => {
        botao.classList.toggle("ativo", botao.dataset.grupo === grupoSelecionado);
    });

    document.getElementById("titulo-grupo-ativo").textContent = grupoSelecionado;
    document.getElementById("titulo-sedes-grupo").textContent = `Sedes do ${grupoSelecionado}`;
    mostrarEstadoCarregando();

    try {
        const detalhes = cacheDetalhesPorGrupo[grupoSelecionado] ||
            await buscarJson(`/api/classificacao/${encodeURIComponent(grupoSelecionado)}/detalhes`);
        cacheDetalhesPorGrupo[grupoSelecionado] = detalhes;

        if (grupoAtivo !== grupoSelecionado) return;

        renderizarClassificacao(detalhes.classificacao);
        renderizarSedes(detalhes.sedes);
        renderizarRodadas(detalhes.rodadas);
        renderizarResumo(detalhes.resumo);
    } catch (erro) {
        mostrarEstadoDeErro(erro);
    }
}

function renderizarClassificacao(linhas) {
    const ordenadas = [...linhas].sort((a, b) => a.posicao - b.posicao);
    const corpoTabela = document.getElementById("corpo-classificacao");
    corpoTabela.innerHTML = "";

    ordenadas.forEach((linha) => {
        const estaClassificado = linha.posicao <= 2;
        const saldoComSinal = linha.saldo_gols > 0 ? `+${linha.saldo_gols}` : `${linha.saldo_gols}`;

        const imagemUrl = linha.escudo_url || linha.bandeira_url;
        const bandeiraHtml = imagemUrl
            ? `<img src="${imagemUrl}" alt="${linha.selecao}" class="bandeira-tabela">`
            : "";

        const tr = document.createElement("tr");
        tr.className = estaClassificado ? "linha-classificada" : "";
        tr.innerHTML = `
            <td class="col-pos">${linha.posicao}º</td>
            <td class="col-selecao">
                <div class="selecao-container">
                    ${bandeiraHtml}
                    <span>${linha.selecao}</span>
                </div>
            </td>
            <td>${linha.pontos}</td>
            <td>${linha.vitorias}</td>
            <td>${linha.empates}</td>
            <td>${linha.derrotas}</td>
            <td>${saldoComSinal}</td>
        `;
        corpoTabela.appendChild(tr);
    });
}

function formatarCapacidade(numero) {
    if (numero == null) return "—";
    return numero.toLocaleString("pt-BR");
}

function renderizarSedes(sedes) {
    const lista = document.getElementById("sedes-lista");
    const contador = document.getElementById("contador-sedes");
    contador.textContent = sedes.length ? `${sedes.length} SEDE${sedes.length > 1 ? "S" : ""}` : "";

    if (!sedes.length) {
        lista.innerHTML = `<p class="item-carregando">Nenhuma sede cadastrada pra esse grupo ainda.</p>`;
        return;
    }

    lista.innerHTML = "";
    sedes.forEach((e) => {
        const card = document.createElement("div");
        card.className = "sede-card";
        card.innerHTML = `
            <div class="sede-card-imagem-wrap">
                ${e.imagem_url
                    ? `<img src="${e.imagem_url}" alt="${e.nome}" class="sede-card-imagem">`
                    : `<div class="sede-card-imagem sede-card-imagem-vazia">${SVG_ICONE_ESTADIO_GRANDE}</div>`}
                <span class="sede-card-capacidade-badge">${SVG_ICONE_PESSOAS} ${formatarCapacidade(e.capacidade)}</span>
            </div>
            <div class="sede-card-info">
                <div class="sede-card-nome">${e.nome}</div>
                <div class="sede-card-local">
                    ${e.bandeira_pais_url ? `<img src="${e.bandeira_pais_url}" alt="${e.pais}" class="bandeira-tabela">` : ""}
                    <span>${e.cidade}${e.pais ? `, ${e.pais}` : ""}</span>
                </div>
                ${e.descricao ? `<p class="sede-card-descricao">${e.descricao}</p>` : ""}
            </div>
        `;
        lista.appendChild(card);
    });
}

const ORDINAL_RODADA = { 1: "1ª", 2: "2ª", 3: "3ª", 4: "4ª", 5: "5ª", 6: "6ª" };

function renderizarRodadas(rodadas) {
    const container = document.getElementById("rodadas-lista");

    if (!rodadas.length) {
        container.innerHTML = `<p class="item-carregando">Nenhum jogo cadastrado pra esse grupo ainda.</p>`;
        return;
    }

    container.innerHTML = "";
    rodadas.forEach((bloco) => {
        const secao = document.createElement("div");
        secao.className = "rodada-bloco";

        const titulo = document.createElement("h3");
        titulo.className = "rodada-titulo";
        titulo.textContent = `${ORDINAL_RODADA[bloco.rodada] || `${bloco.rodada}ª`} RODADA`;
        secao.appendChild(titulo);

        const jogosWrap = document.createElement("div");
        jogosWrap.className = "rodada-jogos";

        bloco.jogos.forEach((jogo) => {
            jogosWrap.appendChild(montarCardDeJogo(jogo));
        });

        secao.appendChild(jogosWrap);
        container.appendChild(secao);
    });
}

function montarCardDeJogo(jogo) {
    const jogado = jogo.gols_casa !== null && jogo.gols_fora !== null;
    const placar = jogado ? `${jogo.gols_casa}-${jogo.gols_fora}` : "vs";

    const imagemCasa = jogo.escudo_casa_url || jogo.bandeira_casa_url;
    const imagemFora = jogo.escudo_fora_url || jogo.bandeira_fora_url;

    const card = document.createElement("div");
    card.className = "rodada-jogo-card";
    card.innerHTML = `
        <div class="rodada-jogo-meta">
            <span>${jogo.estadio || "Sede a definir"}</span>
            <span>${jogo.data || "Data a definir"}</span>
        </div>
        <div class="rodada-jogo-confronto">
            <div class="rodada-time rodada-time-casa">
                ${imagemCasa ? `<img src="${imagemCasa}" alt="${jogo.casa}" class="bandeira-tabela">` : ""}
                <span class="rodada-time-nome">${jogo.casa}</span>
            </div>
            <span class="rodada-placar ${jogado ? "rodada-placar-decidido" : ""}">${placar}</span>
            <div class="rodada-time rodada-time-fora">
                <span class="rodada-time-nome">${jogo.fora}</span>
                ${imagemFora ? `<img src="${imagemFora}" alt="${jogo.fora}" class="bandeira-tabela">` : ""}
            </div>
        </div>
    `;
    return card;
}

function renderizarResumo(resumo) {
    document.getElementById("resumo-total-gols").textContent = resumo.total_gols;
    document.getElementById("resumo-total-jogos").textContent = resumo.total_jogos;
    document.getElementById("resumo-media-gols").textContent =
        resumo.media_gols.toString().replace(".", ",");
}

iniciarClassificacao();