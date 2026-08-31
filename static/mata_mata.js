const SVG_NS = "http://www.w3.org/2000/svg";
const LARGURA = 1400;
const ALTURA = 1650;
const MARGEM = 90;

const MOSTRAR_LINHAS = false;

const RAIO_ICONE = 30;

const CAMINHO_TROFEU_PNG = "/static/assets/tema/taca-copa.png";

const COLUNAS_LOCAIS = [0, 130, 260, 345, 450];

const ROTULOS_RODADAS = ["2ª FASE", "OITAVAS", "QUARTAS", "SEMI"];

function el(tag, atributos = {}, filhos = []) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [chave, valor] of Object.entries(atributos)) {
        node.setAttribute(chave, valor);
    }
    filhos.forEach((filho) => node.appendChild(filho));
    return node;
}

function comTitulo(node, texto) {
    const titulo = document.createElementNS(SVG_NS, "title");
    titulo.textContent = texto;
    node.appendChild(titulo);
    return node;
}

function analisarPlacar(str) {
    if (str == null || str === "-" || str === "") return { normal: null, penaltis: null };
    const s = String(str).trim();
    let m = s.match(/^(\d+)\((\d+)\)$/);
    if (m) return { normal: +m[1], penaltis: +m[2] };
    m = s.match(/^\((\d+)\)(\d+)$/);
    if (m) return { normal: +m[2], penaltis: +m[1] };
    m = s.match(/^(\d+)$/);
    if (m) return { normal: +m[1], penaltis: null };
    return { normal: null, penaltis: null };
}

function determinarVencedor(jogo) {
    if (jogo.casa === "A definir" || jogo.fora === "A definir") return null;
    const a = analisarPlacar(jogo.gols_casa);
    const b = analisarPlacar(jogo.gols_fora);
    if (a.normal == null || b.normal == null) return null;
    if (a.normal !== b.normal) return a.normal > b.normal ? jogo.casa : jogo.fora;
    if (a.penaltis != null && b.penaltis != null && a.penaltis !== b.penaltis) {
        return a.penaltis > b.penaltis ? jogo.casa : jogo.fora;
    }
    return null;
}

function formatarPlacarHtml(jogo) {
    const a = analisarPlacar(jogo.gols_casa);
    const b = analisarPlacar(jogo.gols_fora);
    if (a.normal == null || b.normal == null) return "vs";
    if (a.penaltis != null && b.penaltis != null) {
        return `${a.normal} <span class="rodada-placar-pen">(${a.penaltis}×${b.penaltis})</span> ${b.normal}`;
    }
    return `${a.normal}-${b.normal}`;
}

function xReal(lado, localX) {
    return lado === 1 ? MARGEM + localX : LARGURA - MARGEM - localX;
}

function gerarPadrao(n, parGap, grupoGap) {
    const arr = [];
    let y = 0;
    for (let i = 0; i < n; i++) {
        arr.push(y);
        y += i % 2 === 1 ? grupoGap : parGap;
    }
    return arr;
}

function calcularPosicoesY(y0, parGap, grupoGap, numFolhas) {
    const folhas = gerarPadrao(numFolhas, parGap, grupoGap).map((v) => v + y0);
    const niveis = [folhas];

    let centros = [];
    for (let i = 0; i < folhas.length / 2; i++) {
        centros.push((folhas[2 * i] + folhas[2 * i + 1]) / 2);
    }

    while (centros.length > 1) {

        const proximosCentros = [];
        for (let i = 0; i < centros.length / 2; i++) {
            proximosCentros.push((centros[2 * i] + centros[2 * i + 1]) / 2);
        }

        const posicoesDesteNivel = [];
        proximosCentros.forEach((c) => posicoesDesteNivel.push(c - parGap / 2, c + parGap / 2));
        niveis.push(posicoesDesteNivel);

        centros = proximosCentros;
    }

    niveis.push([centros[0]]);
    return niveis;
}

function desenharTime(svg, lado, x, y, nome, imagemUrl, decidido, venceu, id) {
    const raioIcone = RAIO_ICONE;

    const classeIcone = decidido && !venceu ? "bracket-icone bracket-icone-eliminado" : "bracket-icone";

    if (imagemUrl) {
        const icone = el("image", {
            href: imagemUrl,
            x: x - raioIcone,
            y: y - raioIcone,
            width: raioIcone * 2,
            height: raioIcone * 2,
            preserveAspectRatio: "xMidYMid meet",
            class: classeIcone,
        });
        svg.appendChild(comTitulo(icone, nome));
    } else {
        const vazio = el("circle", { cx: x, cy: y, r: raioIcone * 0.55, class: "bracket-escudo-vazio" });
        svg.appendChild(comTitulo(vazio, nome));
    }
}

