let debounceBuscaGlobal = null;

async function buscarJsonGlobal(caminho) {
    const resposta = await fetch(caminho);
    if (!resposta.ok) {
        throw new Error(`A API respondeu com erro ${resposta.status} em ${caminho}`);
    }
    return resposta.json();
}

function montarItemBuscaGlobal(item) {
    const div = document.createElement("div");
    div.className = "busca-item";

    if (item.tipo === "jogador") {
        div.innerHTML = `
            ${item.imagem_url ? `<img src="${item.imagem_url}" alt="${item.nome}" class="foto-jogador">` : `<div class="foto-jogador foto-jogador-vazia"></div>`}
            <div class="busca-item-texto">
                <span class="busca-item-nome">${item.nome}</span>
                <span class="busca-item-subtitulo">${item.subtitulo}</span>
            </div>
        `;
        div.addEventListener("click", () => {
            window.location.href = `/jogador/${item.id}`;
        });
    } else {
        div.innerHTML = `
            ${item.imagem_url ? `<img src="${item.imagem_url}" alt="${item.nome}" class="bandeira-tabela">` : ""}
            <div class="busca-item-texto">
                <span class="busca-item-nome">${item.nome}</span>
                <span class="busca-item-subtitulo">${item.subtitulo}</span>
            </div>
        `;
        div.addEventListener("click", () => {
            window.location.href = `/selecoes?time=${encodeURIComponent(item.nome)}`;
        });
    }
    return div;
}

function renderizarResultadosBuscaGlobal(dados) {
    const painel = document.getElementById("busca-resultados");
    const total = dados.jogadores.length + dados.selecoes.length;

    if (total === 0) {
        painel.innerHTML = `<p class="busca-vazio">Nenhum resultado.</p>`;
        posicionarPainelBusca();
        painel.hidden = false;
        return;
    }

    painel.innerHTML = "";

    if (dados.jogadores.length) {
        const titulo = document.createElement("div");
        titulo.className = "busca-grupo-titulo";
        titulo.textContent = "Jogadores";
        painel.appendChild(titulo);
        dados.jogadores.forEach((item) => painel.appendChild(montarItemBuscaGlobal(item)));
    }

    if (dados.selecoes.length) {
        const titulo = document.createElement("div");
        titulo.className = "busca-grupo-titulo";
        titulo.textContent = "Seleções";
        painel.appendChild(titulo);
        dados.selecoes.forEach((item) => painel.appendChild(montarItemBuscaGlobal(item)));
    }

    posicionarPainelBusca();
    painel.hidden = false;
}

function posicionarPainelBusca() {
    const input = document.getElementById("busca-input");
    const painel = document.getElementById("busca-resultados");
    if (!input || !painel) return;

    const retanguloInput = input.closest(".sidebar-busca-input-wrap").getBoundingClientRect();
    painel.style.top = `${retanguloInput.top}px`;
    painel.style.left = `${retanguloInput.right + 10}px`;
}

function iniciarBuscaGlobal() {
    const input = document.getElementById("busca-input");
    const painel = document.getElementById("busca-resultados");
    const placeholderWrap = document.getElementById("busca-placeholder-wrap");
    const placeholderTexto = document.getElementById("busca-placeholder-texto");
    if (!input) return;

    function ajustarDeslizamentoPlaceholder() {
        if (!placeholderWrap || !placeholderTexto) return;
        const sobra = placeholderTexto.scrollWidth - placeholderWrap.clientWidth;
        placeholderTexto.style.setProperty("--marquee-shift", `${sobra > 0 ? -(sobra + 6) : 0}px`);
    }

    function atualizarVisibilidadePlaceholder() {
        if (!placeholderWrap) return;
        const devemostrar = input.value.length === 0 && document.activeElement !== input;
        placeholderWrap.style.opacity = devemostrar ? "1" : "0";
    }

    ajustarDeslizamentoPlaceholder();
    window.addEventListener("resize", ajustarDeslizamentoPlaceholder);
    input.addEventListener("focus", atualizarVisibilidadePlaceholder);
    input.addEventListener("blur", atualizarVisibilidadePlaceholder);
    input.addEventListener("input", atualizarVisibilidadePlaceholder);

    input.addEventListener("input", () => {
        const termo = input.value.trim();
        clearTimeout(debounceBuscaGlobal);

        if (termo.length < 2) {
            painel.hidden = true;
            return;
        }

        debounceBuscaGlobal = setTimeout(async () => {
            try {
                const dados = await buscarJsonGlobal(`/api/busca?q=${encodeURIComponent(termo)}`);
                renderizarResultadosBuscaGlobal(dados);
            } catch (erro) {
                painel.innerHTML = `<p class="erro-carregamento">Não consegui buscar. A API está rodando?</p>`;
                posicionarPainelBusca();
                painel.hidden = false;
                console.error(erro);
            }
        }, 250);
    });

    document.addEventListener("click", (evento) => {
        if (!evento.target.closest(".sidebar-busca")) {
            painel.hidden = true;
        }
    });

    window.addEventListener("resize", () => {
        if (!painel.hidden) posicionarPainelBusca();
    });
}

iniciarBuscaGlobal();