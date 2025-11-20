import os
import re
import json
import time
import argparse
import requests
import markdown
from typing import Optional
from pathlib import Path
from urllib.parse import urlparse

DIRETORIO_RAIZ = Path(__file__).resolve().parent.parent
DIRETORIO_SAIDA = DIRETORIO_RAIZ / 'data'
ARQUIVO_SAIDA = DIRETORIO_SAIDA / 'github_projects.json'

TEMPO_PAUSA_ENTRE_REQUISICOES = 1.0
TOKEN_GITHUB = os.environ.get('GITHUB_TOKEN')

LISTA_URLS_REPOSITORIOS = [
    'https://github.com/Tiago-Daniel-Guerreiro/IpShared',
    'https://github.com/Tiago-Daniel-Guerreiro/AppDeQuiosque',
    'https://github.com/Tiago-Daniel-Guerreiro/SistemaHospitalar',
    'https://github.com/Tiago-Daniel-Guerreiro/tiago-daniel-guerreiro.github.io',
    'https://github.com/Tiago-Daniel-Guerreiro/Site-Manga',
    'https://github.com/Tiago-Daniel-Guerreiro/Site-Agendamentos',
    'https://github.com/Tiago-Daniel-Guerreiro/SistemaDeGestaoDeBiblioteca',
]

class ClienteGithub:
    """
    Responsável por realizar chamadas HTTP à API do GitHub ou a URLs raw.
    Gerencia cabeçalhos de autenticação e sessões.
    """
    def __init__(self, token: Optional[str] = None):
        self.sessao = requests.Session()
        self.sessao.headers.update({'Accept': 'application/vnd.github.v3+json'})
        if token:
            self.sessao.headers['Authorization'] = f'token {token}'

    def obter_json_api(self, url: str) -> dict:
        """Realiza GET esperando JSON como resposta."""
        resposta = self.sessao.get(url, timeout=20)
        resposta.raise_for_status()
        return resposta.json()

    def obter_conteudo_texto(self, url: str) -> str | None:
        """Realiza GET esperando texto puro (raw) como resposta."""
        try:
            resposta = requests.get(url, timeout=20)
            if resposta.status_code == 200:
                return resposta.text
        except Exception as erro:
            print(f"Erro ao buscar texto raw de {url}: {erro}")
        return None

    def buscar_metadados_repositorio(self, dono: str, repositorio: str) -> dict:
        url = f'https://api.github.com/repos/{dono}/{repositorio}'
        return self.obter_json_api(url)

    def buscar_readme(self, dono: str, repositorio: str, branch_padrao: str | None = None) -> str | None:
        """
        Obtém o README do repositório.
        Estratégia:
        1) Tenta API /readme com Accept raw.
        2) Tenta URLs raw diretas testando múltiplos branches e nomes de arquivo,
           mesmo quando não há branch_padrao disponível (ex.: falha da API).
        """
        # Tentativa 1: Via API (mais estável para metadados)
        url_api = f'https://api.github.com/repos/{dono}/{repositorio}/readme'
        # self.sessao.headers pode ser um Mapping; usar dict(...) evita warnings de tipo
        headers_personalizados = dict(self.sessao.headers)
        headers_personalizados['Accept'] = 'application/vnd.github.v3.raw'

        try:
            resposta = requests.get(url_api, headers=headers_personalizados, timeout=20)
            if resposta.status_code == 200 and resposta.text:
                return resposta.text
        except Exception:
            # Falha silenciosa para tentar o método raw direto
            pass

        # Tentativa 2: Via URL raw direta (caso a API falhe ou quota excedida)
        # Monta lista de branches candidatos e nomes de arquivo comuns
        branches = []
        if branch_padrao:
            branches.append(branch_padrao)
        # Adiciona heurísticas comuns, evitando duplicados
        for b in [
            'main', 'master'
        ]:
            if b not in branches:
                branches.append(b)

        nomes_arquivos = [
            'README.md', 'README.MD', 'Readme.md', 'readme.md',
            'README.markdown', 'README.rst', 'README.txt', 'README'
        ]

        for b in branches:
            for nome in nomes_arquivos:
                url_raw = f'https://raw.githubusercontent.com/{dono}/{repositorio}/{b}/{nome}'
                conteudo = self.obter_conteudo_texto(url_raw)
                if conteudo:
                    return conteudo

        return None


