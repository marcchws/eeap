'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"

// Tipos
interface Pergunta {
  id: string;
  texto: string;
  tipo: 'escala_likert' | 'multipla_escolha' | 'texto_livre' | 'nps' | 'sim_nao';
  obrigatoria: boolean;
  opcoes?: string[];
  peso: number;
  categoria: string;
}

interface ConfiguracaoPesquisa {
  nome: string;
  tipo: 'pulse' | 'clima' | '360' | 'ad_hoc';
  descricao: string;
  publico_alvo: {
    todos: boolean;
    departamentos: string[];
    cargos: string[];
    localizacoes: string[];
  };
  configuracao: {
    anonima: boolean;
    data_inicio: string;
    data_fim: string;
    lembretes: boolean;
    frequencia_lembrete: number;
  };
  perguntas: Pergunta[];
}

interface TemplatesPergunta {
  categoria: string;
  perguntas: Array<{
    texto: string;
    tipo: string;
    opcoes?: string[];
  }>;
}

interface DepartamentoOption {
  id: string;
  nome: string;
  colaboradores: number;
}

// API Mock
const apiMock = {
  obterTemplatesPerguntas: async (): Promise<TemplatesPergunta[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return [
      {
        categoria: 'Engajamento',
        perguntas: [
          {
            texto: 'Como você avalia sua satisfação geral com a empresa?',
            tipo: 'escala_likert'
          },
          {
            texto: 'Você recomendaria nossa empresa como um bom lugar para trabalhar?',
            tipo: 'nps'
          },
          {
            texto: 'Você se sente motivado em seu trabalho atual?',
            tipo: 'escala_likert'
          }
        ]
      },
      {
        categoria: 'Liderança',
        perguntas: [
          {
            texto: 'Como você avalia a comunicação da sua liderança direta?',
            tipo: 'escala_likert'
          },
          {
            texto: 'Seu gestor oferece feedback construtivo regularmente?',
            tipo: 'sim_nao'
          },
          {
            texto: 'Você se sente apoiado por sua liderança?',
            tipo: 'escala_likert'
          }
        ]
      },
      {
        categoria: 'Desenvolvimento',
        perguntas: [
          {
            texto: 'Como você avalia as oportunidades de crescimento na empresa?',
            tipo: 'escala_likert'
          },
          {
            texto: 'Quais áreas você gostaria de desenvolver?',
            tipo: 'multipla_escolha',
            opcoes: ['Liderança', 'Técnica', 'Comunicação', 'Vendas', 'Gestão']
          },
          {
            texto: 'Você tem clareza sobre seu plano de carreira?',
            tipo: 'sim_nao'
          }
        ]
      },
      {
        categoria: 'Clima Organizacional',
        perguntas: [
          {
            texto: 'Como você avalia o ambiente de trabalho?',
            tipo: 'escala_likert'
          },
          {
            texto: 'Você se sente valorizado pela empresa?',
            tipo: 'escala_likert'
          },
          {
            texto: 'Como você descreveria a cultura da empresa?',
            tipo: 'texto_livre'
          }
        ]
      }
    ];
  },

  obterDepartamentos: async (): Promise<DepartamentoOption[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return [
      { id: 'tech', nome: 'Tecnologia', colaboradores: 487 },
      { id: 'vendas', nome: 'Vendas', colaboradores: 623 },
      { id: 'marketing', nome: 'Marketing', colaboradores: 156 },
      { id: 'rh', nome: 'Recursos Humanos', colaboradores: 89 },
      { id: 'financeiro', nome: 'Financeiro', colaboradores: 234 },
      { id: 'operacoes', nome: 'Operações', colaboradores: 445 }
    ];
  },

  criarPesquisa: async (dados: ConfiguracaoPesquisa): Promise<{ id: string }> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulação de validação no backend
    if (dados.perguntas.length === 0) {
      throw new Error('A pesquisa deve ter pelo menos uma pergunta');
    }
    
    if (dados.tipo === 'pulse' && dados.perguntas.length > 10) {
      throw new Error('Pulse Surveys devem ter no máximo 10 perguntas');
    }
    
    return { id: 'pesq_' + Date.now() };
  },

  validarConfiguracao: async (dados: Partial<ConfiguracaoPesquisa>): Promise<{
    valida: boolean;
    erros: string[];
    estimativa_publico: number;
  }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const erros = [];
    let estimativaPublico = 0;
    
    if (dados.publico_alvo) {
      if (dados.publico_alvo.todos) {
        estimativaPublico = 2847;
      } else {
        // Simulação de cálculo baseado em seleções
        const deptSelecionados = dados.publico_alvo.departamentos?.length || 0;
        estimativaPublico = deptSelecionados * 200; // Média estimada
      }
    }
    
    if (estimativaPublico < 5 && dados.configuracao?.anonima) {
      erros.push('Público muito pequeno para pesquisa anônima (mínimo 5 pessoas)');
    }
    
    return {
      valida: erros.length === 0,
      erros,
      estimativa_publico: estimativaPublico
    };
  }
};

