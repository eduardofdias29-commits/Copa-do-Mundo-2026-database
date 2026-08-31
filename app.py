import sqlite3
import os
import re
import unicodedata

from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

app = Flask(__name__)
app.json.ensure_ascii = False                                                   
CORS(app)

CAMINHO_BANCO = os.path.join(os.path.dirname(os.path.abspath(__file__)), "copa.db")
PASTA_ASSETS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "assets")

                                                                          
                                                  
SQL_VALOR_NUMERICO = """
    CASE
        WHEN {campo} LIKE '%M €%' THEN CAST(REPLACE({campo}, 'M €', '') AS REAL) * 1000000
        WHEN {campo} LIKE '%K €%' THEN CAST(REPLACE({campo}, 'K €', '') AS REAL) * 1000
        ELSE 0
    END
"""

def obter_conexao():
    """Cada requisição abre e fecha sua própria conexão."""
    conn = sqlite3.connect(CAMINHO_BANCO)
    conn.row_factory = sqlite3.Row                                             
    return conn

def linhas_para_dicts(linhas):
    return [dict(linha) for linha in linhas]

def obter_limite(padrao=50, maximo=100):
    """Lê ?limite=N da URL, com trava entre 1 e `maximo`."""
    limite = request.args.get("limite", default=padrao, type=int)
    return max(1, min(limite, maximo))
                                                           
MAPA_BANDEIRAS = {
    "México": "mx", "Coreia do Sul": "kr", "República Tcheca": "cz", "África do Sul": "za",
    "Bósnia": "ba", "Canadá": "ca", "Catar": "qa", "Suíça": "ch",
    "Brasil": "br", "Escócia": "gb-sct", "Haiti": "ht", "Marrocos": "ma",
    "Austrália": "au", "Estados Unidos": "us", "Paraguai": "py", "Turquia": "tr",
    "Alemanha": "de", "Costa do Marfim": "ci", "Curaçao": "cw", "Equador": "ec",
    "Holanda": "nl", "Japão": "jp", "Suécia": "se", "Tunísia": "tn",
    "Bélgica": "be", "Egito": "eg", "Irã": "ir", "Nova Zelândia": "nz",
    "Arábia Saudita": "sa", "Cabo Verde": "cv", "Espanha": "es", "Uruguai": "uy",
    "França": "fr", "Iraque": "iq", "Noruega": "no", "Senegal": "sn",
    "Argentina": "ar", "Argélia": "dz", "Jordânia": "jo", "Áustria": "at",
    "Colômbia": "co", "Portugal": "pt", "RD Congo": "cd", "Uzbequistão": "uz",
    "Croácia": "hr", "Gana": "gh", "Inglaterra": "gb-eng", "Panamá": "pa",
    "Itália": "it", "Grécia": "gr",
}

def _slugificar(texto):

    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    texto = texto.lower()
    return re.sub(r"[^a-z0-9]+", "_", texto).strip("_")

def _url_se_existir(*partes_caminho):

    caminho_absoluto = os.path.join(PASTA_ASSETS, *partes_caminho)
    if not os.path.isfile(caminho_absoluto):
        return None
    return "/" + "/".join(["static", "assets", *partes_caminho])

def url_foto_jogador(jogador_id):
    if not jogador_id:
        return None
    return _url_se_existir("jogadores", f"{jogador_id}.png")


def url_logo_clube(nome_clube):
    if not nome_clube:
        return None
    return _url_se_existir("clubs", f"{_slugificar(nome_clube)}.png")


def url_bandeira(nome_selecao):
    if not nome_selecao:
        return None
    codigo = MAPA_BANDEIRAS.get(nome_selecao)
    if not codigo:
        return None
                                                                                                                                          
    return _url_se_existir("flags", f"{codigo}.svg") or _url_se_existir("flags", f"{codigo}.png")


def url_escudo_selecao(nome_selecao):

    if not nome_selecao:
        return None
    return _url_se_existir("escudos", f"{_slugificar(nome_selecao)}.png")

def url_foto_treinador(selecao_id):
    if not selecao_id:
        return None
    return _url_se_existir("treinadores", f"{selecao_id}.png")


def url_imagem_estadio(nome_arquivo):
    if not nome_arquivo:
        return None
    return _url_se_existir("estadios", nome_arquivo)

def enriquecer_jogador(j):

    j["foto_url"] = url_foto_jogador(j.get("id"))
    j["logo_clube_url"] = url_logo_clube(j.get("clube_atual"))
    j["bandeira_url"] = url_bandeira(j.get("selecao"))
    j["escudo_url"] = url_escudo_selecao(j.get("selecao"))
    return j

