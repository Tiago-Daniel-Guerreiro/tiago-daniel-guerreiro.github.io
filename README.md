# Portfólio Pessoal | tiago-daniel-guerreiro.github.io

![Technologies](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JS-blue.svg)
![Data Script](https://img.shields.io/badge/Data%20Script-Python-yellow.svg)
![Deployment](https://img.shields.io/badge/Hosted%20On-GitHub%20Pages-orange.svg)

Este repositório contém o código-fonte do meu portfólio pessoal. Desenvolvido inteiramente por iniciativa própria, este projeto foi construído do zero para funcionar como o meu principal cartão de visita digital.

O grande objetivo foi criar um espaço controlado para contar a minha história como desenvolvedor e destacar os meus projetos. Para garantir que o portfólio se mantém atualizado, **implementei um script em Python que, quando executado, automatiza a recolha de dados dos meus projetos diretamente da API do GitHub**.

**Visite:** [**tiago-daniel-guerreiro.github.io**](https://tiago-daniel-guerreiro.github.io)

## 🚀 Tecnologias e Arquitetura

Este projeto foi construído intencionalmente **sem frameworks front-end** para demonstrar um forte domínio dos fundamentos do desenvolvimento web e para ter um maior controle e liberdade no desenvolvimento.

- **Front-End:**
  - **HTML:** Estrutura de conteúdo semântica e clara.
    - **CSS:** Estilo visual e layouts responsivos com **Flexbox** e **Grid**.
    - **JavaScript (Vanilla JS):** O motor por trás de toda a interatividade, responsável por renderizar os projetos carregados a partir da fonte de dados.
- **Geração de Dados (Script Python):**
  - **Python:** Utilizado para criar um script que busca dados da API do GitHub, processa os `README.md` e gera o ficheiro JSON que alimenta o site.
- **Deployment & Versioning:**
  - **Git & GitHub Pages:** Para controlo de versões e alojamento do site.

## ✔️ Principais Funcionalidades

- **Carregamento Dinâmico de Projetos:** A funcionalidade central do projeto. Um script Python, quando executado manualmente, busca os dados dos meus repositórios públicos, garantindo que o portfólio pode ser atualizado sem necessidade de editar o código HTML.
- **Design Totalmente Responsivo:** O layout adapta-se de forma fluida a qualquer tamanho de ecrã.
- **Galeria de Projetos Interativa:** Apresenta os projetos em cartões e permite abrir um modal com detalhes extraídos e formatados do `README.md` de cada projeto.
- **Animações Subtis de Scroll:** Efeitos de `fade-in` e `slide` que guiam a atenção do utilizador.

## 🏗️ Arquitetura do Sistema de Dados

Para manter o portfólio atualizado, desenvolvi um processo em duas fases que separa a recolha de dados da sua apresentação. **A primeira fase é manual e requer a execução do script Python:**

- **Coleta e Processamento (Script Python):**
  - Ao ser executado, o script `scripts/data_github_projects.py` faz requisições à API pública do GitHub para cada repositório configurado, extraindo dados como descrição e links.
  - Ele também busca o conteúdo bruto do `README.md` de cada projeto, aplica uma série de filtros (regex) para remover ruído (badges, etc.) e converte o Markdown limpo para HTML.
  - O resultado final é um único ficheiro `github_projects.json`, que serve como a **fonte de dados** para o front-end.
- **Renderização (JavaScript):**
  - Ao carregar a página, o `script.js` faz um `fetch` do `github_projects.json`.
  - Em seguida, ele percorre os dados e gera dinamicamente os cartões de projeto e o conteúdo dos modais, injetando o HTML no DOM.

> **🤖 Nota Sobre Uso de IA:** A assistência de IA foi usada de forma focada para acelerar tarefas mecânicas no script Python (como refatoração e geração de expressões regulares). Todo o código gerado foi revisto e ajustado para garantir simplicidade e legibilidade.

## ⚙️ Principais Desafios do Desenvolvimento

- **Interação entre Python e JavaScript:** O maior desafio foi desenhar um formato de dados em JSON que fosse, ao mesmo tempo, fácil de gerar pelo script Python e eficiente para ser consumido e renderizado pelo JavaScript no front-end.
- **Equilibrar Design e Funcionalidade:** Projetar uma interface minimalista e impactante sem sacrificar a usabilidade.
- **Implementar Interatividade com JavaScript Puro:** Construir a galeria e as animações sem bibliotecas externas.

## 🔮 Próximos Passos

O portfólio é um projeto vivo e em constante evolução. Os planos futuros incluem:

- Implementar uma **GitHub Action** que execute o script Python automaticamente a cada `push` (ou periodicamente), eliminando a necessidade da atualização manual e criando um processo totalmente automatizado para os dados.
- Otimizar ainda mais o desempenho, focando no carregamento de imagens e na minificação de ficheiros CSS/JS.
- Melhorar continuamente a acessibilidade.
- Considerar a adição de uma secção de blog para partilhar conhecimentos técnicos.
