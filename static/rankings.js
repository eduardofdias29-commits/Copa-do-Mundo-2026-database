async function buscarJson(caminho) {
    const resposta = await fetch(caminho);
    if (!resposta.ok) {
        throw new Error(`A API respondeu com erro ${resposta.status} em ${caminho}`);
    }
    return resposta.json();
}

function bandeiraOuEscudo(item, prefixo = "") {
    const url = item[`${prefixo}escudo_url`] || item[`${prefixo}bandeira_url`];
    return url ? `<img src="${url}" alt="" class="bandeira-tabela">` : "";
}

function urlPerfilJogador(id) {
    return `/jogador/${id}`;
}

function urlPerfilSelecao(nome) {
    return `/selecoes?time=${encodeURIComponent(nome)}`;
}

function criarItemPreview(fotoUrl, nome, valor, grupoOuSelecao, opcoes = {}) {
    const { selecaoImagemUrl = null, semBorda = false, destino = null } = opcoes;

    const li = document.createElement("li");
    const classeAvatar = `preview-avatar${semBorda ? " preview-avatar-sem-borda" : ""}`;
    const avatar = fotoUrl
        ? `<img src="${fotoUrl}" alt="" class="foto-jogador ${classeAvatar}">`
        : `<div class="foto-jogador foto-jogador-vazia ${classeAvatar}"></div>`;

    const iconeSelecao = selecaoImagemUrl
        ? `<img src="${selecaoImagemUrl}" alt="" class="preview-selecao-icone">`
        : "";

    li.innerHTML = `
        ${avatar}
        <span class="preview-nome">${nome}</span>
        ${iconeSelecao}
        ${grupoOuSelecao ? `<span class="tag-grupo">${grupoOuSelecao}</span>` : ""}
        <span class="preview-valor">${valor}</span>
    `;

    if (destino) {
        li.classList.add("item-clicavel");
        li.addEventListener("click", () => {
            window.location.href = destino;
        });
    }

    return li;
}

function mostrarErroListaDestaque(elemento) {
    elemento.innerHTML = `<li class="erro-carregamento">Não consegui carregar. A API está rodando?</li>`;
}

async function carregarDestaqueArtilheiros() {
    const lista = document.getElementById("rank-lista-artilheiros");
    try {
        const dados = await buscarJson("/api/jogadores/artilheiros?limite=5");
        lista.innerHTML = "";
        dados.forEach((j) => lista.appendChild(criarItemPreview(
            j.foto_url, j.nome, `${j.gols} gols`, null,
            { selecaoImagemUrl: j.escudo_url || j.bandeira_url, destino: urlPerfilJogador(j.id) }
        )));
    } catch (erro) {
        mostrarErroListaDestaque(lista);
        console.error(erro);
    }
}

async function carregarDestaqueValiosos() {
    const lista = document.getElementById("rank-lista-valiosos");
    try {
        const dados = await buscarJson("/api/jogadores/mais-valiosos?limite=5");
        lista.innerHTML = "";
        dados.forEach((j) => lista.appendChild(criarItemPreview(
            j.foto_url, j.nome, j.valor_mercado, null,
            { selecaoImagemUrl: j.escudo_url || j.bandeira_url, destino: urlPerfilJogador(j.id) }
        )));
    } catch (erro) {
        mostrarErroListaDestaque(lista);
        console.error(erro);
    }
}

async function carregarDestaqueAssistencias() {
    const lista = document.getElementById("rank-lista-assistencias");
    try {
        const dados = await buscarJson("/api/jogadores/assistencias?limite=5");
        lista.innerHTML = "";
        dados.forEach((j) => lista.appendChild(criarItemPreview(
            j.foto_url, j.nome, `${j.assistencias} assist.`, null,
            { selecaoImagemUrl: j.escudo_url || j.bandeira_url, destino: urlPerfilJogador(j.id) }
        )));
    } catch (erro) {
        mostrarErroListaDestaque(lista);
        console.error(erro);
    }
}

async function carregarDestaqueFifa() {
    const lista = document.getElementById("rank-lista-fifa");
    try {
        const dados = await buscarJson("/api/ranking-fifa");
        lista.innerHTML = "";
        dados.slice(0, 5).forEach((r) => {
            const imagemUrl = r.escudo_url || r.bandeira_url;
            const titulos = r.titulos_mundiais > 0
                ? `<img src="/static/assets/tema/taca-copa.png" alt="Título Mundial" class="icone-taca-preview">× ${r.titulos_mundiais}`
                : "—";
            lista.appendChild(criarItemPreview(
                imagemUrl, `${r.posicao}º ${r.selecao}`, titulos, null,
                { semBorda: true, destino: urlPerfilSelecao(r.selecao) }
            ));
        });
    } catch (erro) {
        mostrarErroListaDestaque(lista);
        console.error(erro);
    }
}

