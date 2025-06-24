'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

// Tipos para biblioteca de ações
interface TemplateAcao {
  id: string;
  nome: string;
  categoria: string;
  subcategoria: string;
  descricao: string;
  contextoAplicacao: string;
  recursosNecessarios: string[];
  custoMedio: number;
  prazoTypico: number; // em dias
  taxaSucessoHistorica: number;
  indicacoes: string[];
  contraindicacoes: string[];
  materiaisApoio: string[];
  criadoPor: string;
  dataCriacao: string;
  ultimaAtualizacao: string;
  vezesUtilizada: number;
  avaliacaoMedia: number;
  avaliacoes: Array<{
    usuario: string;
    nota: number;
    comentario: string;
    data: string;
  }>;
}

interface FiltrosBiblioteca {
  termo: string;
  categoria: string;
  efetividade: string;
  custo: string;
  prazo: string;
}

// Props do componente
interface BibliotecaAcoesProps {
  perfilUsuario: any;
  isPerfilEstrategico: boolean;
}

// API Mock para biblioteca
const apiMockBiblioteca = {
  listarTemplates: async (filtros: FiltrosBiblioteca): Promise<TemplateAcao[]> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const todosTemplates: TemplateAcao[] = [
      {
        id: 'template_001',
        nome: 'Conversa de Desenvolvimento de Carreira',
        categoria: 'desenvolvimento',
        subcategoria: 'mentoring',
        descricao: 'Conversa estruturada sobre aspirações e próximos passos na carreira do colaborador.',
        contextoAplicacao: 'Colaboradores com alto potencial, em transição de carreira ou demonstrando insatisfação com crescimento.',
        recursosNecessarios: ['Tempo do gestor (2h)', 'Plano de carreira estruturado', 'Mapeamento de competências'],
        custoMedio: 200,
        prazoTypico: 7,
        taxaSucessoHistorica: 85,
        indicacoes: [
          'Score de risco relacionado a crescimento',
          'Colaboradores sêniores sem progressão recente',
          'Feedback sobre falta de perspectiva'
        ],
        contraindicacoes: [
          'Colaboradores em período probatório',
          'Questões salariais primárias',
          'Problemas de performance'
        ],
        materiaisApoio: [
          'Roteiro de conversa de carreira',
          'Template de plano de desenvolvimento',
          'Matriz de competências por cargo'
        ],
        criadoPor: 'Equipe RH',
        dataCriacao: '2024-01-15',
        ultimaAtualizacao: '2024-06-10',
        vezesUtilizada: 127,
        avaliacaoMedia: 4.7,
        avaliacoes: [
          {
            usuario: 'Carlos Lima',
            nota: 5,
            comentario: 'Muito efetivo para colaboradores sêniores. Material de apoio excelente.',
            data: '2024-06-15'
          },
          {
            usuario: 'Ana Paula',
            nota: 4,
            comentario: 'Bom template, mas requer preparação prévia do gestor.',
            data: '2024-06-12'
          }
        ]
      },
      {
        id: 'template_002',
        nome: 'Ajuste Salarial Competitivo',
        categoria: 'remuneracao',
        subcategoria: 'salario',
        descricao: 'Revisão salarial baseada em benchmarking de mercado e performance individual.',
        contextoAplicacao: 'Colaboradores com salário abaixo do mercado ou performance excepcional.',
        recursosNecessarios: ['Aprovação diretoria', 'Pesquisa salarial', 'Análise de performance'],
        custoMedio: 8500,
        prazoTypico: 30,
        taxaSucessoHistorica: 95,
        indicacoes: [
          'Salário significativamente abaixo do mercado',
          'Performance consistentemente alta',
          'Risco de perda para concorrente'
        ],
        contraindicacoes: [
          'Performance abaixo da média',
          'Recente ajuste salarial (< 12 meses)',
          'Orçamento departamental limitado'
        ],
        materiaisApoio: [
          'Template de proposta salarial',
          'Pesquisa de mercado atualizada',
          'Justificativa por performance'
        ],
        criadoPor: 'Diretoria RH',
        dataCriacao: '2024-02-01',
        ultimaAtualizacao: '2024-05-20',
        vezesUtilizada: 43,
        avaliacaoMedia: 4.9,
        avaliacoes: [
          {
            usuario: 'Ana Paula',
            nota: 5,
            comentario: 'Solução definitiva para casos de disparidade salarial. ROI excelente.',
            data: '2024-05-25'
          }
        ]
      },
      {
        id: 'template_003',
        nome: 'Programa de Flexibilidade de Horários',
        categoria: 'flexibilidade',
        subcategoria: 'horarios',
        descricao: 'Implementação de horários flexíveis ou trabalho híbrido personalizado.',
        contextoAplicacao: 'Colaboradores valorizando work-life balance ou com necessidades específicas.',
        recursosNecessarios: ['Aprovação gestão', 'Ajuste de processos', 'Ferramentas de colaboração'],
        custoMedio: 150,
        prazoTypico: 14,
        taxaSucessoHistorica: 78,
        indicacoes: [
          'Feedback sobre work-life balance',
          'Colaboradores com filhos pequenos',
          'Profissionais de alta performance'
        ],
        contraindicacoes: [
          'Cargos que requerem presença física',
          'Colaboradores com baixa autonomia',
          'Início de carreira'
        ],
        materiaisApoio: [
          'Acordo de flexibilidade',
          'Guidelines de trabalho híbrido',
          'Métricas de produtividade'
        ],
        criadoPor: 'Operações',
        dataCriacao: '2024-03-01',
        ultimaAtualizacao: '2024-06-05',
        vezesUtilizada: 89,
        avaliacaoMedia: 4.4,
        avaliacoes: [
          {
            usuario: 'Roberto Silva',
            nota: 4,
            comentario: 'Boa solução, mas requer acompanhamento próximo inicial.',
            data: '2024-06-10'
          }
        ]
      },
      {
        id: 'template_004',
        nome: 'Treinamento de Especialização Técnica',
        categoria: 'desenvolvimento',
        subcategoria: 'capacitacao',
        descricao: 'Investimento em cursos, certificações ou conferências especializadas.',
        contextoAplicacao: 'Profissionais técnicos buscando atualização ou especialização.',
        recursosNecessarios: ['Orçamento de treinamento', 'Tempo do colaborador', 'Plataformas de ensino'],
        custoMedio: 3200,
        prazoTypico: 60,
        taxaSucessoHistorica: 82,
        indicacoes: [
          'Profissionais técnicos',
          'Necessidade de atualização tecnológica',
          'Preparação para promoção'
        ],
        contraindicacoes: [
          'Colaboradores desmotivados',
          'Falta de aplicação prática imediata',
          'Histórico de não conclusão de cursos'
        ],
        materiaisApoio: [
          'Catálogo de cursos recomendados',
          'Critérios de seleção de treinamentos',
          'Plano de aplicação pós-treinamento'
        ],
        criadoPor: 'T&D',
        dataCriacao: '2024-01-20',
        ultimaAtualizacao: '2024-06-01',
        vezesUtilizada: 156,
        avaliacaoMedia: 4.6,
        avaliacoes: [
          {
            usuario: 'Mariana Costa',
            nota: 5,
            comentario: 'Excelente para manter profissionais técnicos atualizados.',
            data: '2024-06-08'
          }
        ]
      },
      {
        id: 'template_005',
        nome: 'Mudança de Projeto Estratégico',
        categoria: 'oportunidades',
        subcategoria: 'projetos',
        descricao: 'Alocação em projeto de maior visibilidade e impacto estratégico.',
        contextoAplicacao: 'Colaboradores buscando novos desafios ou maior protagonismo.',
        recursosNecessarios: ['Disponibilidade em projetos', 'Aprovação project manager', 'Onboarding específico'],
        custoMedio: 500,
        prazoTypico: 21,
        taxaSucessoHistorica: 88,
        indicacoes: [
          'Profissionais de alto potencial',
          'Busca por novos desafios',
          'Preparação para liderança'
        ],
        contraindicacoes: [
          'Projetos com alta pressão',
          'Colaboradores sobrecarregados',
          'Falta de competências necessárias'
        ],
        materiaisApoio: [
          'Portfólio de projetos disponíveis',
          'Critérios de seleção de colaboradores',
          'Plano de transição'
        ],
        criadoPor: 'PMO',
        dataCriacao: '2024-02-15',
        ultimaAtualizacao: '2024-05-30',
        vezesUtilizada: 67,
        avaliacaoMedia: 4.8,
        avaliacoes: []
      },
      {
        id: 'template_006',
        nome: 'Programa de Reconhecimento Público',
        categoria: 'reconhecimento',
        subcategoria: 'destaque',
        descricao: 'Reconhecimento formal através de comunicação interna e premiação.',
        contextoAplicacao: 'Colaboradores com contribuições excepcionais que valorizam reconhecimento.',
        recursosNecessarios: ['Comunicação interna', 'Prêmio/bonificação', 'Evento de reconhecimento'],
        custoMedio: 800,
        prazoTypico: 10,
        taxaSucessoHistorica: 75,
        indicacoes: [
          'Resultados excepcionais',
          'Colaboradores que valorizam reconhecimento',
          'Exemplos a serem destacados'
        ],
        contraindicacoes: [
          'Colaboradores que preferem discrição',
          'Conquistas rotineiras',
          'Período de baixa performance da equipe'
        ],
        materiaisApoio: [
          'Template de comunicação de reconhecimento',
          'Critérios para premiação',
          'Roteiro de evento'
        ],
        criadoPor: 'Comunicação',
        dataCriacao: '2024-03-10',
        ultimaAtualizacao: '2024-06-08',
        vezesUtilizada: 92,
        avaliacaoMedia: 4.3,
        avaliacoes: []
      },
      {
        id: 'template_007',
        nome: 'Mentoring com Liderança Sênior',
        categoria: 'desenvolvimento',
        subcategoria: 'mentoring',
        descricao: 'Programa de mentoring com executivos sêniores para desenvolvimento acelerado.',
        contextoAplicacao: 'Talentos de alto potencial com aspirações de liderança.',
        recursosNecessarios: ['Mentor sênior disponível', 'Programa estruturado', 'Acompanhamento RH'],
        custoMedio: 600,
        prazoTypico: 90,
        taxaSucessoHistorica: 91,
        indicacoes: [
          'Alto potencial de liderança',
          'Preparação para promoção',
          'Necessidade de visão estratégica'
        ],
        contraindicacoes: [
          'Colaboradores técnicos que não querem gestão',
          'Falta de disponibilidade de mentores',
          'Período de alta demanda operacional'
        ],
        materiaisApoio: [
          'Programa de mentoring estruturado',
          'Guia para mentores',
          'Plano de desenvolvimento 90 dias'
        ],
        criadoPor: 'Desenvolvimento',
        dataCriacao: '2024-04-01',
        ultimaAtualizacao: '2024-06-15',
        vezesUtilizada: 28,
        avaliacaoMedia: 4.9,
        avaliacoes: [
          {
            usuario: 'Fernanda Souza',
            nota: 5,
            comentario: 'Programa transformador para quem tem potencial de liderança.',
            data: '2024-06-18'
          }
        ]
      },
      {
        id: 'template_008',
        nome: 'Rotação de Função Lateral',
        categoria: 'oportunidades',
        subcategoria: 'rotacao',
        descricao: 'Mudança para função equivalente em outra área para ampliar experiência.',
        contextoAplicacao: 'Colaboradores buscando variedade ou com conflitos na equipe atual.',
        recursosNecessarios: ['Vaga disponível', 'Treinamento de transição', 'Aprovação ambas as áreas'],
        custoMedio: 1200,
        prazoTypico: 45,
        taxaSucessoHistorica: 73,
        indicacoes: [
          'Busca por novos desafios',
          'Conflitos interpessoais',
          'Preparação para funções generalistas'
        ],
        contraindicacoes: [
          'Especialistas únicos na função',
          'Período de alta demanda na área atual',
          'Resistência à mudança'
        ],
        materiaisApoio: [
          'Mapa de funções equivalentes',
          'Plano de transição',
          'Programa de onboarding'
        ],
        criadoPor: 'RH Estratégico',
        dataCriacao: '2024-04-15',
        ultimaAtualizacao: '2024-06-20',
        vezesUtilizada: 34,
        avaliacaoMedia: 4.2,
        avaliacoes: []
      }
    ];

    // Aplicar filtros
    let templatesFiltrados = todosTemplates;
    
    if (filtros.termo) {
      templatesFiltrados = templatesFiltrados.filter(template =>
        template.nome.toLowerCase().includes(filtros.termo.toLowerCase()) ||
        template.descricao.toLowerCase().includes(filtros.termo.toLowerCase()) ||
        template.categoria.toLowerCase().includes(filtros.termo.toLowerCase())
      );
    }
    
    if (filtros.categoria !== 'todas') {
      templatesFiltrados = templatesFiltrados.filter(template => template.categoria === filtros.categoria);
    }
    
    if (filtros.efetividade !== 'todas') {
      const minEfetividade = filtros.efetividade === 'alta' ? 80 : filtros.efetividade === 'media' ? 60 : 0;
      const maxEfetividade = filtros.efetividade === 'alta' ? 100 : filtros.efetividade === 'media' ? 79 : 59;
      templatesFiltrados = templatesFiltrados.filter(template => 
        template.taxaSucessoHistorica >= minEfetividade && template.taxaSucessoHistorica <= maxEfetividade
      );
    }
    
    if (filtros.custo !== 'todos') {
      const maxCusto = filtros.custo === 'baixo' ? 1000 : filtros.custo === 'medio' ? 5000 : Infinity;
      const minCusto = filtros.custo === 'baixo' ? 0 : filtros.custo === 'medio' ? 1001 : 5001;
      templatesFiltrados = templatesFiltrados.filter(template => 
        template.custoMedio >= minCusto && template.custoMedio <= maxCusto
      );
    }

    if (filtros.prazo !== 'todos') {
      const maxPrazo = filtros.prazo === 'rapido' ? 15 : filtros.prazo === 'medio' ? 45 : Infinity;
      const minPrazo = filtros.prazo === 'rapido' ? 0 : filtros.prazo === 'medio' ? 16 : 46;
      templatesFiltrados = templatesFiltrados.filter(template => 
        template.prazoTypico >= minPrazo && template.prazoTypico <= maxPrazo
      );
    }

    return templatesFiltrados;
  },

  avaliarTemplate: async (templateId: string, avaliacao: {
    nota: number;
    comentario: string;
  }): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simular avaliação
  },

  criarTemplate: async (template: Omit<TemplateAcao, 'id' | 'dataCriacao' | 'ultimaAtualizacao' | 'vezesUtilizada' | 'avaliacaoMedia' | 'avaliacoes'>): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Simular criação
  },

  usarTemplate: async (templateId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    // Simular uso do template
  }
};