def enriquecer_jogadores(lista):
    return [enriquecer_jogador(j) for j in lista]

@app.route("/")
def pagina_dashboard():
    bandeiras_sede = {
        "Estados Unidos": url_bandeira("Estados Unidos"),
        "Canadá": url_bandeira("Canadá"),
        "México": url_bandeira("México"),
    }
    return render_template("index.html", pagina_ativa="dashboard", bandeiras_sede=bandeiras_sede)

@app.route("/classificacao")
def pagina_classificacao():
    return render_template("classificacao.html", pagina_ativa="classificacao")

@app.route("/selecoes")
def pagina_selecoes():
    return render_template("selecoes.html", pagina_ativa="selecoes")

@app.route("/rankings")
def pagina_rankings():
    return render_template("rankings.html", pagina_ativa="rankings")

@app.route("/treinadores")
def pagina_treinadores():
    return render_template("treinadores.html", pagina_ativa="treinadores")

@app.route("/mata-mata")
def pagina_mata_mata():
    return render_template("mata_mata.html", pagina_ativa="mata-mata")

@app.route("/estadios")
def pagina_estadios():
    return render_template("estadios.html", pagina_ativa="estadios")

@app.route("/jogador/<int:jogador_id>")
def pagina_jogador(jogador_id):
                                                                                                    
    return render_template("jogador.html", pagina_ativa="jogador", jogador_id=jogador_id)

@app.route("/api/resumo")
def api_resumo():
    """Números gerais pro dashboard: total de seleções, jogadores, gols e
    assistências computados na hora a partir do banco."""
    conn = obter_conexao()
    total_selecoes = conn.execute("SELECT COUNT(*) FROM selecoes").fetchone()[0]
    total_jogadores = conn.execute("SELECT COUNT(*) FROM jogadores").fetchone()[0]
    total_gols = conn.execute("SELECT COALESCE(SUM(gols), 0) FROM jogadores").fetchone()[0]
    total_assistencias = conn.execute("SELECT COALESCE(SUM(assistencias), 0) FROM jogadores").fetchone()[0]
    conn.close()
    return jsonify({
        "total_selecoes": total_selecoes,
        "total_jogadores": total_jogadores,
        "total_gols": total_gols,
        "total_assistencias": total_assistencias,
    })

@app.route("/api/busca")
def api_busca():

    termo = (request.args.get("q") or "").strip()
    if len(termo) < 2:
        return jsonify({"jogadores": [], "selecoes": []})

    termo_normalizado = _slugificar(termo)
    conn = obter_conexao()

    todos_jogadores = conn.execute("""
        SELECT j.id, j.nome, j.posicao, s.nome AS selecao
        FROM jogadores j
        JOIN selecoes s ON j.selecao_id = s.id
        ORDER BY j.nome
    """).fetchall()

    todas_selecoes = conn.execute("SELECT nome, grupo FROM selecoes ORDER BY nome").fetchall()
    conn.close()

    jogadores = []
    for j in linhas_para_dicts(todos_jogadores):
        if termo_normalizado in _slugificar(j["nome"]):
            jogadores.append({
                "tipo": "jogador",
                "id": j["id"],
                "nome": j["nome"],
                "subtitulo": f"{j['posicao'] or '—'} · {j['selecao']}",
                "imagem_url": url_foto_jogador(j["id"]),
            })
        if len(jogadores) >= 8:
            break

    selecoes = []
    for s in linhas_para_dicts(todas_selecoes):
        if termo_normalizado in _slugificar(s["nome"]):
            selecoes.append({
                "tipo": "selecao",
                "nome": s["nome"],
                "subtitulo": s["grupo"],
                "imagem_url": url_escudo_selecao(s["nome"]) or url_bandeira(s["nome"]),
            })
        if len(selecoes) >= 8:
            break

    return jsonify({"jogadores": jogadores, "selecoes": selecoes})

@app.route("/api/jogadores/<int:jogador_id>")
def api_jogador_detalhe(jogador_id):
    """Perfil completo de um jogador — usado pela tela /jogador/<id>."""
    conn = obter_conexao()
    linha = conn.execute("""
        SELECT j.*, s.nome AS selecao, s.grupo
        FROM jogadores j
        JOIN selecoes s ON j.selecao_id = s.id
        WHERE j.id = ?
    """, (jogador_id,)).fetchone()
    conn.close()

    if not linha:
        return jsonify({"erro": "Jogador não encontrado"}), 404

    jogador = dict(linha)
    valor_final = (jogador.get("valor_mercado_final") or "").strip()
    jogador["valor_mercado_exibido"] = valor_final or jogador.get("valor_mercado") or "—"
    return jsonify(enriquecer_jogador(jogador))