class ExtratorDeInformacoesUrl:
    """ Responsável por processar strings de URL e extrair componentes como dono e repositório. """
    @staticmethod
    def extrair_dono_e_repositorio(url: str) -> tuple[str, str] | tuple[None, None]:
        try:
            objeto_parseado = urlparse(url)
            partes_caminho = [parte for parte in objeto_parseado.path.split('/') if parte]
            
            # Estrutura esperada: /dono/repositorio
            if len(partes_caminho) >= 2:
                dono = partes_caminho[0]
                repositorio = partes_caminho[1]
                if repositorio.endswith('.git'):
                    repositorio = repositorio[:-4]
                return dono, repositorio
        except Exception:
            pass

        # Fallback para URLs mal formatadas ou sem protocolo
        if '/' in url:
            partes_manuais = url.rstrip('/').split('/')
            if len(partes_manuais) >= 2:
                repositorio = partes_manuais[-1]
                if repositorio.endswith('.git'):
                    repositorio = repositorio[:-4]
                dono = partes_manuais[-2]
                return dono, repositorio
                
        return None, None


class ProcessadorMarkdown:
    """
    Responsável por limpar o texto Markdown bruto e separar Título do Corpo.
    Remove ruídos iniciais (badges de build, shields.io, etc).
    """
    
    # Dicionário de Regex para limpeza do corpo do texto
    FILTROS_REGEX_CORPO = {
        'remover_marcador_linguagem':       {'padrao': r'(?m)^!\S+\s*$', 'substituicao': ''},
        'remover_marcadores_explicitos':    {'padrao': r'!Language|!Status', 'substituicao': ''},
        'remover_bash_solitario':           {'padrao': r'(?m)^bash\s*$', 'substituicao': ''},
        'remover_secao_emoji_utilizar':     {'padrao': r'(?s)##\s*🛠️\s*Como Utilizar.*?(?=##|$)', 'substituicao': ''},
        'remover_secao_plain_utilizar':     {'padrao': r'(?s)##\s*Como Utilizar.*?(?=##|$)', 'substituicao': ''},
        'adicionar_quebra_antes_h2':        {'padrao': r'(?m)^(##\s*)', 'substituicao': r'\n\1'},
        'colapsar_quebras_linha_excessivas':{'padrao': r'\n{3,}', 'substituicao': '\n\n'},
    }

    @staticmethod
    def _linha_eh_ruido_inicial(linha: str) -> bool:
        """Verifica se a linha é um badge, imagem de status ou vazia."""
        if not linha:
            return True
        linha_lower = linha.lower()
        if linha.startswith('!') or linha.startswith('[![') or linha.startswith('[!'):
            return True
        if 'shields.io' in linha_lower or 'badge' in linha_lower:
            return True
        return False

    def extrair_titulo_e_corpo(self, texto_readme: str) -> tuple[str | None, str]:
        linhas = []

        for linha in texto_readme.splitlines():
            linhas.append(linha.rstrip())

        indice_atual = 0
        total_linhas = len(linhas)

        # Pula as badges
        while indice_atual < total_linhas:
            if self._linha_eh_ruido_inicial(linhas[indice_atual].strip()):
                indice_atual += 1
            else:
                break

        # Tenta encontrar o Título
        titulo = None
        for i in range(indice_atual, total_linhas):
            linha_limpa = linhas[i].strip()
            # Preferência por H1 (# )
            if linha_limpa.startswith('# ') and not linha_limpa.startswith('## '):
                titulo = linha_limpa[2:].strip()
                indice_atual = i + 1
                break
            # Aceita H2 (## ) se ainda não achou H1
            if linha_limpa.startswith('## ') and not linha_limpa.startswith('### ') and titulo is None:
                titulo = linha_limpa[3:].strip()
                indice_atual = i + 1
                break
        
        # Pula linhas em branco após o título
        while indice_atual < total_linhas and linhas[indice_atual].strip() == '':
            indice_atual += 1

        corpo = '\n'.join(linhas[indice_atual:]).strip()
        return titulo, corpo

    def limpar_corpo_bruto(self, corpo: str) -> str:
        """Aplica filtros de regex definidos na constante da classe."""
        texto_processado = corpo
        for nome_filtro, spec in self.FILTROS_REGEX_CORPO.items():
            texto_processado = re.sub(spec['padrao'], spec['substituicao'], texto_processado)
        return texto_processado.strip()


