// ============================================
// Configurações Globais da API
// ============================================

export const CONFIG_API = {
    URL_BASE: 'https://projeto-iii-4.vercel.app',
    ENDPOINTS: {
        LOGIN: '/login/app_web',
        PRESENCA_CONGRESSO: '/alunos/congresso',
        // Adicione outros endpoints conforme necessário
    }
};

// ============================================
// Utilitários para Requisições HTTP
// ============================================

export async function fazerRequisicaoPost(endpoint, dados) {
    const urlCompleta = CONFIG_API.URL_BASE + endpoint;

    try {
        const resposta = await fetch(urlCompleta, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dados)
        });

        const dadosResposta = await resposta.json();

        if (!resposta.ok) {
            const mensagemErro = dadosResposta.mensagem || dadosResposta.erro || 'Erro na requisição';
            throw {
                mensagem: mensagemErro,
                status: resposta.status,
                dados: dadosResposta
            };
        }

        return dadosResposta;
    } catch (erro) {
        if (erro.mensagem) {
            throw erro;
        }
        throw {
            mensagem: 'Erro ao conectar com o servidor. Verifique sua conexão.',
            detalhes: erro.message
        };
    }
}

export async function fazerRequisicaoGet(endpoint) {
    const urlCompleta = CONFIG_API.URL_BASE + endpoint;
    const tokenAutenticacao = sessionStorage.getItem('tokenAutenticacao');

    try {
        const opcoes = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        // Adicionar token se existir
        if (tokenAutenticacao) {
            opcoes.headers['Authorization'] = `Bearer ${tokenAutenticacao}`;
        }

        const resposta = await fetch(urlCompleta, opcoes);
        const dadosResposta = await resposta.json();

        if (!resposta.ok) {
            const mensagemErro = dadosResposta.mensagem || dadosResposta.erro || 'Erro na requisição';
            throw {
                mensagem: mensagemErro,
                status: resposta.status,
                dados: dadosResposta
            };
        }

        return dadosResposta;
    } catch (erro) {
        if (erro.mensagem) {
            throw erro;
        }
        throw {
            mensagem: 'Erro ao conectar com o servidor. Verifique sua conexão.',
            detalhes: erro.message
        };
    }
}

// ============================================
// Funções de Gerenciamento de Sessão
// ============================================

export function armazenarDadosSessao(dadosResposta, email) {
    sessionStorage.setItem('usuarioLogado', email);
    sessionStorage.setItem('dataLogin', new Date().toISOString());
    
    if (dadosResposta.token) {
        sessionStorage.setItem('tokenAutenticacao', dadosResposta.token);
    }
    
    if (dadosResposta.id || dadosResposta.usuarioId) {
        sessionStorage.setItem('usuarioId', dadosResposta.id || dadosResposta.usuarioId);
    } else {
        // Se o backend não retornar um id numérico, armazenar o e-mail como fallback de identificador de usuário
        sessionStorage.setItem('usuarioId', email);
    }
}

export function limparSessao() {
    sessionStorage.removeItem('usuarioLogado');
    sessionStorage.removeItem('dataLogin');
    sessionStorage.removeItem('tokenAutenticacao');
    sessionStorage.removeItem('usuarioId');
}

export function obterTokenAutenticacao() {
    return sessionStorage.getItem('tokenAutenticacao');
}

export function verificarAutenticacao() {
    return sessionStorage.getItem('usuarioLogado') !== null;
}
