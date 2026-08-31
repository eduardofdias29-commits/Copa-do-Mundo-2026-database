const SVG_NS_PERFIL = "http://www.w3.org/2000/svg";

const POSICAO_NO_CAMPO = {
    GOL: { x: 0.07, y: 0.5 },
    ZAG: { x: 0.22, y: 0.5 },
    LD:  { x: 0.32, y: 0.82 },
    LE:  { x: 0.32, y: 0.18 },
    VOL: { x: 0.44, y: 0.5 },
    MC:  { x: 0.52, y: 0.5 },
    MD:  { x: 0.56, y: 0.76 },
    ME:  { x: 0.56, y: 0.24 },
    MEI: { x: 0.63, y: 0.5 },
    PD:  { x: 0.8, y: 0.82 },
    PE:  { x: 0.8, y: 0.18 },
    ATA: { x: 0.87, y: 0.5 },
};

const NOME_POSICAO = {
    GOL: "Goleiro",
    ZAG: "Zagueiro",
    LD: "Lateral Direito",
    LE: "Lateral Esquerdo",
    VOL: "Volante",
    MC: "Meio-Campista",
    MEI: "Meia Ofensivo",
    ME: "Meia Esquerda",
    MD: "Meia Direita",
    ATA: "Atacante",
    PD: "Ponta Direita",
    PE: "Ponta Esquerda",
};

function el(tag, atributos = {}) {
    const node = document.createElementNS(SVG_NS_PERFIL, tag);
    for (const [chave, valor] of Object.entries(atributos)) {
        node.setAttribute(chave, valor);
    }
    return node;
}

async function buscarJson(caminho) {
    const resposta = await fetch(caminho);
    if (!resposta.ok) {
        throw new Error(`A API respondeu com erro ${resposta.status} em ${caminho}`);
    }
    return resposta.json();
}

function montarCampoTatico(posicao) {
    const LARGURA = 300;
    const ALTURA = 200;

    const svg = el("svg", {
        viewBox: `0 0 ${LARGURA} ${ALTURA}`,
        class: "campo-tatico-svg",
        role: "img",
        "aria-label": `Posição em campo: ${NOME_POSICAO[posicao] || posicao || "não informada"}`,
    });

    svg.appendChild(el("rect", { x: 2, y: 2, width: LARGURA - 4, height: ALTURA - 4, rx: 6, class: "campo-fundo" }));
    svg.appendChild(el("line", { x1: LARGURA / 2, y1: 4, x2: LARGURA / 2, y2: ALTURA - 4, class: "campo-linha" }));
    svg.appendChild(el("circle", { cx: LARGURA / 2, cy: ALTURA / 2, r: 28, class: "campo-linha", fill: "none" }));
    svg.appendChild(el("circle", { cx: LARGURA / 2, cy: ALTURA / 2, r: 2, class: "campo-ponto" }));

    svg.appendChild(el("rect", { x: 4, y: 55, width: 42, height: 90, class: "campo-linha", fill: "none" }));
    svg.appendChild(el("rect", { x: 4, y: 78, width: 16, height: 44, class: "campo-linha", fill: "none" }));
    svg.appendChild(el("rect", { x: LARGURA - 46, y: 55, width: 42, height: 90, class: "campo-linha", fill: "none" }));
    svg.appendChild(el("rect", { x: LARGURA - 20, y: 78, width: 16, height: 44, class: "campo-linha", fill: "none" }));

    const pos = POSICAO_NO_CAMPO[posicao] || { x: 0.5, y: 0.5 };
    const px = 20 + pos.x * (LARGURA - 40);
    const py = 20 + pos.y * (ALTURA - 40);

    svg.appendChild(el("circle", { cx: px, cy: py, r: 10, class: "campo-marcador-anel", fill: "none" }));
    svg.appendChild(el("circle", { cx: px, cy: py, r: 6, class: "campo-marcador" }));

    return svg;
}

function preencherHeader(j) {
    document.getElementById("perfil-titulo-pagina").textContent = `Perfil — ${j.nome}`;
    document.title = `${j.nome} — Copa 2026`;

    const imagemUrl = j.escudo_url || j.bandeira_url;
    const header = document.getElementById("perfil-header");
    header.innerHTML = `
        ${j.foto_url ? `<img src="${j.foto_url}" alt="${j.nome}" class="perfil-foto">` : `<div class="perfil-foto perfil-foto-vazia"></div>`}
        <div class="perfil-info-principal">
            <h2 class="perfil-nome">${j.numero ? `<span class="perfil-numero">#${j.numero}</span>` : ""} ${j.nome}</h2>
            <div class="perfil-selecao-linha">
                ${imagemUrl ? `<img src="${imagemUrl}" alt="${j.selecao}" class="bandeira-tabela">` : ""}
                <span>${j.selecao}</span>
                <span class="perfil-ponto-separador">•</span>
                <span class="tag-grupo">${j.grupo}</span>
            </div>
        </div>
    `;
}

function preencherCorpo(j) {
    document.getElementById("perfil-posicao").textContent = NOME_POSICAO[j.posicao] || j.posicao || "—";
    document.getElementById("perfil-idade").textContent = j.idade ? `${j.idade} anos` : "—";

    const clubeEl = document.getElementById("perfil-clube");
    clubeEl.innerHTML = `
        ${j.logo_clube_url ? `<img src="${j.logo_clube_url}" alt="" class="logo-clube">` : ""}
        <span>${j.clube_atual || "Desconhecido"}</span>
    `;
    document.getElementById("perfil-meta-grid").hidden = false;

    document.getElementById("perfil-valor").textContent = j.valor_mercado_exibido || "—";
    document.getElementById("perfil-valor-secao").hidden = false;

    document.getElementById("perfil-stat-jogos").textContent = j.jogos ?? 0;
    document.getElementById("perfil-stat-gols").textContent = j.gols ?? 0;
    document.getElementById("perfil-stat-assistencias").textContent = j.assistencias ?? 0;
    document.getElementById("perfil-stat-amarelos").textContent = j.cartoes_amarelos ?? 0;
    document.getElementById("perfil-stat-vermelhos").textContent = j.cartoes_vermelhos ?? 0;
    document.getElementById("perfil-stats-grid").hidden = false;

    const campoWrap = document.getElementById("perfil-campo-wrap");
    campoWrap.innerHTML = "";
    campoWrap.appendChild(montarCampoTatico(j.posicao));

    document.getElementById("perfil-campo-card").hidden = false;
}

async function iniciarPerfil() {
    try {

        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const idDaUrl = pathParts[pathParts.length - 1];

        const idFinal = (typeof JOGADOR_ID !== 'undefined' && JOGADOR_ID) ? JOGADOR_ID : idDaUrl;

        if (!idFinal || isNaN(idFinal)) {
            console.warn("Nenhum JOGADOR_ID válido foi encontrado para carregar o perfil.");
            return;
        }

        const jogador = await buscarJson(`/api/jogadores/${idFinal}`);
        preencherHeader(jogador);
        preencherCorpo(jogador);

    } catch (erro) {
        document.getElementById("perfil-header").innerHTML =
            `<p class="erro-carregamento">Não consegui carregar esse jogador. A API está rodando?</p>`;
        console.error("Erro ao carregar perfil do jogador:", erro);
    }
}

document.addEventListener("DOMContentLoaded", iniciarPerfil);