// Funções utilitárias
const formatarMoeda = (valor: number | undefined): string => {
  if (!valor) return 'R$ 0,00';
  
  try {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  } catch (error) {
    console.error('Erro ao formatar moeda:', error);
    return 'R$ 0,00';
  }
};

const formatarData = (dataString: string | undefined): string => {
  if (!dataString) return 'N/A';
  
  try {
    const data = new Date(dataString);
    
    if (isNaN(data.getTime())) {
      return 'Data inválida';
    }
    
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Erro de formato';
  }
};

export default function BibliotecaAcoes({ perfilUsuario, isPerfilEstrategico }: BibliotecaAcoesProps) {
  // Estados principais
  const [templates, setTemplates] = useState<TemplateAcao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Estados de filtros
  const [filtros, setFiltros] = useState<FiltrosBiblioteca>({
    termo: '',
    categoria: 'todas',
    efetividade: 'todas',
    custo: 'todos',
    prazo: 'todos'
  });
  
  // Estados de modal
  const [modalDetalhes, setModalDetalhes] = useState<{
    show: boolean;
    template: TemplateAcao | null;
  }>({
    show: false,
    template: null
  });
  
  const [modalAvaliacao, setModalAvaliacao] = useState<{
    show: boolean;
    templateId: string;
    templateNome: string;
  }>({
    show: false,
    templateId: '',
    templateNome: ''
  });
  
  const [dadosAvaliacao, setDadosAvaliacao] = useState({
    nota: 5,
    comentario: ''
  });
  
  const [modalNovoTemplate, setModalNovoTemplate] = useState(false);
  const [novoTemplate, setNovoTemplate] = useState({
    nome: '',
    categoria: 'desenvolvimento',
    subcategoria: '',
    descricao: '',
    contextoAplicacao: '',
    recursosNecessarios: '',
    custoMedio: '',
    prazoTypico: '',
    indicacoes: '',
    contraindicacoes: '',
    materiaisApoio: ''
  });
  
  const [salvandoAvaliacao, setSalvandoAvaliacao] = useState(false);
  const [salvandoTemplate, setSalvandoTemplate] = useState(false);
  const [usandoTemplate, setUsandoTemplate] = useState<string | null>(null);
  
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Carregar templates
  useEffect(() => {
    carregarTemplates();
  }, [filtros]);

  const carregarTemplates = useCallback(async () => {
    if (!montadoRef.current) return;

    setCarregando(true);
    setErro(null);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregando(false);
        setErro('Tempo de carregamento excedido. Tente novamente.');
      }
    }, 6000);

    try {
      const templatesData = await apiMockBiblioteca.listarTemplates(filtros);
      if (montadoRef.current) {
        setTemplates(templatesData);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      if (montadoRef.current) {
        setErro('Falha ao carregar biblioteca de ações. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregando(false);
      }
    }
  }, [filtros]);

  // Handlers de filtros
  const handleFiltroChange = useCallback((campo: keyof FiltrosBiblioteca, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltros({
      termo: '',
      categoria: 'todas',
      efetividade: 'todas',
      custo: 'todos',
      prazo: 'todos'
    });
  }, []);

  // Verificar se tem filtros aplicados
  const filtrosAplicados = useMemo(() => {
    return filtros.termo !== '' || 
           filtros.categoria !== 'todas' || 
           filtros.efetividade !== 'todas' ||
           filtros.custo !== 'todos' ||
           filtros.prazo !== 'todos';
  }, [filtros]);

  // Funções de cor e label
  const getCorCategoria = useCallback((categoria: string) => {
    switch (categoria) {
      case 'desenvolvimento': return 'bg-blue-100 text-blue-800';
      case 'remuneracao': return 'bg-green-100 text-green-800';
      case 'flexibilidade': return 'bg-purple-100 text-purple-800';
      case 'reconhecimento': return 'bg-yellow-100 text-yellow-800';
      case 'oportunidades': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getLabelCategoria = useCallback((categoria: string) => {
    switch (categoria) {
      case 'desenvolvimento': return 'Desenvolvimento';
      case 'remuneracao': return 'Remuneração';
      case 'flexibilidade': return 'Flexibilidade';
      case 'reconhecimento': return 'Reconhecimento';
      case 'oportunidades': return 'Oportunidades';
      default: return categoria;
    }
  }, []);

  const getCorEfetividade = useCallback((taxa: number) => {
    if (taxa >= 80) return 'text-green-600';
    if (taxa >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  // Handlers de modais
  const handleAbrirDetalhes = useCallback((template: TemplateAcao) => {
    setModalDetalhes({
      show: true,
      template
    });
  }, []);

  const handleFecharDetalhes = useCallback(() => {
    setModalDetalhes({
      show: false,
      template: null
    });
  }, []);

  const handleAbrirAvaliacao = useCallback((templateId: string, templateNome: string) => {
    setModalAvaliacao({
      show: true,
      templateId,
      templateNome
    });
    setDadosAvaliacao({
      nota: 5,
      comentario: ''
    });
  }, []);

  const handleFecharAvaliacao = useCallback(() => {
    setModalAvaliacao({
      show: false,
      templateId: '',
      templateNome: ''
    });
    setDadosAvaliacao({
      nota: 5,
      comentario: ''
    });
  }, []);

  const handleSalvarAvaliacao = useCallback(async () => {
    if (!montadoRef.current) return;

    if (!dadosAvaliacao.comentario.trim()) {
      toast.error('Comentário da avaliação é obrigatório');
      return;
    }

    setSalvandoAvaliacao(true);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setSalvandoAvaliacao(false);
        toast.error('Tempo excedido ao salvar avaliação. Tente novamente.');
      }
    }, 5000);

    try {
      await apiMockBiblioteca.avaliarTemplate(modalAvaliacao.templateId, dadosAvaliacao);
      if (montadoRef.current) {
        toast.success('Avaliação registrada com sucesso');
        handleFecharAvaliacao();
        carregarTemplates();
      }
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      if (montadoRef.current) {
        toast.error('Falha ao registrar avaliação. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setSalvandoAvaliacao(false);
      }
    }
  }, [dadosAvaliacao, modalAvaliacao.templateId, handleFecharAvaliacao, carregarTemplates]);

  const handleAbrirNovoTemplate = useCallback(() => {
    setModalNovoTemplate(true);
    setNovoTemplate({
      nome: '',
      categoria: 'desenvolvimento',
      subcategoria: '',
      descricao: '',
      contextoAplicacao: '',
      recursosNecessarios: '',
      custoMedio: '',
      prazoTypico: '',
      indicacoes: '',
      contraindicacoes: '',
      materiaisApoio: ''
    });
  }, []);

  const handleFecharNovoTemplate = useCallback(() => {
    setModalNovoTemplate(false);
  }, []);

  const handleSalvarNovoTemplate = useCallback(async () => {
    if (!montadoRef.current) return;

    // Validações básicas
    if (!novoTemplate.nome.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }
    if (!novoTemplate.descricao.trim()) {
      toast.error('Descrição é obrigatória');
      return;
    }
    if (!novoTemplate.custoMedio || isNaN(Number(novoTemplate.custoMedio))) {
      toast.error('Custo médio deve ser um número válido');
      return;
    }
    if (!novoTemplate.prazoTypico || isNaN(Number(novoTemplate.prazoTypico))) {
      toast.error('Prazo típico deve ser um número válido');
      return;
    }

    setSalvandoTemplate(true);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setSalvandoTemplate(false);
        toast.error('Tempo excedido ao criar template. Tente novamente.');
      }
    }, 8000);

    try {
      const templateData = {
        nome: novoTemplate.nome.trim(),
        categoria: novoTemplate.categoria,
        subcategoria: novoTemplate.subcategoria.trim(),
        descricao: novoTemplate.descricao.trim(),
        contextoAplicacao: novoTemplate.contextoAplicacao.trim(),
        recursosNecessarios: novoTemplate.recursosNecessarios.split('\n').filter(r => r.trim()),
        custoMedio: Number(novoTemplate.custoMedio),
        prazoTypico: Number(novoTemplate.prazoTypico),
        taxaSucessoHistorica: 0, // Inicia sem histórico
        indicacoes: novoTemplate.indicacoes.split('\n').filter(i => i.trim()),
        contraindicacoes: novoTemplate.contraindicacoes.split('\n').filter(c => c.trim()),
        materiaisApoio: novoTemplate.materiaisApoio.split('\n').filter(m => m.trim()),
        criadoPor: perfilUsuario.nome
      };

      await apiMockBiblioteca.criarTemplate(templateData);
      if (montadoRef.current) {
        toast.success('Template criado com sucesso');
        handleFecharNovoTemplate();
        carregarTemplates();
      }
    } catch (error) {
      console.error('Erro ao criar template:', error);
      if (montadoRef.current) {
        toast.error('Falha ao criar template. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setSalvandoTemplate(false);
      }
    }
  }, [novoTemplate, perfilUsuario.nome, handleFecharNovoTemplate, carregarTemplates]);

  // Handler para usar template
  const handleUsarTemplate = useCallback(async (templateId: string, templateNome: string) => {
    if (!montadoRef.current) return;

    setUsandoTemplate(templateId);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setUsandoTemplate(null);
        toast.error('Tempo excedido ao usar template. Tente novamente.');
      }
    }, 5000);

    try {
      await apiMockBiblioteca.usarTemplate(templateId);
      if (montadoRef.current) {
        toast.success(`Template "${templateNome}" adicionado ao plano`);
        // Aqui seria redirecionado para criação de plano com template
      }
    } catch (error) {
      console.error('Erro ao usar template:', error);
      if (montadoRef.current) {
        toast.error('Falha ao usar template. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setUsandoTemplate(null);
      }
    }
  }, []);

  // Handler para recarregar
  const handleRecarregar = useCallback(() => {
    carregarTemplates();
  }, [carregarTemplates]);

  // Renderizar loading
  if (carregando) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Renderizar erro
  if (!carregando && erro) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
        <LucideIcons.AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Erro ao carregar biblioteca</h3>
        <p className="text-gray-700 mb-4">{erro}</p>
        <Button onClick={handleRecarregar}>
          <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Biblioteca de Ações de Retenção</CardTitle>
          <CardDescription>
            Explore templates testados e avaliados pela comunidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="busca">Buscar</Label>
              <div className="relative">
                <LucideIcons.Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="busca"
                  placeholder="Nome ou descrição..."
                  value={filtros.termo}
                  onChange={(e) => handleFiltroChange('termo', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div>
              <Label>Categoria</Label>
              <Select value={filtros.categoria} onValueChange={(valor) => handleFiltroChange('categoria', valor)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                  <SelectItem value="remuneracao">Remuneração</SelectItem>
                  <SelectItem value="flexibilidade">Flexibilidade</SelectItem>
                  <SelectItem value="reconhecimento">Reconhecimento</SelectItem>
                  <SelectItem value="oportunidades">Oportunidades</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Efetividade</Label>
              <Select value={filtros.efetividade} onValueChange={(valor) => handleFiltroChange('efetividade', valor)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="alta">Alta (80%+)</SelectItem>
                  <SelectItem value="media">Média (60-79%)</SelectItem>
                  <SelectItem value="baixa">Baixa (&lt;60%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Custo</Label>
              <Select value={filtros.custo} onValueChange={(valor) => handleFiltroChange('custo', valor)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="baixo">Baixo (até R$ 1K)</SelectItem>
                  <SelectItem value="medio">Médio (R$ 1-5K)</SelectItem>
                  <SelectItem value="alto">Alto (R$ 5K+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={limparFiltros}
                disabled={!filtrosAplicados}
                className="w-full"
              >
                <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header de resultados */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Templates Disponíveis ({templates.length})
          </h2>
          {filtrosAplicados && (
            <p className="text-sm text-gray-500">
              Filtros aplicados • {templates.length} resultado{templates.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        {isPerfilEstrategico && (
          <Button onClick={handleAbrirNovoTemplate}>
            <LucideIcons.Plus className="mr-2 h-4 w-4" />
            Novo Template
          </Button>
        )}
      </div>

      {/* Grid de templates */}
      {templates.length === 0 ? (
        <div className="text-center py-16">
          <LucideIcons.BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-medium mb-2">Nenhum template encontrado</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            {filtrosAplicados 
              ? 'Nenhum template corresponde aos filtros aplicados. Tente ajustar os critérios.'
              : 'A biblioteca está vazia. Comece criando o primeiro template.'
            }
          </p>
          
          {filtrosAplicados ? (
            <Button onClick={limparFiltros} variant="outline">
              <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          ) : (
            isPerfilEstrategico && (
              <Button onClick={handleAbrirNovoTemplate}>
                <LucideIcons.Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Template
              </Button>
            )
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 line-clamp-2">{template.nome}</CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={`text-xs ${getCorCategoria(template.categoria)}`}>
                        {getLabelCategoria(template.categoria)}
                      </Badge>
                      {template.subcategoria && (
                        <Badge variant="outline" className="text-xs">
                          {template.subcategoria}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-sm">
                    <LucideIcons.Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{template.avaliacaoMedia.toFixed(1)}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm line-clamp-3">
                  {template.descricao}
                </p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Efetividade:</span>
                    <div className={`font-semibold ${getCorEfetividade(template.taxaSucessoHistorica)}`}>
                      {template.taxaSucessoHistorica}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Custo médio:</span>
                    <div className="font-semibold text-green-600">
                      {formatarMoeda(template.custoMedio)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Prazo:</span>
                    <div className="font-semibold">
                      {template.prazoTypico} dias
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Uso:</span>
                    <div className="font-semibold">
                      {template.vezesUtilizada}x
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAbrirDetalhes(template)}
                  >
                    <LucideIcons.Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  
                  <Button 
                    size="sm"
                    onClick={() => handleUsarTemplate(template.id, template.nome)}
                    disabled={usandoTemplate === template.id}
                  >
                    {usandoTemplate === template.id ? (
                      <LucideIcons.Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <LucideIcons.Plus className="h-4 w-4 mr-1" />
                    )}
                    Usar
                  </Button>
                  
                  <Button 
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAbrirAvaliacao(template.id, template.nome)}
                  >
                    <LucideIcons.MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de detalhes */}
      <Dialog open={modalDetalhes.show} onOpenChange={(open) => !open && handleFecharDetalhes()}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {modalDetalhes.template && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{modalDetalhes.template.nome}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={`text-xs ${getCorCategoria(modalDetalhes.template.categoria)}`}>
                      {getLabelCategoria(modalDetalhes.template.categoria)}
                    </Badge>
                    {modalDetalhes.template.subcategoria && (
                      <Badge variant="outline" className="text-xs">
                        {modalDetalhes.template.subcategoria}
                      </Badge>
                    )}
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      Criado por {modalDetalhes.template.criadoPor}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Métricas principais */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getCorEfetividade(modalDetalhes.template.taxaSucessoHistorica)}`}>
                      {modalDetalhes.template.taxaSucessoHistorica}%
                    </div>
                    <div className="text-sm text-gray-500">Efetividade</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatarMoeda(modalDetalhes.template.custoMedio)}
                    </div>
                    <div className="text-sm text-gray-500">Custo Médio</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {modalDetalhes.template.prazoTypico}
                    </div>
                    <div className="text-sm text-gray-500">Dias</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {modalDetalhes.template.vezesUtilizada}
                    </div>
                    <div className="text-sm text-gray-500">Utilizações</div>
                  </div>
                </div>
                
                {/* Descrição e contexto */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Descrição</h4>
                    <p className="text-gray-700">{modalDetalhes.template.descricao}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Contexto de Aplicação</h4>
                    <p className="text-gray-700">{modalDetalhes.template.contextoAplicacao}</p>
                  </div>
                </div>
                
                {/* Recursos necessários */}
                <div>
                  <h4 className="font-semibold mb-2">Recursos Necessários</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {modalDetalhes.template.recursosNecessarios.map((recurso, index) => (
                      <li key={index} className="text-gray-700">{recurso}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Indicações e contraindicações */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2 text-green-700">Indicações</h4>
                    <ul className="space-y-1">
                      {modalDetalhes.template.indicacoes.map((indicacao, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <LucideIcons.CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{indicacao}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2 text-red-700">Contraindicações</h4>
                    <ul className="space-y-1">
                      {modalDetalhes.template.contraindicacoes.map((contraindicacao, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <LucideIcons.XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{contraindicacao}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Materiais de apoio */}
                <div>
                  <h4 className="font-semibold mb-2">Materiais de Apoio</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {modalDetalhes.template.materiaisApoio.map((material, index) => (
                      <li key={index} className="text-gray-700">{material}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Avaliações */}
                {modalDetalhes.template.avaliacoes.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Avaliações Recentes</h4>
                    <div className="space-y-3">
                      {modalDetalhes.template.avaliacoes.slice(0, 3).map((avaliacao, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{avaliacao.usuario}</span>
                            <div className="flex items-center space-x-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <LucideIcons.Star 
                                  key={i}
                                  className={`h-4 w-4 ${i < avaliacao.nota ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{avaliacao.comentario}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatarData(avaliacao.data)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={handleFecharDetalhes}>
                  Fechar
                </Button>
                <Button onClick={() => {
                  const template = modalDetalhes.template!;
                  handleFecharDetalhes();
                  handleUsarTemplate(template.id, template.nome);
                }}>
                  <LucideIcons.Plus className="mr-2 h-4 w-4" />
                  Usar Template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de avaliação */}
      <Dialog open={modalAvaliacao.show} onOpenChange={(open) => !open && handleFecharAvaliacao()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliar Template</DialogTitle>
            <DialogDescription>
              {modalAvaliacao.templateNome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nota (1-5)</Label>
              <div className="flex items-center space-x-2 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDadosAvaliacao(prev => ({ ...prev, nota: i + 1 }))}
                    className={`p-1 rounded hover:bg-gray-100 transition-colors`}
                  >
                    <LucideIcons.Star 
                      className={`h-6 w-6 ${i < dadosAvaliacao.nota ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {dadosAvaliacao.nota} estrela{dadosAvaliacao.nota !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div>
              <Label>Comentário</Label>
              <Textarea
                placeholder="Compartilhe sua experiência com este template..."
                value={dadosAvaliacao.comentario}
                onChange={(e) => setDadosAvaliacao(prev => ({ ...prev, comentario: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleFecharAvaliacao}
              disabled={salvandoAvaliacao}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarAvaliacao}
              disabled={salvandoAvaliacao || !dadosAvaliacao.comentario.trim()}
            >
              {salvandoAvaliacao ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Enviar Avaliação'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de novo template */}
      <Dialog open={modalNovoTemplate} onOpenChange={(open) => !open && handleFecharNovoTemplate()}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Template</DialogTitle>
            <DialogDescription>
              Adicione um novo template de ação à biblioteca
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome do Template</Label>
                <Input
                  placeholder="Ex: Conversa de Desenvolvimento..."
                  value={novoTemplate.nome}
                  onChange={(e) => setNovoTemplate(prev => ({ ...prev, nome: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>Categoria</Label>
                <Select 
                  value={novoTemplate.categoria} 
                  onValueChange={(valor) => setNovoTemplate(prev => ({ ...prev, categoria: valor }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                    <SelectItem value="remuneracao">Remuneração</SelectItem>
                    <SelectItem value="flexibilidade">Flexibilidade</SelectItem>
                    <SelectItem value="reconhecimento">Reconhecimento</SelectItem>
                    <SelectItem value="oportunidades">Oportunidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Subcategoria</Label>
                <Input
                  placeholder="Ex: mentoring, projetos..."
                  value={novoTemplate.subcategoria}
                  onChange={(e) => setNovoTemplate(prev => ({ ...prev, subcategoria: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>Custo Médio (R$)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={novoTemplate.custoMedio}
                  onChange={(e) => setNovoTemplate(prev => ({ ...prev, custoMedio: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>Prazo Típico (dias)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={novoTemplate.prazoTypico}
                  onChange={(e) => setNovoTemplate(prev => ({ ...prev, prazoTypico: e.target.value }))}
                />
              </div>
            </div>
            
            <div>
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descreva o que é esta ação e como funciona..."
                value={novoTemplate.descricao}
                onChange={(e) => setNovoTemplate(prev => ({ ...prev, descricao: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div>
              <Label>Contexto de Aplicação</Label>
              <Textarea
                placeholder="Quando e para quem esta ação é mais efetiva..."
                value={novoTemplate.contextoAplicacao}
                onChange={(e) => setNovoTemplate(prev => ({ ...prev, contextoAplicacao: e.target.value }))}
                rows={2}
              />
            </div>
            
            <div>
              <Label>Recursos Necessários (um por linha)</Label>
              <Textarea
                placeholder="Tempo do gestor&#10;Orçamento de treinamento&#10;Aprovação diretoria"
                value={novoTemplate.recursosNecessarios}
                onChange={(e) => setNovoTemplate(prev => ({ ...prev, recursosNecessarios: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Indicações (uma por linha)</Label>
                <Textarea
                  placeholder="Colaboradores de alto potencial&#10;Falta de perspectiva de carreira"
                  value={novoTemplate.indicacoes}
                  onChange={(e) => setNovoTemplate(prev => ({ ...prev, indicacoes: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Contraindicações (uma por linha)</Label>
                <Textarea
                  placeholder="Período probatório&#10;Problemas de performance"
                  value={novoTemplate.contraindicacoes}
                  onChange={(e) => setNovoTemplate(prev => ({ ...prev, contraindicacoes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            
            <div>
              <Label>Materiais de Apoio (um por linha)</Label>
              <Textarea
                placeholder="Roteiro de conversa&#10;Template de plano&#10;Guia de implementação"
                value={novoTemplate.materiaisApoio}
                onChange={(e) => setNovoTemplate(prev => ({ ...prev, materiaisApoio: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleFecharNovoTemplate}
              disabled={salvandoTemplate}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarNovoTemplate}
              disabled={salvandoTemplate || !novoTemplate.nome.trim() || !novoTemplate.descricao.trim()}
            >
              {salvandoTemplate ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Template'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}