class ConversorMarkdownHtml:
    """
    Encapsula a lógica de conversão de MD para HTML, incluindo pré-processamento 
    para listas e negrito.
    """

    @staticmethod
    def escapar_html_basico(texto: str) -> str:
        if texto is None:
            return ''
        return (texto.replace('&', '&amp;')
                     .replace('<', '&lt;')
                     .replace('>', '&gt;'))

    def converter(self, corpo_markdown: str) -> str:
        # Pré-processamento: Remover negrito (**texto**) se estiver dentro de links ou colchetes
        # Ex: [**Texto**] -> [Texto]
        def _remover_negrito_interno(match):
            conteudo = match.group(1).replace('**', '')
            return f'[{conteudo}]'
        
        corpo_preparado = re.sub(r'\[([^\]]*?)\]', _remover_negrito_interno, corpo_markdown or '')

        # Inserir linha em branco antes de itens de lista para garantir renderização correta
        # Regex olha para listas que não são precedidas por duas quebras de linha
        corpo_preparado = re.sub(r'(?m)(?<!\n\n)(^(?:\s*)(?:[-*+]|\d+\.)\s+)', r'\n\n\1', corpo_preparado)
        # Separar cabeçalhos de listas
        corpo_preparado = re.sub(r'(?m)^(#{1,6} .*?)\n((?:[-*+]|\d+\.)\s+)', r'\1\n\n\2', corpo_preparado)

        # Conversão usando biblioteca Markdown
        html = markdown.markdown(
            corpo_preparado or '', 
            extensions=['extra', 'sane_lists', 'nl2br']
        )
        return html


