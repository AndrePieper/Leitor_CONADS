# CONADSI 2026 - Leitor de Documentos

Sistema de leitura e análise de documentos CONADS desenvolvido com HTML, CSS e JavaScript vanilla, sem dependências externas além do Vite como bundler.

## 📁 Estrutura do Projeto

```
Leitor_CONADS/
├── index.html                 # Página de redirecionamento para login
├── package.json              # Configurações do projeto
├── README.md                 # Este arquivo
└── src/
    ├── main.js              # JavaScript principal (para referência/extensões futuras)
    ├── style.css            # Estilos globais (para referência/extensões futuras)
    └── page/
        ├── login/           # Página de login
        │   ├── login.html
        │   ├── login.css
        │   └── login.js
        ├── home/            # Página inicial
        │   ├── home.html
        │   ├── home.css
        │   └── home.js
        └── leitor/          # Página do leitor de documentos
            ├── leitor.html
            ├── leitor.css
            └── leitor.js
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Instalação e Execução

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Abra seu navegador e acesse:**
   ```
   http://localhost:5173
   ```

4. **Para fazer build de produção:**
   ```bash
   npm run build
   ```

## 🔐 Credenciais de Teste

Para acessar o sistema de teste, use:

- **Usuário:** `admin`
- **Senha:** `123456`

## 📋 Funcionalidades

### 🔑 Página de Login (`login.html`)
- Autenticação simples com validação de campos
- Armazenamento de sessão com SessionStorage
- Mensagens de erro amigáveis
- Design responsivo com gradiente roxo

**Funções principais:**
- `validarCamposLogin()` - Valida os campos de entrada
- `processarLogin()` - Processa a autenticação
- `realizarRedirecionamentoParaHome()` - Redireciona para home
- `armazenarDadosSessao()` - Armazena dados da sessão

### 🏠 Página Initial (`home.html`)
- Menu com opções principais (Leitor, Relatórios, Configurações)
- Informações da sessão do usuário
- Barra de navegação com opção de logout
- Layout em grade responsiva

**Funções principais:**
- `verificarAutenticacao()` - Verifica se o usuário está logado
- `preencherInformacoesUsuario()` - Exibe dados do usuário
- `realizarLogout()` - Realiza logout com confirmação
- `redirecionarParaLeitor()` - Navega para o leitor

### 📄 Página do Leitor (`leitor.html`)
- Upload de documentos (PDF, DOCX, TXT, JPG, PNG)
- Visualização de arquivos
- Controles de zoom e rotação
- Anotações salvas no LocalStorage
- Navegação entre múltiplos documentos
- Layout em 3 colunas (painel lateral, visualização, informações)

**Funções principais:**
- `procesarArquivoSelecionado()` - Processa arquivo selecionado
- `adicionarDocumentoCarregado()` - Adiciona documento à lista
- `selecionarDocumento()` - Seleciona um documento
- `exibirDocumento()` - Exibe o documento selecionado
- `aumentarZoom()` / `diminuirZoom()` - Controla zoom
- `rotacionarDocumento()` - Rotaciona o documento 90°
- `salvarAnotacoes()` - Salva anotações no LocalStorage
- `baixarDocumento()` - Realiza download do documento

## 🎨 Design e Estilo

Cada página possui seu próprio arquivo CSS com:
- **Paleta de cores:** Gradiente roxo (#667eea para #764ba2)
- **Tipografia:** Segoe UI
- **Responsividade:** Grid CSS adaptável
- **Animações:** Transições suaves e efeitos hover

### Componentes Reutilizáveis
- Botões primários e secundários
- Cards com sombras e efeitos
- Inputs com validação visual
- Navegação intuitiva

## 💾 Armazenamento

### SessionStorage
- `usuarioLogado` - Nome do usuário autenticado
- `dataLogin` - Data/hora do login

### LocalStorage
- `anotacoes_[id]` - Anotações por documento (chave dinâmica)

## 🔄 Fluxo de Navegação

```
index.html
    ↓
pagina_login.html (autenticação)
    ↓
pagina_home.html (menu principal)
    ├→ pagina_leitor.html (leitor de documentos)
    └→ (Outras funcionalidades em desenvolvimento)
```

## 📱 Responsividade

O projeto é totalmente responsivo e se adapta a diferentes tamanhos de tela:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (até 767px)

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Marcação semântica
- **CSS3** - Estilos e layout (Grid, Flexbox, Gradientes)
- **JavaScript Vanilla** - Sem frameworks ou bibliotecas
- **Vite** - Bundler de desenvolvimento
- **SessionStorage/LocalStorage** - Armazenamento local

## 📝 Nomes em Português

Todas as funções, variáveis e classes foram nomeadas em português para facilitar a compreensão:

### Convenção de Nomenclatura
- **Funções:** `verbInfinitivo + Descrição` (ex: `validarCamposLogin`)
- **Variáveis:** `nomeDecritivo` em camelCase (ex: `usuarioLogado`)
- **IDs HTML:** `botao-acao-descritiva` com hífen (ex: `botao-entrar`)
- **Classes CSS:** `classe-descritiva` com hífen (ex: `cartao-login`)

## 🚧 Funcionalidades Futuras

- [ ] Integração com API backend
- [ ] Suporte a mais formatos de arquivo
- [ ] Exportação de documentos
- [ ] Histórico de leitura
- [ ] Compartilhamento de documentos
- [ ] Temas escuro/claro

## 📄 Licença

Desenvolvido para CONADSI UNIFASIPE - 2026

## 👨‍💻 Desenvolvimento

Para adicionar novas funcionalidades:

1. Crie a pasta em `src/page/[nome]`
2. Crie a página HTML: `[nome].html`
3. Crie o CSS: `[nome].css`
4. Crie o JavaScript: `[nome].js`
5. Use nomes descritivos em português
6. Mantenha a estrutura modular

**Exemplo de nova página:**
```
src/page/relatorios/
├── relatorios.html
├── relatorios.css
└── relatorios.js
```

---

**Desenvolvido com ❤️ para CONADSI 2026**