function mostrarTelaDeDestaques() {
    marcarItemAtivo(null);
    document.getElementById("rankings-destaques").hidden = false;
    document.getElementById("card-grafico-valorizacao").hidden = true;
    document.getElementById("card-ranking").hidden = true;
}

function carregarDestaques() {
    carregarDestaqueArtilheiros();
    carregarDestaqueValiosos();
    carregarDestaqueAssistencias();
    carregarDestaqueFifa();
}

const GRUPOS_DE_RANKING = [
    {
        titulo: "Jogadores",
        itens: [
            { id: "artilheiros",       tipo: "jogador-completo", rotulo: "Artilheiros",        url: "/api/jogadores/artilheiros?limite=50", campoValor: "gols", rotuloValor: "GOLS" },
            { id: "assistencias",      tipo: "jogador-completo", rotulo: "Assistências",       url: "/api/jogadores/assistencias?limite=50", campoValor: "assistencias", rotuloValor: "ASSISTÊNCIAS" },
            { id: "ga",                tipo: "jogador-completo", rotulo: "G/A", url: "/api/jogadores/ga?limite=50", campoValor: "ga", rotuloValor: "G+A" },
            { id: "cartoes-amarelos",  tipo: "jogador-completo", rotulo: "Cartões Amarelos",    url: "/api/jogadores/cartoes?tipo=amarelos&limite=50", campoValor: "cartoes", rotuloValor: "CARTÕES", iconeClasse: "icone-cartao-amarelo" },
            { id: "cartoes-vermelhos", tipo: "jogador-completo", rotulo: "Cartões Vermelhos",   url: "/api/jogadores/cartoes?tipo=vermelhos&limite=50", campoValor: "cartoes", rotuloValor: "CARTÕES", iconeClasse: "icone-cartao-vermelho" },
            { id: "defesas",           tipo: "jogador-completo", rotulo: "Goleiros Com Mais Defesas",  url: "/api/goleiros/defesas?limite=50", campoValor: "defesas", rotuloValor: "DEFESAS", ocultarPosicao: true },
            { id: "mais-velhos",       tipo: "jogador-idade", rotulo: "Jogadores Mais Velhos",         url: "/api/jogadores/mais-velhos?limite=50", campoValor: "idade", rotuloValor: "IDADE" },
            { id: "mais-novos",        tipo: "jogador-idade", rotulo: "Jogadores Mais Novos",         url: "/api/jogadores/mais-novos?limite=50", campoValor: "idade", rotuloValor: "IDADE" },
        ],
    },
    {
        titulo: "Mercado",
        itens: [
            { id: "mais-valiosos",  tipo: "jogador-valioso", rotulo:"Mais Valiosos",       url: "/api/jogadores/mais-valiosos?limite=50", campoValor: "valor_mercado", rotuloValor: "VALOR" },
            { id: "valorizaram",    tipo: "valorizacao",  rotulo:"Maiores Valorizações", tituloCard: "Valorização Completa — Antes x Depois da Copa", url: "/api/valorizacao/top?tipo=valorizaram&limite=100" },
        ],
    },
    {
        titulo: "Curiosidades & Seleções",
        itens: [
            { id: "gols-contra",       tipo: "gols-contra",  rotulo: "Gols Contra",   url: "/api/gols-contra" },
            { id: "clubes",            tipo: "clube",        rotulo: "Clubes (G+A)", url: "/api/clubes/participacoes?metrica=ga", rotuloColuna: "G+A" },
            { id: "clubes-convocados", tipo: "clube",        rotulo: "Clubes Com Mais Convocados", url: "/api/clubes/mais-convocados", rotuloColuna: "JOGADORES" },
            { id: "melhor-ataque",     tipo: "selecao-gols", rotulo: "Seleções — Melhor Ataque", url: "/api/selecoes/melhor-ataque", campoValor: "gols_marcados", campoMedia: "media_marcados", rotuloValor: "GOLS MARCADOS" },
            { id: "melhor-defesa",     tipo: "selecao-gols", rotulo: "Seleções — Melhor Defesa", url: "/api/selecoes/melhor-defesa", campoValor: "gols_sofridos", campoMedia: "media_sofridos", rotuloValor: "GOLS SOFRIDOS" },
            { id: "melhores-terceiros", tipo: "terceiros",   rotulo: "Melhores Terceiros Colocados", tituloCard: "Melhores Terceiros Colocados", url: "/api/classificacao/melhores-terceiros" },
            { id: "fifa",              tipo: "fifa",         rotulo: "Ranking FIFA", url: "/api/ranking-fifa" },
        ],
    },
];