@app.route("/api/selecoes")
def api_selecoes():
    conn = obter_conexao()
    linhas = conn.execute("""
        SELECT s.id, s.nome, s.grupo, s.ranking_fifa, s.titulos_mundiais,
               t.nome AS treinador, t.pais AS treinador_pais, t.idade AS treinador_idade
        FROM selecoes s
        LEFT JOIN treinadores t ON t.selecao_id = s.id
        ORDER BY s.grupo, s.nome
    """).fetchall()
    conn.close()
    resultado = linhas_para_dicts(linhas)
    for s in resultado:
        s["bandeira_url"] = url_bandeira(s["nome"])
        s["escudo_url"] = url_escudo_selecao(s["nome"])
        s["treinador_foto_url"] = url_foto_treinador(s["id"])
                                                                                                                                        
        s["treinador_bandeira_url"] = url_bandeira(s["treinador_pais"])
    return jsonify(resultado)

@app.route("/api/selecoes/<nome_selecao>/jogadores")
def api_elenco_da_selecao(nome_selecao):
    conn = obter_conexao()
    linhas = conn.execute("""
        SELECT j.id, j.nome, j.posicao, j.numero, j.idade, j.clube_atual,
               j.valor_mercado, j.valor_mercado_final, j.gols, j.assistencias,
               j.cartoes_amarelos, j.cartoes_vermelhos, j.jogos, j.defesas,
               s.nome AS selecao, s.grupo
        FROM jogadores j
        JOIN selecoes s ON j.selecao_id = s.id
        WHERE s.nome = ?
        ORDER BY j.numero
    """, (nome_selecao,)).fetchall()
    conn.close()

    if not linhas:
        return jsonify({"erro": f"Seleção '{nome_selecao}' não encontrada ou sem elenco cadastrado"}), 404

    return jsonify(enriquecer_jogadores(linhas_para_dicts(linhas)))

@app.route("/api/jogadores/mais-valiosos")
def api_jogadores_mais_valiosos():
    limite = obter_limite()
    conn = obter_conexao()
    linhas = conn.execute(f"""
        SELECT j.id, j.nome, j.posicao, j.idade, j.jogos, j.clube_atual,
               COALESCE(NULLIF(j.valor_mercado_final, ''), j.valor_mercado) AS valor_mercado,
               s.nome AS selecao, s.grupo
        FROM jogadores j
        JOIN selecoes s ON j.selecao_id = s.id
        WHERE COALESCE(NULLIF(j.valor_mercado_final, ''), j.valor_mercado) IS NOT NULL
          AND COALESCE(NULLIF(j.valor_mercado_final, ''), j.valor_mercado) != ''
        ORDER BY {SQL_VALOR_NUMERICO.format(campo="COALESCE(NULLIF(j.valor_mercado_final, ''), j.valor_mercado)")} DESC
        LIMIT ?
    """, (limite,)).fetchall()
    conn.close()
    return jsonify(enriquecer_jogadores(linhas_para_dicts(linhas)))

def _ranking_jogadores(campo_ordenacao, alias_total, descendente=True, minimo=None):

    limite = obter_limite()
    direcao = "DESC" if descendente else "ASC"
    condicao = f"j.{campo_ordenacao} IS NOT NULL" if minimo is None else f"j.{campo_ordenacao} >= {minimo}"

    conn = obter_conexao()
    linhas = conn.execute(f"""
        SELECT j.id, j.nome, j.posicao, j.idade, j.jogos, j.clube_atual,
               COALESCE(NULLIF(j.valor_mercado_final, ''), j.valor_mercado) AS valor_mercado,
               j.{campo_ordenacao} AS {alias_total},
               s.nome AS selecao, s.grupo
        FROM jogadores j
        JOIN selecoes s ON j.selecao_id = s.id
        WHERE {condicao}
        ORDER BY j.{campo_ordenacao} {direcao}
        LIMIT ?
    """, (limite,)).fetchall()
    conn.close()
    return enriquecer_jogadores(linhas_para_dicts(linhas))

@app.route("/api/jogadores/artilheiros")
def api_artilheiros():
    return jsonify(_ranking_jogadores("gols", "gols"))

@app.route("/api/jogadores/assistencias")
def api_assistencias():
    return jsonify(_ranking_jogadores("assistencias", "assistencias"))

