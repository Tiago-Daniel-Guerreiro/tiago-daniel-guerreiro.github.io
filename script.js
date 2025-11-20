// Código principal da aplicação - gestão e inicialização dos módulos
const App = {

    // Lista de ações/módulos a inicializar
    acoes: {
        0: () => App.Scroll.init(),
        1: () => App.projetos.init(),
        2: () => App.revelar_scroll.init(),
        3: () => App.animacaoDeDigitacao.init(),
        4: () => App.tema.init(),
        5: () => App.menu.init(),
        6: () => App.easter_egg.init(),
    },

    // Inicializa todos os módulos listados em 'acoes' com tratamento de erros individual para evitar falhas totais
    init() {
        for(const indiceAtual in this.acoes) {
            try {
                this.acoes[indiceAtual]();
            } catch (error) {
                console.error(`Erro ao inicializar o módulo ${indiceAtual}:`, error);
            }
        }
    },

    // Função para desativar temporariamente um botão
    async DesativarBotaoTemporariamente(button, duration = 300) {
        if (button.disabled) return;
        button.disabled = true;
        await new Promise(resolve => setTimeout(resolve, duration));
        button.disabled = false;
    },
    //Sistema de scroll inteligente - salva e restaura a posição do scroll
    Scroll: {
        // Guarda as configurações para fácil acesso e modificação
        config: {
            STORAGE_KEY: 'scrollPosition',
            NAVIGATION_FLAG: 'manualNavigation',
        },

        // Armazena referências aos elementos da página para evitar buscas repetidas
        elementos: {
            mainContent: null,
            headerLinks: null,
        },

        // Ponto de entrada. Chama os outros métodos na ordem correta.
        init() {
            this.cacheElementos();
            this.vincularEventos();
            this.mostrarConteudo();

            // Aguarda todos os recursos (imagens, etc.) serem carregados
            window.addEventListener('load', () => {
                this.restorePosition();
                this.mostrarConteudo();
            });

            // Garante que o main fica visível mesmo se o evento load não disparar
            this.mostrarConteudo();

            // Garante que o main fica visível mesmo se o evento load não disparar
            setTimeout(() => {
                this.mostrarConteudo();
            }, 2000); // 2 segundos após init, como fallback
        },

        cacheElementos() { // Encontra os elementos do DOM e guarda suas referências.
            this.elementos.mainContent = document.querySelector('main');
            this.elementos.headerLinks = document.querySelectorAll('header a');
        },

        // Centraliza a configuração de todos os event listeners.
        vincularEventos() {
            // Salva a posição sempre que o usuário rolar a página
            window.addEventListener('scroll', () => this.savePosition());

            // Adiciona o comportamento de scroll suave aos links do header
            this.elementos.headerLinks.forEach(link => {
                link.addEventListener('click', (event) => this.handleLinkClick(event));
            });
        },

        // Salva a posição Y atual no sessionStorage.
        savePosition() { sessionStorage.setItem(this.config.STORAGE_KEY, window.scrollY); },

        restorePosition() { // Restaura a posição do scroll ao recarregar a página.
            // Se o utilizador navegou clicando em um link, não restauramos a posição, pois ele já está na posição correta
            if (sessionStorage.getItem(this.config.NAVIGATION_FLAG)) {
                sessionStorage.removeItem(this.config.NAVIGATION_FLAG); // Limpa a flag para futuras recargas
                return;
            }

            const savedPosition = sessionStorage.getItem(this.config.STORAGE_KEY);
            if (savedPosition) {
                // Rola para a posição salva de forma instantânea
                window.scrollTo({
                    top: parseInt(savedPosition, 10),
                    behavior: 'instant'
                });
            }
        },
        
        // Intercepta o clique nos links para criar uma navegação suave e controlar o estado.
        handleLinkClick(event) {
            event.preventDefault(); // Impede o pulo brusco e a mudança na URL
            
            const targetId = event.currentTarget.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                sessionStorage.setItem(this.config.NAVIGATION_FLAG, 'true'); // Sinaliza que o próximo carregamento não deve restaurar a posição

                // Rola suavemente até o elemento alvo se o usuário não tiver preferência por reduzir movimento
                if (!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches))
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                else
                    targetElement.scrollIntoView({ behavior: 'instant' });

                history.pushState("", document.title, window.location.pathname + window.location.search); // Limpa a URL, removendo o #id-seccao
            }
        },

        // Torna o conteúdo principal visível após o posicionamento.
        mostrarConteudo() { if (this.elementos.mainContent) { this.elementos.mainContent.classList.add('visivel'); } },
    },

    // Menu - Controla a abertura/fechamento do menu de navegação
    menu: {
        header: document.querySelector('.site-header'),

        init() {
            if (!this.header) return; // Verifica se o header existe

            document.querySelectorAll('.nav-toggle').forEach(btn => {
                btn.addEventListener('click', (elemento) => {
                    this.toggle();
                    this.ativar_animacoes_header();
                    App.DesativarBotaoTemporariamente(elemento.currentTarget);
                });
            });

            window.addEventListener('resize', () => this.handleResize());
        },

        ativar_animacoes_header() {
            // Respeita a preferência de movimento reduzido do utilizador.
            if (!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches))
                this.header.classList.add('menu-animacoes');
        },

        toggle() {
            this.header.classList.toggle('nav-open');
        },
        
        closer() {
            if (this.header.classList.contains('nav-open'))
                this.header.classList.remove('nav-open');

            if (this.header.classList.contains('menu-animacoes'))
                this.header.classList.remove('menu-animacoes');

        },
        
        handleResize() { if (window.innerWidth >= 900) this.closer(); }
    },

    // Animações de scroll, de reveleção de secções
    revelar_scroll: {
        init() {
            const elementos = document.querySelectorAll('section');
            if (elementos.length === 0) return;

            // Estado inicial (pronto para animar)
            elementos.forEach(elemento => elemento.classList.add('revelar'));

            const reduzirMovimento =
                                    window.matchMedia && // Verifica se o dispositivo suportar o método
                                    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            // Verifica se o dispositivo suportar IntersectionObserver e não usa reduzir movimentos
            if (!reduzirMovimento && 'IntersectionObserver' in window) {
                    const observador = new IntersectionObserver((entradas, observador) => {
                        entradas.forEach(entrada => {
                            if (entrada.isIntersecting) {
                                entrada.target.classList.add('visivel');
                                observador.unobserve(entrada.target); // só revela uma vez
                            }
                    });
                }, { threshold: 0.15, rootMargin: '80px 0px' }); // Quando 15% do elemento estiver visível adiciona "visivel"

                elementos.forEach(elemento => observador.observe(elemento));
            } else {
                // Mostra tudo quando o dispositivo é incompativel ou usa reduzir movimentos
                elementos.forEach(elemento => elemento.classList.add('visivel'));
            }
        }
    },
    
    // Projetos - Gere a exibição de projetos em cards e a visualização do modal
    projetos: {
        "ImagensEmLoop": false,
        "dadosProjetos": [
            {
                "id": 1,
                "repo": "IpShared",
                "coverImage": null,
                "images": null,
                "demoLink": null,
                "tags": ["C#", "Avalonia UI", "Multiplataforma"]
            },
            {
                "id": 2,
                "repo": "AppDeQuiosque",
                "coverImage": "/assets/projetos/quiosque/capa.webp",
                "images": [
                    "/assets/projetos/quiosque/1.webp",
                    "/assets/projetos/quiosque/2.webp",
                    "/assets/projetos/quiosque/3.webp"
                ],
                "demoLink": null,
                "tags": ["C#", "Windows Forms", "JSON"]
            },
                        {
                "id": 3,
                "repo": "SistemaHospitalar",
                "coverImage": null,
                "images": null,
                "demoLink": null,
                "tags": ["Python"]
            },
            {
                "id": 4,
                "repo": "Site-Manga",
                "coverImage": null,
                "images": null,
                "demoLink": "https://tiago-daniel-guerreiro.github.io/Site-Manga/",
                "tags": ["JavaScript","CSS","HTML"]
            },
            {
                "id": 5,
                "repo": "Site-Agendamentos",
                "coverImage": "",
                "images": null,
                "demoLink": "site-agendamentos.great-site.net",
                "tags": ["PHP", "MySQL"]
            },
            {
                "id": 6,
                "repo": "SistemaDeGestaoDeBiblioteca",
                "coverImage": null,
                "images": null,
                "demoLink": null,
                "tags": ["Python", "JSON"]
            },
            {
                "id": 7,
                "repo": "tiago-daniel-guerreiro.github.io",
                "coverImage": null,
                "images": null,
                "demoLink": null,
                "tags": ["CSS", "JavaScript","HTML"],
                "showInCards": false
            }
        ],
        
        // Mantém o estado atual do modal (qual projeto está aberto, qual imagem, etc.)
        estado: {
            projetoAtual: null,
            indiceImagemAtual: 0,
            imagensDoProjetoAtual: [],
        },

        // Flags internas para gerir o histórico do navegador quando o modal está aberto
        _pushedState: false,
        _closingFromPop: false,

        // Armazena referências aos elementos da página para evitar buscas repetidas
        elementos: {
            containerProjetos: document.querySelector('.projects-container'),
            modal: null,
            tituloModal: null,
            imagemPrincipalModal: null,
            miniaturasModal: null,
            detalhesModal: null,
            linksModal: null,
            botaoProximo: null,
            botaoAnterior: null,
        },

        // Inicializa o módulo de projetos - criando o modal, carregando os cards e vinculando eventos
        async init() {
            this.criarEstruturaModal();

            // Tenta carregar dados pré-buscados (gerados pelo script Python) para evitar chamadas ao GitHub em runtime
            try {
                await this.loadLocalGithubData();
            } catch (e) {
                // se falhar, continuamos com os dados locais definidos no código
                console.info('loadLocalGithubData falhou ou não existe (ok):', e.message);
            }

            // Gera os cards usando função dedicada
            this.CarregarCardsDeProjetos();
            this.RegistarFalhasNoCarregamentoDeImagens();
            this.vincularEventos();
            this.verificarUrl();
        },

        // Verifica a URL atual (hash) e abre o modal se for um link do tipo #<id> (numérico)
        // Também aceita o formato antigo '#projeto-<id>' como compatibilidade
        verificarUrl() {
            try {
                const hash = (window.location.hash || '').toString();
                if (!hash) return;

                let idStr = null;

                // Caso novo: hash apenas numérico, ex: '#4'
                const numericMatch = hash.match(/^#(\d+)$/);
                if (numericMatch) {
                    idStr = numericMatch[1];
                }

                if (!idStr) return;

                const idNum = Number(idStr);
                if (!Number.isNaN(idNum) && Number.isInteger(idNum)) {
                    const projeto = this.obterProjetoPorId(idNum);
                    if (projeto) {
                        // Abrir sem empurrar novo estado (já estamos com esse hash)
                        this.abrirModal(projeto.id, false);
                    }
                }
            } catch (err) {
                console.error('Erro ao verificar o hash da URL para abrir modal:', err);
            }
        }
,
    // Tenta ler o arquivo gerado pelo script Python (data/github_projects.json)
        async loadLocalGithubData() {
            const path = '/data/github_projects.json';
            let resp;

            try {
                resp = await fetch(path, { cache: 'no-cache' });
            } catch (e) { throw e; }

            if (!resp.ok) { throw new Error(`HTTP ${resp.status}`); }

            const projects = await resp.json();

            if (!Array.isArray(projects)) return;

            for (const repoInfo of projects) {
                // Para cada item do json, tenta encontrar o projeto correspondente nos dados locais
                if (!repoInfo.repo) continue;

                const projetoLocal = this.obterProjetoPorRepo(repoInfo.repo);

                if (!projetoLocal) continue;

                // Adiciona os campos pré-processados ao projeto local
                if (repoInfo.description) projetoLocal.description = repoInfo.description;
                if (repoInfo.link) projetoLocal.githubLink = repoInfo.link;
                if (repoInfo.title) projetoLocal.title = repoInfo.title;
                if (repoInfo.description_html) projetoLocal.description_html = repoInfo.description_html;
            }
        },

        /**
         * Converte caracteres especiais em entidades HTML para impedir injeção de código
         * e quebra da marcação quando o conteúdo vem de fontes externas (ex: README, tags).
         * Escapa:
         *  &  -> &amp;
         *  <  -> &lt;
         *  >  -> &gt;
         *  "  -> &quot;
         *  '  -> &#39;
         * Retorna string vazia se str for null/undefined/falsy.
         */
        escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },

        // Encontra um projeto pelo nome do repositório (repo). Retorna undefined se não achar.
        obterProjetoPorRepo(repo) {
            if (!repo) return undefined;
            const repo_formatado = String(repo).toLowerCase();
            return this.dadosProjetos.find(p =>
                p && p.repo && p.repo.toLowerCase() === repo_formatado
            );
        },

        // Encontra um projeto pelo id numérico. Retorna undefined se não achar.
        obterProjetoPorId(id) {
            if (id == null) return undefined;
            return this.dadosProjetos.find(p => p && p.id === id);
        },
        // Cria o HTML do modal, insere no body e guarda as referências aos seus elementos
        criarEstruturaModal() {
            if (document.querySelector('.project-modal')) return;

            const modalHTML = `
                <div class="project-modal">
                    <div class="modal-overlay"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2 class="modal-title"></h2>
                            <button class="btn add-border add-background-hover icon-only-close modal-close-btn" aria-label="Fechar"></button>
                        </div>
                        <div class="modal-body">
                            <section class="modal-images-section">
                                <div class="modal-image-viewer">
                                    <img src="" alt="Imagem principal do projeto" class="modal-main-image">
                                    <button class="btn add-background-clicked is-circular icon-only-arrow_left modal-arrow modal-arrow-prev"></button>
                                    <button class="btn add-background-clicked is-circular icon-only-arrow_right modal-arrow modal-arrow-next"></button>
                                </div>
                                <div class="modal-thumbnails"></div>
                            </section>
                            <div class="modal-tags-block">
                                <h3>Tags:</h3>
                                <div class="modal-tags"></div>
                            </div>
                            <div class="modal-details-container"></div>
                            <div class="modal-links"></div>
                        </div>
                    </div>
                </div>`;
            
            // Adiciona o modal ao final do body
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Guarda as referências para não ter que procurar na página novamente
            this.elementos.modal =                  document.querySelector('.project-modal');
            this.elementos.tituloModal =            this.elementos.modal.querySelector('.modal-title');
            this.elementos.modalTagsBlock =        this.elementos.modal.querySelector('.modal-tags-block');
            this.elementos.modalTags =              this.elementos.modal.querySelector('.modal-tags');
            this.elementos.modalCloseBtn =          this.elementos.modal.querySelector('.modal-close-btn');
            this.elementos.imagemPrincipalModal =   this.elementos.modal.querySelector('.modal-main-image');
            this.elementos.miniaturasModal =        this.elementos.modal.querySelector('.modal-thumbnails');
            this.elementos.detalhesModal =          this.elementos.modal.querySelector('.modal-details-container');
            this.elementos.linksModal =             this.elementos.modal.querySelector('.modal-links');
            this.elementos.botaoProximo =           this.elementos.modal.querySelector('.modal-arrow-next');
            this.elementos.botaoAnterior =          this.elementos.modal.querySelector('.modal-arrow-prev');
            this.elementos.modalImagesSection =     this.elementos.modal.querySelector('.modal-images-section');
            if (this.elementos.imagemPrincipalModal) {
                // Marca imagem como quebrada para que fique invisível até encontrarmos uma válida
                this.elementos.imagemPrincipalModal.addEventListener('error', () => {
                    this.elementos.imagemPrincipalModal.classList.add('is-broken');
                    this.tentarAvancarImagemOuOcultar();
                });
                // Ao carregar com sucesso, garante que fica visível
                this.elementos.imagemPrincipalModal.addEventListener('load', () => {
                    this.elementos.imagemPrincipalModal.classList.remove('is-broken');
                });
            }

            // Clique fora (overlay) fecha o modal
            const overlay = this.elementos.modal.querySelector('.modal-overlay');
            if (overlay) overlay.addEventListener('click', () => this.fecharModal());

            // Extra: clique direto no container fora do conteúdo também fecha
            this.elementos.modal.addEventListener('click', (e) => {
                if (e.target === this.elementos.modal) this.fecharModal();
            });
        },

        _extrairTextoPlano(html) {
            if (!html) return '';
            const div = document.createElement('div');
            div.innerHTML = String(html);
            const txt = div.textContent || div.innerText || '';
            return txt.replace(/\s+/g, ' ').trim(); // Remove múltiplos espaços e quebras de linha
        },

        // Decide a melhor descrição para o card e limita aos 'maxLen' primeiros caracteres
        _obterDescricaoParaCard(projeto, maxLen) {
            let texto = '';
            // Descrição vinda do GitHub (plain text)
            if (projeto.description && String(projeto.description).trim() !== '') {
                texto = String(projeto.description).trim();
            }
            // Caso não esteja disponivel usa HTML do README já convertido (description_html) → texto plano
            else if (projeto.description_html && String(projeto.description_html).trim() !== '')
                texto = this._extrairTextoPlano(projeto.description_html);
            
            let limite = 200;
            if (typeof maxLen === 'number' && maxLen > 0 )
                limite = maxLen;

            if (texto.length > limite) 
                texto = texto.slice(0, limite) + '...';

            return texto;
        },

        // Cria o HTML para um card de projeto individual
        criarHtmlDoCard(projeto) {
            // Usar título do README primeiro, se não existir usa o do repositório e em ultimo caso usa um padrão
            const tituloCard = projeto.title || projeto.repo || 'Projeto sem título';

            return `
                <li class="project-card add-filter-brightness-115 add-shadow-sm">
                    <img src="${projeto.coverImage || ''}" alt="Capa do projeto ${this.escapeHtml(tituloCard)}" class="card-image" loading="lazy">
                    <div class="card-content">
                        <p class="card-tags">${this.escapeHtml(this.obterTagsParaCard(projeto))}</p>
                        <h3 class="card-title">${this.escapeHtml(tituloCard)}</h3>
                        <p class="card-description">${this.escapeHtml(this._obterDescricaoParaCard(projeto))}</p>
                        <button class="btn add-size-medium add-background-accent-high btn-project-details" data-project-id="${projeto.id}">Ver detalhes</button>
                    </div>
                </li>
            `;
        },
        // Responsável por montar a lista de cards de projetos no container
        CarregarCardsDeProjetos() {
            if (!this.elementos.containerProjetos) return;
            const htmlCards = this.dadosProjetos
                .filter(p => p && p.showInCards !== false)
                .map(p => this.criarHtmlDoCard(p)).join('');
            this.elementos.containerProjetos.innerHTML = htmlCards;
        },

        // Obtém as tags de um projeto
        obterTags(projeto) {
            if (Array.isArray(projeto?.tags))
                return projeto.tags;

            return [];
        },
        
        // Gera o texto das tags para exibir no card (máximo 2)
        obterTagsParaCard(projeto) {
            const tags = this.obterTags(projeto);
            if (!Array.isArray(tags) || tags.length === 0) 
                return '';
            return tags.slice(0, 2).join(' · ');
        },

        // Gera o HTML para os links de demonstração e GitHub
        gerarHtmlLinks(demoLink, githubLink, repositorio) {
            const normalizar = (u) => {
                if (!u) 
                    return null;
                let url = String(u).trim();
                if (!url) 
                    return null;
                if (!/^https?:\/\//i.test(url)) 
                    url = 'https://' + url;

                return url;
            };
            const demo = normalizar(demoLink);
            let github = normalizar(githubLink);
            if (!github && repositorio) github = `https://github.com/Tiago-Daniel-Guerreiro/${encodeURIComponent(repositorio)}`;
            let html = '';
            if (github) html += ` <a href="${this.escapeHtml(github)}" target="_blank" rel="noopener noreferrer" class="btn add-background-accent-high add-background-accent-hover add-border-accent-hover icon-left-github">GitHub</a>`;
            if (demo) html += ` <a href="${this.escapeHtml(demo)}" target="_blank" rel="noopener noreferrer" class="btn add-background-accent-high add-background-accent-hover add-border-accent-hover icon-left-external">Demonstração</a>`;
            return html;
        },

        // Centraliza a configuração de todos os event listeners da página
        vincularEventos() {
            // Ao invés de adicionar um listener a cada botão, adiciona um só ao container e o método lida com a lógica
            if (this.elementos.containerProjetos) // Verifica se o container existe
                this.elementos.containerProjetos.addEventListener('click', (evento) => this.lidarCliqueNosProjetos(evento));
            
            this.vincularEventosDoModal(); // Atribui os clicks aos botões do modal
            
            // Quando uma tecla é pressionada, o método é chamado e lida com a lógica
            document.addEventListener('keydown', (evento) => this.lidarTeclaPressionada(evento));

            
            // Fecha o modal quando o utilizador pressiona "Voltar" no navegador (popstate)
            // Se o modal estiver aberto, interpretamos o popstate como pedido para fechar o modal
            window.addEventListener('popstate', (event) => {
                try {
                    const state = event.state;

                    // Se o state indica que o modal deve estar aberto, abre-o (sem empurrar history)
                    if (state && state.modalOpen && state.projectId) {
                        if (!(this.elementos && this.elementos.modal && this.elementos.modal.classList.contains('active'))) {
                            this.abrirModal(state.projectId, false);
                        }
                        return;
                    }

                    // Se o hash atual é numérico (#<id>), abre o modal correspondente
                    const hash = (window.location.hash || '').toString();
                    const numericMatch = hash.match(/^#(\d+)$/);
                    if (numericMatch) {
                        const idNum = Number(numericMatch[1]);
                        if (!Number.isNaN(idNum) && !this.elementos.modal.classList.contains('active')) {
                            this.abrirModal(idNum, false);
                            return;
                        }
                    }

                    // Caso contrário, se o modal estiver aberto, fechamos (voltar do browser)
                    if (this.elementos && this.elementos.modal && this.elementos.modal.classList.contains('active')) {
                        this._closingFromPop = true;
                        this.fecharModal();
                        this._closingFromPop = false;
                    }
                } catch (err) {
                    console.error('Erro ao tratar popstate para modal:', err);
                }
            });
        },

        //Vincula os eventos de clique aos elementos do modal
        vincularEventosDoModal() {
            if (!this.elementos.modal) return;

            this.elementos.modal.querySelector('.modal-close-btn').addEventListener('click', () => this.fecharModal());
            this.elementos.modal.querySelector('.modal-overlay').addEventListener('click', () => this.fecharModal());
            
            this.elementos.botaoProximo.addEventListener('click', () => this.mudarImagemModal(this.estado.indiceImagemAtual + 1));
            this.elementos.botaoAnterior.addEventListener('click', () => this.mudarImagemModal(this.estado.indiceImagemAtual - 1));

            // Ao invés de adicionar um listener a cada miniatura, adiciona um só ao container e o método lida com a lógica
            this.elementos.miniaturasModal.addEventListener('click', (evento) => this.lidarCliqueMiniatura(evento));
        },

        // Lida com o clique numa das miniaturas de imagem do modal
        lidarCliqueMiniatura(evento) {
            const botaoMiniaturaClicado = evento.target.closest('button');

            if (!botaoMiniaturaClicado) return;

            if (botaoMiniaturaClicado.dataset.index) // Verifica se o botão tem o atributo data-index
                this.mudarImagemModal(Number(botaoMiniaturaClicado.dataset.index)); // Converte o índice para número e muda a imagem
        },

        // Lida com cliques dentro do container de projetos
        lidarCliqueNosProjetos(evento) {
            const card = evento.target.closest('.project-card');

            let id = null;

            if (card) { // Verifica se o clique foi dentro de um card
                const btn = card.querySelector('.btn-project-details');

                if (btn) // Verifica se o botão existe
                    id = btn.dataset.projectId;
            }

            if (id) // Se um ID foi encontrado, abre o modal com esse projeto
                this.abrirModal(Number(id));
        },

        // Lida com teclas pressionadas quando o modal está aberto
        lidarTeclaPressionada(evento) {
            if (!this.estado.projetoAtual) return; // Se não houver projeto aberto, ignora

            const acoes = { // Associa teclas às ações
                'Escape': () => this.fecharModal(),
                'ArrowRight': () => this.mudarImagemModal(this.estado.indiceImagemAtual + 1),
                'ArrowLeft': () => this.mudarImagemModal(this.estado.indiceImagemAtual - 1)
            };

            if (acoes[evento.key]) // Se a tecla pressionada tiver uma ação associada, executa-a
                acoes[evento.key]();
        },

        // Prepara e abre o modal com os dados de um projeto específico
        // projetoId: número identificador do projeto
        // pushHistory: se true (padrão) empurra um novo estado no history com /<id>
        abrirModal(projetoId, pushHistory = true) {
            const projeto = this.obterProjetoPorId(projetoId);

            if (!projeto) // Se o projeto não for encontrado, sai da função
                return;

            this.estado.projetoAtual = projeto; // Define o estado
            this.estado.tentativasErroImagem = 0; // reset contador de fallback
            
            // Prepara lista de imagens segura (tratando null, [], [""], undefined)
            this.estado.imagensDoProjetoAtual = this._prepararListaDeImagens(projeto);

            this.estado.indiceImagemAtual = 0;

            // Garantir que a secção de imagens está visível e limpa de estados anteriores
            if (this.elementos.modalImagesSection)
                this.elementos.modalImagesSection.classList.remove('hidden');
            
            if (this.elementos.imagemPrincipalModal)
                this.elementos.imagemPrincipalModal.classList.remove('is-broken');

            // Preenche o conteúdo
            this.preencherConteudoDeTextoDoModal(projeto);
            this.carregarMiniaturasAsync(this.estado.imagensDoProjetoAtual);
            if (this.estado.imagensDoProjetoAtual.length > 0)
                this.mudarImagemModal(0); // Mostra a primeira imagem válida
            else
                this._ocultarViewerPorFalha();

            // Torna o modal visível
            this.elementos.modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Trava o scroll da página

            // Adiciona um estado extra ao histórico (sem alterar a URL) para que o botão "Voltar" feche o modal
            if (pushHistory) {
                try {
                    // empurra o state com um hash '#<id>' (numérico) — não provoca scroll automático e identifica o modal
                    const hash = '#' + encodeURIComponent(String(projeto.id));
                    history.pushState({ modalOpen: true, projectId: projeto.id }, "", hash);
                    this._pushedState = true;
                } catch (err) {
                    // Se o navegador não permitir, apenas seguimos sem histórico
                    console.warn('Não foi possível empurrar estado para o history:', err);
                    this._pushedState = false;
                }
            } else {
                // Abrido sem empurrar history (por ex. carregado directamente via URL)
                this._pushedState = false;
            }
        },

        // Formata e normaliza a lista de imagens de um projeto (cover + images)
        _prepararListaDeImagens(projeto) {
            let resultados = [];
            const adicionar = (valor) => {
                if (typeof valor !== 'string') return;
                const limpo = valor.trim();
                if (!limpo) return;
                resultados.push(limpo);
            };
            adicionar(projeto.coverImage);
            if (Array.isArray(projeto.images)) for (const img of projeto.images) adicionar(img);
            return resultados;
        },
        retirarIdUrl() {
                // Remove o hash numérico do URL sem criar nova entrada no histórico.
                // Usamos replaceState porque:
                // - não queremos adicionar uma nova entrada ao history (evita poluir o Back);
                // - não disparará 'popstate', portanto não causa efeitos colaterais como reabrir o modal.
                try {
                    if (/^#\d+$/.test((window.location.hash || '').toString())) {
                        history.replaceState(null, "", window.location.pathname + window.location.search);
                    }
                } catch (e) { }
        },

        // Fecha o modal e limpa o estado.
        fecharModal() {
            if (!this.elementos.modal) return;
            // Se estivermos a fechar por causa de um popstate, apenas fechamos o modal
            if (this._closingFromPop) {
                this.elementos.modal.classList.remove('active');
                document.body.style.overflow = ''; // Restaura o scroll
                this.estado.projetoAtual = null;
                this.estado.imagensDoProjetoAtual = [];
                if (this.elementos.miniaturasModal) this.elementos.miniaturasModal.innerHTML = ''; // Limpa miniaturas
                // Depois de fecharmos por popstate, já não temos o estado empurrado
                this._pushedState = false;

                // Se por algum motivo ainda existe um hash numérico na URL, removemos
                this.retirarIdUrl()
                return;
            }

            // Se o modal abriu um estado no history, volta um passo no histórico para remover esse estado
            if (this._pushedState) {
                try {
                    history.back();
                    // A verdadeira remoção/fecho do modal será feita no handler de popstate
                    // Pequeno fallback: se após um intervalo o hash numérico continuar presente (navegador não mudou), removemos por replaceState
                    setTimeout(() => {
                        this.retirarIdUrl()
                    }, 250);
                    return;
                } catch (err) {
                    console.warn('Erro ao fazer history.back() ao fechar modal:', err);
                    // Se falhar, fechamos normalmente
                }
            }

            // Fecho normal quando não houve estado no history
            this.elementos.modal.classList.remove('active');
            document.body.style.overflow = ''; // Restaura o scroll
            this.estado.projetoAtual = null;
            this.estado.imagensDoProjetoAtual = [];
            if (this.elementos.miniaturasModal) this.elementos.miniaturasModal.innerHTML = ''; // Limpa miniaturas
            try { this.retirarIdUrl(); } catch (e) {}
        },

        // Carrega as miniaturas de forma assíncrona
        carregarMiniaturasAsync(listaDeImagens) {
            this.elementos.miniaturasModal.innerHTML = ''; // Limpa as miniaturas antigas

            listaDeImagens.forEach((urlDaImagem, indice) => {
                const miniaturaHtml = `
                    <button type="button" data-index="${indice}" class="add-filter-brightness-90">
                        <img src="${urlDaImagem}" alt="Miniatura ${indice + 1}" loading="lazy">
                    </button>`;
                this.elementos.miniaturasModal.insertAdjacentHTML('beforeend', miniaturaHtml);
                const btn = this.elementos.miniaturasModal.lastElementChild;
                const img = btn && btn.querySelector('img');
                if (img) {
                    img.addEventListener('error', () => {
                        btn.remove();
                        if (!this.elementos.miniaturasModal.querySelector('button')) {
                            this.tentarAvancarImagemOuOcultar && this.tentarAvancarImagemOuOcultar();
                        }
                    });
                }
            });
        },

        // Atualiza a imagem principal e a miniatura ativa no modal
        mudarImagemModal(novoIndice) {
            const totalImagens = this.estado.imagensDoProjetoAtual.length;

            if (totalImagens === 0) return; // Sai da função se não houver imagens para mostrar

            let indiceCalculado = novoIndice; // Começa assumindo que o novo índice é válido

            if(!this.ImagensEmLoop) { // Se as imagens estiverem em loop
                indiceCalculado = Math.max(0, Math.min(novoIndice, totalImagens - 1)); // Garante que o índice está dentro dos limites
            } else {
                // Corrige o índice se estiver fora dos limites
                if (novoIndice >= totalImagens) // Volta ao início se passar da última imagem
                    indiceCalculado = 0; // voltamos para o início (índice 0)
                else if (novoIndice < 0) // Se o novo índice for negativo
                    indiceCalculado = totalImagens - 1; // vamos para o final da lista
            }

            this.estado.indiceImagemAtual = indiceCalculado;

            // Atualiza a imagem principal do modal
            if (this.elementos.imagemPrincipalModal)
                this.elementos.imagemPrincipalModal.classList.remove('is-broken');
            this.elementos.imagemPrincipalModal.src = this.estado.imagensDoProjetoAtual[indiceCalculado];
            this.elementos.imagemPrincipalModal.alt = `Imagem ${indiceCalculado + 1} do projeto ${this.estado.projetoAtual.title || this.estado.projetoAtual.repo}`; // Atualiza o texto da imagem.

            // Atualiza a visibilidade das setas se não estiver em loop
            if (!this.ImagensEmLoop) {

                // Esconde/mostra a seta "anterior" se estiver no início.
                if((indiceCalculado === 0))
                    this.elementos.botaoAnterior.style.display = 'none';
                else
                    this.elementos.botaoAnterior.style.display = '';

                // Esconde/mostra a seta "próximo" se estiver no fim.
                if((indiceCalculado === totalImagens - 1))
                    this.elementos.botaoProximo.style.display = 'none';
                else
                    this.elementos.botaoProximo.style.display = '';
            }

            // Pega todos os botões das miniaturas.
            const todasAsMiniaturas = this.elementos.miniaturasModal.querySelectorAll('button');

            // Seleciona a miniatura correspondente à imagem atual e destaca-a
            for (const botaoMiniatura of todasAsMiniaturas) { // Percorre cada botão de miniatura.

                // Compara o índice desta miniatura com o índice da imagem que estamos a mostrar.
                if (Number(botaoMiniatura.dataset.index) === indiceCalculado)
                    botaoMiniatura.classList.add('active'); // Se for a miniatura correta, adiciona a classe 'active' para a destacar.
                else
                    botaoMiniatura.classList.remove('active'); // Se não for, remove a classe 'active' para garantir que não fica destacada.
            }
        },

        // Preenche o modal com as informações de texto do projeto
        preencherConteudoDeTextoDoModal(projeto) {
            const { repo, demoLink, githubLink, description_html } = projeto;
            const tituloModal = projeto.title || projeto.repo || 'Projeto sem título';
            const tagsArray = this.obterTags(projeto);
            const tagsHtml = tagsArray.map(tag => `<span class="modal-header-tag">${this.escapeHtml(String(tag))}</span>`).join('');
            if (this.elementos.modalTags) this.elementos.modalTags.innerHTML = tagsHtml;
            if (this.elementos.modalTagsBlock) this.elementos.modalTagsBlock.style.display = tagsArray.length ? '' : 'none';
            if (this.elementos.tituloModal) this.elementos.tituloModal.innerHTML = `<span class="modal-title-text">${this.escapeHtml(String(tituloModal))}</span>`;
            let conteudoHTML = '';
            if (description_html && description_html.trim()) conteudoHTML = `<div class="modal-section">${description_html}</div>`;
            else conteudoHTML = `<div class="modal-section"><p>Informações detalhadas não disponíveis.</p></div>`;
            this.elementos.detalhesModal.innerHTML = conteudoHTML;
            this.elementos.linksModal.innerHTML = this.gerarHtmlLinks(demoLink, githubLink, repo);
        },
        

        // Carrega as miniaturas de forma assíncrona
        carregarMiniaturasAsync(listaDeImagens) {
            this.elementos.miniaturasModal.innerHTML = ''; // Limpa as miniaturas antigas

            listaDeImagens.forEach((urlDaImagem, indice) => {
                const miniaturaHtml = `
                    <button type="button" data-index="${indice}" class="add-filter-brightness-90">
                        <img src="${urlDaImagem}" alt="Miniatura ${indice + 1}" loading="lazy">
                    </button>`;
                this.elementos.miniaturasModal.insertAdjacentHTML('beforeend', miniaturaHtml);
                const btn = this.elementos.miniaturasModal.lastElementChild;
                const img = btn && btn.querySelector('img');
                if (img) {
                    img.addEventListener('error', () => {
                        btn.remove();
                        if (!this.elementos.miniaturasModal.querySelector('button'))
                            this.tentarAvancarImagemOuOcultar && this.tentarAvancarImagemOuOcultar();
                    });
                }
            });
        },

        // Atualiza a imagem principal e a miniatura ativa no modal
        mudarImagemModal(novoIndice) {
            const totalImagens = this.estado.imagensDoProjetoAtual.length;

            if (totalImagens === 0) return; // Sai da função se não houver imagens para mostrar

            let indiceCalculado = novoIndice; // Começa assumindo que o novo índice é válido

            if(!this.ImagensEmLoop) { // Se as imagens estiverem em loop
                indiceCalculado = Math.max(0, Math.min(novoIndice, totalImagens - 1)); // Garante que o índice está dentro dos limites
            } else {
                // Corrige o índice se estiver fora dos limites
                if (novoIndice >= totalImagens) // Volta ao início se passar da última imagem
                    indiceCalculado = 0; // voltamos para o início (índice 0)
                else if (novoIndice < 0) // Se o novo índice for negativo
                    indiceCalculado = totalImagens - 1; // vamos para o final da lista
            }

            this.estado.indiceImagemAtual = indiceCalculado;

            // Atualiza a imagem principal do modal
            if (this.elementos.imagemPrincipalModal)
                this.elementos.imagemPrincipalModal.classList.remove('is-broken');
            this.elementos.imagemPrincipalModal.src = this.estado.imagensDoProjetoAtual[indiceCalculado];
            this.elementos.imagemPrincipalModal.alt = `Imagem ${indiceCalculado + 1} do projeto ${this.estado.projetoAtual.title}`; // Atualiza o texto da imagem.

            // Atualiza a visibilidade das setas se não estiver em loop
            if (!this.ImagensEmLoop) {

                // Esconde/mostra a seta "anterior" se estiver no início.
                if((indiceCalculado === 0))
                    this.elementos.botaoAnterior.style.display = 'none';
                else
                    this.elementos.botaoAnterior.style.display = '';

                // Esconde/mostra a seta "próximo" se estiver no fim.
                if((indiceCalculado === totalImagens - 1))
                    this.elementos.botaoProximo.style.display = 'none';
                else
                    this.elementos.botaoProximo.style.display = '';
            }

            // Pega todos os botões das miniaturas.
            const todasAsMiniaturas = this.elementos.miniaturasModal.querySelectorAll('button');

            // Seleciona a miniatura correspondente à imagem atual e destaca-a
            for (const botaoMiniatura of todasAsMiniaturas) { // Percorre cada botão de miniatura.

                // Compara o índice desta miniatura com o índice da imagem que estamos a mostrar.
                if (Number(botaoMiniatura.dataset.index) === indiceCalculado)
                    botaoMiniatura.classList.add('active'); // Se for a miniatura correta, adiciona a classe 'active' para a destacar.
                else
                    botaoMiniatura.classList.remove('active'); // Se não for, remove a classe 'active' para garantir que não fica destacada.
            }
        },
        RegistarFalhasNoCarregamentoDeImagens() {
            if (!this.elementos.containerProjetos) return;
            const imagens = this.elementos.containerProjetos.querySelectorAll('img.card-image');
            imagens.forEach(img => {
                const aplicarFallback = () => {
                    const card = img.closest('.project-card');
                    if (card) {
                        card.classList.add('no-image');
                        img.remove();
                    }
                };
                img.addEventListener('error', aplicarFallback, { once: true });
                if (!img.getAttribute('src') || img.getAttribute('src').trim() === '') 
                    aplicarFallback();
            });
        },
        tentarAvancarImagemOuOcultar() {
            const imgs = this.estado.imagensDoProjetoAtual;
            if (!Array.isArray(imgs) || imgs.length === 0) 
                return this._ocultarViewerPorFalha();

            this.estado.tentativasErroImagem = (this.estado.tentativasErroImagem || 0) + 1;
            if (this.estado.tentativasErroImagem >= imgs.length) 
                return this._ocultarViewerPorFalha();

            this.mudarImagemModal(this.estado.indiceImagemAtual + 1);
        },

        _ocultarViewerPorFalha() {
            if (this.elementos.modalImagesSection)
                this.elementos.modalImagesSection.classList.add('hidden');
        },
    },

    // Animação de digitação - Animação que simula a digitação de texto
    animacaoDeDigitacao: {
        ConfigPadrao: {
            velocidadeEscrever: 120,
            velocidadeApagar: 80,
            delayInicial: 1000,
            delayEntrePalavras: 1500,
            delayAposLoop: 740,
            loop: true
        },
        elementos: null, 

        init() {
            this.elementos = document.querySelectorAll('.escrever');
            if (this.elementos.length === 0) return;

            const prefereMovimentoReduzido = window.matchMedia &&
                                            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefereMovimentoReduzido) {
                this.elementos.forEach(elemento => {
                    if (this.obterPalavras(elemento).length === 0) return;
                    this.definirTextoEstatico(elemento);
                });
                return;
            }
            
            this.adicionarEventosDeImpressao(this.elementos); // Adiciona os eventos de impressão

            this.elementos.forEach(elemento => {
                const palavras = this.obterPalavras(elemento);
                if (palavras.length === 0) return;
                
                this.iniciar(elemento, palavras, this.ConfigPadrao); // Inicia a animação para cada elemento
            });
        },

        eventosDeImpressaoAdicionados : false, // Fora do objeto App.animacaoDeDigitacao, adicione uma flag global:

        adicionarEventosDeImpressao() {
            if (this.eventosDeImpressaoAdicionados) return;
            this.eventosDeImpressaoAdicionados = true;

            window.addEventListener('beforeprint', () => {
                this.elementos.forEach(elemento => {
                    elemento.dataset.animacaoPausada = 'true';
                    this.definirTextoEstatico(elemento) // Escreve o texto "original"
                });
            });

            window.addEventListener('afterprint', () => {
                this.elementos.forEach(elemento => {
                    delete elemento.dataset.animacaoPausada;
                    elemento.classList.add('escrever');

                    this.iniciar(elemento, this.obterPalavras(elemento), this.ConfigPadrao);
                });
            });
        },

        definirTextoEstatico(elemento) {
            elemento.textContent = this.obterPalavrasOriginais(elemento);
            elemento.classList.remove('a-piscar'); // Retira o piscar do "cursor"           
            elemento.classList.remove('escrever'); // Retira o cursor e o estilo especifico do efeito
        },

        obterPalavras(elemento) {
            if (elemento.dataset.palavras) {
                try {
                    const listaPalavras = JSON.parse(elemento.dataset.palavras);
                    if (Array.isArray(listaPalavras) && listaPalavras.length > 0) {
                        // Garante que o texto original é guardado apenas uma vez
                        if (!elemento.dataset.TextoOriginal) {
                            this.GuardarTextoOriginal(elemento);
                        }
                        return listaPalavras;
                    }
                } catch (erro) {
                    console.error("Erro ao processar data-palavras como JSON:", erro);
                }
            }
            // Só guarda o texto original se ainda não estiver guardado
            if (!elemento.dataset.TextoOriginal) {
                this.GuardarTextoOriginal(elemento);
            }
            return this.obterPalavrasOriginais_Array(elemento);
        },

        GuardarTextoOriginal(elemento) {
            let textoOriginal = elemento.textContent.trim();
            if(textoOriginal.length === 0) textoOriginal = '';
            elemento.dataset.TextoOriginal = textoOriginal;
        },

        obterPalavrasOriginais(elemento) {
            if (!elemento.dataset.TextoOriginal) this.GuardarTextoOriginal(elemento);
            return elemento.dataset.TextoOriginal;
        },

        obterPalavrasOriginais_Array(elemento) {
            return [this.obterPalavrasOriginais(elemento)];
        },

        pausar (ms) { return new Promise(resolve => setTimeout(resolve, ms)); },

        async escreverPalavra (elemento, velocidade, palavra) {
            for (let i = 0; i < palavra.length; i++) {
                if (elemento.dataset.animacaoPausada) return; // Verifica a flag antes de cada letra para parar mais rápida
                elemento.textContent = palavra.substring(0, i + 1);
                await this.pausar(velocidade);
            }
        },

        async apagarPalavra (elemento, velocidade, palavra) {
            for (let i = palavra.length; i > 0; i--) {
                if (elemento.dataset.animacaoPausada) return; // Verifica a flag antes de cada letra
                elemento.textContent = palavra.substring(0, i - 1);
                await this.pausar(velocidade);
            }
        },

        async iniciar(elemento, palavras, config) {
            
            if (elemento.dataset.animacaoPausada) return; // Se a animação já estiver marcada como pausada, não inicia

            elemento.textContent = '';
            elemento.classList.add('a-piscar');
            await this.pausar(config.delayInicial);
            if (elemento.dataset.animacaoPausada) return; // Verifica após cada pausa

            // Loop principal
            while (!elemento.dataset.animacaoPausada) { // O loop agora depende da flag!
                for (let i = 0; i < palavras.length; i++) {
                    // Verifica a flag antes de cada palavra
                    if (elemento.dataset.animacaoPausada) break;

                    const palavra = palavras[i];

                    elemento.classList.remove('a-piscar');

                    await this.escreverPalavra(elemento, config.velocidadeEscrever, palavra);
                    if (elemento.dataset.animacaoPausada) break;

                    elemento.classList.add('a-piscar');
                    await this.pausar(config.delayEntrePalavras);

                    if (elemento.dataset.animacaoPausada) break;

                    elemento.classList.remove('a-piscar');
                    
                    // Se não estiver em loop e for a última palavra, sai do loop
                    if (!config.loop && i === palavras.length - 1) {
                        elemento.classList.remove('escrever');
                        return; // Sai da função completamente
                    }

                    await this.apagarPalavra(elemento, config.velocidadeApagar, palavra);
                    if (elemento.dataset.animacaoPausada) break;

                    elemento.classList.add('a-piscar');
                    await this.pausar(config.velocidadeApagar / 2);
                }

                await this.pausar(config.delayAposLoop);
            }

        }
    },

    // Tema - Gere a alternância entre temas claro e escuro e guarda a preferência do utilizador
    tema: {
        init() {
            // Apenas atribui as funções aos botões pois a inicizalização do tema é feita no HTML
            document.querySelectorAll('.theme-toggle').forEach(btn => {
                btn.addEventListener('click', (elemento) => {
                    this.toggle();
                    App.DesativarBotaoTemporariamente(elemento.currentTarget, 500);
                });
            });
        },

        toggle() { // Alterna o tema de forma simples.   
            let novoTema = 'light'; // Valor padrão

            // Se o tema atual for light, muda para dark
            if(document.documentElement.dataset.theme === 'light')
                novoTema = 'dark';

            this.SetTheme(novoTema);
        },

        SetTheme(novoTema){
            // Garante que o tema é válido
            if (!['light', 'dark'].includes(novoTema)) return;

            document.documentElement.dataset.theme = novoTema;

            try {
                localStorage.setItem('theme', novoTema);
            } catch {} // Se o localStorage não estiver disponível, apenas ignora.

            // Verifica se a função inicializada no index.html existe
            // Se existir, chama-a para atualizar a cor da barra do navegador
            if (typeof setThemeColorByTheme === 'function') { setThemeColorByTheme(novoTema); }
        }
    }
    ,

    // Módulo Easter-egg: abre o projeto do portfolio quando o avatar é clicado 10 vezes
    easter_egg: {
        contador: 0,
        limite: 10,
        selector: '.inicio-photo',
        init() {
            // Regista o listener no document para garantir que funciona mesmo que o avatar seja adicionado depois
            document.addEventListener('click', (imagem) => {
                let avatar = null;

                if(imagem.target.closest)
                    avatar = imagem.target.closest(this.selector);

                if (!avatar)
                    return;

                this.contador += 1;
                if (this.contador >= this.limite) {
                    this.contador = 0;
                    // procura o projeto do portfolio por githubLink OU demoLink e abre o modal
                    const projeto = App.projetos.dadosProjetos.find(p => 
                        p.repo === 'tiago-daniel-guerreiro.github.io'
                    );
                    if (projeto)
                        App.projetos.abrirModal(projeto.id);
                    else
                        console.warn('Projeto de portfolio não encontrado para easter-egg.');
                }
            });
        }
    }
};

// Quando a página estiver carregada, inicializa a aplicação
document.addEventListener('DOMContentLoaded', () => { App.init(); });