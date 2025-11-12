import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { servicoAutenticacao } from '../api/servicoApi';

const ContextoAutenticacao = createContext();

export const ProvedorAutenticacao = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const dadosUsuarioString = await AsyncStorage.getItem('dadosUsuario');

        if (dadosUsuarioString) {
          const dadosUsuario = JSON.parse(dadosUsuarioString);
          setUsuario(dadosUsuario);
          setAutenticado(true);
        }
      } catch (erro) {
        console.error('Erro ao carregar dados do usuário:', erro);
      } finally {
        setCarregando(false);
      }
    };

    carregarUsuario();
  }, []);

  const fazerLogin = async (credenciais) => {
    try {
      console.log('Tentando login com:', credenciais.nome);
      const resposta = await servicoAutenticacao.fazerLogin(credenciais);

      if (resposta.success) {
        console.log('Login bem-sucedido:', resposta.user);
        setUsuario(resposta.user);
        setAutenticado(true);

        await AsyncStorage.setItem('dadosUsuario', JSON.stringify(resposta.user));
        return { success: true };
      } else {
        console.warn('Falha no login:', resposta.message);
        return { success: false, message: resposta.message };
      }
    } catch (erro) {
      console.error('Erro durante login:', erro);
      return {
        success: false,
        message: erro.message || 'Erro ao conectar com o servidor'
      };
    }
  };

  const fazerRegistro = async (dadosUsuario) => {
    try {
      const resposta = await servicoAutenticacao.fazerRegistro(dadosUsuario);

      if (resposta.success) {
        setUsuario(resposta.user);
        setAutenticado(true);
        return { success: true, user: resposta.user };
      } else {
        return { success: false, message: resposta.message };
      }
    } catch (erro) {
      return { success: false, message: erro.message };
    }
  };

  const fazerLogout = async () => {
    try {
      await servicoAutenticacao.fazerLogout();
      setUsuario(null);
      setAutenticado(false);
      await AsyncStorage.removeItem('dadosUsuario');
      return { success: true };
    } catch (erro) {
      return { success: false, message: erro.message };
    }
  };

  const verificarAutenticacao = async () => {
    try {
      const resultado = await servicoAutenticacao.verificarAutenticacao();
      setAutenticado(resultado.isAuthenticated);

      if (resultado.isAuthenticated) {
        setUsuario(resultado.user);
      } else {
        setUsuario(null);
      }

      return resultado;
    } catch (erro) {
      setAutenticado(false);
      setUsuario(null);
      return { isAuthenticated: false };
    }
  };

  const atualizarImagemUsuario = async (novaUrlImagem) => {
    if (usuario) {
      const usuarioAtualizado = { ...usuario, imagemPerfil: novaUrlImagem };
      setUsuario(usuarioAtualizado);
      try {
        await AsyncStorage.setItem('dadosUsuario', JSON.stringify(usuarioAtualizado));
      } catch (erro) {
        console.error("Erro ao salvar imagem do perfil no AsyncStorage:", erro);
      }
    }
  };

  const atualizarUsuario = async (idUsuario, dadosUsuario) => {
    try {
      const resposta = await servicoAutenticacao.atualizarUsuario(idUsuario, dadosUsuario);
      if (resposta.success) {
        const usuarioAtualizado = { ...usuario, ...dadosUsuario };
        setUsuario(usuarioAtualizado);
        await AsyncStorage.setItem('dadosUsuario', JSON.stringify(usuarioAtualizado));
        return { success: true, user: usuarioAtualizado };
      } else {
        return { success: false, message: resposta.message };
      }
    } catch (erro) {
      return { success: false, message: erro.message };
    }
  };

  const valor = {
    user: usuario,
    loading: carregando,
    authenticated: autenticado,
    login: fazerLogin,
    register: fazerRegistro,
    logout: fazerLogout,
    checkAuth: verificarAutenticacao,
    updateUserImage: atualizarImagemUsuario,
    updateUser: atualizarUsuario
  };

  return <ContextoAutenticacao.Provider value={valor}>{children}</ContextoAutenticacao.Provider>;
};

export const usarAutenticacao = () => {
  const contexto = useContext(ContextoAutenticacao);

  if (!contexto) {
    throw new Error('usarAutenticacao deve ser usado dentro de um ProvedorAutenticacao');
  }

  return contexto;
};