class FormatadorHtml:
    """
    Responsável por limpar e formatar o HTML gerado.
    Remove tags indesejadas, corrige listas mal formadas e remove badges.
    """
    PADROES_EMBLEMAS = [
        r'<p[^>]*>\s*<img[^>]*alt="[^"]*\.NET Framework"[^>]*>\s*</p>',
        r'<p[^>]*>\s*<img[^>]*src="[^"]*shields\.io[^"]*"[^>]*>\s*</p>',
        r'<p[^>]*>\s*<img[^>]*alt="[^"]*badge[^"]*"[^>]*>\s*</p>',
        r'<img[^>]*alt="[^"]*\.NET Framework"[^>]*>',
        r'<img[^>]*src="[^"]*shields\.io[^"]*"[^>]*>',
        r'<img[^>]*alt="[^"]*badge[^"]*"[^>]*>',
        r'<p[^>]*>\s*(?:<img[^>]*>[\s\n]*)+</p>',
    ]

    REGEX_REMOVER_LINHA_DEMO = re.compile(
        r'<p[^>]*>[^<]*Uma versão de demonstração está disponível online em[\s\S]*?</p>',
        flags=re.IGNORECASE
    )

    def limpar_emblemas_e_imagens_status(self, html: str) -> str:
        if not html: 
            return html
        
        html_limpo = html
        for padrao in self.PADROES_EMBLEMAS:
            html_limpo = re.sub(padrao, '', html_limpo, flags=re.IGNORECASE | re.MULTILINE)
        
        # Remover parágrafos vazios resultantes da remoção
        html_limpo = re.sub(r'<p>\s*</p>', '', html_limpo)
        return html_limpo.strip()

    def corrigir_titulos_u0001(self, html: str) -> str:
        """
        Corrige artefactos onde headings vieram como parágrafos iniciados com \u0001.
        - <p>\u0001Título<br>... => <h2>Título</h2><p>...
        - <p>\u0001Título</p>   => <h2>Título</h2>
        Remove quaisquer \u0001 remanescentes.
        """
        if not html:
            return ""
        out = html
        # 1) Parágrafo com título + <br>
        out = re.sub(r"<p>\u0001([^<]+?)<br\s*\/??\s*>", lambda m: f"<h2>{self._escape_texto(m.group(1).strip())}</h2><p>", out)
        # 2) Parágrafo que é só o título
        out = re.sub(r"<p>\u0001([^<]+?)<\/p>", lambda m: f"<h2>{self._escape_texto(m.group(1).strip())}</h2>", out)
        # 3) Remover quaisquer ocorrências restantes
        out = out.replace("\u0001", "")
        return out

    @staticmethod
    def _escape_texto(txt: str) -> str:
        return (txt
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
               )

    def corrigir_listas_html(self, html: str) -> str:
        """Corrige estruturas <ul> e <ol> que podem ter sido geradas incorretamente."""
        linhas = html.split('\n')
        saida = []
        dentro_ul = False
        dentro_ol = False

        for linha in linhas:
            # Detectar itens de lista não ordenada soltos em parágrafos
            match_ul = re.match(r'<p>\s*[-*+]\s+(.*?)</p>\s*$', linha)
            # Detectar itens de lista ordenada soltos em parágrafos
            match_ol = re.match(r'<p>\s*(\d+)\.\s+(.*?)</p>\s*$', linha)

            if match_ul:
                if not dentro_ul:
                    if dentro_ol: saida.append('</ol>'); dentro_ol = False
                    saida.append('<ul>'); dentro_ul = True
                saida.append(f'<li>{match_ul.group(1)}</li>')
                continue

            if match_ol:
                if not dentro_ol:
                    if dentro_ul: saida.append('</ul>'); dentro_ul = False
                    saida.append('<ol>'); dentro_ol = True
                saida.append(f'<li>{match_ol.group(2)}</li>')
                continue

            # Fechar listas se encontrar uma linha normal
            if dentro_ul: saida.append('</ul>'); 
            dentro_ul = False
            if dentro_ol: saida.append('</ol>'); 
            dentro_ol = False
            saida.append(linha)

        if dentro_ul: saida.append('</ul>')
        if dentro_ol: saida.append('</ol>')
        
        return '\n'.join(saida)

    def remover_paragrafos_dentro_de_li(self, html: str) -> str:
        """Transforma <li><p>Texto</p></li> em <li>Texto</li>."""
        def _colapsar(match):
            interno = match.group(1).strip()
            interno = re.sub(r'</p>\s*<p>', '<br /><br />', interno)
            interno = re.sub(r'^<p>|</p>$', '', interno)
            return f'<li>{interno}</li>'
            
        html = re.sub(r'<li>\s*((?:<p>.*?</p>\s*)+)\s*</li>', _colapsar, html, flags=re.DOTALL)
        html = re.sub(r'<li>\s*<p>(.*?)</p>\s*</li>', r'<li>\1</li>', html, flags=re.DOTALL)
        return html

    def dividir_li_concatenados(self, html: str) -> str:
        """
        Divide itens de lista que usam ' - ' como separador visual mas deveriam ser múltiplos itens.
        Ex: <li>Item 1 - Item 2</li> vira <li>Item 1</li><li>Item 2</li>
        """
        def _expandir(match):
            bloco_li = match.group(0)
            # Se tiver sub-listas, não mexe
            if '<ul' in bloco_li or '<ol' in bloco_li:
                return bloco_li
            
            m = re.match(r'<li>([\s\S]*?)</li>', bloco_li)
            if not m:
                return bloco_li
            conteudo_interno = m.group(1)
            if ' - ' not in conteudo_interno:
                return bloco_li
            
            # Separa por hífen, mas tenta evitar quebrar palavras compostas (heuristicamente)
            partes = re.split(r'\s+-\s+(?=(?:<strong>|[A-Za-zÁ-Úá-ú]))', conteudo_interno)
            if len(partes) <= 1:
                return bloco_li
            
            return ''.join(f'<li>{parte.strip()}</li>' for parte in partes if parte.strip())

        return re.sub(r'<li>[\s\S]*?</li>', _expandir, html)

    def limpeza_final(self, html: Optional[str], nome_repositorio: str) -> str:
        # aceita None como entrada e normaliza para string vazia
        if not html: return ""
        
        html = self.limpar_emblemas_e_imagens_status(html)
        # Corrigir casos antigos onde títulos vieram com \u0001 no início do parágrafo
        html = self.corrigir_titulos_u0001(html)
        
        # Lógica específica de portfólio
        if nome_repositorio in ["tiago-daniel-guerreiro.github.io", "Site-Manga"]:
            html = re.sub(r'<p><strong>Visite:</strong>\s*<a[^>]*>.*?</a></p>', '', html)

        # Limpezas estruturais
        html = self.corrigir_listas_html(html)
        html = self.remover_paragrafos_dentro_de_li(html)
        html = self.dividir_li_concatenados(html)
        
        # Remover menção a demonstração online (se desejado)
        html = self.REGEX_REMOVER_LINHA_DEMO.sub('', html)
        
        # Remover listas vazias
        html = re.sub(r'<ul>\s*</ul>', '', html)
        html = re.sub(r'<ol>\s*</ol>', '', html)
        
        # Normalizar quebras de linha
        html = re.sub(r'\n{3,}', '\n\n', html)
        
        return html.strip()