@app.route("/api/jogadores/ga")
def api_ranking_ga():
    limite = obter_limite()
    conn = obter_conexao()
    linhas = conn.execute("""
        SELECT j.id, j.nome, j.posicao, j.idade, j.jogos, j.clube_atual,
               COALESCE(j.gols, 0) AS gols,
               COALESCE(j.assistencias, 0) AS assistencias,
               COALESCE(j.gols, 0) + COALESCE(j.assistencias, 0) AS ga,
               s.nome AS selecao, s.grupo
        FROM jogadores j
        JOIN selecoes s ON j.selecao_id = s.id
        WHERE COALESCE(j.gols, 0) + COALESCE(j.assistencias, 0) > 0
        ORDER BY ga DESC
        LIMIT ?
    """, (limite,)).fetchall()
    conn.close()
    return jsonify(enriquecer_jogadores(linhas_para_dicts(linhas)))

@app.route("/api/jogadores/cartoes")
def api_ranking_cartoes():
    tipo = request.args.get("tipo", default="amarelos")
    campos = {"amarelos": "cartoes_amarelos", "vermelhos": "cartoes_vermelhos"}
    if tipo not in campos:
        return jsonify({"erro": "tipo precisa ser 'amarelos' ou 'vermelhos'"}), 400
    return jsonify(_ranking_jogadores(campos[tipo], "cartoes", minimo=1))

@app.route("/api/jogadores/mais-velhos")
def api_mais_velhos():
    return jsonify(_ranking_jogadores("idade", "idade", descendente=True))

@app.route("/api/jogadores/mais-novos")
def api_mais_novos():
    return jsonify(_ranking_jogadores("idade", "idade", descendente=False))

@app.route("/api/goleiros/defesas")
def api_goleiros_mais_defesas():
    limite = obter_limite()
    conn = obter_conexao()
    linhas = conn.execute("""
        SELECT j.id, j.nome, j.posicao, j.idade, j.jogos, j.clube_atual, j.defesas,
               s.nome AS selecao, s.grupo
        FROM jogadores j
        JOIN selecoes s ON j.selecao_id = s.id
        WHERE j.posicao = 'GOL' AND j.defesas >= 1
        ORDER BY j.defesas DESC
        LIMIT ?
    """, (limite,)).fetchall()
    conn.close()
    return jsonify(enriquecer_jogadores(linhas_para_dicts(linhas)))

@app.route("/api/classificacao")
def api_classificacao_completa():
    conn = obter_conexao()
    linhas = conn.execute("""
        SELECT grupo, posicao, selecao, pontos, vitorias, empates, derrotas, saldo_gols
        FROM classificacao
        ORDER BY grupo, posicao
    """).fetchall()
    conn.close()
    resultado = linhas_para_dicts(linhas)
    for c in resultado:
        c["bandeira_url"] = url_bandeira(c["selecao"])
        c["escudo_url"] = url_escudo_selecao(c["selecao"])
    return jsonify(resultado)

@app.route("/api/classificacao/<grupo>/detalhes")
def api_classificacao_detalhes_do_grupo(grupo):

    conn = obter_conexao()

    linhas_classificacao = conn.execute("""
        SELECT grupo, posicao, selecao, pontos, vitorias, empates, derrotas, saldo_gols
        FROM classificacao
        WHERE grupo = ?
        ORDER BY posicao
    """, (grupo,)).fetchall()

    if not linhas_classificacao:
        conn.close()
        return jsonify({"erro": f"Grupo '{grupo}' não encontrado"}), 404

    linhas_jogos = conn.execute("""
        SELECT id, rodada, casa, fora, gols_casa, gols_fora, estadio, data
        FROM jogos_grupos
        WHERE grupo = ?
        ORDER BY rodada, id
    """, (grupo,)).fetchall()
                                                    
    nomes_sedes_em_ordem = list(dict.fromkeys(
        linha["estadio"] for linha in linhas_jogos if linha["estadio"]
    ))

    linhas_estadios = []
    if nomes_sedes_em_ordem:
        marcadores = ",".join("?" * len(nomes_sedes_em_ordem))
        linhas_estadios = conn.execute(f"""
            SELECT nome, cidade, pais, capacidade, habitantes, descricao, imagem
            FROM estadios
            WHERE nome IN ({marcadores})
        """, nomes_sedes_em_ordem).fetchall()

    conn.close()

    classificacao = linhas_para_dicts(linhas_classificacao)
    for c in classificacao:
        c["bandeira_url"] = url_bandeira(c["selecao"])
        c["escudo_url"] = url_escudo_selecao(c["selecao"])

    jogos_por_rodada = {}
    total_gols = 0
    total_jogos_disputados = 0
    for linha in linhas_jogos:
        jogo = dict(linha)
        jogo["bandeira_casa_url"] = url_bandeira(jogo["casa"])
        jogo["escudo_casa_url"] = url_escudo_selecao(jogo["casa"])
        jogo["bandeira_fora_url"] = url_bandeira(jogo["fora"])
        jogo["escudo_fora_url"] = url_escudo_selecao(jogo["fora"])
        jogos_por_rodada.setdefault(jogo["rodada"], []).append(jogo)
        if jogo["gols_casa"] is not None and jogo["gols_fora"] is not None:
            total_gols += jogo["gols_casa"] + jogo["gols_fora"]
            total_jogos_disputados += 1

    rodadas = [
        {"rodada": numero, "jogos": jogos_por_rodada[numero]}
        for numero in sorted(jogos_por_rodada.keys())
    ]

    estadios_por_nome = {e["nome"]: dict(e) for e in linhas_estadios}
    sedes = []
    for nome in nomes_sedes_em_ordem:
        estadio = estadios_por_nome.get(nome)
        if not estadio:
            continue
        estadio["imagem_url"] = url_imagem_estadio(estadio["imagem"])
        estadio["bandeira_pais_url"] = url_bandeira(estadio["pais"])
        sedes.append(estadio)

    media_gols = round(total_gols / total_jogos_disputados, 1) if total_jogos_disputados else 0

    return jsonify({
        "classificacao": classificacao,
        "rodadas": rodadas,
        "sedes": sedes,
        "resumo": {
            "total_gols": total_gols,
            "total_jogos": total_jogos_disputados,
            "media_gols": media_gols,
        },
    })

