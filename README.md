📂 System Update Log: L1 Cache v2.0
Status da Build: Stable Release
Stack: React 18, Tailwind CSS, Firebase v10.8 (Auth/Firestore)

1. 🧠 Core Engine & Algoritmos
Implementação de lógica avançada de retenção de memória baseada em ciência cognitiva.

Algoritmo SRS (Space Repetition System): Implementação personalizada do algoritmo SM-2 (SuperMemo 2).

Cálculo dinâmico de intervalos de revisão com base no Ease Factor.

Estados de memória distintos: learning (aprendizado) e graduated (graduado/memória de longo prazo).

Lógica de "Cram Mode" (Revisão forçada) caso o deck esteja vazio.

Gestão de Estado Global: Utilização de React.useState e useEffect para controle de sessão, filas de estudo e autenticação.

Tratamento de Erros (Kernel Panic): Implementação de um Error Boundary que captura falhas críticas na renderização e exibe uma tela de "System Failure" com opção de reboot.

2. 📚 Interface de Estudo (Study Session)
Recursos focados na experiência do usuário durante o aprendizado ativo.

Flashcards 3D Interativos:

Animação de "Flip" (rotação 180º no eixo Y) utilizando CSS perspective-1000 e transform-style-3d.

Separação clara entre Front (Pergunta) e Back (Resposta).

Text-to-Speech (TTS) Nativo:

Integração com a API window.speechSynthesis.

Funcionalidade: Leitura em voz alta automática ou sob demanda (botão de áudio) tanto da pergunta quanto da resposta.

Configuração para pt-BR com taxa de velocidade otimizada (1.1x).

Controles de Input:

Atalhos de Teclado: Espaço para revelar a resposta, teclas 1, 2, 3, 4 para avaliar a dificuldade.

Feedback Visual: Botões de avaliação coloridos (Errei, Difícil, Bom, Fácil) que mostram o próximo intervalo de tempo calculado antes do clique.

Barra de Progresso: Indicador visual de posição na fila atual (ex: "5 / 20").

3. 📊 Dashboard & Métricas
Visualização de dados para monitoramento de consistência e progresso.

Heatmap de Consistência:

Gráfico estilo GitHub que visualiza a atividade dos últimos 30 dias.

Gradiente de cores dinâmico (do azul escuro ao esmeralda brilhante) baseado na intensidade de revisões diárias.

Leaderboard (Ranking Global):

Sistema de classificação em tempo real consultando o Firestore.

Métricas de rankeamento: Retenção (%), XP Total (Cartas estudadas) e Tempo de Estudo.

Distinção visual para o Top 1 (Ícone de Coroa) e badges de performance (Retenção > 80%).

Estatísticas Rápidas: Contador de Cards Totais vs. Cards Memorizados no cabeçalho.

4. 🛠️ Painel Administrativo (God Mode)
Ferramentas de gestão de conteúdo restritas a usuários com privilégios.

Controle de Acesso: Verificação de e-mail (domínio @userpro.com) para liberar a visualização do painel.

CRUD de Cards:

Criação, Leitura, Atualização e Exclusão de flashcards diretamente na interface.

Persistência imediata no Firestore.

Editor de Texto Rico (WYSIWYG):

Editor customizado permitindo formatação: Negrito, Itálico, Listas e Blocos de Código (essencial para CS).

Suporte a injeção de HTML no conteúdo do card.

Filtros e Organização:

Sistema de filtragem por "Deck" (Categoria) e "Tópico" (Subcategoria).

Autocomplete (datalist) para sugestão de categorias já existentes ao criar novos cards.

5. 🎨 UI/UX & Design System
Estética visual "Cyberpunk/Dev" focada em imersão e redução de fadiga visual.

Tema Dark Mode: Paleta de cores baseada em Slate-950 (fundo), Blue-500 (primária) e Purple-500 (accent).

Glassmorphism: Utilização de transparências, blur de fundo (backdrop-filter) e bordas sutis nos containers de cards e modais.

Tipografia: Fonte Inter para interface geral e Fira Code (Monospaced) para trechos de código.

Micro-interações:

Animações de entrada (fade-in, slide-up).

Efeitos de Hover e Scale em botões e cards.

Feedback de carregamento (Spinner de CPU).

6. ☁️ Infraestrutura Backend (Firebase)
Authentication: Login via E-mail/Senha e modo "Convidado".

Firestore Database:

Coleção cards: Armazena o conteúdo global de estudo.

Coleção users/{uid}/reviews: Armazena o progresso individual de cada usuário (isolamento de dados).

Coleção leaderboard: Agrega estatísticas para o ranking público.
