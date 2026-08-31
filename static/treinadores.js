const SVG_ICONE_PESSOA_GRANDE = `<svg class="icone-placeholder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

async function buscarJson(caminho) {
    const resposta = await fetch(caminho);
    if (!resposta.ok) {
        throw new Error(`A API respondeu com erro ${resposta.status} em ${caminho}`);
    }
    return resposta.json();
}

async function iniciarTreinadores() {
    const grid = document.getElementById("treinadores-grid");
    try {
        const treinadores = await buscarJson("/api/treinadores");
        grid.innerHTML = "";

        treinadores.forEach((t) => {
            const escudoOuBandeira = t.escudo_url || t.bandeira_url;
            const participacoes = t.participacoes_copa
                ? `${t.participacoes_copa}ª Copa`
                : "1ª Copa";

            const paisHtml = t.bandeira_pais_url
                ? `<img src="${t.bandeira_pais_url}" alt="${t.pais || ''}" title="${t.pais || ''}" class="treinador-bandeira-pais">`
                : `<span>${t.pais || "—"}</span>`;

            const card = document.createElement("div");
            card.className = "treinador-card";
            card.innerHTML = `
                <div class="treinador-card-topo">
                    <span class="tag-grupo">${t.grupo}</span>
                </div>
                <div class="treinador-card-corpo">
                    ${t.foto_url
                        ? `<img src="${t.foto_url}" alt="${t.nome}" class="treinador-foto">`
                        : `<div class="treinador-foto treinador-foto-vazia">${SVG_ICONE_PESSOA_GRANDE}</div>`}
                    <div class="treinador-info">
                        <div class="treinador-nome" title="${t.nome}">${t.nome}</div>
                        <div class="treinador-selecao">
                            ${escudoOuBandeira ? `<img src="${escudoOuBandeira}" alt="" class="bandeira-tabela">` : ""}
                            <span class="treinador-selecao-nome" title="${t.selecao}">${t.selecao}</span>
                        </div>
                        <div class="treinador-meta">
                            ${paisHtml} · <span>${t.idade ? `${t.idade} anos` : "idade —"}</span> · <span>${participacoes}</span>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (erro) {
        grid.innerHTML = `<p class="erro-carregamento">Não consegui carregar os treinadores. A API está rodando?</p>`;
        console.error(erro);
    }
}

iniciarTreinadores();