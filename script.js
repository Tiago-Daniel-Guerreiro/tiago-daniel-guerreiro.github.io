// Código principal da aplicação - gestão e inicialização dos módulos
const App = {

    // Lista de ações/módulos a inicializar
    acoes: {
        0: () => App.projetos.init(),
        1: () => App.revelar_scroll.init(),
        3: () => App.animacaoDeDigitacao.init(),
        4: () => App.tema.init(),
        5: () => App.menu.init(),
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
        // Controla se as setas de navegação das imagens do modal fazem loop ou simplesmente ficam ocultas quando chegam ao fim
        ImagensEmLoop : false,

        dadosProjetos: [
            {
                id: 1,
                title: 'Quiosque Digital (Estágio)',
                coverImage: '/assets/projetos/quiosque/capa.webp',
                images: [
                    '/assets/projetos/quiosque/1.webp',
                    '/assets/projetos/quiosque/2.webp',
                    '/assets/projetos/quiosque/3.webp',
                ],
                githubLink: 'https://github.com/Tiago-Daniel-Guerreiro/AppParaQuiosque',
                demoLink: null,
                details: [
                    { order: 1, type: 'tags',           title: 'Tecnologias Utilizadas',content: ['C#', 'Windows Forms'] },
                    { order: 2, type: 'description',    title: 'Objetivo Principal',    content: "...", showInModal: true },
                    { order: 3, type: 'text',           title: 'O Problema',            content: "..." },
                    { order: 4, type: 'text',           title: 'A Solução',             content: "..." },
                    { order: 5, type: 'text',           title: 'Meu Papel',             content: "..." },
                    { order: 6, type: 'text',           title: 'Principais Desafios',   content: "..." },
                    { order: 7, type: 'text',           title: 'Resultados',            content: "..." }
                ]
            },
            {
                id: 2,
                title: 'Sistema de Agendamentos Web (Projeto Escolar)',
                coverImage: '/assets/projetos/agendamentos/capa.webp',
                images: [
                    '/assets/projetos/agendamentos/1.webp',
                    '/assets/projetos/agendamentos/2.webp',
                    '/assets/projetos/agendamentos/3.webp'
                ],
                githubLink: 'https://github.com/Tiago-Daniel-Guerreiro/Site-Agendamentos',
                demoLink: 'https://site-agendamentos.great-site.net/',
                details: [
                    { order: 1, type: 'tags',           title: 'Tecnologias Utilizadas',        content: ['PHP', 'MySQL', 'HTML', 'CSS'] },
                    { order: 2, type: 'description',    title: 'Objetivo Principal',            content: "...", showInModal: true },
                    { order: 3, type: 'text',           title: 'Contexto Académico',            content: "..." },
                    { order: 4, type: 'text',           title: 'Foco Backend',                  content: "..." },
                    { order: 5, type: 'text',           title: 'Funcionalidades Implementadas', content: "..." },
                    { order: 6, type: 'text',           title: 'Desafios Técnicos',             content: "..." },
                    { order: 7, type: 'text',           title: 'Aprendizagens',                 content: "..." }
                ]
            },
            {
                id: 3,
                title: 'Leitor de Mangás Online (Projeto Escolar)',
                coverImage: '/assets/projetos/mangas/capa.webp',
                images: [
                    '/assets/projetos/mangas/1.webp',
                    '/assets/projetos/mangas/2.webp',
                    '/assets/projetos/mangas/3.webp'
                ],
                githubLink: 'https://github.com/Tiago-Daniel-Guerreiro/Site-Manga',
                demoLink: 'https://tiago-daniel-guerreiro.github.io/Site-Manga/',
                details: [
                    { order: 1, type: 'tags',           title: 'Tecnologias Utilizadas',    content: ['JavaScript', 'CSS', 'HTML'] },
                    { order: 2, type: 'description',    title: 'Objetivo Principal',        content: "...", showInModal: true },
                    { order: 3, type: 'text',           title: 'Contexto Académico',        content: "..." },
                    { order: 4, type: 'text',           title: 'Foco Frontend',             content: "..." },
                    { order: 5, type: 'text',           title: 'Funcionalidades JavaScript',content: "..." },
                    { order: 6, type: 'text',           title: 'Desafios de Interface',     content: "..." },
                    { order: 7, type: 'text',           title: 'Aprendizagens',             content: "..." }
                ]
            }
        ],
        
        // Mantém o estado atual do modal (qual projeto está aberto, qual imagem, etc.)
        estado: {
            projetoAtual: null,
            indiceImagemAtual: 0,
            imagensDoProjetoAtual: [],
        },

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
        init() {
            this.criarEstruturaModal();
            this.CarregarCardsDeProjetos();
            this.vincularEventos();
        },

        // Encontra um projeto no array de dados pelo seu ID
        obterProjetoPorId(idDoProjetoParaEncontrar) {

            // Loop por cada projeto até encontrar o ID correspondente
            const projetoEncontrado = this.dadosProjetos.find(projeto => {
                // Retorna true se for o projeto que estamos a procurar
                return projeto.id === idDoProjetoParaEncontrar; 
            });

            // Retorna o objeto do projeto que foi encontrado, ou 'undefined' se não encontrou nenhum.
            return projetoEncontrado;
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
                            <button class="btn add-border add-background-hover icon-only-close modal-close-btn"></button>
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
            this.elementos.imagemPrincipalModal =   this.elementos.modal.querySelector('.modal-main-image');
            this.elementos.miniaturasModal =        this.elementos.modal.querySelector('.modal-thumbnails');
            this.elementos.detalhesModal =          this.elementos.modal.querySelector('.modal-details-container');
            this.elementos.linksModal =             this.elementos.modal.querySelector('.modal-links');
            this.elementos.miniaturasModal =        this.elementos.modal.querySelector('.modal-thumbnails');
            this.elementos.detalhesModal =          this.elementos.modal.querySelector('.modal-details-container');
            this.elementos.linksModal =             this.elementos.modal.querySelector('.modal-links');
            this.elementos.botaoProximo =           this.elementos.modal.querySelector('.modal-arrow-next');
            this.elementos.botaoAnterior =          this.elementos.modal.querySelector('.modal-arrow-prev');
        },

        // Cria o HTML para todos os cards de projeto e os insere no container principal
        CarregarCardsDeProjetos() {
            if (!this.elementos.containerProjetos) return; // Verifica se o container existe

            // String vazia que vai juntar todo o HTML.
            let htmlDeTodosOsCards = '';

            // Percorre cada 'projeto' no array 'dadosProjetos'.
            for (const projeto of this.dadosProjetos) {
                
                // Para cada projeto, chama a função que cria o HTML do seu card.
                const htmlDoCardAtual = this.criarHtmlDoCard(projeto);

                // Adiciona o HTML do card atual à string principal.
                htmlDeTodosOsCards += htmlDoCardAtual;
            }

            // Após o loop terminar, insere a string completa no container de uma só vez.
            this.elementos.containerProjetos.innerHTML = htmlDeTodosOsCards;
        },
        
        // Cria o HTML para um único card de projeto
        criarHtmlDoCard(projeto){
            const { id, title, coverImage, details } = projeto;

            let descricao = this.ObterDescricao(details); // Obtém a descrição completa, assumindo que por padrão é > 100 caracteres

            if(descricao.length > 100) // Se for maior que 100 caracteres, corta e adiciona "..."
                descricao = `${descricao.substring(0, 100)}...`;

            const tagsParaCard = this.ObterTagsParaCard(details); // Obtém as tags formatadas para o card

            // retorna o HTML do card com os dados do projeto
            return `
                <li class="project-card add-filter-brightness-90 add-shadow-sm">
                    <img src="${coverImage}" alt="Capa do projeto ${title}" class="card-image" loading="lazy">
                    <div class="card-content">
                        <p class="card-tags">${tagsParaCard}</p>
                        <h3 class="card-title">${title}</h3>
                        <p class="card-description">${descricao}</p>
                        <button class="btn add-size-medium add-background-accent-high btn-project-details" data-project-id="${id}">Ver detalhes</button>
                    </div>
                </li>
            `;
        },

        // Função para obter o texto a descrição do array de detalhes
        ObterDescricao (details) {
            for (const detalhe of details) {
                if (detalhe.type === 'description') {
                    return detalhe.content;
                }
            }
            return '';
        },

        // Função para obter o texto a descrição do array de detalhes
        ObterTags (details) {
            for (const detalhe of details) {
                if (detalhe.type === 'tags') {
                    if(detalhe.content && Array.isArray(detalhe.content)) // Verifica se é um array ou se existe
                        return detalhe.content; // Retorna o array de tags se existir
                }
            }
            return [];
        },

        // Formata as tags para exibição no card do projeto
        ObterTagsParaCard (details) {
            const tagsArray = this.ObterTags(details); // Obtém o array de tags

            // Separa as duas primeiras tags e junta com " · " mas se só houver uma simplesmente mostra essa
            let tagsParaCard = tagsArray.slice(0, 2).join(' · '); // O slice começa no índice 0 e vai até (mas não inclui) o índice 2 se ele existir

            return tagsParaCard;
        },

        // Centraliza a configuração de todos os event listeners da página
        vincularEventos() {
            // Ao invés de adicionar um listener a cada botão, adiciona um só ao container e o método lida com a lógica
            if (this.elementos.containerProjetos) // Verifica se o container existe
                this.elementos.containerProjetos.addEventListener('click', (evento) => this.lidarCliqueNosProjetos(evento));
            
            this.vincularEventosDoModal(); // Atribui os clicks aos botões do modal
            
            // Quando uma tecla é pressionada, o método é chamado e lida com a lógica
            document.addEventListener('keydown', (evento) => this.lidarTeclaPressionada(evento));
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
        abrirModal(projetoId) {
            const projeto = this.obterProjetoPorId(projetoId);

            if (!projeto) // Se o projeto não for encontrado, sai da função
                return;

            this.estado.projetoAtual = projeto; // Define o estado
            
            // Inicia uma nova lista (array) com a imagem de capa como primeiro item
            let listaDeImagens = [projeto.coverImage];

            for (const imagem of projeto.images) { // Percorre cada imagem na lista das imagens do projeto
               
                if (listaDeImagens.includes(imagem)) // Verifica se a imagem já está na lista
                    continue; // Se já estiver, ignora e passa para a próxima imagem.

                // Adiciona cada uma dessas imagens, usando o método .push() para adicionar ao final do array
                listaDeImagens.push(imagem);
            }

            // No final, atribui a lista completa, já combinada, ao estado.
            this.estado.imagensDoProjetoAtual = listaDeImagens;

            this.estado.indiceImagemAtual = 0;

            // Preenche o conteúdo
            this.preencherConteudoDeTextoDoModal(projeto);
            this.carregarMiniaturasAsync(this.estado.imagensDoProjetoAtual);
            this.mudarImagemModal(0); // Mostra a primeira imagem

            // Torna o modal visível
            this.elementos.modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Trava o scroll da página
        },

        // Fecha o modal e limpa o estado.
        fecharModal() {
            if (!this.elementos.modal) return;

            this.elementos.modal.classList.remove('active');
            document.body.style.overflow = ''; // Restaura o scroll
            
            // Limpa o estado
            this.estado.projetoAtual = null;
            this.estado.imagensDoProjetoAtual = [];
            this.elementos.miniaturasModal.innerHTML = ''; // Limpa miniaturas
        },

        // Processa a lista de detalhes de um projeto e gera o HTML completo
        gerarHtmlDetalhes(details) {
            if (!Array.isArray(details) || details.length === 0) 
                return ''; // Se não houver detalhes, retorna uma string vazia.

            // Cria uma lista vazia para guardar apenas os detalhes que queremos mostrar.
            let detalhesParaMostrar = [];

            for (const detalhe of details) { // Loop por cada detalhe na lista original.

                if (detalhe.showInModal === false)
                     continue; // Ignora o detalhe se 'showInModal' for false.
                
                // push é usado para adicionar um item ao final do array.
                // mas também poderíamos usar detalhesParaMostrar[detalhesParaMostrar.length] = detalhe;
                detalhesParaMostrar.push(detalhe); // Adiciona o detalhe à lista se 'showInModal' for true ou indefinido.
            }

            // Ordena a lista que acabámos de criar com base na propriedade 'order'.
            detalhesParaMostrar.sort((a, b) => (a.order || 0) - (b.order || 0)); // Ordenação crescente, valores indefinidos são tratados como 0.

            let htmlFinal = ''; // Cria uma string vazia para juntar todo o HTML.

            for (const detalhe of detalhesParaMostrar) { // Loop por cada detalhe na lista
                htmlFinal += this.gerarHtmlParaDetalhe(detalhe);  // Adiciona o HTML de cada detalhe à string final.
            }

            return htmlFinal; // Retorna a string do HTML completo.
        },

        gerarHtmlParaDetalhe(detalhe) {
            // Gera o HTML para um único detalhe do projeto
            if (!detalhe) return '';

            const { title, description } = detalhe;
            if (!title) return '';
            
            return `
                <div class="modal-section">
                    <h3 class="modal-section-title subtitulo">${title}</h3>
                    <p class="textos-longos">${description || ''}</p>
                </div>
            `;
        },

        // Gera o HTML para os links de demonstração e GitHub
        gerarHtmlLinks(demoLink, githubLink) {
            let linksHTML = ''; // Gera os links de demonstração e GitHub

            if (demoLink && demoLink.trim().includes("/")) // Só adiciona o link de demonstração se existir
                linksHTML += `<a href="${demoLink}" target="_blank" rel="noopener noreferrer" class="btn add-background-accent-high add-background-accent-hover add-border-accent-hover icon-left-external">Demonstração</a>`;

            if (githubLink && githubLink.trim().includes("/")) // Só adiciona o link do GitHub se existir
                linksHTML += `<a href="${githubLink}" target="_blank" rel="noopener noreferrer" class="btn add-background-accent-high add-background-accent-hover add-border-accent-hover icon-left-github">GitHub</a>`;
            
            return linksHTML;
        },

        // Preenche o modal com as informações de texto do projeto
        preencherConteudoDeTextoDoModal(projeto) {
            const { title, details, demoLink, githubLink } = projeto;

            this.elementos.tituloModal.textContent = title;

            // Usa a função dedicada para gerar o HTML das secções de detalhes
            this.elementos.detalhesModal.innerHTML = this.gerarHtmlDetalhes(details);

            this.elementos.linksModal.innerHTML = this.gerarHtmlLinks(demoLink, githubLink);
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

        init() {
            const elementos = document.querySelectorAll('.escrever');
            if (elementos.length === 0) return;

            // Verifica se o dispositivo é compatível e se o utilizador prefere movimento reduzido.
            const prefereMovimentoReduzido = window.matchMedia &&
                                             window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            elementos.forEach(elemento => {
                const palavras = this.obterPalavras(elemento);
                
                if (palavras.length === 0) return; // Não faz nada se não houver palavras

                if (prefereMovimentoReduzido) {
                    // Se preferir movimento reduzido, define o texto estático e para.
                    this.definirTextoEstatico(elemento);
                    return;
                }

                // Inicia a animação assíncrona
                this.iniciar(elemento, palavras, this.ConfigPadrao);
            });
        },
        
        definirTextoEstatico(elemento) {
            elemento.textContent = this.obterPalavrasOriginais(elemento);
            elemento.classList.remove('a-piscar', 'escrever'); // Remove as classes de animação para garantir que o cursor não pisque.
        },

        obterPalavras(elemento) {
            // Tenta obter as palavras do atributo data-palavras
            if (elemento.dataset.palavras) { // Se o atributo existe
                try {
                    // Tenta converter a string JSON para um array
                    const listaPalavras = JSON.parse(elemento.dataset.palavras);
                    // Garante que é um array e não está vazio
                    if (Array.isArray(listaPalavras) && listaPalavras.length > 0) {
                        return listaPalavras;
                    }
                } catch (erro) {
                    // Se o JSON for inválido, ignora e segue para o próximo método.
                    console.error("Erro ao processar data-palavras como JSON:", erro);
                }
            }

            this.definirTextoOriginal(elemento); // Garante que o texto original está definido
            return this.obterPalavrasOriginais_Array(elemento); // Retorna um array com o texto ou um array vazio
        },

        definirTextoOriginal(elemento) {
            let textoOriginal = elemento.textContent.trim();

            if(textoOriginal.length === 0) 
                textoOriginal = ''; // Se o texto original estiver vazio, retorna array vazio
            
            elemento.dataset.TextoOriginal = textoOriginal; // Guarda o texto original para uso futuro
        },

        obterPalavrasOriginais(elemento) {
            if (!elemento.dataset.TextoOriginal)     // Se o atributo não existe
                this.definirTextoOriginal(elemento); // Garante que o atributo está definido
            
            return elemento.dataset.TextoOriginal; // Retorna um array com o texto original
        },

        obterPalavrasOriginais_Array(elemento) {
            return [this.obterPalavrasOriginais(elemento)];
        },

        async iniciar(elemento, palavras, config) {
            if (palavras.length === 0) return;

            const pausar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            // Funções auxiliares para clareza
            const escreverPalavra = async (palavra) => {
                for (let i = 0; i < palavra.length; i++) {
                    elemento.textContent = palavra.substring(0, i + 1);
                    await pausar(config.velocidadeEscrever);
                }
            };

            const apagarPalavra = async (palavra) => {
                for (let i = palavra.length; i > 0; i--) {
                    elemento.textContent = palavra.substring(0, i - 1);
                    await pausar(config.velocidadeApagar);
                }
            };

            // Prepara o elemento
            elemento.textContent = ''; // Limpa o conteúdo inicial
            elemento.classList.add('a-piscar');
            await pausar(config.delayInicial);

            // Loop principal
            while (true) {
                for (let i = 0; i < palavras.length; i++) {
                    const palavra = palavras[i];
 
                    elemento.classList.remove('a-piscar');
                    await escreverPalavra(palavra);

                    elemento.classList.add('a-piscar');
                    await pausar(config.delayEntrePalavras);

                    // Condição de saída se o loop estiver desativado
                    if (!config.loop && i === palavras.length - 1)
                        return; // Termina a função

                    elemento.classList.remove('a-piscar');
                    await apagarPalavra(palavra);
                    elemento.classList.add('a-piscar');
                    await pausar(config.velocidadeApagar / 2);
                }

                if (!config.loop) break; // Segurança extra, caso o return não seja atingido
                
                await pausar(config.delayAposLoop);
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
};

// Quando a página estiver carregada, inicializa a aplicação
document.addEventListener('DOMContentLoaded', () => { App.init(); });