const TODOS_OS_ITENS = GRUPOS_DE_RANKING.flatMap((grupo) => grupo.itens);

function montarMenu() {
    const menu = document.getElementById("rankings-menu");
    menu.innerHTML = "";

    GRUPOS_DE_RANKING.forEach((grupo) => {
        const tituloGrupo = document.createElement("div");
        tituloGrupo.className = "rankings-menu-grupo-titulo";
        tituloGrupo.textContent = grupo.titulo;
        menu.appendChild(tituloGrupo);

        grupo.itens.forEach((item) => {
            const botao = document.createElement("button");
            botao.className = "rankings-menu-item";
            botao.textContent = item.rotulo;
            botao.dataset.id = item.id;
            botao.addEventListener("click", () => carregarRanking(item));
            menu.appendChild(botao);
        });
    });
}

function marcarItemAtivo(id) {
    document.querySelectorAll(".rankings-menu-item").forEach((botao) => {
        botao.classList.toggle("ativo", id !== null && botao.dataset.id === id);
    });
}

function renderizarCabecalho(colunas) {
    const cabecalho = document.getElementById("cabecalho-ranking");
    cabecalho.innerHTML = `<tr>${colunas.map((c) => `<th class="${c.classe || ''}">${c.titulo}</th>`).join("")}</tr>`;
}

function renderizarJogadores(dados, ranking) {
    renderizarCabecalho([
        { titulo: "#", classe: "col-pos" },
        { titulo: "JOGADOR", classe: "col-jogador" },
        { titulo: ranking.rotuloValor, classe: "th-centralizado" },
        { titulo: "SELEÇÃO" },
        { titulo: "CLUBE", classe: "col-clube" },
    ]);

    const corpo = document.getElementById("corpo-ranking");
    corpo.innerHTML = "";
    dados.forEach((j, indice) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-pos">${indice + 1}º</td>
            <td class="col-jogador">
                <div class="jogador-container">
                    ${j.foto_url ? `<img src="${j.foto_url}" alt="${j.nome}" class="foto-jogador">` : `<div class="foto-jogador foto-jogador-vazia"></div>`}
                    <a href="${urlPerfilJogador(j.id)}" class="link-jogador" title="${j.nome}">${j.nome}</a>
                </div>
            </td>
            <td class="col-valor-destaque">${j[ranking.campoValor] ?? "—"}</td>
            <td><div class="selecao-container">${bandeiraOuEscudo(j)}${j.selecao ? `<a href="${urlPerfilSelecao(j.selecao)}" class="link-selecao" title="${j.selecao}">${j.selecao}</a>` : "—"}</div></td>
            <td class="col-clube">
                <div class="clube-container">
                    ${j.logo_clube_url ? `<img src="${j.logo_clube_url}" alt="${j.clube_atual || ''}" class="logo-clube">` : ""}
                    <span title="${j.clube_atual || ''}">${j.clube_atual || "—"}</span>
                </div>
            </td>
        `;
        corpo.appendChild(tr);
    });
}

function renderizarJogadoresCompleto(dados, ranking) {
    const semPosicao = !!ranking.ocultarPosicao;

    const colunas = [
        { titulo: "#", classe: "col-pos" },
        { titulo: "JOGADOR", classe: "col-jogador" },
        { titulo: ranking.rotuloValor, classe: "th-centralizado" },
        { titulo: "JOGOS" },
    ];
    if (!semPosicao) colunas.push({ titulo: "POSIÇÃO" });
    colunas.push({ titulo: "SELEÇÃO" }, { titulo: "CLUBE", classe: "col-clube" });
    renderizarCabecalho(colunas);

    const corpo = document.getElementById("corpo-ranking");
    corpo.innerHTML = "";
    dados.forEach((j, indice) => {
        const valor = j[ranking.campoValor] ?? "—";
        const valorHtml = ranking.iconeClasse
            ? `<span class="valor-com-icone"><span class="icone-cartao ${ranking.iconeClasse}"></span>${valor}</span>`
            : valor;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-pos">${indice + 1}º</td>
            <td class="col-jogador">
                <div class="jogador-container">
                    ${j.foto_url ? `<img src="${j.foto_url}" alt="${j.nome}" class="foto-jogador">` : `<div class="foto-jogador foto-jogador-vazia"></div>`}
                    <a href="${urlPerfilJogador(j.id)}" class="link-jogador" title="${j.nome}">${j.nome}</a>
                </div>
            </td>
            <td class="col-valor-destaque">${valorHtml}</td>
            <td class="dado-numero">${j.jogos ?? "—"}</td>
            ${semPosicao ? "" : `<td>${j.posicao || "—"}</td>`}
            <td><div class="selecao-container">${bandeiraOuEscudo(j)}${j.selecao ? `<a href="${urlPerfilSelecao(j.selecao)}" class="link-selecao" title="${j.selecao}">${j.selecao}</a>` : "—"}</div></td>
            <td class="col-clube">
                <div class="clube-container">
                    ${j.logo_clube_url ? `<img src="${j.logo_clube_url}" alt="${j.clube_atual || ''}" class="logo-clube">` : ""}
                    <span title="${j.clube_atual || ''}">${j.clube_atual || "—"}</span>
                </div>
            </td>
        `;
        corpo.appendChild(tr);
    });
}

