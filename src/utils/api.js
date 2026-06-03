// ============================================
// Configurações Globais da API
// ============================================

export const CONFIG_API = {
    URL_BASE: 'https://projeto-iii-4.vercel.app',
    ENDPOINTS: {
        LOGIN: '/login/app_web',
        PRESENCA_CONGRESSO: '/alunos/congresso',
        USUARIOS: '/usuarios',
        // Adicione outros endpoints conforme necessário
    }
};

function decodificarJwtPayload(token) {
    if (!token) return null;

    const partes = token.split('.');
    if (partes.length !== 3) return null;

    try {
        const payload = partes[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = atob(payload);
        return JSON.parse(decoded);
    } catch (erro) {
        console.error('Erro ao decodificar payload JWT:', erro);
        return null;
    }
}

export function obterTokenAutenticacao() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export async function fazerRequisicaoPost(endpoint, dados) {
    const urlCompleta = CONFIG_API.URL_BASE + endpoint;
    const tokenAutenticacao = obterTokenAutenticacao();
    const headers = {
        'Content-Type': 'application/json',
    };

    if (tokenAutenticacao) {
        headers['Authorization'] = `Bearer ${tokenAutenticacao}`;
    }

    try {
        const resposta = await fetch(urlCompleta, {
            method: 'POST',
            headers,
            body: JSON.stringify(dados)
        });

        const dadosResposta = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            const mensagem = dadosResposta?.message || dadosResposta?.mensagem || dadosResposta?.erro || 'Erro ao processar requisição';
            throw new Error(mensagem);
        }

        return dadosResposta;
    } catch (erro) {
        if (erro instanceof Error) throw erro;
        throw new Error('Erro ao conectar com o servidor. Verifique sua conexão.');
    }
}

export async function fazerRequisicaoGet(endpoint) {
    const urlCompleta = CONFIG_API.URL_BASE + endpoint;
    const tokenAutenticacao = obterTokenAutenticacao();
    const opcoes = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (tokenAutenticacao) {
        opcoes.headers['Authorization'] = `Bearer ${tokenAutenticacao}`;
    }

    try {
        const resposta = await fetch(urlCompleta, opcoes);
        const dadosResposta = await resposta.json().catch(() => null);

        if (!resposta.ok) {
            const mensagem = dadosResposta?.message || dadosResposta?.mensagem || dadosResposta?.erro || 'Erro ao processar requisição';
            throw new Error(mensagem);
        }

        return dadosResposta;
    } catch (erro) {
        if (erro instanceof Error) throw erro;
        throw new Error('Erro ao conectar com o servidor. Verifique sua conexão.');
    }
}

// ============================================
// Funções de Gerenciamento de Sessão
// ============================================

export function armazenarDadosSessao(dadosResposta, email) {
    const token =
        dadosResposta?.token ||
        dadosResposta?.accessToken ||
        dadosResposta?.authToken ||
        dadosResposta?.token_autenticacao ||
        dadosResposta?.tokenAutenticacao ||
        dadosResposta?.data?.token ||
        dadosResposta?.data?.accessToken;

    if (token) {
        const payload = decodificarJwtPayload(token);

        localStorage.setItem('token', token);
        sessionStorage.setItem('token', token);

        if (payload) {
            localStorage.setItem('usuarioId', String(payload.id ?? ''));
            localStorage.setItem('usuarioTipo', String(payload.tipo ?? ''));
            localStorage.setItem('usuarioPayload', JSON.stringify(payload));

            sessionStorage.setItem('usuarioId', String(payload.id ?? ''));
            sessionStorage.setItem('usuarioTipo', String(payload.tipo ?? ''));
            sessionStorage.setItem('usuarioPayload', JSON.stringify(payload));
        }

        const usuarioLogado = payload?.email || payload?.usuario || email;
        localStorage.setItem('usuarioLogado', usuarioLogado);
        sessionStorage.setItem('usuarioLogado', usuarioLogado);
    } else {
        localStorage.setItem('usuarioLogado', email);
        sessionStorage.setItem('usuarioLogado', email);
        sessionStorage.setItem('usuarioId', email);
        localStorage.setItem('usuarioId', email);
    }

    localStorage.setItem('dataLogin', new Date().toISOString());
    sessionStorage.setItem('dataLogin', new Date().toISOString());
}

export function limparSessao() {
    sessionStorage.removeItem('usuarioLogado');
    sessionStorage.removeItem('dataLogin');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuarioId');
    sessionStorage.removeItem('usuarioTipo');
    sessionStorage.removeItem('usuarioPayload');

    localStorage.removeItem('usuarioLogado');
    localStorage.removeItem('dataLogin');
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('usuarioTipo');
    localStorage.removeItem('usuarioPayload');
}

export function verificarAutenticacao() {
    return Boolean( obterTokenAutenticacao() );
}
