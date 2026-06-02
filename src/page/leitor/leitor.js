// ============================================
// Importações
// ============================================

import { verificarAutenticacao } from '../../utils/api.js';

// ============================================
// Elementos do DOM
// ============================================

const botaoVoltar = document.getElementById('botao-voltar');
const botaoIniciarScanner = document.getElementById('botao-iniciar-scanner');
const botaoPararScanner = document.getElementById('botao-parar-scanner');
const videoScanner = document.getElementById('video-scanner');
const mensagemScanner = document.getElementById('mensagem-scanner');
const usuarioLeitorInfo = document.getElementById('usuario-leitor-info');

// ============================================
// Estado do Scanner
// ============================================

let streamScanner = null;
let scannerAtivo = false;
let animationFrameId = null;
let scanTimeoutId = null;
const canvasQRCode = document.createElement('canvas');
const contextoQRCode = canvasQRCode.getContext('2d');

function mostrarMensagemScanner(texto, tipo = 'info') {
    if (!mensagemScanner) return;
    mensagemScanner.textContent = texto;
    mensagemScanner.className = tipo === 'erro' ? 'mensagem-scanner erro' : tipo === 'sucesso' ? 'mensagem-scanner sucesso' : 'mensagem-scanner';
}

function extrairIdChamadaDoQRCode(textoQRCode) {
    if (!textoQRCode) return null;

    try {
        const dados = JSON.parse(textoQRCode);
        return dados.id_chamada ?? dados.idChamado ?? dados.id ?? null;
    } catch {
        const valor = textoQRCode.trim();
        const match = valor.match(/\d+/);
        return match ? match[0] : valor || null;
    }
}

async function enviarPresencaCongresso(idChamada) {
    const idAluno = sessionStorage.getItem('usuarioId') || sessionStorage.getItem('usuarioLogado');

    if (!idAluno) {
        return { ok: false, status: null, mensagem: 'ID do aluno não encontrado. Faça login novamente.' };
    }

    const dadosPresenca = {
        hora_post: new Date().toISOString(),
        id_chamada: idChamada,
        id_aluno: idAluno,
        tipo_presenca: 1,
    };

    const endpointBase = 'https://projeto-iii-4.vercel.app/alunos/congresso';
    const urls = [endpointBase, endpointBase.endsWith('/') ? endpointBase : endpointBase + '/'];

    for (const url of urls) {
        console.info('Tentando endpoint de presença:', url);
        try {
            const resposta = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosPresenca),
            });

            const conteudo = await resposta.json().catch(() => null);

            if (!resposta.ok) {
                if (resposta.status === 404 && !url.endsWith('/')) {
                    continue; // tentar com /
                }
                return { ok: false, status: resposta.status, mensagem: conteudo?.mensagem || conteudo?.erro || `Status ${resposta.status}` };
            }

            return { ok: true, status: resposta.status, dados: conteudo };
        } catch (erro) {
            console.error('Erro ao enviar presença:', erro);
            if (url.endsWith('/')) {
                return { ok: false, status: null, mensagem: erro.message || 'Erro ao enviar presença.' };
            }
        }
    }

    return { ok: false, status: 404, mensagem: 'Endpoint de presença não encontrado.' };
}

function pararScannerQRCode() {
    scannerAtivo = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    if (scanTimeoutId) {
        clearTimeout(scanTimeoutId);
        scanTimeoutId = null;
    }

    if (streamScanner) {
        streamScanner.getTracks().forEach(track => track.stop());
        streamScanner = null;
    }

    if (videoScanner) {
        videoScanner.pause();
        videoScanner.srcObject = null;
    }
}

async function processarFrameQRCode() {
    if (!scannerAtivo) return;

    if (typeof jsQR !== 'function') {
        console.error('jsQR não está disponível');
        mostrarMensagemScanner('Erro interno: biblioteca de leitura QR não carregada.', 'erro');
        return;
    }

    if (!videoScanner || videoScanner.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
        // vídeo ainda não pronto, tentar novamente em 1s
        scanTimeoutId = setTimeout(processarFrameQRCode, 1000);
        return;
    }

    canvasQRCode.width = videoScanner.videoWidth;
    canvasQRCode.height = videoScanner.videoHeight;
    contextoQRCode.drawImage(videoScanner, 0, 0, canvasQRCode.width, canvasQRCode.height);

    let imageData;
    try {
        imageData = contextoQRCode.getImageData(0, 0, canvasQRCode.width, canvasQRCode.height);
    } catch (e) {
        console.warn('Erro ao capturar frame:', e);
        scanTimeoutId = setTimeout(processarFrameQRCode, 1000);
        return;
    }

    const codigoQR = jsQR(imageData.data, imageData.width, imageData.height);

    if (!codigoQR?.data) {
        // nenhum QR detectado, tentar novamente em 5s
        scanTimeoutId = setTimeout(processarFrameQRCode, 5000);
        return;
    }

    const idChamada = extrairIdChamadaDoQRCode(codigoQR.data);
    if (!idChamada) {
        mostrarMensagemScanner('QR detectado, mas id_chamada não foi encontrado.', 'erro');
        scanTimeoutId = setTimeout(processarFrameQRCode, 5000);
        return;
    }

    // pausar novas leituras enquanto envia
    scannerAtivo = false;
    mostrarMensagemScanner('Enviando presença...', 'info');

    const resultado = await enviarPresencaCongresso(idChamada);

    if (resultado.ok) {
        mostrarMensagemScanner('Presença registrada com sucesso!', 'sucesso');
        setTimeout(() => { window.location.href = '/home.html'; }, 1500);
        return;
    }

    // erro no envio: mostrar mensagem e retomar tentativas
    mostrarMensagemScanner(resultado.mensagem || 'Erro ao enviar presença.', 'erro');
    scannerAtivo = true;
    scanTimeoutId = setTimeout(processarFrameQRCode, 5000);
}

async function iniciarScannerQRCode() {
    if (!navigator.mediaDevices?.getUserMedia) {
        mostrarMensagemScanner('Seu navegador não suporta acesso à câmera.', 'erro');
        return;
    }

    try {
        // mensagem de abertura removida conforme solicitado
        streamScanner = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        videoScanner.srcObject = streamScanner;
        await videoScanner.play();

        scannerAtivo = true;
        botaoIniciarScanner?.setAttribute('disabled', 'true');
        botaoPararScanner?.removeAttribute('disabled');

        processarFrameQRCode();
    } catch (erro) {
        console.error('Erro ao iniciar scanner:', erro);
        mostrarMensagemScanner('Permissão negada ou câmera indisponível. Use o botão para tentar novamente.', 'erro');
    }
}

function verificarAutenticacaoLeitor() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');

    if (!usuarioLogado) {
        window.location.href = '/login.html';
        return false;
    }

    if (usuarioLeitorInfo) {
        usuarioLeitorInfo.textContent = usuarioLogado;
    }

    return true;
}

function voltarParaHome() {
    pararScannerQRCode();
    window.location.href = '/home.html';
}

function inicializarEventosLeitor() {
    botaoVoltar?.addEventListener('click', voltarParaHome);
    botaoIniciarScanner?.addEventListener('click', iniciarScannerQRCode);
    botaoPararScanner?.addEventListener('click', pararScannerQRCode);
}

function inicializarPaginaLeitor() {
    if (!verificarAutenticacaoLeitor()) {
        return;
    }

    inicializarEventosLeitor();
    iniciarScannerQRCode();
}

document.addEventListener('DOMContentLoaded', inicializarPaginaLeitor);