function renderizarJogadoresValioso(dados, ranking) {
    renderizarCabecalho([
        { titulo: "#", classe: "col-pos" },
        { titulo: "JOGADOR", classe: "col-jogador" },
        { titulo: ranking.rotuloValor, classe: "th-centralizado" },
        { titulo: "POSIÇÃO" },
        { titulo: "SELEÇÃO" },
        { titulo: "CLUBE", classe: "col-clube" },
    ]);

    const corpo = document.getElementById("corpo-ranking");
    corpo.innerHTML = "";
    dados.forEach((j, indice) => {
        const valor = j[ranking.campoValor] ?? "—";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-pos">${indice + 1}º</td>
            <td class="col-jogador">
                <div class="jogador-container">
                    ${j.foto_url ? `<img src="${j.foto_url}" alt="${j.nome}" class="foto-jogador">` : `<div class="foto-jogador foto-jogador-vazia"></div>`}
                    <a href="${urlPerfilJogador(j.id)}" class="link-jogador" title="${j.nome}">${j.nome}</a>
                </div>
            </td>
            <td class="col-valor-destaque">${valor}</td>
            <td>${j.posicao || "—"}</td>
            <td><div class="selecao-container">${bandeiraOuEscudo(j)}${j.selecao ? `<a href="${urlPerfilSelecao(j.selecao)}" class="link-selecao" title="${j.selecao}">${j.selecao}</a>` : "—"}</div></td>
            <td class="col-clube">
                <div class="clube-container">
                    ${j.logo_clube_url ? `<img src="${j.logo_clube_url}" alt="${j.clube_atual || ''}" class="logo-clube">` : ""}
                    <span title="${j.clube_atual || ''}">${j.clube_atual || "—"}</span>
                </div>
            </td>
        `;
        corpo.appendChild(tr);
    });
}

function renderizarJogadoresIdade(dados, ranking) {
    renderizarCabecalho([
        { titulo: "#", classe: "col-pos" },
        { titulo: "JOGADOR", classe: "col-jogador" },
        { titulo: ranking.rotuloValor, classe: "th-centralizado" },
        { titulo: "POSIÇÃO" },
        { titulo: "VALOR" },
        { titulo: "SELEÇÃO" },
        { titulo: "CLUBE", classe: "col-clube" },
    ]);

    const corpo = document.getElementById("corpo-ranking");
    corpo.innerHTML = "";
    dados.forEach((j, indice) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-pos">${indice + 1}º</td>
            <td class="col-jogador">
                <div class="jogador-container">
                    ${j.foto_url ? `<img src="${j.foto_url}" alt="${j.nome}" class="foto-jogador">` : `<div class="foto-jogador foto-jogador-vazia"></div>`}
                    <a href="${urlPerfilJogador(j.id)}" class="link-jogador" title="${j.nome}">${j.nome}</a>
                </div>
            </td>
            <td class="col-valor-destaque">${j[ranking.campoValor] ?? "—"}</td>
            <td>${j.posicao || "—"}</td>
            <td>${j.valor_mercado || "—"}</td>
            <td><div class="selecao-container">${bandeiraOuEscudo(j)}${j.selecao ? `<a href="${urlPerfilSelecao(j.selecao)}" class="link-selecao" title="${j.selecao}">${j.selecao}</a>` : "—"}</div></td>
            <td class="col-clube">
                <div class="clube-container">
                    ${j.logo_clube_url ? `<img src="${j.logo_clube_url}" alt="${j.clube_atual || ''}" class="logo-clube">` : ""}
                    <span title="${j.clube_atual || ''}">${j.clube_atual || "—"}</span>
                </div>
            </td>
        `;
        corpo.appendChild(tr);
    });
}

