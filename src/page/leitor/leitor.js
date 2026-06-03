// ============================================
// Importações
// ============================================

import jsQR from 'jsqr';
import { CONFIG_API } from '../../utils/api.js';

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
const canvasQRCode = document.createElement('canvas');
const contextoQRCode = canvasQRCode.getContext('2d', { willReadFrequently: true });

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
    const idAluno = localStorage.getItem('usuarioId') || sessionStorage.getItem('usuarioId') || localStorage.getItem('usuarioLogado') || sessionStorage.getItem('usuarioLogado');

    if (!idAluno) {
        return { ok: false, status: null, mensagem: 'ID do aluno não encontrado. Faça login novamente.' };
    }

    const dadosPresenca = {
        hora_post: new Date().toISOString(),
        id_chamada: idChamada,
        id_aluno: idAluno,
        tipo_presenca: 1,
    };
    const url = CONFIG_API.URL_BASE + CONFIG_API.ENDPOINTS.PRESENCA_CONGRESSO;

    try {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Logando informações do POST para facilitar debug
        console.info('Enviando POST de presença', {
            url,
            headers: Object.assign({}, headers, { Authorization: headers.Authorization ? '***REDACTED***' : undefined }),
            payload: dadosPresenca,
        });

        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(dadosPresenca),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
            throw new Error(data?.message || data?.mensagem || 'Erro genérico');
        }

        return { ok: true, status: res.status, dados: data };
    } catch (error) {
        console.error('Falha no POST de presença:', error?.message || error);
        return { ok: false, status: null, mensagem: error?.message || 'Erro ao enviar presença.' };
    }
}

function pararScannerQRCode() {
    scannerAtivo = false;

    if (animationFrameId) {
        clearTimeout(animationFrameId);
        animationFrameId = null;
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
        animationFrameId = setTimeout(processarFrameQRCode, 5000);
        return;
    }

    if (videoScanner.videoWidth === 0 || videoScanner.videoHeight === 0) {
        animationFrameId = setTimeout(processarFrameQRCode, 5000);
        return;
    }

    const maxScanWidth = 640;
    const aspectRatio = videoScanner.videoWidth / videoScanner.videoHeight;
    const scanWidth = Math.min(videoScanner.videoWidth, maxScanWidth);
    const scanHeight = Math.round(scanWidth / aspectRatio);

    canvasQRCode.width = scanWidth;
    canvasQRCode.height = scanHeight;
    contextoQRCode.drawImage(videoScanner, 0, 0, scanWidth, scanHeight);

    let imageData;
    try {
        imageData = contextoQRCode.getImageData(0, 0, canvasQRCode.width, canvasQRCode.height);
    } catch (e) {
        console.warn('Erro ao capturar frame:', e);
        animationFrameId = setTimeout(processarFrameQRCode, 5000);
        return;
    }

    const codigoQR = jsQR(imageData.data, imageData.width, imageData.height);

    if (!codigoQR?.data) {
        animationFrameId = setTimeout(processarFrameQRCode, 5000);
        return;
    }

    const idChamada = extrairIdChamadaDoQRCode(codigoQR.data);
    if (!idChamada) {
        mostrarMensagemScanner('QR detectado, mas id_chamada não foi encontrado.', 'erro');
        animationFrameId = setTimeout(processarFrameQRCode, 5000);
        return;
    }

    // pausar novas leituras enquanto envia
    scannerAtivo = false;
    mostrarMensagemScanner('QR lido. Enviando presença...', 'info');

    const resultado = await enviarPresencaCongresso(idChamada);

    if (resultado.ok) {
        mostrarMensagemScanner('Presença registrada com sucesso!', 'sucesso');
        setTimeout(() => { window.location.href = '/home.html'; }, 1500);
        return;
    }

    // erro no envio: mostrar mensagem e retomar tentativas
    mostrarMensagemScanner(resultado.mensagem || 'Erro ao enviar presença.', 'erro');
    scannerAtivo = true;
    animationFrameId = setTimeout(processarFrameQRCode, 5000);
}

async function obterStreamCameraPreferida() {
    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Seu navegador não suporta acesso à câmera.');
    }

    const opcoesAmbiente = { video: { facingMode: { ideal: 'environment' } }, audio: false };

    try {
        return await navigator.mediaDevices.getUserMedia(opcoesAmbiente);
    } catch (erro) {
        console.warn('Falha usando facingMode environment:', erro);

        if (!navigator.mediaDevices?.enumerateDevices) {
            throw erro;
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(device => device.kind === 'videoinput');
            for (const device of videoInputs) {
                try {
                    return await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: device.deviceId } }, audio: false });
                } catch (innerErro) {
                    console.warn(`Falha ao abrir câmera ${device.label || device.deviceId}:`, innerErro);
                }
            }
        } catch (innerErro) {
            console.warn('Falha ao enumerar dispositivos de vídeo:', innerErro);
        }

        throw erro;
    }
}

async function iniciarScannerQRCode() {
    if (!navigator.mediaDevices?.getUserMedia) {
        mostrarMensagemScanner('Seu navegador não suporta acesso à câmera.', 'erro');
        return;
    }

    try {
        videoScanner?.setAttribute('playsinline', '');
        videoScanner?.setAttribute('webkit-playsinline', '');

        streamScanner = await obterStreamCameraPreferida();
        videoScanner.srcObject = streamScanner;
        await videoScanner.play();

        scannerAtivo = true;
        botaoIniciarScanner?.setAttribute('disabled', 'true');
        botaoPararScanner?.removeAttribute('disabled');

        processarFrameQRCode();
    } catch (erro) {
        console.error('Erro ao iniciar scanner:', erro);
        const mensagem = erro?.name === 'NotAllowedError' || erro?.name === 'PermissionDeniedError'
            ? 'Permissão negada para acessar a câmera. Confirme o acesso no navegador.'
            : 'Câmera indisponível no momento. Tente novamente ou use outro navegador mobile.';
        mostrarMensagemScanner(mensagem, 'erro');
    }
}

function verificarAutenticacaoLeitor() {
    const usuarioLogado = localStorage.getItem('usuarioLogado') || sessionStorage.getItem('usuarioLogado');

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
