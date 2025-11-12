import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const obterUrlApi = () => {
  return 'https://backend-toolsearch.onrender.com/api';
};

const URL_API = obterUrlApi();

const clienteApi = axios.create({
  baseURL: URL_API,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000
});

clienteApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('tokenUsuario');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('Fazendo requisição para:', config.url, config.method, config.baseURL);
      return config;
    } catch (erro) {
      console.error('Erro no interceptor de requisição:', erro);
      return Promise.reject(erro);
    }
  },
  (erro) => {
    console.error('Erro ao processar requisição:', erro);
    return Promise.reject(erro);
  }
);

clienteApi.interceptors.response.use(
  (resposta) => {
    console.log('Resposta recebida:', resposta.status);
    return resposta;
  },
  (erro) => {
    console.error('Erro na resposta:', erro);

    if (erro.response) {
      console.error('Erro do servidor:', erro.response.status, erro.response.data);
    } else if (erro.request) {
      console.error('Sem resposta do servidor. Verifique IP/conexão e se o servidor está rodando.');
      console.error('Detalhes do request:', erro.request._url);
    } else {
      console.error('Erro na configuração da requisição:', erro.message);
    }

    if (erro.code === 'ECONNABORTED') {
      console.error('Timeout na requisição - o servidor demorou muito para responder');
    }

    if (erro.message && erro.message.includes('Network Error')) {
      console.error('Erro de rede - verifique sua conexão e se o servidor está acessível no IP correto');
    }

    return Promise.reject(erro);
  }
);

export const servicoAutenticacao = {
  fazerRegistro: async (dadosUsuario) => {
    try {
      console.log('Tentando registrar usuário:', dadosUsuario.nome);
      console.log('URL de registro:', `${URL_API}/auth/register`);

      const resposta = await clienteApi.post('/auth/register', dadosUsuario);

      if (resposta.data.token) {
        await AsyncStorage.setItem('tokenUsuario', resposta.data.token);
        await AsyncStorage.setItem('dadosUsuario', JSON.stringify(resposta.data.user));
      }

      return resposta.data;
    } catch (erro) {
      console.error('Erro completo no registro:', erro);
      if (erro.response) {
        console.error('Erro do servidor:', erro.response.status, erro.response.data);
        return erro.response.data;
      } else if (erro.request) {
        console.error('Sem resposta do servidor. Detalhes:', erro.request._url);
        return {
          success: false,
          message: 'Servidor não respondeu. Verifique se o backend está rodando e acessível no IP correto.'
        };
      } else {
        console.error('Erro na configuração da requisição:', erro.message);
        return { success: false, message: 'Erro ao configurar requisição: ' + erro.message };
      }
    }
  },

  fazerLogin: async (credenciais) => {
    try {
      console.log('Tentando login com:', credenciais.nome);
      console.log('URL de login:', `${URL_API}/auth/login`);

      const resposta = await clienteApi.post('/auth/login', credenciais);

      if (resposta.data.token) {
        await AsyncStorage.setItem('tokenUsuario', resposta.data.token);
        await AsyncStorage.setItem('dadosUsuario', JSON.stringify(resposta.data.user));
      }

      return resposta.data;
    } catch (erro) {
      console.error('Erro completo no login:', erro);
      if (erro.response) {
        return erro.response.data;
      } else if (erro.request) {
        return {
          success: false,
          message: 'Servidor não respondeu. Verifique se o backend está rodando e acessível no IP correto.'
        };
      } else {
        return { success: false, message: 'Erro ao configurar requisição: ' + erro.message };
      }
    }
  },

  fazerLogout: async () => {
    try {
      await AsyncStorage.removeItem('tokenUsuario');
      await AsyncStorage.removeItem('dadosUsuario');
      return { success: true };
    } catch (erro) {
      throw { message: 'Erro ao fazer logout' };
    }
  },

  verificarAutenticacao: async () => {
    try {
      const token = await AsyncStorage.getItem('tokenUsuario');

      if (!token) {
        return { isAuthenticated: false };
      }

      const resposta = await clienteApi.get('/auth/check');
      return { isAuthenticated: true, user: resposta.data.user };
    } catch (erro) {
      await AsyncStorage.removeItem('tokenUsuario');
      await AsyncStorage.removeItem('dadosUsuario');
      return { isAuthenticated: false };
    }
  },

  testarConexao: async () => {
    try {
      console.log('Testando conexão com:', `${URL_API}/test`);
      const resposta = await clienteApi.get('/test');
      return { success: true, message: resposta.data.message };
    } catch (erro) {
      console.error('Erro no teste de conexão:', erro);
      let mensagem = 'Erro de conexão';

      if (erro.request) {
        mensagem = `Servidor não encontrado. Verifique se o backend está rodando no IP correto: ${URL_API}`;
      }

      return { success: false, message: mensagem };
    }
  },

  atualizarUsuario: async (idUsuario, dadosUsuario) => {
    try {
      const resposta = await clienteApi.put(`/auth/users/${idUsuario}`, dadosUsuario);
      return resposta.data;
    } catch (erro) {
      console.error("Erro ao atualizar usuário:", erro.response ? erro.response.data : erro.message);
      throw erro;
    }
  }
};

export const servicoEmprestimo = {
  registrarEmprestimo: async ({ ferramenta_id, usuario_id, local_emprestimo }) => {
    const resposta = await clienteApi.post('/emprestimos', {
      ferramenta_id,
      usuario_id,
      local_emprestimo
    });
    return resposta.data;
  },
  registrarDevolucao: async (emprestimo_id, { local_devolucao }) => {
    const resposta = await clienteApi.put(`/emprestimos/${emprestimo_id}/devolucao`, {
      local_devolucao
    });
    return resposta.data;
  },
  buscarEmprestimoAberto: async (ferramenta_id) => {
    const resposta = await clienteApi.get(`/emprestimos/aberto/${ferramenta_id}`);
    return resposta.data;
  }
};

export const servicoFerramenta = {
  obterFerramentasMaisUtilizadas: async () => {
    const resposta = await clienteApi.get('/ferramentas/mais-utilizadas');
    return resposta.data;
  },
  deletarFerramenta: async (idFerramenta) => {
    try {
      const resposta = await clienteApi.delete(`/ferramentas/${idFerramenta}`);
      return resposta.data;
    } catch (erro) {
      console.error('Erro ao deletar ferramenta via API:', erro);
      throw erro;
    }
  },
};

export default clienteApi;