function formatarDeltaEuro(valor) {
    const sinal = valor >= 0 ? "+" : "-";
    const abs = Math.abs(valor);
    let texto;
    if (abs >= 1_000_000) {
        const milhoes = abs / 1_000_000;
        texto = `${Number.isInteger(milhoes) ? milhoes.toFixed(0) : milhoes.toFixed(1)}M €`;
    } else if (abs >= 1_000) {
        const milhares = abs / 1_000;
        texto = `${Number.isInteger(milhares) ? milhares.toFixed(0) : milhares.toFixed(1)}K €`;
    } else {
        texto = `${abs.toFixed(0)} €`;
    }
    return `${sinal}${texto}`;
}

function renderizarValorizacao(dados) {
    renderizarCabecalho([
        { titulo: "#", classe: "col-pos" },
        { titulo: "JOGADOR", classe: "col-jogador" },
        { titulo: "VARIAÇÃO", classe: "th-centralizado" },
        { titulo: "VALOR INICIAL", classe: "th-centralizado" },
        { titulo: "VALOR FINAL", classe: "th-centralizado" },
        { titulo: "SELEÇÃO" },
        { titulo: "CLUBE", classe: "col-clube" },
    ]);

    document.getElementById("tabela-ranking").classList.add("tabela-valorizacao");

    const corpo = document.getElementById("corpo-ranking");
    corpo.innerHTML = "";

    if (dados.length === 0) {
        corpo.innerHTML = `<tr><td colspan="7" class="item-carregando">Nenhum jogador nessa categoria ainda.</td></tr>`;
        montarGraficoValorizacao([]);
        return;
    }

    dados.forEach((j, indice) => {
        const subiu = j.delta_abs >= 0;
        const variacaoTexto = `${formatarDeltaEuro(j.delta_abs)} (${subiu ? "+" : ""}${j.delta_pct.toFixed(1)}%)`;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-pos">${indice + 1}º</td>
            <td class="col-jogador">
                <div class="jogador-container">
                    ${j.foto_url ? `<img src="${j.foto_url}" alt="${j.nome}" class="foto-jogador">` : `<div class="foto-jogador foto-jogador-vazia"></div>`}
                    <a href="${urlPerfilJogador(j.id)}" class="link-jogador" title="${j.nome}">${j.nome}</a>
                </div>
            </td>
            <td class="${subiu ? "valor-subiu" : "valor-desceu"}">${variacaoTexto}</td>
            <td class="col-valor-secundario">${j.valor_inicial_txt}</td>
            <td class="col-valor-destaque">${j.valor_final_txt}</td>
            <td><div class="selecao-container">${bandeiraOuEscudo(j)}${j.selecao ? `<a href="${urlPerfilSelecao(j.selecao)}" class="link-selecao" title="${j.selecao}">${j.selecao}</a>` : "—"}</div></td>
            <td class="col-clube">
                <div class="clube-container">
                    ${j.logo_clube_url ? `<img src="${j.logo_clube_url}" alt="${j.clube_atual || ''}" class="logo-clube">` : ""}
                    <span title="${j.clube_atual || ''}">${j.clube_atual || "—"}</span>
                </div>
            </td>
        `;
        corpo.appendChild(tr);
    });

    montarGraficoValorizacao(dados);
}

const SVG_NS_RANKINGS = "http://www.w3.org/2000/svg";

function elSvg(tag, atributos = {}) {
    const node = document.createElementNS(SVG_NS_RANKINGS, tag);
    for (const [chave, valor] of Object.entries(atributos)) {
        node.setAttribute(chave, valor);
    }
    return node;
}

function montarGraficoValorizacao(dados) {
    const card = document.getElementById("card-grafico-valorizacao");
    const wrap = document.getElementById("grafico-valorizacao-svg");
    if (!card || !wrap) return;

    const top10 = dados.slice(0, 10);

    if (top10.length === 0) {
        card.hidden = true;
        return;
    }
    card.hidden = false;
    wrap.innerHTML = "";

    const LARGURA = 1000;
    const MARGEM_ESQ = 190;
    const MARGEM_DIR = 40;
    const MARGEM_TOPO = 16;
    const ALTURA_LINHA = 38;
    const larguraGrafico = LARGURA - MARGEM_ESQ - MARGEM_DIR;
    const alturaGrafico = top10.length * ALTURA_LINHA;
    const ALTURA_TOTAL = MARGEM_TOPO + alturaGrafico + 50;

    const maiorValorM = Math.max(...top10.map((d) => d.delta_abs / 1_000_000));
    const eixoMax = Math.max(5, Math.ceil(maiorValorM / 5) * 5);
    const passo = eixoMax / 7 <= 5 ? 5 : Math.ceil(eixoMax / 7 / 5) * 5;

    const svg = elSvg("svg", {
        viewBox: `0 0 ${LARGURA} ${ALTURA_TOTAL}`,
        class: "grafico-svg",
        role: "img",
        "aria-label": "Gráfico das maiores valorizações",
    });

    for (let v = 0; v <= eixoMax; v += passo) {
        const x = MARGEM_ESQ + (v / eixoMax) * larguraGrafico;
        svg.appendChild(elSvg("line", {
            x1: x, y1: MARGEM_TOPO, x2: x, y2: MARGEM_TOPO + alturaGrafico, class: "grafico-grade",
        }));
        const label = elSvg("text", {
            x, y: MARGEM_TOPO + alturaGrafico + 24, "text-anchor": "middle", class: "grafico-eixo-label",
        });
        label.textContent = v;
        svg.appendChild(label);
    }

    top10.forEach((d, i) => {
        const y = MARGEM_TOPO + i * ALTURA_LINHA;
        const valorM = d.delta_abs / 1_000_000;
        const larguraBarra = Math.max(2, (valorM / eixoMax) * larguraGrafico);

        const nomeLabel = elSvg("text", {
            x: MARGEM_ESQ - 14, y: y + ALTURA_LINHA / 2 + 5, "text-anchor": "end", class: "grafico-nome-label",
        });
        nomeLabel.textContent = d.nome;
        svg.appendChild(nomeLabel);

        svg.appendChild(elSvg("rect", {
            x: MARGEM_ESQ, y: y + 6, width: larguraBarra, height: ALTURA_LINHA - 14, rx: 3, class: "grafico-barra",
        }));
    });

    const eixoTitulo = elSvg("text", {
        x: MARGEM_ESQ + larguraGrafico / 2, y: MARGEM_TOPO + alturaGrafico + 46, "text-anchor": "middle", class: "grafico-eixo-titulo",
    });
    eixoTitulo.textContent = "Variação (M €)";
    svg.appendChild(eixoTitulo);

    wrap.appendChild(svg);
}

function renderizarGolsContra(dados) {
    renderizarCabecalho([
        { titulo: "#", classe: "col-pos" },
        { titulo: "JOGADOR", classe: "col-jogador" },
        { titulo: "SELEÇÃO", classe: "col-selecao" },
        { titulo: "JOGO" },
        { titulo: "FASE" },
    ]);

    const corpo = document.getElementById("corpo-ranking");
    corpo.innerHTML = "";
    dados.forEach((g, indice) => {
        const imagemCasa = g.escudo_casa_url || g.bandeira_casa_url;
        const imagemFora = g.escudo_fora_url || g.bandeira_fora_url;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-pos">${indice + 1}º</td>
            <td class="col-jogador">
                <div class="jogador-container">
                    ${g.foto_url ? `<img src="${g.foto_url}" alt="${g.nome}" class="foto-jogador">` : `<div class="foto-jogador foto-jogador-vazia"></div>`}
                    ${g.jogador_id ? `<a href="${urlPerfilJogador(g.jogador_id)}" class="link-jogador">${g.nome}</a>` : `<span>${g.nome}</span>`}
                </div>
            </td>
            <td class="col-selecao"><div class="selecao-container">${bandeiraOuEscudo(g)}<a href="${urlPerfilSelecao(g.selecao)}" class="link-selecao">${g.selecao}</a></div></td>
            <td>
                <div class="confronto-mini">
                    ${imagemCasa ? `<img src="${imagemCasa}" alt="${g.casa}" class="bandeira-tabela" title="${g.casa}">` : ""}
                    <span class="confronto-mini-placar">${g.gols_casa} × ${g.gols_fora}</span>
                    ${imagemFora ? `<img src="${imagemFora}" alt="${g.fora}" class="bandeira-tabela" title="${g.fora}">` : ""}
                </div>
            </td>
            <td><span class="tag-grupo">${g.fase}</span></td>
        `;
        corpo.appendChild(tr);
    });
}