class GerenciadorDeRepositorios:
    """
    Orquestrador Principal.
    Conecta o Cliente API, o Processador Markdown e o Higienizador HTML.
    """
    def __init__(self):
        self.cliente_github = ClienteGithub(TOKEN_GITHUB)
        self.processador_md = ProcessadorMarkdown()
        self.conversor_md = ConversorMarkdownHtml()
        self.higienizador = FormatadorHtml()

    def processar_repositorio_unico(self, url: str) -> dict | None:
        dono, nome_repositorio = ExtratorDeInformacoesUrl.extrair_dono_e_repositorio(url)
        
        if not dono or not nome_repositorio:
            print(f'IGNORADO (URL inválida): {url}')
            return None

        print(f'Processando: {dono}/{nome_repositorio} ...')
        dados_saida = {
            'repo': nome_repositorio,
            'link': f'https://github.com/{dono}/{nome_repositorio}'
        }

        # 1) Tenta metadados via API, mas não aborta em caso de falha
        branch_padrao = None
        try:
            info_api = self.cliente_github.buscar_metadados_repositorio(dono, nome_repositorio)
            if isinstance(info_api, dict):
                dados_saida['description'] = info_api.get('description') or ""
                branch_padrao = info_api.get('default_branch')
        except Exception as e:
            print(f'  AVISO METADADOS: falha ao obter api.github.com ({e}). Prosseguindo com fallback raw...')

        # 2) Tenta README (API primeiro; em falha, raw com heurísticas de branch/arquivo)
        texto_readme = None
        try:
            texto_readme = self.cliente_github.buscar_readme(dono, nome_repositorio, branch_padrao)
        except Exception as e:
            print(f'  AVISO README: falha ao obter README ({e}).')

        if texto_readme:
            try:
                # Extração e Limpeza Markdown
                titulo, corpo_bruto = self.processador_md.extrair_titulo_e_corpo(texto_readme)
                corpo_limpo = self.processador_md.limpar_corpo_bruto(corpo_bruto)

                # Conversão para HTML
                html_gerado = self.conversor_md.converter(corpo_limpo)

                # Higienização do HTML
                html_final = self.higienizador.limpeza_final(html_gerado, nome_repositorio)

                dados_saida['title'] = titulo or ""
                dados_saida['description_html'] = html_final or ""
            except Exception as e:
                print(f'  AVISO PROCESSAMENTO: falha ao processar README ({e}).')
        else:
            print(f'  AVISO: README não encontrado para {nome_repositorio}')

        return dados_saida

    def buscar_todos(self, lista_urls: list[str]) -> list[dict]:
        resultados = []
        for url in lista_urls:
            item = self.processar_repositorio_unico(url)
            if item:
                resultados.append(item)
            time.sleep(TEMPO_PAUSA_ENTRE_REQUISICOES)
        return resultados

    def reaplicar_limpeza_em_dados_existentes(self, dados: list[dict]) -> list[dict]:
        """Permite limpar o HTML novamente sem fazer fetch na API."""
        alterados = 0
        for item in dados:
            html_atual = item.get('description_html')
            nome_repo = item.get('repo', '')
            
            novo_html = self.higienizador.limpeza_final(html_atual, nome_repo)
            
            if novo_html != html_atual:
                item['description_html'] = novo_html
                alterados += 1
        
        print(f'Limpeza local aplicada. {alterados} registros modificados.')
        return dados

def carregar_dados_json() -> list[dict]:
    if not ARQUIVO_SAIDA.exists():
        return []
    try:
        return json.loads(ARQUIVO_SAIDA.read_text(encoding='utf-8'))
    except json.JSONDecodeError:
        return []

def salvar_dados_json(dados: list[dict]):
    DIRETORIO_SAIDA.mkdir(parents=True, exist_ok=True)
    ARQUIVO_SAIDA.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Dados salvos com sucesso em: {ARQUIVO_SAIDA} ({len(dados)} itens)')

def configurar_argumentos_cli():
    # Mantido por compatibilidade, mas parâmetros são ignorados.
    return argparse.Namespace()

def main():
    # Sem parâmetros: por padrão BUSCA, LIMPA e SUBSTITUI o ficheiro existente.
    gerente = GerenciadorDeRepositorios()
    print("Buscando dados da API do GitHub...")
    dados = gerente.buscar_todos(LISTA_URLS_REPOSITORIOS)
    # Passada final de limpeza e normalização
    dados = gerente.reaplicar_limpeza_em_dados_existentes(dados)
    salvar_dados_json(dados)

if __name__ == '__main__':
    main()