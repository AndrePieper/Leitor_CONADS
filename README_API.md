# CONADSI 2026 - Leitor de Documentos

Sistema de leitura e análise de documentos CONADS desenvolvido com HTML, CSS e JavaScript vanilla com integração à API real.

## 🚀 Início Rápido

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Instalação e Execução

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Para fazer build de produção
npm run build

# Para preview de produção
npm run preview
```

Acesse `http://localhost:5173` no navegador.

## 📁 Estrutura do Projeto

```
Leitor_CONADS/
├── index.html                 # Página de redirecionamento
├── package.json              # Configurações do projeto
├── README.md                 # Este arquivo
└── src/
    ├── main.js              # JavaScript principal
    ├── style.css            # Estilos globais
    ├── utils/
    │   └── api.js          # Configurações e utilitários da API
    └── page/
        ├── login/
        │   ├── login.html
        │   ├── login.css
        │   └── login.js
        ├── home/
        │   ├── home.html
        │   ├── home.css
        │   └── home.js
        └── leitor/
            ├── leitor.html
            ├── leitor.css
            └── leitor.js
```

## 🔐 Autenticação

### Configuração da API

**URL Base:** `https://projeto-iii-4.vercel.app`

**Endpoint de Login:**
- **Rota:** `POST /login/app_web`
- **Campos obrigatórios:**
  - `email` (string) - Email do usuário
  - `senha` (string) - Senha do usuário

**Exemplo de requisição:**
```javascript
const dados = {
    email: "usuario@exemplo.com",
    senha: "senha123"
};

fetch('https://projeto-iii-4.vercel.app/login/app_web', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(dados)
});
```

## 📋 Funcionalidades

### 🔑 Página de Login
- Autenticação com API real
- Validação de email e senha
- Armazenamento seguro de token
- Feedback visual durante autenticação
- Tratamento robusto de erros

**Elementos principais:**
- Campo de email (validação de formato)
- Campo de senha (mínimo 6 caracteres)
- Botão "Entrar no Sistema" com feedback de carregamento
- Mensagens de erro personalizadas

### 🏠 Página Inicial (Home)
- Menu com opções principais
- Informações da sessão do usuário
- Barra de navegação com logout
- Layout responsivo em grade

**Opções disponíveis:**
- Leitor de Documentos (funcional)
- Relatórios (em desenvolvimento)
- Configurações (em desenvolvimento)

### 📄 Página do Leitor
- Upload de documentos (PDF, DOCX, TXT, JPG, PNG)
- Visualização de arquivos
- Controles de zoom (50% a 300%)
- Rotação de documentos (90°)
- Download de arquivos
- Anotações salvas por documento
- Layout em 3 colunas

**Operações suportadas:**
- Carregar múltiplos documentos
- Visualizar imagens
- Fazer anotações e salvar no LocalStorage
- Ajustar zoom
- Girar visualização
- Fazer download

## 💾 Armazenamento de Dados

### SessionStorage
- `usuarioLogado` - Email do usuário autenticado
- `dataLogin` - Data/hora do login (ISO 8601)
- `tokenAutenticacao` - Token JWT fornecido pela API
- `usuarioId` - ID do usuário

### LocalStorage
- `anotacoes_[id]` - Anotações por documento (chave dinâmica)

## 🛠️ Utilitários da API

### Arquivo: `src/utils/api.js`

**Configurações:**
```javascript
CONFIG_API.URL_BASE          // URL base da API
CONFIG_API.ENDPOINTS.LOGIN   // Endpoint de login
```

**Funções disponíveis:**

```javascript
// POST genérico
await fazerRequisicaoPost(endpoint, dados)

// GET com suporte a token
await fazerRequisicaoGet(endpoint)

// Gerenciamento de sessão
armazenarDadosSessao(dadosResposta, email)
limparSessao()
verificarAutenticacao()
obterTokenAutenticacao()
```

## 📱 Responsividade

Suporte completo para:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (até 767px)

## 🎨 Design

- **Cores:** Gradiente roxo (#667eea para #764ba2)
- **Tipografia:** Segoe UI
- **Componentes:** Cards, botões, inputs com validação visual
- **Animações:** Transições suaves e efeitos hover

## 🔄 Fluxo de Navegação

```
index.html
    ↓
login/ (autenticação com API)
    ↓
home/ (menu principal)
    ├→ leitor/ (leitor de documentos)
    └→ logout (volta ao login)
```

## 🔒 Segurança

- Validação de entrada em campos
- Proteção de páginas com verificação de autenticação
- Armazenamento seguro de tokens
- Limpeza de sessão ao logout
- HTTPS para comunicação com API

## 🚧 Funcionalidades Futuras

- [ ] Suporte a mais formatos de arquivo
- [ ] OCR para documentos
- [ ] Compartilhamento de documentos
- [ ] Histórico de leitura
- [ ] Exportação de anotações
- [ ] Temas escuro/claro
- [ ] Integração com mais endpoints da API

## 📝 Convenção de Nomenclatura

Todos os nomes em **português** para melhor clareza:

### Funções
- Padrão: `verboInfinitivo + Descrição`
- Exemplo: `validarCamposLogin()`, `procesarLogin()`

### Variáveis
- Padrão: `nomeDescritivo` em camelCase
- Exemplo: `usuarioLogado`, `estadoLeitor`

### IDs HTML
- Padrão: `nome-acao-descritiva` com hífen
- Exemplo: `botao-entrar`, `entrada-usuario`

### Classes CSS
- Padrão: `classe-descritiva` com hífen
- Exemplo: `cartao-login`, `botao-primario`

## 👨‍💻 Desenvolvimento

Para adicionar novas páginas:

1. Crie a pasta: `src/page/[nome]`
2. Crie os arquivos:
   - `[nome].html`
   - `[nome].css`
   - `[nome].js`

**Exemplo:**
```
src/page/relatorios/
├── relatorios.html
├── relatorios.css
└── relatorios.js
```

### Importar utilitários de API

```javascript
import { 
    CONFIG_API, 
    fazerRequisicaoPost, 
    verificarAutenticacao,
    limparSessao 
} from '../../utils/api.js';
```

## 📞 Suporte e Contato

- **Projeto:** CONADSI 2026
- **Instituição:** UNIFASIPE
- **Área:** Análise e Desenvolvimento de Sistemas

## 📄 Licença

Desenvolvido para CONADSI UNIFASIPE - 2026

---

**Desenvolvido com ❤️ para CONADSI 2026**