function renderizarSelecoesGols(dados, ranking) {
    renderizarCabecalho([
        { titulo: "#", classe: "col-pos" },
        { titulo: "SELEÇÃO", classe: "col-selecao" },
        { titulo: ranking.rotuloValor, classe: "th-centralizado" },
        { titulo: "JOGOS", classe: "th-centralizado" },
    ]);

    const corpo = document.getElementById("corpo-ranking");
    corpo.innerHTML = "";
    dados.forEach((s, indice) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-pos">${indice + 1}º</td>
            <td class="col-selecao">
                <div class="selecao-container">
                    ${bandeiraOuEscudo(s)}
                    <a href="${urlPerfilSelecao(s.selecao)}" class="link-selecao">${s.selecao}</a>
                </div>
            </td>
            <td class="col-valor-destaque">${s[ranking.campoValor] ?? "—"}</td>
            <td class="dado-numero">${s.jogos ?? "—"}</td>
        `;
        corpo.appendChild(tr);
    });
}

function renderizarTerceiros(dados) {
    renderizarCabecalho([
        { titulo: "#", classe: "col-pos" },
        { titulo: "GRUPO" },
        { titulo: "SELEÇÃO", classe: "col-selecao" },
        { titulo: "P", classe: "th-centralizado" },
        { titulo: "V", classe: "th-centralizado" },
        { titulo: "E", classe: "th-centralizado" },
        { titulo: "D", classe: "th-centralizado" },
        { titulo: "SG", classe: "th-centralizado" },
        { titulo: "SITUAÇÃO" },
    ]);

    const corpo = document.getElementById("corpo-ranking");
    corpo.innerHTML = "";

    dados.forEach((t) => {
        const saldoComSinal = t.saldo_gols > 0 ? `+${t.saldo_gols}` : `${t.saldo_gols}`;
        const tr = document.createElement("tr");
        tr.className = t.classificado ? "linha-classificada" : "";
        tr.innerHTML = `
            <td class="col-pos">${t.posicao_geral}º</td>
            <td><span class="tag-grupo">${t.grupo}</span></td>
            <td class="col-selecao">
                <div class="selecao-container">
                    ${bandeiraOuEscudo(t)}
                    <a href="${urlPerfilSelecao(t.selecao)}" class="link-selecao">${t.selecao}</a>
                </div>
            </td>
            <td class="dado-numero">${t.pontos}</td>
            <td class="dado-numero">${t.vitorias}</td>
            <td class="dado-numero">${t.empates}</td>
            <td class="dado-numero">${t.derrotas}</td>
            <td class="dado-numero">${saldoComSinal}</td>
            <td>
                ${t.classificado
                    ? `<span class="tag-top tag-situacao tag-situacao-classificado">CLASSIFICADO</span>`
                    : `<span class="tag-top tag-situacao tag-situacao-eliminado">ELIMINADO</span>`}
            </td>
        `;
        corpo.appendChild(tr);
    });
}

function renderizarClubes(dados, rotuloColuna = "TOTAL") {
    renderizarCabecalho([
        { titulo: "#", classe: "col-pos" },
        { titulo: "CLUBE", classe: "col-clube" },
        { titulo: rotuloColuna },
    ]);

    const corpo = document.getElementById("corpo-ranking");
    corpo.innerHTML = "";
    dados.forEach((c, indice) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-pos">${indice + 1}º</td>
            <td class="col-clube">
                <div class="clube-container">
                    ${c.logo_clube_url ? `<img src="${c.logo_clube_url}" alt="${c.clube}" class="logo-clube">` : ""}
                    <span>${c.clube}</span>
                </div>
            </td>
            <td class="col-valor-destaque">${c.total}</td>
        `;
        corpo.appendChild(tr);
    });
}