// Funções utilitárias defensivas
const gerarIdUnico = (): string => {
  try {
    return 'pergunta_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  } catch (error) {
    console.error('Erro ao gerar ID único:', error);
    return 'pergunta_' + Date.now();
  }
};

const formatarData = (dataString: string | undefined): string => {
  if (!dataString) return '';
  
  try {
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return '';
    
    return data.toISOString().split('T')[0];
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
};

const formatarNumero = (valor: number | undefined): string => {
  if (valor === undefined || valor === null || isNaN(valor)) return '0';
  
  try {
    return valor.toLocaleString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar número:', error);
    return '0';
  }
};

const obterLabelTipoPergunta = (tipo: string): string => {
  const labels = {
    'escala_likert': 'Escala (1-5)',
    'multipla_escolha': 'Múltipla Escolha',
    'texto_livre': 'Texto Livre',
    'nps': 'NPS (0-10)',
    'sim_nao': 'Sim/Não'
  };
  return labels[tipo] || tipo;
};

const validarDataMinima = (data: string): boolean => {
  try {
    const dataFornecida = new Date(data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return dataFornecida >= hoje;
  } catch (error) {
    return false;
  }
};

// Interface principal
interface CriarPesquisaProps {
  usuario: any;
  permissoes: any;
  onPesquisaCriada: () => void;
}

export default function CriarPesquisa({ usuario, permissoes, onPesquisaCriada }: CriarPesquisaProps) {
  // Estados principais
  const [etapaAtual, setEtapaAtual] = useState<'configuracao' | 'publico' | 'perguntas' | 'preview'>('configuracao');
  const [salvando, setSalvando] = useState(false);
  const [carregandoTemplates, setCarregandoTemplates] = useState(false);
  const [carregandoDepartamentos, setCarregandoDepartamentos] = useState(false);
  const [validandoConfiguracao, setValidandoConfiguracao] = useState(false);
  
  // Estados de dados
  const [templates, setTemplates] = useState<TemplatesPergunta[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoOption[]>([]);
  const [estimativaPublico, setEstimativaPublico] = useState(0);
  
  // Estado da pesquisa sendo criada
  const [pesquisa, setPesquisa] = useState<ConfiguracaoPesquisa>({
    nome: '',
    tipo: 'pulse',
    descricao: '',
    publico_alvo: {
      todos: true,
      departamentos: [],
      cargos: [],
      localizacoes: []
    },
    configuracao: {
      anonima: true,
      data_inicio: '',
      data_fim: '',
      lembretes: true,
      frequencia_lembrete: 3
    },
    perguntas: []
  });
  
  // Estados de validação
  const [erros, setErros] = useState<Record<string, string>>({});
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [errosValidacao, setErrosValidacao] = useState<string[]>([]);
  
  // Estados de modais
  const [modalTemplates, setModalTemplates] = useState<{
    aberto: boolean;
    categoriaSelecionada: string;
  }>({
    aberto: false,
    categoriaSelecionada: ''
  });
  
  const [modalPergunta, setModalPergunta] = useState<{
    aberto: boolean;
    editando: Pergunta | null;
    pergunta: Partial<Pergunta>;
  }>({
    aberto: false,
    editando: null,
    pergunta: {
      texto: '',
      tipo: 'escala_likert',
      obrigatoria: true,
      peso: 1,
      categoria: 'Geral',
      opcoes: []
    }
  });
  
  const montadoRef = useRef(true);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    carregarTemplates();
    carregarDepartamentos();
  }, []);

  // Validação em tempo real após primeira tentativa
  useEffect(() => {
    if (tentouEnviar) {
      validarEtapaAtual();
    }
  }, [pesquisa, tentouEnviar, etapaAtual]);

  // Carregar templates de perguntas
  const carregarTemplates = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoTemplates(true);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoTemplates(false);
        toast.error('Tempo excedido ao carregar templates');
      }
    }, 5000);
    
    try {
      const templatesData = await apiMock.obterTemplatesPerguntas();
      
      if (montadoRef.current) {
        setTemplates(templatesData);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      if (montadoRef.current) {
        toast.error('Falha ao carregar templates de perguntas');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoTemplates(false);
      }
    }
  }, []);

  // Carregar departamentos
  const carregarDepartamentos = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoDepartamentos(true);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoDepartamentos(false);
        toast.error('Tempo excedido ao carregar departamentos');
      }
    }, 5000);
    
    try {
      const deptData = await apiMock.obterDepartamentos();
      
      if (montadoRef.current) {
        setDepartamentos(deptData);
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
      if (montadoRef.current) {
        toast.error('Falha ao carregar departamentos');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoDepartamentos(false);
      }
    }
  }, []);

  // Validar configuração atual
  const validarConfiguracao = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setValidandoConfiguracao(true);
    setErrosValidacao([]);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setValidandoConfiguracao(false);
        toast.error('Tempo excedido na validação');
      }
    }, 5000);
    
    try {
      const resultado = await apiMock.validarConfiguracao(pesquisa);
      
      if (montadoRef.current) {
        setEstimativaPublico(resultado.estimativa_publico);
        setErrosValidacao(resultado.erros);
      }
    } catch (error) {
      console.error('Erro na validação:', error);
      if (montadoRef.current) {
        toast.error('Falha na validação da configuração');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setValidandoConfiguracao(false);
      }
    }
  }, [pesquisa]);

  // Validação da etapa atual
  const validarEtapaAtual = useCallback(() => {
    const novosErros: Record<string, string> = {};
    
    switch (etapaAtual) {
      case 'configuracao':
        if (!pesquisa.nome || pesquisa.nome.trim().length === 0) {
          novosErros.nome = 'Nome é obrigatório';
        } else if (pesquisa.nome.trim().length < 3) {
          novosErros.nome = 'Nome deve ter ao menos 3 caracteres';
        } else if (pesquisa.nome.trim().length > 100) {
          novosErros.nome = 'Nome não pode ter mais de 100 caracteres';
        }
        
        if (!pesquisa.configuracao.data_inicio) {
          novosErros.data_inicio = 'Data de início é obrigatória';
        } else if (!validarDataMinima(pesquisa.configuracao.data_inicio)) {
          novosErros.data_inicio = 'Data de início deve ser hoje ou no futuro';
        }
        
        if (!pesquisa.configuracao.data_fim) {
          novosErros.data_fim = 'Data de término é obrigatória';
        } else if (pesquisa.configuracao.data_inicio && 
                   new Date(pesquisa.configuracao.data_fim) <= new Date(pesquisa.configuracao.data_inicio)) {
          novosErros.data_fim = 'Data de término deve ser posterior à data de início';
        }
        break;
        
      case 'publico':
        if (!pesquisa.publico_alvo.todos && 
            pesquisa.publico_alvo.departamentos.length === 0 && 
            pesquisa.publico_alvo.cargos.length === 0 && 
            pesquisa.publico_alvo.localizacoes.length === 0) {
          novosErros.publico = 'Selecione ao menos um critério de público-alvo';
        }
        break;
        
      case 'perguntas':
        if (pesquisa.perguntas.length === 0) {
          novosErros.perguntas = 'Adicione ao menos uma pergunta';
        } else if (pesquisa.tipo === 'pulse' && pesquisa.perguntas.length > 10) {
          novosErros.perguntas = 'Pulse Surveys devem ter no máximo 10 perguntas';
        }
        break;
    }
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }, [etapaAtual, pesquisa]);

  // Handler para mudança de dados
  const handleChange = useCallback((campo: string, valor: any) => {
    setPesquisa(prev => {
      const novosDados = { ...prev };
      
      // Navegação aninhada para campos como configuracao.anonima
      const campoPartes = campo.split('.');
      let objeto = novosDados;
      
      for (let i = 0; i < campoPartes.length - 1; i++) {
        objeto = objeto[campoPartes[i]];
      }
      
      objeto[campoPartes[campoPartes.length - 1]] = valor;
      return novosDados;
    });
    
    // Limpar erro quando campo é editado
    if (erros[campo]) {
      setErros(prev => {
        const novos = { ...prev };
        delete novos[campo];
        return novos;
      });
    }
    
    // Validar configuração quando relevante
    if (campo.includes('publico_alvo') || campo.includes('configuracao.anonima')) {
      setTimeout(() => {
        if (montadoRef.current) {
          validarConfiguracao();
        }
      }, 500);
    }
  }, [erros, validarConfiguracao]);

  // Handler para seleção de departamentos
  const handleDepartamentoToggle = useCallback((deptId: string, selecionado: boolean) => {
    setPesquisa(prev => ({
      ...prev,
      publico_alvo: {
        ...prev.publico_alvo,
        departamentos: selecionado 
          ? [...prev.publico_alvo.departamentos, deptId]
          : prev.publico_alvo.departamentos.filter(id => id !== deptId)
      }
    }));
  }, []);

  // Navegação entre etapas
  const irParaEtapa = useCallback((etapa: typeof etapaAtual) => {
    if (etapa !== etapaAtual) {
      setTentouEnviar(true);
      
      if (validarEtapaAtual()) {
        setEtapaAtual(etapa);
        setTentouEnviar(false);
        setErros({});
      } else {
        toast.error('Corrija os erros antes de continuar');
      }
    }
  }, [etapaAtual, validarEtapaAtual]);

  const proximaEtapa = useCallback(() => {
    const etapas: (typeof etapaAtual)[] = ['configuracao', 'publico', 'perguntas', 'preview'];
    const indiceAtual = etapas.indexOf(etapaAtual);
    
    if (indiceAtual < etapas.length - 1) {
      irParaEtapa(etapas[indiceAtual + 1]);
    }
  }, [etapaAtual, irParaEtapa]);

  const etapaAnterior = useCallback(() => {
    const etapas: (typeof etapaAtual)[] = ['configuracao', 'publico', 'perguntas', 'preview'];
    const indiceAtual = etapas.indexOf(etapaAtual);
    
    if (indiceAtual > 0) {
      setEtapaAtual(etapas[indiceAtual - 1]);
    }
  }, [etapaAtual]);

  // Gerenciamento de perguntas
  const adicionarPergunta = useCallback((pergunta: Pergunta) => {
    setPesquisa(prev => ({
      ...prev,
      perguntas: [...prev.perguntas, pergunta]
    }));
    
    setModalPergunta({
      aberto: false,
      editando: null,
      pergunta: {
        texto: '',
        tipo: 'escala_likert',
        obrigatoria: true,
        peso: 1,
        categoria: 'Geral',
        opcoes: []
      }
    });
    
    toast.success('Pergunta adicionada com sucesso');
  }, []);

  const editarPergunta = useCallback((index: number, pergunta: Pergunta) => {
    setPesquisa(prev => {
      const novasPerguntas = [...prev.perguntas];
      novasPerguntas[index] = pergunta;
      return { ...prev, perguntas: novasPerguntas };
    });
    
    setModalPergunta({
      aberto: false,
      editando: null,
      pergunta: {
        texto: '',
        tipo: 'escala_likert',
        obrigatoria: true,
        peso: 1,
        categoria: 'Geral',
        opcoes: []
      }
    });
    
    toast.success('Pergunta atualizada com sucesso');
  }, []);

  const removerPergunta = useCallback((index: number) => {
    setPesquisa(prev => ({
      ...prev,
      perguntas: prev.perguntas.filter((_, i) => i !== index)
    }));
    
    toast.success('Pergunta removida com sucesso');
  }, []);

  // Adicionar perguntas do template
  const adicionarPerguntasTemplate = useCallback((categoria: string) => {
    const template = templates.find(t => t.categoria === categoria);
    if (!template) return;
    
    const novasPerguntas: Pergunta[] = template.perguntas.map(p => ({
      id: gerarIdUnico(),
      texto: p.texto,
      tipo: p.tipo as any,
      obrigatoria: true,
      opcoes: p.opcoes || [],
      peso: 1,
      categoria: categoria
    }));
    
    setPesquisa(prev => ({
      ...prev,
      perguntas: [...prev.perguntas, ...novasPerguntas]
    }));
    
    setModalTemplates({ aberto: false, categoriaSelecionada: '' });
    toast.success(`${novasPerguntas.length} perguntas adicionadas de ${categoria}`);
  }, [templates]);

  // Salvar pesquisa
  const handleSalvar = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setTentouEnviar(true);
    
    if (!validarEtapaAtual() || errosValidacao.length > 0) {
      toast.error('Corrija os erros antes de salvar');
      return;
    }
    
    setSalvando(true);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setSalvando(false);
        toast.error('Tempo excedido ao salvar pesquisa');
      }
    }, 15000);
    
    try {
      const resultado = await apiMock.criarPesquisa(pesquisa);
      
      if (montadoRef.current) {
        toast.success('Pesquisa criada com sucesso!');
        onPesquisaCriada();
      }
    } catch (error) {
      console.error('Erro ao salvar pesquisa:', error);
      if (montadoRef.current) {
        toast.error(error.message || 'Falha ao criar pesquisa. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setSalvando(false);
      }
    }
  }, [pesquisa, validarEtapaAtual, errosValidacao, onPesquisaCriada]);

  // Verificação de permissões
  if (!permissoes.podeCrear) {
    return (
      <div className="text-center py-16">
        <LucideIcons.Shield className="h-16 w-16 text-gray-300 mx-auto mb-6" />
        <h3 className="text-xl font-medium mb-2">Acesso Restrito</h3>
        <p className="text-gray-500">
          Você não tem permissão para criar pesquisas. Entre em contato com o administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {[
              { key: 'configuracao', label: 'Configuração', icon: LucideIcons.Settings },
              { key: 'publico', label: 'Público-Alvo', icon: LucideIcons.Users },
              { key: 'perguntas', label: 'Perguntas', icon: LucideIcons.MessageSquare },
              { key: 'preview', label: 'Preview', icon: LucideIcons.Eye }
            ].map((etapa, index) => {
              const isAtiva = etapaAtual === etapa.key;
              const isConcluida = ['configuracao', 'publico', 'perguntas', 'preview'].indexOf(etapaAtual) > index;
              
              return (
                <Fragment key={etapa.key}>
                  <div className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isAtiva 
                        ? 'border-primary bg-primary text-white' 
                        : isConcluida 
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-500'
                    }`}>
                      {isConcluida ? (
                        <LucideIcons.Check className="h-5 w-5" />
                      ) : (
                        <etapa.icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isAtiva ? 'text-primary' : isConcluida ? 'text-green-600' : 'text-gray-500'}`}>
                        {etapa.label}
                      </p>
                    </div>
                  </div>
                  
                  {index < 3 && (
                    <div className={`flex-1 h-0.5 mx-4 ${isConcluida ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo da Etapa */}
      <Card>
        <CardContent className="pt-6">
          {/* Etapa 1: Configuração */}
          {etapaAtual === 'configuracao' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Configuração Básica</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nome">Nome da Pesquisa *</Label>
                      <Input
                        id="nome"
                        value={pesquisa.nome}
                        onChange={(e) => handleChange('nome', e.target.value)}
                        className={erros.nome ? 'border-red-500' : ''}
                        placeholder="Ex: Pulse Survey Q1 2025"
                      />
                      {erros.nome && (
                        <p className="text-red-500 text-sm mt-1">{erros.nome}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="tipo">Tipo de Pesquisa</Label>
                      <Select
                        value={pesquisa.tipo}
                        onValueChange={valor => handleChange('tipo', valor)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pulse">Pulse Survey (máx. 10 perguntas)</SelectItem>
                          <SelectItem value="clima">Clima Organizacional</SelectItem>
                          <SelectItem value="360">Feedback 360°</SelectItem>
                          <SelectItem value="ad_hoc">Pesquisa Específica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea
                        id="descricao"
                        value={pesquisa.descricao}
                        onChange={(e) => handleChange('descricao', e.target.value)}
                        placeholder="Descreva o objetivo desta pesquisa..."
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="data_inicio">Data de Início *</Label>
                      <Input
                        id="data_inicio"
                        type="date"
                        value={formatarData(pesquisa.configuracao.data_inicio)}
                        onChange={(e) => handleChange('configuracao.data_inicio', e.target.value)}
                        className={erros.data_inicio ? 'border-red-500' : ''}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {erros.data_inicio && (
                        <p className="text-red-500 text-sm mt-1">{erros.data_inicio}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="data_fim">Data de Término *</Label>
                      <Input
                        id="data_fim"
                        type="date"
                        value={formatarData(pesquisa.configuracao.data_fim)}
                        onChange={(e) => handleChange('configuracao.data_fim', e.target.value)}
                        className={erros.data_fim ? 'border-red-500' : ''}
                        min={pesquisa.configuracao.data_inicio || new Date().toISOString().split('T')[0]}
                      />
                      {erros.data_fim && (
                        <p className="text-red-500 text-sm mt-1">{erros.data_fim}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="anonima"
                        checked={pesquisa.configuracao.anonima}
                        onCheckedChange={valor => handleChange('configuracao.anonima', valor)}
                      />
                      <Label htmlFor="anonima">Pesquisa Anônima</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="lembretes"
                        checked={pesquisa.configuracao.lembretes}
                        onCheckedChange={valor => handleChange('configuracao.lembretes', valor)}
                      />
                      <Label htmlFor="lembretes">Enviar Lembretes</Label>
                    </div>
                    
                    {pesquisa.configuracao.lembretes && (
                      <div>
                        <Label htmlFor="frequencia_lembrete">Frequência de Lembretes (dias)</Label>
                        <Select
                          value={pesquisa.configuracao.frequencia_lembrete.toString()}
                          onValueChange={valor => handleChange('configuracao.frequencia_lembrete', parseInt(valor))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Diário</SelectItem>
                            <SelectItem value="2">A cada 2 dias</SelectItem>
                            <SelectItem value="3">A cada 3 dias</SelectItem>
                            <SelectItem value="7">Semanal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Etapa 2: Público-Alvo */}
          {etapaAtual === 'publico' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Definir Público-Alvo</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="todos"
                      checked={pesquisa.publico_alvo.todos}
                      onCheckedChange={valor => handleChange('publico_alvo.todos', valor)}
                    />
                    <Label htmlFor="todos">Todos os colaboradores</Label>
                  </div>
                  
                  {!pesquisa.publico_alvo.todos && (
                    <>
                      <div>
                        <h4 className="font-medium mb-3">Departamentos</h4>
                        {carregandoDepartamentos ? (
                          <div className="flex items-center py-4">
                            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                            <span className="text-sm text-gray-500">Carregando departamentos...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {departamentos.map((dept) => (
                              <div key={dept.id} className="flex items-center space-x-2 p-3 border rounded">
                                <Checkbox
                                  id={`dept_${dept.id}`}
                                  checked={pesquisa.publico_alvo.departamentos.includes(dept.id)}
                                  onCheckedChange={(checked) => 
                                    handleDepartamentoToggle(dept.id, checked as boolean)
                                  }
                                />
                                <div className="flex-1">
                                  <Label htmlFor={`dept_${dept.id}`} className="font-medium">
                                    {dept.nome}
                                  </Label>
                                  <p className="text-sm text-gray-500">
                                    {formatarNumero(dept.colaboradores)} pessoas
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  {erros.publico && (
                    <p className="text-red-500 text-sm">{erros.publico}</p>
                  )}
                </div>
                
                {/* Estimativa de Público */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">Estimativa de Público-Alvo</h4>
                      <p className="text-blue-700">
                        Aproximadamente <strong>{formatarNumero(estimativaPublico)}</strong> colaboradores receberão esta pesquisa
                      </p>
                    </div>
                    
                    {validandoConfiguracao && (
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    )}
                  </div>
                  
                  {errosValidacao.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {errosValidacao.map((erro, index) => (
                        <p key={index} className="text-red-600 text-sm flex items-center">
                          <LucideIcons.AlertTriangle className="h-4 w-4 mr-1" />
                          {erro}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Etapa 3: Perguntas */}
          {etapaAtual === 'perguntas' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Perguntas da Pesquisa</h3>
                  <p className="text-sm text-gray-500">
                    {pesquisa.perguntas.length} pergunta(s) adicionada(s)
                    {pesquisa.tipo === 'pulse' && ` (máximo 10)`}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setModalTemplates({ aberto: true, categoriaSelecionada: '' })}
                    disabled={carregandoTemplates}
                  >
                    <LucideIcons.Library className="h-4 w-4 mr-2" />
                    Templates
                  </Button>
                  
                  <Button
                    onClick={() => setModalPergunta({ ...modalPergunta, aberto: true })}
                    disabled={pesquisa.tipo === 'pulse' && pesquisa.perguntas.length >= 10}
                  >
                    <LucideIcons.Plus className="h-4 w-4 mr-2" />
                    Nova Pergunta
                  </Button>
                </div>
              </div>
              
              {erros.perguntas && (
                <p className="text-red-500 text-sm">{erros.perguntas}</p>
              )}
              
              {pesquisa.perguntas.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
                  <LucideIcons.MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium mb-2">Nenhuma pergunta adicionada</h4>
                  <p className="text-gray-500 mb-6">
                    Comece adicionando perguntas manualmente ou usando nossos templates
                  </p>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setModalTemplates({ aberto: true, categoriaSelecionada: '' })}
                    >
                      Usar Templates
                    </Button>
                    <Button
                      onClick={() => setModalPergunta({ ...modalPergunta, aberto: true })}
                    >
                      Criar Pergunta
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pesquisa.perguntas.map((pergunta, index) => (
                    <Card key={pergunta.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Badge variant="outline">#{index + 1}</Badge>
                              <Badge variant={pergunta.obrigatoria ? 'default' : 'secondary'}>
                                {pergunta.obrigatoria ? 'Obrigatória' : 'Opcional'}
                              </Badge>
                              <Badge variant="outline">
                                {obterLabelTipoPergunta(pergunta.tipo)}
                              </Badge>
                              <Badge variant="outline">
                                {pergunta.categoria}
                              </Badge>
                            </div>
                            
                            <p className="text-lg font-medium mb-2">{pergunta.texto}</p>
                            
                            {pergunta.opcoes && pergunta.opcoes.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {pergunta.opcoes.map((opcao, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {opcao}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setModalPergunta({
                                  aberto: true,
                                  editando: pergunta,
                                  pergunta: { ...pergunta }
                                });
                              }}
                            >
                              <LucideIcons.Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removerPergunta(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <LucideIcons.Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Etapa 4: Preview */}
          {etapaAtual === 'preview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Preview da Pesquisa</h3>
                
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{pesquisa.nome}</CardTitle>
                      {pesquisa.descricao && (
                        <CardDescription>{pesquisa.descricao}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-500">Tipo</p>
                          <p>{pesquisa.tipo.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Período</p>
                          <p>{formatarData(pesquisa.configuracao.data_inicio)} - {formatarData(pesquisa.configuracao.data_fim)}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Público-Alvo</p>
                          <p>{formatarNumero(estimativaPublico)} pessoas</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Perguntas</p>
                          <p>{pesquisa.perguntas.length} pergunta(s)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Perguntas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {pesquisa.perguntas.map((pergunta, index) => (
                          <div key={pergunta.id} className="border-l-4 border-blue-500 pl-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium">#{index + 1}</span>
                              {pergunta.obrigatoria && (
                                <Badge variant="destructive" className="text-xs">Obrigatória</Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {obterLabelTipoPergunta(pergunta.tipo)}
                              </Badge>
                            </div>
                            <p className="text-lg mb-2">{pergunta.texto}</p>
                            
                            {pergunta.tipo === 'escala_likert' && (
                              <div className="flex space-x-2">
                                {[1, 2, 3, 4, 5].map(num => (
                                  <div key={num} className="w-8 h-8 border rounded flex items-center justify-center text-sm">
                                    {num}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {pergunta.tipo === 'multipla_escolha' && pergunta.opcoes && (
                              <div className="space-y-1">
                                {pergunta.opcoes.map((opcao, idx) => (
                                  <div key={idx} className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border rounded"></div>
                                    <span>{opcao}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {pergunta.tipo === 'sim_nao' && (
                              <div className="flex space-x-4">
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border rounded-full"></div>
                                  <span>Sim</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border rounded-full"></div>
                                  <span>Não</span>
                                </div>
                              </div>
                            )}
                            
                            {pergunta.tipo === 'texto_livre' && (
                              <div className="w-full h-20 border rounded p-2 bg-gray-50 text-sm text-gray-500">
                                Área para resposta em texto livre...
                              </div>
                            )}
                            
                            {pergunta.tipo === 'nps' && (
                              <div className="flex space-x-1">
                                {Array.from({ length: 11 }).map((_, i) => (
                                  <div key={i} className="w-8 h-8 border rounded flex items-center justify-center text-sm">
                                    {i}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {errosValidacao.length > 0 && (
                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="text-red-700 flex items-center">
                          <LucideIcons.AlertTriangle className="h-5 w-5 mr-2" />
                          Atenção: Problemas Identificados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {errosValidacao.map((erro, index) => (
                            <p key={index} className="text-red-600 text-sm">• {erro}</p>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navegação */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={etapaAnterior}
          disabled={etapaAtual === 'configuracao'}
        >
          <LucideIcons.ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        
        <div className="flex space-x-2">
          {etapaAtual !== 'preview' ? (
            <Button onClick={proximaEtapa}>
              Próximo
              <LucideIcons.ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSalvar}
              disabled={salvando || errosValidacao.length > 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {salvando ? (
                <>
                  <LucideIcons.Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <LucideIcons.Save className="h-4 w-4 mr-2" />
                  Criar Pesquisa
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Modal de Templates */}
      <Dialog open={modalTemplates.aberto} onOpenChange={(open) => {
        if (!open) {
          setModalTemplates({ aberto: false, categoriaSelecionada: '' });
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Biblioteca de Templates</DialogTitle>
          </DialogHeader>
          
          {carregandoTemplates ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {templates.map((template) => (
                <Card key={template.categoria} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.categoria}</CardTitle>
                    <CardDescription>
                      {template.perguntas.length} pergunta(s) disponível(is)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {template.perguntas.slice(0, 2).map((pergunta, index) => (
                        <p key={index} className="text-sm text-gray-600">
                          • {pergunta.texto}
                        </p>
                      ))}
                      {template.perguntas.length > 2 && (
                        <p className="text-sm text-gray-500">
                          + {template.perguntas.length - 2} pergunta(s) adicional(is)
                        </p>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => adicionarPerguntasTemplate(template.categoria)}
                      className="w-full"
                      disabled={pesquisa.tipo === 'pulse' && 
                               pesquisa.perguntas.length + template.perguntas.length > 10}
                    >
                      <LucideIcons.Plus className="h-4 w-4 mr-2" />
                      Adicionar {template.perguntas.length} Pergunta(s)
                    </Button>
                    
                    {pesquisa.tipo === 'pulse' && 
                     pesquisa.perguntas.length + template.perguntas.length > 10 && (
                      <p className="text-xs text-red-500 mt-2">
                        Excederia o limite de 10 perguntas para Pulse Survey
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Pergunta */}
      <Dialog open={modalPergunta.aberto} onOpenChange={(open) => {
        if (!open) {
          setModalPergunta({
            aberto: false,
            editando: null,
            pergunta: {
              texto: '',
              tipo: 'escala_likert',
              obrigatoria: true,
              peso: 1,
              categoria: 'Geral',
              opcoes: []
            }
          });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {modalPergunta.editando ? 'Editar Pergunta' : 'Nova Pergunta'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="pergunta_texto">Texto da Pergunta *</Label>
              <Textarea
                id="pergunta_texto"
                value={modalPergunta.pergunta.texto || ''}
                onChange={(e) => setModalPergunta(prev => ({
                  ...prev,
                  pergunta: { ...prev.pergunta, texto: e.target.value }
                }))}
                placeholder="Digite a pergunta..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pergunta_tipo">Tipo de Pergunta</Label>
                <Select
                  value={modalPergunta.pergunta.tipo}
                  onValueChange={valor => setModalPergunta(prev => ({
                    ...prev,
                    pergunta: { ...prev.pergunta, tipo: valor as any }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="escala_likert">Escala (1-5)</SelectItem>
                    <SelectItem value="multipla_escolha">Múltipla Escolha</SelectItem>
                    <SelectItem value="texto_livre">Texto Livre</SelectItem>
                    <SelectItem value="nps">NPS (0-10)</SelectItem>
                    <SelectItem value="sim_nao">Sim/Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="pergunta_categoria">Categoria</Label>
                <Select
                  value={modalPergunta.pergunta.categoria}
                  onValueChange={valor => setModalPergunta(prev => ({
                    ...prev,
                    pergunta: { ...prev.pergunta, categoria: valor }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geral">Geral</SelectItem>
                    <SelectItem value="Engajamento">Engajamento</SelectItem>
                    <SelectItem value="Liderança">Liderança</SelectItem>
                    <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                    <SelectItem value="Clima Organizacional">Clima Organizacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {modalPergunta.pergunta.tipo === 'multipla_escolha' && (
              <div>
                <Label>Opções de Resposta</Label>
                <div className="space-y-2">
                  {(modalPergunta.pergunta.opcoes || []).map((opcao, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={opcao}
                        onChange={(e) => {
                          const novasOpcoes = [...(modalPergunta.pergunta.opcoes || [])];
                          novasOpcoes[index] = e.target.value;
                          setModalPergunta(prev => ({
                            ...prev,
                            pergunta: { ...prev.pergunta, opcoes: novasOpcoes }
                          }));
                        }}
                        placeholder={`Opção ${index + 1}`}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const novasOpcoes = (modalPergunta.pergunta.opcoes || []).filter((_, i) => i !== index);
                          setModalPergunta(prev => ({
                            ...prev,
                            pergunta: { ...prev.pergunta, opcoes: novasOpcoes }
                          }));
                        }}
                      >
                        <LucideIcons.X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      const novasOpcoes = [...(modalPergunta.pergunta.opcoes || []), ''];
                      setModalPergunta(prev => ({
                        ...prev,
                        pergunta: { ...prev.pergunta, opcoes: novasOpcoes }
                      }));
                    }}
                  >
                    <LucideIcons.Plus className="h-4 w-4 mr-2" />
                    Adicionar Opção
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="pergunta_obrigatoria"
                checked={modalPergunta.pergunta.obrigatoria}
                onCheckedChange={valor => setModalPergunta(prev => ({
                  ...prev,
                  pergunta: { ...prev.pergunta, obrigatoria: valor }
                }))}
              />
              <Label htmlFor="pergunta_obrigatoria">Pergunta Obrigatória</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalPergunta(prev => ({ ...prev, aberto: false }))}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const perguntaCompleta: Pergunta = {
                  id: modalPergunta.editando?.id || gerarIdUnico(),
                  texto: modalPergunta.pergunta.texto || '',
                  tipo: modalPergunta.pergunta.tipo || 'escala_likert',
                  obrigatoria: modalPergunta.pergunta.obrigatoria ?? true,
                  peso: modalPergunta.pergunta.peso || 1,
                  categoria: modalPergunta.pergunta.categoria || 'Geral',
                  opcoes: modalPergunta.pergunta.opcoes || []
                };
                
                if (!perguntaCompleta.texto.trim()) {
                  toast.error('Texto da pergunta é obrigatório');
                  return;
                }
                
                if (perguntaCompleta.tipo === 'multipla_escolha' && 
                    (!perguntaCompleta.opcoes || perguntaCompleta.opcoes.length < 2)) {
                  toast.error('Perguntas de múltipla escolha devem ter pelo menos 2 opções');
                  return;
                }
                
                if (modalPergunta.editando) {
                  const index = pesquisa.perguntas.findIndex(p => p.id === modalPergunta.editando!.id);
                  editarPergunta(index, perguntaCompleta);
                } else {
                  adicionarPergunta(perguntaCompleta);
                }
              }}
              disabled={!modalPergunta.pergunta.texto?.trim()}
            >
              {modalPergunta.editando ? 'Atualizar' : 'Adicionar'} Pergunta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}