@app.route("/api/classificacao/melhores-terceiros")
def api_melhores_terceiros():

    conn = obter_conexao()

    linhas = conn.execute("""
        SELECT grupo, posicao, selecao, pontos, vitorias, empates, derrotas, saldo_gols
        FROM classificacao
        WHERE posicao = 3
    """).fetchall()

    gols_marcados = {}
    for row in conn.execute("SELECT casa, fora, gols_casa, gols_fora FROM jogos_grupos"):
        if row["gols_casa"] is None or row["gols_fora"] is None:
            continue
        gols_marcados[row["casa"]] = gols_marcados.get(row["casa"], 0) + row["gols_casa"]
        gols_marcados[row["fora"]] = gols_marcados.get(row["fora"], 0) + row["gols_fora"]
    conn.close()

    terceiros = linhas_para_dicts(linhas)
    for t in terceiros:
        t["gols_marcados"] = gols_marcados.get(t["selecao"], 0)
        t["bandeira_url"] = url_bandeira(t["selecao"])
        t["escudo_url"] = url_escudo_selecao(t["selecao"])

    terceiros.sort(key=lambda t: (-t["pontos"], -t["saldo_gols"], -t["gols_marcados"], t["selecao"]))

    for indice, t in enumerate(terceiros):
        t["posicao_geral"] = indice + 1
        t["classificado"] = indice < 8

    return jsonify(terceiros)

@app.route("/api/treinadores")
def api_treinadores():
    conn = obter_conexao()
    linhas = conn.execute("""
        SELECT t.nome, t.pais, t.idade, t.participacoes_copa, t.selecao_id,
               s.nome AS selecao, s.grupo
        FROM treinadores t
        JOIN selecoes s ON t.selecao_id = s.id
        ORDER BY t.nome
    """).fetchall()
    conn.close()
    resultado = linhas_para_dicts(linhas)
    for t in resultado:
        t["foto_url"] = url_foto_treinador(t["selecao_id"])
        t["bandeira_url"] = url_bandeira(t["selecao"])
        t["escudo_url"] = url_escudo_selecao(t["selecao"])
        t["bandeira_pais_url"] = url_bandeira(t["pais"])
    return jsonify(resultado)

@app.route("/api/clubes/participacoes")
def api_clubes_participacoes():
    metrica = request.args.get("metrica", default="ga")
    campos = {
        "ga": "COALESCE(gols, 0) + COALESCE(assistencias, 0)",
        "gols": "COALESCE(gols, 0)",
        "assistencias": "COALESCE(assistencias, 0)",
    }
    if metrica not in campos:
        return jsonify({"erro": "metrica precisa ser 'ga', 'gols' ou 'assistencias'"}), 400

    conn = obter_conexao()
    linhas = conn.execute(f"""
        SELECT clube_atual AS clube, SUM({campos[metrica]}) AS total
        FROM jogadores
        WHERE clube_atual IS NOT NULL AND clube_atual != '' AND clube_atual != 'Desconhecido'
        GROUP BY clube_atual
        HAVING total > 0
        ORDER BY total DESC, clube_atual ASC
        LIMIT 50
    """).fetchall()
    conn.close()
    resultado = linhas_para_dicts(linhas)
    for c in resultado:
        c["logo_clube_url"] = url_logo_clube(c["clube"])
    return jsonify(resultado)


