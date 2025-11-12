export const agruparFerramentas = (ferramentas) => {
  if (!ferramentas || ferramentas.length === 0) {
    return [];
  }

  const mapaGrupos = new Map();

  ferramentas.forEach(ferramenta => {
    const chave = `${ferramenta.nome}_${ferramenta.categoria_id || 'sem_categoria'}`;
    
    if (!mapaGrupos.has(chave)) {
      mapaGrupos.set(chave, {
        id: chave,
        nome: ferramenta.nome,
        categoria_id: ferramenta.categoria_id,
        categoria_nome: ferramenta.categoria_nome,
        imagem_url: ferramenta.imagem_url,
        detalhes: ferramenta.detalhes,
        local: ferramenta.local,
        total: 0,
        disponivel: 0,
        ferramentas: [],
        patrimonio_base: ferramenta.patrimonio,
        adicionado_por: ferramenta.adicionado_por,
        data_criacao: ferramenta.data_criacao,
      });
    }

    const grupo = mapaGrupos.get(chave);
    grupo.total++;
    if (ferramenta.disponivel) {
      grupo.disponivel++;
    }
    grupo.ferramentas.push(ferramenta);
  });

  return Array.from(mapaGrupos.values()).sort((a, b) => 
    a.nome.localeCompare(b.nome)
  );
};

export const buscarFerramentaDisponivel = (grupo) => {
  if (!grupo || !grupo.ferramentas) {
    return null;
  }
  
  return grupo.ferramentas.find(f => f.disponivel) || null;
};

export const obterFerramentasDisponiveis = (grupo) => {
  if (!grupo || !grupo.ferramentas) {
    return [];
  }
  
  return grupo.ferramentas.filter(f => f.disponivel);
};

export const obterFerramentasEmprestadas = (grupo) => {
  if (!grupo || !grupo.ferramentas) {
    return [];
  }
  
  return grupo.ferramentas.filter(f => !f.disponivel);
};

export const formatarPatrimonio = (patrimonio) => {
  if (!patrimonio) return '';
  if (patrimonio.startsWith('SEM PATRIMONIO')) {
    return 'SEM PATRIMONIO';
  }
  return patrimonio;
};

