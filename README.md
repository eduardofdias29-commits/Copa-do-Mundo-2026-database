# Copa do Mundo FIFA 2026 — Database & Dashboard

Dashboard com dados da Copa do Mundo FIFA 2026: elencos, treinadores, classificação da fase de grupos, chaveamento do mata-mata, estatísticas e estádios — tudo consumindo uma API própria.

🔗 **[Ver o site no ar](#)** _(link depois do deploy)_

![preview do site](#)
_(screenshot aqui)_

## Sobre o projeto

Projeto pessoal e independente, sem vínculo oficial com a FIFA. Comecei depois do primeiro semestre da faculdade, usando as férias pra aprender SQLite na prática, e a Copa 2026 era um assunto que eu já ia acompanhar de qualquer jeito, então virou o tema natural do banco de dados.

A ideia inicial era puxar tudo via API pública de futebol, mas as opções gratuitas eram limitadas demais pro que eu queria (elenco completo, valor de mercado, clube atual de cada jogador). Resolvi catalogar manualmente os nomes, valores e clubes de todos os jogadores convocados, atualizado até 22/07/2026.

A primeira versão da interface foi em Python com CustomTkinter, mas ficou lenta e limitada conforme o projeto cresceu (estatísticas, estádios, fotos, bandeiras...). Migrei pra Flask servindo uma API própria, com o front-end em HTML/CSS/JS puro sem framework.

## Stack

- **Backend:** Flask + SQLite
- **Frontend:** HTML, CSS e JavaScript puro (sem framework)
- **Dados:** API própria, consumida pelo front via `fetch`

## Fontes de dados

Dados reunidos manualmente, a partir de:

| Fonte | Dados |
|---|---|
| FIFA | Jogos, sedes, convocações |
| Transfermarkt | Valor de mercado, clube atual |
| Sofascore | Estatísticas complementares |

## Funcionalidades

- Elencos completos das 48 seleções, com escudos, fotos e valor de mercado
- Perfil individual de cada jogador (posição tática, estatísticas, clube)
- Classificação da fase de grupos, por grupo, com rodadas e sedes
- Chaveamento do mata-mata (2ª fase → oitavas → quartas → semi → final)
- Rankings: artilheiros, assistências, mais valiosos, ranking FIFA
- Os 48 treinadores e suas trajetórias em Copas
- As 16 sedes, com cidade e capacidade
- Busca global (jogadores e seleções)
- Tema claro/escuro

## Rodando localmente

```bash
git clone https://github.com/eduardofdias29-commits/Copa-do-Mundo-2026-database.git
cd Copa-do-Mundo-2026-database
pip install -r requirements.txt
python app.py
```

Abre em `http://127.0.0.1:5000`.

## Estrutura

```
app.py              # Flask: rotas de página + API JSON
copa.db              # banco SQLite com todos os dados
templates/            # HTML (Jinja)
static/
    style.css
    *.js               # um script por página
    assets/            # fotos, escudos, bandeiras, estádios
```

## API

Todas as rotas devolvem JSON, sob o prefixo `/api`. Alguns exemplos:

```
GET /api/selecoes
GET /api/selecoes/<nome>/jogadores
GET /api/jogadores/<id>
GET /api/jogadores/artilheiros
GET /api/classificacao
GET /api/classificacao/<grupo>/detalhes
GET /api/mata-mata
GET /api/estadios
GET /api/treinadores
GET /api/busca?q=<termo>
```

## Aviso

Projeto pessoal, sem vínculo oficial com a FIFA. Feito pra estudo e portfólio.