@app.route("/api/clubes/mais-convocados")
def api_clubes_mais_convocados():

    conn = obter_conexao()
    linhas = conn.execute("""
        SELECT clube_atual AS clube, COUNT(*) AS total
        FROM jogadores
        WHERE clube_atual IS NOT NULL AND clube_atual != '' AND clube_atual != 'Desconhecido'
        GROUP BY clube_atual
        ORDER BY total DESC, clube_atual ASC
        LIMIT 50
    """).fetchall()
    conn.close()
    resultado = linhas_para_dicts(linhas)
    for c in resultado:
        c["logo_clube_url"] = url_logo_clube(c["clube"])
    return jsonify(resultado)

def _parse_gols_normal(valor):

    if valor is None:
        return None
    texto = str(valor).strip()
    if texto in ("", "-"):
        return None
    m = re.match(r"^(\d+)\((\d+)\)$", texto)
    if m:
        return int(m.group(1))
    m = re.match(r"^\((\d+)\)(\d+)$", texto)
    if m:
        return int(m.group(2))
    m = re.match(r"^(\d+)$", texto)
    if m:
        return int(m.group(1))
    return None

def _gols_por_selecao():

    marcados, sofridos, jogos = {}, {}, {}

    def registrar(casa, fora, gc, gf):
        if not casa or not fora or gc is None or gf is None:
            return
        marcados[casa] = marcados.get(casa, 0) + gc
        marcados[fora] = marcados.get(fora, 0) + gf
        sofridos[casa] = sofridos.get(casa, 0) + gf
        sofridos[fora] = sofridos.get(fora, 0) + gc
        jogos[casa] = jogos.get(casa, 0) + 1
        jogos[fora] = jogos.get(fora, 0) + 1

    conn = obter_conexao()
    for row in conn.execute("SELECT casa, fora, gols_casa, gols_fora FROM jogos_grupos"):
        registrar(row["casa"], row["fora"], row["gols_casa"], row["gols_fora"])
    conn.close()

    for fase in _resolver_fases_mata_mata():
        for jogo in fase["jogos"]:
            if jogo["casa"] == "A definir" or jogo["fora"] == "A definir":
                continue
            registrar(jogo["casa"], jogo["fora"], _parse_gols_normal(jogo["gols_casa"]), _parse_gols_normal(jogo["gols_fora"]))

    return marcados, sofridos, jogos


def _ranking_ataque_defesa(ordenar_por):

    marcados, sofridos, jogos = _gols_por_selecao()

    conn = obter_conexao()
    grupos = {r["nome"]: r["grupo"] for r in conn.execute("SELECT nome, grupo FROM selecoes")}
    conn.close()

    resultado = []
    for selecao, total_jogos in jogos.items():
        gm = marcados.get(selecao, 0)
        gs = sofridos.get(selecao, 0)
        resultado.append({
            "selecao": selecao,
            "grupo": grupos.get(selecao),
            "jogos": total_jogos,
            "gols_marcados": gm,
            "gols_sofridos": gs,
            "media_marcados": round(gm / total_jogos, 2) if total_jogos else 0,
            "media_sofridos": round(gs / total_jogos, 2) if total_jogos else 0,
            "bandeira_url": url_bandeira(selecao),
            "escudo_url": url_escudo_selecao(selecao),
        })

    if ordenar_por == "ataque":
        resultado.sort(key=lambda d: (-d["gols_marcados"], d["selecao"]))
    else:
        resultado.sort(key=lambda d: (d["gols_sofridos"], -d["gols_marcados"], d["selecao"]))

    return resultado[:50]


@app.route("/api/selecoes/melhor-ataque")
def api_melhor_ataque():
    return jsonify(_ranking_ataque_defesa("ataque"))


@app.route("/api/selecoes/melhor-defesa")
def api_melhor_defesa():
    return jsonify(_ranking_ataque_defesa("defesa"))

@app.route("/api/gols-contra")
def api_gols_contra():

    conn = obter_conexao()
    linhas = conn.execute("""
        SELECT gc.id, gc.jogador_nome AS nome, gc.selecao,
               gc.casa, gc.gols_casa, gc.fora, gc.gols_fora, gc.fase,
               j.id AS jogador_id, j.posicao
        FROM gols_contra gc
        LEFT JOIN selecoes s ON s.nome = gc.selecao
        LEFT JOIN jogadores j ON j.nome = gc.jogador_nome AND j.selecao_id = s.id
        ORDER BY gc.id
    """).fetchall()
    conn.close()
    resultado = linhas_para_dicts(linhas)
    for g in resultado:
        g["foto_url"] = url_foto_jogador(g["jogador_id"])
        g["bandeira_url"] = url_bandeira(g["selecao"])
        g["escudo_url"] = url_escudo_selecao(g["selecao"])
        g["bandeira_casa_url"] = url_bandeira(g["casa"])
        g["bandeira_fora_url"] = url_bandeira(g["fora"])
        g["escudo_casa_url"] = url_escudo_selecao(g["casa"])
        g["escudo_fora_url"] = url_escudo_selecao(g["fora"])
    return jsonify(resultado)

