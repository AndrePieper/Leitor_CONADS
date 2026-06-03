const botaoVoltar = document.getElementById('botao-voltar');
const botaoIniciarScanner = document.getElementById('botao-iniciar-scanner');
const botaoPararScanner = document.getElementById('botao-parar-scanner');
const videoScanner = document.getElementById('video-scanner');
const mensagemScanner = document.getElementById('mensagem-scanner');
const usuarioLeitorInfo = document.getElementById('usuario-leitor-info');

let cameraStream = null;
let scannerAtivo = false;
let animationFrameId = null;

const canvasQRCode = document.createElement('canvas');
const contextoQRCode = canvasQRCode.getContext('2d');

function mostrarMensagemScanner(texto, tipo = 'info') {
    if (!mensagemScanner) return;

    mensagemScanner.textContent = texto;

    mensagemScanner.className =
        tipo === 'erro'
            ? 'mensagem-scanner erro'
            : tipo === 'sucesso'
            ? 'mensagem-scanner sucesso'
            : 'mensagem-scanner';
}

function extrairIdChamadaDoQRCode(textoQRCode) {
    if (!textoQRCode) return null;

    try {
        const dados = JSON.parse(textoQRCode);

        return (
            dados.id_chamada ??
            dados.idChamado ??
            dados.id ??
            null
        );
    } catch {
        const valor = textoQRCode.trim();
        const match = valor.match(/\d+/);

        return match ? match[0] : valor;
    }
}

async function enviarPresencaCongresso(idChamada) {
    const idAluno =
        sessionStorage.getItem('usuarioId') ||
        sessionStorage.getItem('usuarioLogado');

    if (!idAluno) {
        mostrarMensagemScanner(
            'ID do aluno não encontrado.',
            'erro'
        );
        return;
    }

    const dadosPresenca = {
        hora_post: new Date().toISOString(),
        id_chamada: idChamada,
        id_aluno: idAluno,
        tipo_presenca: 1
    };

    try {
        const resposta = await fetch(
            'https://projeto-iii-4.vercel.app/alunos/congresso',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosPresenca)
            }
        );

        if (!resposta.ok) {
            throw new Error(
                `Erro ao registrar presença (${resposta.status})`
            );
        }

        mostrarMensagemScanner(
            'Presença registrada com sucesso!',
            'sucesso'
        );

        return { ok: true };
    } catch (erro) {
        console.error(erro);

        mostrarMensagemScanner(
            erro.message || 'Erro ao registrar presença.',
            'erro'
        );

        return { ok: false };
    }
}

async function obterStreamCameraPreferida() {
    return navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: {
                ideal: 'environment'
            }
        },
        audio: false
    });
}

async function iniciarCameraScanner() {
    try {
        mostrarMensagemScanner(
            'Solicitando acesso à câmera...',
            'info'
        );

        cameraStream =
            await obterStreamCameraPreferida();

        videoScanner.srcObject = cameraStream;

        await videoScanner.play();

        scannerAtivo = true;

        botaoIniciarScanner.disabled = true;
        botaoPararScanner.disabled = false;

        mostrarMensagemScanner(
            'Aponte para um QR Code',
            'info'
        );

        processarFrameQRCode();
    } catch (erro) {
        console.error(erro);

        mostrarMensagemScanner(
            'Não foi possível acessar a câmera.',
            'erro'
        );
    }
}

function pararCameraScanner() {
    scannerAtivo = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    if (cameraStream) {
        cameraStream.getTracks().forEach(track =>
            track.stop()
        );
    }

    videoScanner.srcObject = null;

    botaoIniciarScanner.disabled = false;
    botaoPararScanner.disabled = true;
}

async function processarFrameQRCode() {
    if (!scannerAtivo) return;

    if (
        videoScanner.readyState !==
        HTMLMediaElement.HAVE_ENOUGH_DATA
    ) {
        animationFrameId =
            requestAnimationFrame(
                processarFrameQRCode
            );
        return;
    }

    canvasQRCode.width = videoScanner.videoWidth;
    canvasQRCode.height = videoScanner.videoHeight;

    contextoQRCode.drawImage(
        videoScanner,
        0,
        0,
        canvasQRCode.width,
        canvasQRCode.height
    );

    try {
        const imageData =
            contextoQRCode.getImageData(
                0,
                0,
                canvasQRCode.width,
                canvasQRCode.height
            );

        const codigoQR = jsQR(
            imageData.data,
            imageData.width,
            imageData.height
        );

        if (codigoQR && codigoQR.data) {
            const idChamada =
                extrairIdChamadaDoQRCode(
                    codigoQR.data
                );

            if (idChamada) {
                mostrarMensagemScanner(
                    `QR encontrado: ${idChamada}`,
                    'sucesso'
                );

                pararCameraScanner();

                await enviarPresencaCongresso(
                    idChamada
                );

                setTimeout(() => {
                    window.location.href =
                        '../home/pagina_home.html';
                }, 1500);

                return;
            }
        }
    } catch (erro) {
        console.error(
            'Erro lendo QR Code:',
            erro
        );
    }

    animationFrameId =
        requestAnimationFrame(
            processarFrameQRCode
        );
}

function verificarAutenticacaoLeitor() {
    const usuarioLogado =
        sessionStorage.getItem(
            'usuarioLogado'
        );

    if (!usuarioLogado) {
        return true;
    }

    usuarioLeitorInfo.textContent =
        usuarioLogado;

    return true;
}

function voltarParaHome() {
    pararCameraScanner();

    window.location.href =
        '../home/pagina_home.html';
}

function inicializarEventosLeitor() {
    botaoVoltar?.addEventListener(
        'click',
        voltarParaHome
    );

    botaoIniciarScanner?.addEventListener(
        'click',
        iniciarCameraScanner
    );

    botaoPararScanner?.addEventListener(
        'click',
        pararCameraScanner
    );
}

function inicializarPaginaLeitor() {
    verificarAutenticacaoLeitor();
    inicializarEventosLeitor();

    mostrarMensagemScanner(
        'Toque em Iniciar câmera para começar.'
    );
}

document.addEventListener(
    'DOMContentLoaded',
    inicializarPaginaLeitor
);