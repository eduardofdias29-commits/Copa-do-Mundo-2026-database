const selecoesPorGrupo = {};
let grupoAtivo = null;
let selecaoAtiva = null;

async function buscarJson(caminho) {
    const resposta = await fetch(caminho);
    if (!resposta.ok) {
        throw new Error(`A API respondeu com erro ${resposta.status} em ${caminho}`);
    }
    return resposta.json();
}

async function iniciarSelecoes() {
    const grid = document.getElementById("times-grid");
    try {
        const todasAsSelecoes = await buscarJson("/api/selecoes");

        todasAsSelecoes.forEach((selecao) => {
            if (!selecoesPorGrupo[selecao.grupo]) {
                selecoesPorGrupo[selecao.grupo] = [];
            }
            selecoesPorGrupo[selecao.grupo].push(selecao);
        });

        const grupos = Object.keys(selecoesPorGrupo).sort();

        const nomeNaUrl = new URLSearchParams(window.location.search).get("time");
        const selecaoDaUrl = nomeNaUrl && todasAsSelecoes.find((s) => s.nome === nomeNaUrl);

        montarAbasDeGrupo(grupos);
        mostrarGrupo(selecaoDaUrl ? selecaoDaUrl.grupo : grupos[0]);

        if (selecaoDaUrl) {
            selecionarTime(selecaoDaUrl);
            document.getElementById("card-elenco").scrollIntoView({ behavior: "smooth", block: "start" });
        }
    } catch (erro) {
        grid.innerHTML = `<p class="erro-carregamento">Não consegui carregar as seleções. A API está rodando?</p>`;
        console.error(erro);
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

function mostrarGrupo(grupo) {
    grupoAtivo = grupo;

    document.querySelectorAll(".grupo-tab").forEach((botao) => {
        botao.classList.toggle("ativo", botao.dataset.grupo === grupo);
    });

    const grid = document.getElementById("times-grid");
    grid.innerHTML = "";

    const times = [...(selecoesPorGrupo[grupo] || [])].sort((a, b) => a.nome.localeCompare(b.nome));

    times.forEach((selecao) => {
        const imagemUrl = selecao.escudo_url || selecao.bandeira_url;
        const card = document.createElement("button");
        card.className = "time-card";
        card.dataset.nome = selecao.nome;
        card.innerHTML = `
            ${imagemUrl ? `<img src="${imagemUrl}" alt="${selecao.nome}" class="time-card-imagem">` : `<div class="time-card-imagem time-card-imagem-vazia"></div>`}
            <span class="time-card-nome">${selecao.nome}</span>
        `;
        card.addEventListener("click", () => selecionarTime(selecao));
        grid.appendChild(card);
    });

    if (selecaoAtiva && selecaoAtiva.grupo !== grupo) {
        document.getElementById("card-elenco").hidden = true;
        selecaoAtiva = null;
    }
}

async function selecionarTime(selecao) {
    selecaoAtiva = selecao;

    document.querySelectorAll(".time-card").forEach((card) => {
        card.classList.toggle("ativo", card.dataset.nome === selecao.nome);
    });

    const cardElenco = document.getElementById("card-elenco");
    const corpoTabela = document.getElementById("corpo-elenco");
    cardElenco.hidden = false;

    document.getElementById("elenco-nome-selecao").textContent = selecao.nome;
    document.getElementById("elenco-tag-grupo").textContent = selecao.grupo;

    const cardTreinador = document.getElementById("elenco-treinador-card");
    if (selecao.treinador) {
        cardTreinador.hidden = false;

        const fotoTreinadorEl = document.getElementById("elenco-treinador-foto");
        fotoTreinadorEl.src = selecao.treinador_foto_url || "";
        fotoTreinadorEl.style.visibility = selecao.treinador_foto_url ? "visible" : "hidden";

        document.getElementById("elenco-treinador-nome").textContent = selecao.treinador;
        document.getElementById("elenco-treinador-pais").textContent = selecao.treinador_pais || "—";
        document.getElementById("elenco-treinador-idade").textContent = selecao.treinador_idade
            ? `${selecao.treinador_idade} anos`
            : "—";

        const bandeiraTreinadorEl = document.getElementById("elenco-treinador-bandeira");
        bandeiraTreinadorEl.src = selecao.treinador_bandeira_url || "";
        bandeiraTreinadorEl.style.visibility = selecao.treinador_bandeira_url ? "visible" : "hidden";
    } else {
        cardTreinador.hidden = true;
    }

    const escudoEl = document.getElementById("elenco-escudo");
    const imagemUrl = selecao.escudo_url || selecao.bandeira_url;
    escudoEl.src = imagemUrl || "";
    escudoEl.style.visibility = imagemUrl ? "visible" : "hidden";

    corpoTabela.innerHTML = `<tr><td colspan="11" class="item-carregando">Carregando…</td></tr>`;

    try {
        const jogadores = await buscarJson(`/api/selecoes/${encodeURIComponent(selecao.nome)}/jogadores`);
        renderizarElenco(jogadores);
    } catch (erro) {
        corpoTabela.innerHTML = `<tr><td colspan="11" class="erro-carregamento">Não consegui carregar o elenco.</td></tr>`;
        console.error(erro);
    }
}

function renderizarElenco(jogadores) {
    const corpoTabela = document.getElementById("corpo-elenco");
    corpoTabela.innerHTML = "";

    jogadores.forEach((j) => {
        const valorExibido = (j.valor_mercado_final && j.valor_mercado_final.trim())
            ? j.valor_mercado_final
            : (j.valor_mercado || "—");

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-numero">${j.numero ?? "—"}</td>
            <td class="col-jogador">
                <div class="jogador-container">
                    ${j.foto_url
                        ? `<img src="${j.foto_url}" alt="${j.nome}" class="foto-jogador">`
                        : `<div class="foto-jogador foto-jogador-vazia"></div>`}
                    <a href="/jogador/${j.id}" class="link-jogador">${j.nome}</a>
                </div>
            </td>
            <td>${j.posicao || "—"}</td>
            <td>${j.idade ?? "—"}</td>
            <td class="col-clube">
                <div class="clube-container">
                    ${j.logo_clube_url ? `<img src="${j.logo_clube_url}" alt="${j.clube_atual || ''}" class="logo-clube">` : ""}
                    <span>${j.clube_atual || "Desconhecido"}</span>
                </div>
            </td>
            <td class="col-valor">${valorExibido}</td>
            <td>${j.jogos ?? 0}</td>
            <td>${j.gols ?? 0}</td>
            <td>${j.assistencias ?? 0}</td>
            <td>${j.cartoes_amarelos ?? 0}</td>
            <td>${j.cartoes_vermelhos ?? 0}</td>
        `;
        corpoTabela.appendChild(tr);
    });
}

iniciarSelecoes();