@app.route("/api/estadios")
def api_estadios():
    conn = obter_conexao()
    linhas = conn.execute("""
        SELECT nome, cidade, pais, capacidade, habitantes, descricao, imagem
        FROM estadios
        ORDER BY capacidade DESC, nome
    """).fetchall()
    conn.close()
    resultado = linhas_para_dicts(linhas)
    for e in resultado:
        e["imagem_url"] = url_imagem_estadio(e["imagem"])
        e["bandeira_pais_url"] = url_bandeira(e["pais"])
    return jsonify(resultado)

@app.route("/api/ranking-fifa")
def api_ranking_fifa():
    conn = obter_conexao()
    linhas = conn.execute("""
        SELECT ranking_fifa AS posicao, nome AS selecao, titulos_mundiais
        FROM selecoes
        WHERE ranking_fifa IS NOT NULL
        ORDER BY ranking_fifa
    """).fetchall()
    conn.close()
    resultado = linhas_para_dicts(linhas)
    for r in resultado:
        r["bandeira_url"] = url_bandeira(r["selecao"])
        r["escudo_url"] = url_escudo_selecao(r["selecao"])
    return jsonify(resultado)

def _parse_valor(texto):

    if not texto:
        return None
    texto = texto.strip().upper().replace(",", ".").replace("€", "").strip()
    match = re.match(r"^([\d.]+)\s*([KMB])?$", texto)
    if not match:
        return None
    numero_str, multiplicador = match.groups()
    try:
        numero = float(numero_str)
    except ValueError:
        return None
    fator = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}.get(multiplicador, 1)
    return numero * fator

def _obter_dados_valorizacao():
    conn = obter_conexao()
    linhas = conn.execute("""
        SELECT j.id, j.nome, j.posicao, j.clube_atual, j.valor_mercado,
               j.valor_mercado_final, s.nome AS selecao, s.grupo
        FROM jogadores j
        JOIN selecoes s ON j.selecao_id = s.id
        WHERE j.valor_mercado_final IS NOT NULL AND j.valor_mercado_final != ''
    """).fetchall()
    conn.close()

    dados = []
    for linha in linhas:
        valor_inicial = _parse_valor(linha["valor_mercado"])
        valor_final = _parse_valor(linha["valor_mercado_final"])
        if valor_inicial is None or valor_final is None:
            continue
        delta_abs = valor_final - valor_inicial
        delta_pct = (delta_abs / valor_inicial * 100) if valor_inicial > 0 else 0.0
        item = {
            "id": linha["id"],
            "nome": linha["nome"],
            "posicao": linha["posicao"],
            "clube_atual": linha["clube_atual"],
            "selecao": linha["selecao"],
            "grupo": linha["grupo"],
            "valor_inicial": valor_inicial,
            "valor_final": valor_final,
            "valor_inicial_txt": linha["valor_mercado"],
            "valor_final_txt": linha["valor_mercado_final"],
            "delta_abs": delta_abs,
            "delta_pct": delta_pct,
        }
        enriquecer_jogador(item)
        dados.append(item)
    return dados

@app.route("/api/valorizacao")
def api_valorizacao_geral():
    return jsonify(_obter_dados_valorizacao())

@app.route("/api/valorizacao/top")
def api_valorizacao_top():
    tipo = request.args.get("tipo", default="valorizaram")
    limite = request.args.get("limite", default=10, type=int)
    limite = max(1, min(limite, 200))

    dados = _obter_dados_valorizacao()
    if tipo == "valorizaram":
        resultado = sorted(dados, key=lambda d: d["delta_abs"], reverse=True)[:limite]
    elif tipo == "desvalorizaram":
        perderam = [d for d in dados if d["delta_abs"] < 0]
        resultado = sorted(perderam, key=lambda d: d["delta_abs"])[:limite]
    else:
        return jsonify({"erro": "tipo precisa ser 'valorizaram' ou 'desvalorizaram'"}), 400

    return jsonify(resultado)

