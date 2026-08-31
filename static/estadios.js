const SVG_ICONE_ESTADIO_GRANDE = `<svg class="icone-placeholder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="34" height="34"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 21 8 3 8"/></svg>`;
const SVG_ICONE_PESSOAS = `<svg class="icone-inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;

async function buscarJson(caminho) {
    const resposta = await fetch(caminho);
    if (!resposta.ok) {
        throw new Error(`A API respondeu com erro ${resposta.status} em ${caminho}`);
    }
    return resposta.json();
}

function formatarCapacidade(numero) {
    if (numero == null) return "—";
    return numero.toLocaleString("pt-BR");
}

async function iniciarEstadios() {
    const grid = document.getElementById("estadios-grid");
    try {
        const estadios = await buscarJson("/api/estadios");
        grid.innerHTML = "";

        estadios.forEach((e) => {
            const card = document.createElement("div");
            card.className = "estadio-card";
            card.innerHTML = `
                <div class="estadio-imagem-wrap">
                    ${e.imagem_url
                        ? `<img src="${e.imagem_url}" alt="${e.nome}" class="estadio-imagem">`
                        : `<div class="estadio-imagem estadio-imagem-vazia">${SVG_ICONE_ESTADIO_GRANDE}</div>`}
                    <span class="estadio-capacidade-badge">${SVG_ICONE_PESSOAS} ${formatarCapacidade(e.capacidade)}</span>
                </div>
                <div class="estadio-info">
                    <div class="estadio-nome">${e.nome}</div>
                    <div class="estadio-local">
                        ${e.bandeira_pais_url ? `<img src="${e.bandeira_pais_url}" alt="${e.pais}" class="bandeira-tabela">` : ""}
                        <span>${e.cidade}${e.pais ? `, ${e.pais}` : ""}</span>
                    </div>
                    ${e.habitantes ? `<div class="estadio-habitantes">${e.habitantes}</div>` : ""}
                    ${e.descricao ? `<p class="estadio-descricao">${e.descricao}</p>` : ""}
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (erro) {
        grid.innerHTML = `<p class="erro-carregamento">Não consegui carregar os estádios. A API está rodando?</p>`;
        console.error(erro);
    }
}

iniciarEstadios();