function desenharConector(svg, xDe, xPara, yA, yB, jogo) {
    const vencedor = determinarVencedor(jogo);
    const decidido = vencedor !== null;
    const venceuA = decidido && vencedor === jogo.casa;
    const venceuB = decidido && vencedor === jogo.fora;

    const turnX = xDe + (xPara - xDe) * 0.55;
    const yMid = (yA + yB) / 2;

    if (MOSTRAR_LINHAS) {
        svg.appendChild(el("line", { x1: xDe, y1: yA, x2: turnX, y2: yA, class: `bracket-linha ${venceuA ? "bracket-linha-vencedor" : ""}` }));
        svg.appendChild(el("line", { x1: xDe, y1: yB, x2: turnX, y2: yB, class: `bracket-linha ${venceuB ? "bracket-linha-vencedor" : ""}` }));
        svg.appendChild(el("line", { x1: turnX, y1: yA, x2: turnX, y2: yB, class: `bracket-linha ${decidido ? "bracket-linha-vencedor" : ""}` }));
        svg.appendChild(el("line", { x1: turnX, y1: yMid, x2: xPara, y2: yMid, class: `bracket-linha ${decidido ? "bracket-linha-vencedor" : ""}` }));
    }
}

function desenharMetade(svg, lado, rodadas) {
    const numFolhas = rodadas[0].length * 2;
    const niveis = calcularPosicoesY(95, 74, 130, numFolhas);
    const xCols = COLUNAS_LOCAIS.map((lc) => xReal(lado, lc));

    rodadas.forEach((jogosDoNivel, nivel) => {
        jogosDoNivel.forEach((jogo, idx) => {
            const yA = niveis[nivel][2 * idx];
            const yB = niveis[nivel][2 * idx + 1];
            const vencedor = determinarVencedor(jogo);
            const decidido = vencedor !== null;

            desenharTime(svg, lado, xCols[nivel], yA, jogo.casa, jogo.escudo_casa_url || jogo.bandeira_casa_url, decidido, decidido && vencedor === jogo.casa, `${lado}-${nivel}-${idx}-a`);
            desenharTime(svg, lado, xCols[nivel], yB, jogo.fora, jogo.escudo_fora_url || jogo.bandeira_fora_url, decidido, decidido && vencedor === jogo.fora, `${lado}-${nivel}-${idx}-b`);

            desenharConector(svg, xCols[nivel], xCols[nivel + 1], yA, yB, jogo);
        });
    });

    const nivelAncora = niveis.length - 1;
    return { x: xCols[nivelAncora], y: niveis[nivelAncora][0] };
}

function desenharCabecalhos(svg) {
    [1, -1].forEach((lado) => {
        ROTULOS_RODADAS.forEach((rotulo, i) => {
            const texto = el("text", {
                x: xReal(lado, COLUNAS_LOCAIS[i]),
                y: 34,
                "text-anchor": "middle",
                class: "bracket-cabecalho",
            });
            texto.textContent = rotulo;
            svg.appendChild(texto);
        });
    });

    const rotuloFinal = el("text", { x: LARGURA / 2, y: 34, "text-anchor": "middle", class: "bracket-cabecalho" });
    rotuloFinal.textContent = "FINAL";
    svg.appendChild(rotuloFinal);
}