def _jogo_mata_mata(casa, fora, linha):

    return {
        "casa": casa or "A definir",
        "fora": fora or "A definir",
        "bandeira_casa_url": url_bandeira(casa),
        "bandeira_fora_url": url_bandeira(fora),
        "escudo_casa_url": url_escudo_selecao(casa),
        "escudo_fora_url": url_escudo_selecao(fora),
        "gols_casa": linha["gols_casa"] if linha.get("gols_casa") is not None else "-",
        "gols_fora": linha["gols_fora"] if linha.get("gols_fora") is not None else "-",
        "estadio": linha["estadio"] or "Estádio a definir",
        "data": linha["data"] or "Data a definir",
    }

def _perdedor(time_a, time_b, vencedor):
    if not time_a or not time_b or not vencedor:
        return None
    if vencedor == time_a:
        return time_b
    if vencedor == time_b:
        return time_a
    return None

def _resolver_fases_mata_mata():

    conn = obter_conexao()
    linhas = conn.execute("""
        SELECT fase, regiao, ordem, casa, fora, gols_casa, gols_fora, estadio, data, vencedor
        FROM jogos_mata_mata
        ORDER BY fase, regiao, ordem
    """).fetchall()
    conn.close()

    por_fase = {}
    for linha in linhas:
        d = dict(linha)
        por_fase.setdefault(d["fase"], {}).setdefault(d["regiao"], []).append(d)

    regioes = ("NW", "SW", "NE", "SE")
    segunda_fase = por_fase.get("SEGUNDA_FASE", {})
    oitavas = por_fase.get("OITAVAS", {})
    quartas = por_fase.get("QUARTAS", {})
    semifinal_esquerda = por_fase.get("SEMIFINAIS", {}).get("esquerda", [{}])[0]
    semifinal_direita = por_fase.get("SEMIFINAIS", {}).get("direita", [{}])[0]
    final = por_fase.get("FINAL", {}).get("", [{}])[0]
    terceiro = por_fase.get("TERCEIRO", {}).get("", [{}])[0]

    jogos_segunda_fase = []
    for regiao in regioes:
        for confronto in segunda_fase.get(regiao, []):
            jogos_segunda_fase.append(_jogo_mata_mata(confronto["casa"], confronto["fora"], confronto))

    jogos_oitavas = []
    for regiao in regioes:
        pares = segunda_fase.get(regiao, [])
        for confronto in oitavas.get(regiao, []):
            i = confronto["ordem"]
            casa = pares[2 * i]["vencedor"] if len(pares) > 2 * i else None
            fora = pares[2 * i + 1]["vencedor"] if len(pares) > 2 * i + 1 else None
            jogos_oitavas.append(_jogo_mata_mata(casa, fora, confronto))

    jogos_quartas = []
    vencedor_quartas = {}
    for regiao in regioes:
        pares_oitavas = oitavas.get(regiao, [])
        confronto = quartas.get(regiao, [{}])[0]
        casa = pares_oitavas[0]["vencedor"] if len(pares_oitavas) > 0 else None
        fora = pares_oitavas[1]["vencedor"] if len(pares_oitavas) > 1 else None
        jogos_quartas.append(_jogo_mata_mata(casa, fora, confronto))
        vencedor_quartas[regiao] = confronto.get("vencedor")

    jogos_semifinais = [
        _jogo_mata_mata(vencedor_quartas.get("NW"), vencedor_quartas.get("SW"), semifinal_esquerda),
        _jogo_mata_mata(vencedor_quartas.get("NE"), vencedor_quartas.get("SE"), semifinal_direita),
    ]

    jogo_final = _jogo_mata_mata(
        semifinal_esquerda.get("vencedor"), semifinal_direita.get("vencedor"), final
    )

    casa_terceiro = _perdedor(
        vencedor_quartas.get("NW"), vencedor_quartas.get("SW"), semifinal_esquerda.get("vencedor")
    )
    fora_terceiro = _perdedor(
        vencedor_quartas.get("NE"), vencedor_quartas.get("SE"), semifinal_direita.get("vencedor")
    )
    jogo_terceiro = _jogo_mata_mata(casa_terceiro, fora_terceiro, terceiro)

    return [
        {"titulo": "SEGUNDA FASE", "jogos": jogos_segunda_fase},
        {"titulo": "OITAVAS DE FINAL", "jogos": jogos_oitavas},
        {"titulo": "QUARTAS DE FINAL", "jogos": jogos_quartas},
        {"titulo": "SEMIFINAL", "jogos": jogos_semifinais},
        {"titulo": "3º LUGAR & FINAL", "jogos": [jogo_terceiro, jogo_final]},
    ]

@app.route("/api/mata-mata")
def api_mata_mata():
    return jsonify(_resolver_fases_mata_mata())

if __name__ == "__main__":

    app.run(debug=True)