function renderizarFifa(dados) {
    renderizarCabecalho([
        { titulo: "#", classe: "col-pos" },
        { titulo: "SELEÇÃO", classe: "col-selecao" },
        { titulo: "TÍTULOS MUNDIAIS", classe: "th-centralizado" },
    ]);

    const corpo = document.getElementById("corpo-ranking");
    corpo.innerHTML = "";
    dados.forEach((r) => {
        const titulos = r.titulos_mundiais > 0
            ? `<img src="/static/assets/tema/taca-copa.png" alt="Título Mundial" class="icone-taca">× ${r.titulos_mundiais}`
            : "—";
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-pos">${r.posicao}º</td>
            <td class="col-selecao"><div class="selecao-container">${bandeiraOuEscudo(r)}<a href="${urlPerfilSelecao(r.selecao)}" class="link-selecao">${r.selecao}</a></div></td>
            <td class="col-valor-destaque">${titulos}</td>
        `;
        corpo.appendChild(tr);
    });
}

const RENDERIZADORES = {
    "jogador": renderizarJogadores,
    "jogador-completo": renderizarJogadoresCompleto,
    "jogador-valioso": renderizarJogadoresValioso,
    "jogador-idade": renderizarJogadoresIdade,
    "valorizacao": renderizarValorizacao,
    "gols-contra": renderizarGolsContra,
    "clube": renderizarClubes,
    "selecao-gols": renderizarSelecoesGols,
    "terceiros": renderizarTerceiros,
    "fifa": renderizarFifa,
};

const CONFIG_FILTRO_CLUBES = {
    ga: "G+A",
    gols: "GOLS",
    assistencias: "ASSISTÊNCIAS",
};

async function aplicarFiltroClubes(filtro) {
    document.querySelectorAll(".ga-filtro-btn").forEach((botao) => {
        botao.classList.toggle("ativo", botao.dataset.filtro === filtro);
    });

    const corpo = document.getElementById("corpo-ranking");
    corpo.innerHTML = `<tr><td class="item-carregando">Carregando…</td></tr>`;

    try {
        const dados = await buscarJson(`/api/clubes/participacoes?metrica=${filtro}`);
        document.getElementById("contador-ranking").textContent = `${dados.length} REGISTRO(S)`;
        renderizarClubes(dados, CONFIG_FILTRO_CLUBES[filtro]);
    } catch (erro) {
        corpo.innerHTML = `<tr><td class="erro-carregamento">Não consegui carregar este ranking. A API está rodando? (${erro.message})</td></tr>`;
        console.error("Erro ao filtrar clubes:", erro);
    }
}

document.getElementById("ga-filtro").addEventListener("click", (evento) => {
    const botao = evento.target.closest(".ga-filtro-btn");
    if (botao) aplicarFiltroClubes(botao.dataset.filtro);
});

async function carregarRanking(ranking) {
    document.getElementById("rankings-destaques").hidden = true;
    document.getElementById("card-ranking").hidden = false;

    marcarItemAtivo(ranking.id);

    document.getElementById("tabela-ranking").dataset.rankingId = ranking.id;

    const tituloTexto = ranking.tituloCard || ranking.rotulo;
    const iconeHtml = ranking.iconeClasse
        ? `<span class="icone-cartao ${ranking.iconeClasse}"></span>`
        : "";
    document.getElementById("titulo-ranking-ativo").innerHTML = `${iconeHtml}${tituloTexto}`;

    document.getElementById("contador-ranking").textContent = "";

    document.getElementById("tabela-ranking").classList.toggle(
        "tabela-jogador-completo",
        ranking.tipo === "jogador-completo"
    );
    document.getElementById("tabela-ranking").classList.toggle(
        "tabela-jogador-idade",
        ranking.tipo === "jogador-idade"
    );
    document.getElementById("tabela-ranking").classList.toggle(
        "tabela-jogador-valioso",
        ranking.tipo === "jogador-valioso"
    );
    document.getElementById("tabela-ranking").classList.toggle(
        "tabela-sem-posicao",
        !!ranking.ocultarPosicao
    );
    document.getElementById("tabela-ranking").classList.toggle(
        "tabela-valorizacao",
        ranking.tipo === "valorizacao"
    );
    document.getElementById("tabela-ranking").classList.toggle(
        "tabela-estatistica-unica",
        ranking.tipo === "clube" || ranking.tipo === "fifa"
    );

    const cardGrafico = document.getElementById("card-grafico-valorizacao");
    if (cardGrafico && ranking.tipo !== "valorizacao") cardGrafico.hidden = true;

    const disclaimer = document.getElementById("disclaimer-fonte");
    if (ranking.disclaimer) {
        disclaimer.textContent = ranking.disclaimer;
        disclaimer.hidden = false;
    } else {
        disclaimer.hidden = true;
    }

    document.getElementById("ga-filtro").hidden = ranking.id !== "clubes";
    if (ranking.id === "clubes") {
        document.querySelectorAll(".ga-filtro-btn").forEach((botao) => {
            botao.classList.toggle("ativo", botao.dataset.filtro === "ga");
        });
    }

    const corpo = document.getElementById("corpo-ranking");
    corpo.innerHTML = `<tr><td class="item-carregando">Carregando…</td></tr>`;

    try {
        const dados = await buscarJson(ranking.url);
        document.getElementById("contador-ranking").textContent = `${dados.length} REGISTRO(S)`;
        if (ranking.tipo === "clube") {
            renderizarClubes(dados, ranking.rotuloColuna || "TOTAL");
        } else {
            RENDERIZADORES[ranking.tipo](dados, ranking);
        }
    } catch (erro) {
        corpo.innerHTML = `<tr><td class="erro-carregamento">Não consegui carregar este ranking. A API está rodando? (${erro.message})</td></tr>`;
        console.error("Erro ao carregar ranking:", ranking.id, erro);
    }
}

function iniciarRankings() {
    try {
        montarMenu();
        mostrarTelaDeDestaques();
        carregarDestaques();
    } catch (erro) {

        const menu = document.getElementById("rankings-menu");
        if (menu) {
            menu.innerHTML = `<p class="erro-carregamento">Erro ao montar o menu: ${erro.message}</p>`;
        }
        console.error("Erro ao iniciar a página de rankings:", erro);
    }
}

iniciarRankings();