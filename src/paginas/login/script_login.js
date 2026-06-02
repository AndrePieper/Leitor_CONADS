// ============================================
// Elementos do DOM
// ============================================

const entradaUsuario = document.getElementById('entrada-usuario');
const entradaSenha = document.getElementById('entrada-senha');
const botaoEntrar = document.getElementById('botao-entrar');
const mensagemErro = document.getElementById('mensagem-erro');

// ============================================
// Funções de Validação
// ============================================

function validarCamposLogin() {
    const usuario = entradaUsuario.value.trim();
    const senha = entradaSenha.value.trim();

    if (!usuario || !senha) {
        mostrarErro('Por favor, preencha todos os campos!');
        return false;
    }

    if (usuario.length < 3) {
        mostrarErro('Usuário deve ter pelo menos 3 caracteres!');
        return false;
    }

    if (senha.length < 6) {
        mostrarErro('Senha deve ter pelo menos 6 caracteres!');
        return false;
    }

    return true;
}

function mostrarErro(textoErro) {
    mensagemErro.textContent = textoErro;
    mensagemErro.classList.add('visivel');
}

function esconderErro() {
    mensagemErro.classList.remove('visivel');
    mensagemErro.textContent = '';
}

// ============================================
// Funções de Autenticação
// ============================================

function processarLogin() {
    esconderErro();

    if (!validarCamposLogin()) {
        return;
    }

    const usuario = entradaUsuario.value.trim();
    const senha = entradaSenha.value.trim();

    // Simulação de validação (em produção, seria uma chamada de API)
    if (usuario === 'admin' && senha === '123456') {
        realizarRedirecionamentoParaHome(usuario);
    } else {
        mostrarErro('Usuário ou senha incorretos!');
        limparCampos();
    }
}

function realizarRedirecionamentoParaHome(nomeUsuario) {
    // Armazenar dados da sessão
    armazenarDadosSessao(nomeUsuario);

    // Redirecionar para a página inicial
    window.location.href = '/home.html';
}

function armazenarDadosSessao(nomeUsuario) {
    sessionStorage.setItem('usuarioLogado', nomeUsuario);
    sessionStorage.setItem('usuarioId', nomeUsuario);
    sessionStorage.setItem('dataLogin', new Date().toISOString());
}

function limparCampos() {
    entradaUsuario.value = '';
    entradaSenha.value = '';
    entradaUsuario.focus();
}

// ============================================
// Funções de Inicialização
// ============================================

function inicializarEventosLogin() {
    botaoEntrar.addEventListener('click', processarLogin);

    // Permitir envio ao pressionar Enter
    entradaSenha.addEventListener('keypress', (evento) => {
        if (evento.key === 'Enter') {
            processarLogin();
        }
    });

    // Limpar erro ao digitar
    entradaUsuario.addEventListener('input', esconderErro);
    entradaSenha.addEventListener('input', esconderErro);
}

// ============================================
// Execução Inicial
// ============================================

document.addEventListener('DOMContentLoaded', inicializarEventosLogin);
