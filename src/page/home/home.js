// ============================================
// Importações
// ============================================

import { verificarAutenticacao, limparSessao } from '../../utils/api.js';

// ============================================
// Elementos do DOM
// ============================================

const nomeUsuarioExibido = document.getElementById('nome-usuario-exibido');
const usuarioInfoElemento = document.getElementById('usuario-info');
const dataLoginInfoElemento = document.getElementById('data-login-info');
const botaoSair = document.getElementById('botao-sair');
const botaoIrLeitor = document.getElementById('botao-ir-leitor');

// ============================================
// Funções de Sessão
// ============================================

function obterNomeUsuarioSessao() {
    return sessionStorage.getItem('usuarioLogado') || 'Usuário';
}

function obterDataLoginSessao() {
    const dataLogin = sessionStorage.getItem('dataLogin');
    if (!dataLogin) return 'Indisponível';

    const data = new Date(dataLogin);
    return data.toLocaleString('pt-BR');
}

// ============================================
// Funções de Exibição
// ============================================

function preencherInformacoesUsuario() {
    const nomeUsuario = obterNomeUsuarioSessao();
    const dataLogin = obterDataLoginSessao();

    nomeUsuarioExibido.textContent = nomeUsuario;
    usuarioInfoElemento.textContent = nomeUsuario;
    dataLoginInfoElemento.textContent = dataLogin;
}

function configurarModoEscuro() {
    const preferencia = localStorage.getItem('temaEscuro');
    if (preferencia === 'ativo') {
        document.body.classList.add('tema-escuro');
    }
}

// ============================================
// Funções de Navegação
// ============================================

function redirecionarParaLogin() {
    window.location.href = '/login.html';
}

function redirecionarParaLeitor() {
    window.location.href = '/leitor.html';
}

function realizarLogout() {
    // Confirmar logout
    const confirmado = confirm('Tem certeza que deseja sair?');
    
    if (confirmado) {
        limparSessao();
        redirecionarParaLogin();
    }
}

// ============================================
// Funções de Inicialização
// ============================================

function inicializarEventosHome() {
    botaoSair.addEventListener('click', realizarLogout);
    botaoIrLeitor.addEventListener('click', redirecionarParaLeitor);
}

function inicializarPaginaHome() {
    // Verificar autenticação
    if (!verificarAutenticacao()) {
        redirecionarParaLogin();
        return;
    }

    // Preencher informações do usuário
    preencherInformacoesUsuario();

    // Configurar eventos
    inicializarEventosHome();

    // Verificar preferências de tema
    configurarModoEscuro();
}

// ============================================
// Execução Inicial
// ============================================

document.addEventListener('DOMContentLoaded', inicializarPaginaHome);