function desenharCentro(svg, ancoraEsq, ancoraDir, jogoFinal) {
    const vencedor = jogoFinal ? determinarVencedor(jogoFinal) : null;
    const decidido = vencedor !== null;
    const cx = (ancoraEsq.x + ancoraDir.x) / 2;
    const cy = (ancoraEsq.y + ancoraDir.y) / 2;

    const cyTrofeu = cy - 220;

    if (MOSTRAR_LINHAS) {
        svg.appendChild(
            el("line", {
                x1: ancoraEsq.x, y1: ancoraEsq.y, x2: cx - 100, y2: cy,
                class: `bracket-linha ${decidido && jogoFinal && vencedor === jogoFinal.casa ? "bracket-linha-vencedor" : ""}`,
            })
        );
        svg.appendChild(
            el("line", {
                x1: ancoraDir.x, y1: ancoraDir.y, x2: cx + 100, y2: cy,
                class: `bracket-linha ${decidido && jogoFinal && vencedor === jogoFinal.fora ? "bracket-linha-vencedor" : ""}`,
            })
        );
    }

    const raioTrofeu = 125;
    const trofeuImg = el("image", {
        href: CAMINHO_TROFEU_PNG,
        x: cx - raioTrofeu, y: cyTrofeu - raioTrofeu, width: raioTrofeu * 2, height: raioTrofeu * 2,
        preserveAspectRatio: "xMidYMid meet",
        class: "bracket-trofeu-img",
    });

    trofeuImg.addEventListener("error", () => {
        const fallback = el("g", { class: "bracket-trofeu-fallback" });
        const t = (n) => `${n}`;
        fallback.appendChild(el("path", {
            d: `M ${t(cx - 18)} ${t(cyTrofeu - 30)} Q ${t(cx - 18)} ${t(cyTrofeu + 2)} ${t(cx)} ${t(cyTrofeu + 2)} Q ${t(cx + 18)} ${t(cyTrofeu + 2)} ${t(cx + 18)} ${t(cyTrofeu - 30)} Z`,
            fill: "none", stroke: "currentColor", "stroke-width": 3, "stroke-linejoin": "round",
        }));
        fallback.appendChild(el("path", { d: `M ${t(cx - 18)} ${t(cyTrofeu - 24)} Q ${t(cx - 30)} ${t(cyTrofeu - 24)} ${t(cx - 30)} ${t(cyTrofeu - 10)} Q ${t(cx - 30)} ${t(cyTrofeu + 2)} ${t(cx - 18)} ${t(cyTrofeu + 2)}`, fill: "none", stroke: "currentColor", "stroke-width": 3 }));
        fallback.appendChild(el("path", { d: `M ${t(cx + 18)} ${t(cyTrofeu - 24)} Q ${t(cx + 30)} ${t(cyTrofeu - 24)} ${t(cx + 30)} ${t(cyTrofeu - 10)} Q ${t(cx + 30)} ${t(cyTrofeu + 2)} ${t(cx + 18)} ${t(cyTrofeu + 2)}`, fill: "none", stroke: "currentColor", "stroke-width": 3 }));
        fallback.appendChild(el("line", { x1: cx, y1: cyTrofeu + 2, x2: cx, y2: cyTrofeu + 22, stroke: "currentColor", "stroke-width": 3 }));
        fallback.appendChild(el("line", { x1: cx - 16, y1: cyTrofeu + 30, x2: cx + 16, y2: cyTrofeu + 30, stroke: "currentColor", "stroke-width": 4, "stroke-linecap": "round" }));
        trofeuImg.replaceWith(fallback);
    });
    svg.appendChild(trofeuImg);

    if (jogoFinal) {
        const raioIconeFinal = RAIO_ICONE + 8;
        const offsetX = raioIconeFinal + 22;

        const classeCasa = decidido && vencedor !== jogoFinal.casa ? "bracket-icone bracket-icone-eliminado" : "bracket-icone";
        const escudoCasa = jogoFinal.escudo_casa_url || jogoFinal.bandeira_casa_url;
        if (escudoCasa) {
            const icone = el("image", {
                href: escudoCasa,
                x: cx - offsetX - raioIconeFinal, y: cy - raioIconeFinal,
                width: raioIconeFinal * 2, height: raioIconeFinal * 2,
                preserveAspectRatio: "xMidYMid meet",
                class: classeCasa,
            });
            svg.appendChild(comTitulo(icone, jogoFinal.casa));
        } else {
            svg.appendChild(comTitulo(el("circle", { cx: cx - offsetX, cy, r: raioIconeFinal * 0.55, class: "bracket-escudo-vazio" }), jogoFinal.casa));
        }

        const classeFora = decidido && vencedor !== jogoFinal.fora ? "bracket-icone bracket-icone-eliminado" : "bracket-icone";
        const escudoFora = jogoFinal.escudo_fora_url || jogoFinal.bandeira_fora_url;
        if (escudoFora) {
            const icone = el("image", {
                href: escudoFora,
                x: cx + offsetX - raioIconeFinal, y: cy - raioIconeFinal,
                width: raioIconeFinal * 2, height: raioIconeFinal * 2,
                preserveAspectRatio: "xMidYMid meet",
                class: classeFora,
            });
            svg.appendChild(comTitulo(icone, jogoFinal.fora));
        } else {
            svg.appendChild(comTitulo(el("circle", { cx: cx + offsetX, cy, r: raioIconeFinal * 0.55, class: "bracket-escudo-vazio" }), jogoFinal.fora));
        }
    }
}

function montarBracket(fases) {

    const segunda = fases[0].jogos;
    const oitavas = fases[1].jogos;
    const quartas = fases[2].jogos;
    const semi = fases[3].jogos;
    const final = fases[4].jogos[1];

    const svg = el("svg", {
        viewBox: `0 0 ${LARGURA} ${ALTURA}`,
        class: "bracket-svg",
        role: "img",
        "aria-label": "Bracket do mata-mata da Copa 2026",
    });

    desenharCabecalhos(svg);

    const ancoraEsq = desenharMetade(svg, 1, [segunda.slice(0, 8), oitavas.slice(0, 4), quartas.slice(0, 2), [semi[0]]]);
    const ancoraDir = desenharMetade(svg, -1, [segunda.slice(8, 16), oitavas.slice(4, 8), quartas.slice(2, 4), [semi[1]]]);

    desenharCentro(svg, ancoraEsq, ancoraDir, final);

    return svg;
}

