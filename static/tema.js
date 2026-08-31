const CHAVE_TEMA = "copa2026-tema";

function iniciarBotaoTema() {
    const botao = document.getElementById("botao-tema");
    if (!botao) return;

    botao.addEventListener("click", () => {
        const estaClaro = document.documentElement.getAttribute("data-tema") === "claro";

        if (estaClaro) {
            document.documentElement.removeAttribute("data-tema");
            localStorage.setItem(CHAVE_TEMA, "escuro");
        } else {
            document.documentElement.setAttribute("data-tema", "claro");
            localStorage.setItem(CHAVE_TEMA, "claro");
        }
    });
}

iniciarBotaoTema();