const SECOES_FASES = [
    { id: "fase-segunda", titulo: "2ª Fase" },
    { id: "fase-oitavas", titulo: "Oitavas" },
    { id: "fase-quartas", titulo: "Quartas" },
    { id: "fase-semi", titulo: "Semifinal" },
    { id: "fase-terceiro", titulo: "3º Lugar" },
    { id: "fase-final", titulo: "Final" },
];

function montarCardFase(jogo) {
    const vencedor = determinarVencedor(jogo);
    const decidido = vencedor !== null;
    const definidoCasa = jogo.casa && jogo.casa !== "A definir";
    const definidoFora = jogo.fora && jogo.fora !== "A definir";
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
            <div class="rodada-time rodada-time-casa ${!definidoCasa ? "rodada-time-indefinido" : ""}">
                ${imagemCasa ? `<img src="${imagemCasa}" alt="${jogo.casa}" title="${jogo.casa}" class="bandeira-tabela">` : ""}
                <span class="rodada-time-nome">${jogo.casa || "A definir"}</span>
            </div>
            <span class="rodada-placar ${decidido ? "rodada-placar-decidido" : ""}">${formatarPlacarHtml(jogo)}</span>
            <div class="rodada-time rodada-time-fora ${!definidoFora ? "rodada-time-indefinido" : ""}">
                <span class="rodada-time-nome">${jogo.fora || "A definir"}</span>
                ${imagemFora ? `<img src="${imagemFora}" alt="${jogo.fora}" title="${jogo.fora}" class="bandeira-tabela">` : ""}
            </div>
        </div>
    `;
    return card;
}

function montarSecaoFase(id, jogos) {
    const secao = document.createElement("div");
    secao.className = "rodada-bloco";
    secao.id = id;

    const jogosWrap = document.createElement("div");
    jogosWrap.className = "rodada-jogos";
    jogos.forEach((jogo) => jogosWrap.appendChild(montarCardFase(jogo)));
    secao.appendChild(jogosWrap);

    return secao;
}

let jogosPorFase = {};
let indiceFaseAtiva = 0;

function mostrarFasePorIndice(indice) {
    indiceFaseAtiva = ((indice % SECOES_FASES.length) + SECOES_FASES.length) % SECOES_FASES.length;
    const secaoInfo = SECOES_FASES[indiceFaseAtiva];

    document.getElementById("mata-mata-painel-titulo").textContent = secaoInfo.titulo;

    const lista = document.getElementById("mata-mata-fases-lista");
    lista.innerHTML = "";
    lista.appendChild(montarSecaoFase(secaoInfo.id, jogosPorFase[secaoInfo.id] || []));

    const scrollWrap = document.getElementById("mata-mata-painel-scroll");
    if (scrollWrap) scrollWrap.scrollTo({ top: 0, behavior: "smooth" });
}

function renderizarListaDeFases(fases) {
    const [segunda, oitavas, quartas, semi, terceiroFinal] = fases;
    const [terceiro, final] = terceiroFinal.jogos;

    jogosPorFase = {
        "fase-segunda": segunda.jogos,
        "fase-oitavas": oitavas.jogos,
        "fase-quartas": quartas.jogos,
        "fase-semi": semi.jogos,
        "fase-terceiro": [terceiro],
        "fase-final": [final],
    };

    mostrarFasePorIndice(0);
}

function iniciarPainel(fases) {
    document.getElementById("mata-mata-seta-anterior").addEventListener("click", () => mostrarFasePorIndice(indiceFaseAtiva - 1));
    document.getElementById("mata-mata-seta-proxima").addEventListener("click", () => mostrarFasePorIndice(indiceFaseAtiva + 1));

    renderizarListaDeFases(fases);
}

async function buscarJson(caminho) {
    const resposta = await fetch(caminho);
    if (!resposta.ok) {
        throw new Error(`A API respondeu com erro ${resposta.status} em ${caminho}`);
    }
    return resposta.json();
}

async function iniciarMataMata() {
    const wrapBracket = document.getElementById("bracket-wrap");

    try {
        const fases = await buscarJson("/api/mata-mata");

        wrapBracket.innerHTML = "";
        wrapBracket.appendChild(montarBracket(fases));

        iniciarPainel(fases);
    } catch (erro) {
        wrapBracket.innerHTML = `<p class="erro-carregamento">Não consegui carregar o mata-mata. A API está rodando?</p>`;
        document.getElementById("mata-mata-fases-lista").innerHTML = `<p class="erro-carregamento">Não consegui carregar.</p>`;
        console.error(erro);
    }
}

iniciarMataMata();