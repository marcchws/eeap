'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'
import { toast, Toaster } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

import TimelineSection from './timeline-section'
import FriccoesSection from './friccoes-section'
import MilestonesSection from './milestones-section'
import RelatoriosSection from './relatorios-section'

// Tipos e interfaces
interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  data_admissao: string;
  status: 'ativo' | 'inativo';
  score_satisfacao: number;
  score_risco: number;
}

interface FiltrosGlobais {
  colaborador_id: string;
  departamento: string;
  periodo_inicio: string;
  periodo_fim: string;
  tipo_evento: string;
}

// API Mock com todas as operações necessárias
const apiMock = {
  // Colaboradores
  buscarColaboradores: async (termo: string = '', departamento: string = 'todos') => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const colaboradores: Colaborador[] = [
      {
        id: '1',
        nome: 'Ana Silva Santos',
        cargo: 'Analista de RH Senior',
        departamento: 'Recursos Humanos',
        data_admissao: '2022-03-15',
        status: 'ativo',
        score_satisfacao: 85,
        score_risco: 25
      },
      {
        id: '2',
        nome: 'Carlos Eduardo Lima',
        cargo: 'Desenvolvedor Full Stack',
        departamento: 'Tecnologia',
        data_admissao: '2021-08-20',
        status: 'ativo',
        score_satisfacao: 72,
        score_risco: 65
      },
      {
        id: '3',
        nome: 'Mariana Costa Oliveira',
        cargo: 'Coordenadora de Marketing',
        departamento: 'Marketing',
        data_admissao: '2020-11-10',
        status: 'ativo',
        score_satisfacao: 90,
        score_risco: 15
      },
      {
        id: '4',
        nome: 'Roberto Fernandes',
        cargo: 'Analista Financeiro',
        departamento: 'Financeiro',
        data_admissao: '2023-01-25',
        status: 'ativo',
        score_satisfacao: 68,
        score_risco: 75
      },
      {
        id: '5',
        nome: 'Julia Pereira Martins',
        cargo: 'Especialista em Vendas',
        departamento: 'Comercial',
        data_admissao: '2022-07-08',
        status: 'ativo',
        score_satisfacao: 88,
        score_risco: 20
      }
    ];

    let resultados = colaboradores;

    if (termo) {
      resultados = resultados.filter(c => 
        c.nome.toLowerCase().includes(termo.toLowerCase()) ||
        c.cargo.toLowerCase().includes(termo.toLowerCase())
      );
    }

    if (departamento !== 'todos') {
      resultados = resultados.filter(c => c.departamento === departamento);
    }

    return resultados;
  },

  obterDepartamentos: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      'Recursos Humanos',
      'Tecnologia', 
      'Marketing',
      'Financeiro',
      'Comercial',
      'Operações'
    ];
  },

  obterColaboradorPorId: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const colaboradores = await apiMock.buscarColaboradores();
    return colaboradores.find(c => c.id === id) || null;
  }
};

// Funções utilitárias defensivas
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

const calcularTempoEmpresa = (dataAdmissao: string | undefined): string => {
  if (!dataAdmissao) return 'N/A';
  
  try {
    const admissao = new Date(dataAdmissao);
    const agora = new Date();
    
    if (isNaN(admissao.getTime())) {
      return 'Data inválida';
    }
    
    const diffMs = agora.getTime() - admissao.getTime();
    const diffMeses = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
    
    if (diffMeses < 12) {
      return `${diffMeses} ${diffMeses === 1 ? 'mês' : 'meses'}`;
    }
    
    const anos = Math.floor(diffMeses / 12);
    const mesesRestantes = diffMeses % 12;
    
    if (mesesRestantes === 0) {
      return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
    }
    
    return `${anos}a ${mesesRestantes}m`;
  } catch (error) {
    console.error('Erro ao calcular tempo:', error);
    return 'Erro de cálculo';
  }
};

const getCorScore = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getCorRisco = (risco: number): string => {
  if (risco <= 30) return 'text-green-600';
  if (risco <= 60) return 'text-yellow-600';
  return 'text-red-600';
};

export default function EmployeeJourneyAnalytics() {
  // Estados principais
  const [abaSelecionada, setAbaSelecionada] = useState<'timeline' | 'friccoes' | 'milestones' | 'relatorios'>('timeline');
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<Colaborador | null>(null);
  const [filtrosGlobais, setFiltrosGlobais] = useState<FiltrosGlobais>({
    colaborador_id: '',
    departamento: 'todos',
    periodo_inicio: '',
    periodo_fim: '',
    tipo_evento: 'todos'
  });

  // Estados de busca de colaboradores
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [departamentos, setDepartamentos] = useState<string[]>([]);
  const [carregandoColaboradores, setCarregandoColaboradores] = useState(false);
  const [carregandoDepartamentos, setCarregandoDepartamentos] = useState(true);
  const [erroColaboradores, setErroColaboradores] = useState<string | null>(null);

  // Estados de interface
  const [mostrarBusca, setMostrarBusca] = useState(false);

  // Ref para controle de montagem
  const montadoRef = useRef(true);

  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    carregarDepartamentos();
    
    return () => {
      montadoRef.current = false;
    };
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
      const deps = await apiMock.obterDepartamentos();
      if (montadoRef.current) {
        setDepartamentos(deps);
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

  // Buscar colaboradores
  const buscarColaboradores = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoColaboradores(true);
    setErroColaboradores(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoColaboradores(false);
        setErroColaboradores('Tempo excedido. Tente novamente.');
      }
    }, 5000);
    
    try {
      const resultado = await apiMock.buscarColaboradores(termoBusca, filtrosGlobais.departamento);
      if (montadoRef.current) {
        setColaboradores(resultado);
        if (resultado.length === 0) {
          setErroColaboradores('Nenhum colaborador encontrado com os filtros aplicados');
        }
      }
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
      if (montadoRef.current) {
        setErroColaboradores('Falha ao buscar colaboradores. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoColaboradores(false);
      }
    }
  }, [termoBusca, filtrosGlobais.departamento]);

  // Efeito para buscar colaboradores quando filtros mudam
  useEffect(() => {
    if (mostrarBusca) {
      const timer = setTimeout(() => {
        buscarColaboradores();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [mostrarBusca, termoBusca, filtrosGlobais.departamento, buscarColaboradores]);

  // Selecionar colaborador
  const handleSelecionarColaborador = useCallback(async (colaborador: Colaborador) => {
    setColaboradorSelecionado(colaborador);
    setFiltrosGlobais(prev => ({ ...prev, colaborador_id: colaborador.id }));
    setMostrarBusca(false);
    toast.success(`Colaborador ${colaborador.nome} selecionado`);
  }, []);

  // Limpar seleção de colaborador
  const handleLimparSelecao = useCallback(() => {
    setColaboradorSelecionado(null);
    setFiltrosGlobais(prev => ({ ...prev, colaborador_id: '' }));
    setTermoBusca('');
    setColaboradores([]);
    toast.info('Seleção de colaborador removida');
  }, []);

  // Abrir busca de colaboradores
  const handleAbrirBusca = useCallback(() => {
    setMostrarBusca(true);
    setTermoBusca('');
    setColaboradores([]);
    setErroColaboradores(null);
  }, []);

  // Alterar filtro de departamento
  const handleFiltroChange = useCallback((campo: keyof FiltrosGlobais, valor: string) => {
    setFiltrosGlobais(prev => ({ ...prev, [campo]: valor }));
  }, []);

  // Mudar aba
  const handleMudarAba = useCallback((aba: 'timeline' | 'friccoes' | 'milestones' | 'relatorios') => {
    setAbaSelecionada(aba);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Toaster position="bottom-right" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Employee Journey Analytics</h1>
          <p className="text-gray-600 mt-1">
            Mapeamento e análise da jornada completa do colaborador
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="px-3 py-1">
            <LucideIcons.Users className="mr-1 h-4 w-4" />
            15.000+ Colaboradores
          </Badge>
        </div>
      </div>

      {/* Filtros Globais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <LucideIcons.Filter className="mr-2 h-5 w-5" />
            Filtros Globais
          </CardTitle>
          <CardDescription>
            Configure os filtros para análise da jornada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Seleção de Colaborador */}
            <div className="space-y-2">
              <Label>Colaborador</Label>
              {colaboradorSelecionado ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-green-900">{colaboradorSelecionado.nome}</p>
                    <p className="text-sm text-green-700">{colaboradorSelecionado.cargo}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-green-600">
                        Satisfação: <span className={getCorScore(colaboradorSelecionado.score_satisfacao)}>
                          {colaboradorSelecionado.score_satisfacao}%
                        </span>
                      </span>
                      <span className="text-xs text-green-600">
                        Risco: <span className={getCorRisco(colaboradorSelecionado.score_risco)}>
                          {colaboradorSelecionado.score_risco}%
                        </span>
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLimparSelecao}
                  >
                    <LucideIcons.X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleAbrirBusca}
                  className="w-full justify-start"
                >
                  <LucideIcons.Search className="mr-2 h-4 w-4" />
                  Buscar colaborador...
                </Button>
              )}
            </div>

            {/* Departamento */}
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                value={filtrosGlobais.departamento}
                onValueChange={valor => handleFiltroChange('departamento', valor)}
                disabled={carregandoDepartamentos}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Departamentos</SelectItem>
                  {departamentos.map(dep => (
                    <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="space-y-2">
              <Label>Período de Análise</Label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={filtrosGlobais.periodo_inicio}
                  onChange={e => handleFiltroChange('periodo_inicio', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={filtrosGlobais.periodo_fim}
                  onChange={e => handleFiltroChange('periodo_fim', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Busca de Colaboradores */}
      {mostrarBusca && (
        <Card className="fixed inset-0 z-50 m-4 md:max-w-2xl md:mx-auto md:mt-20 md:h-fit bg-white shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Selecionar Colaborador</CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setMostrarBusca(false)}
              >
                <LucideIcons.X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Busca */}
            <div className="relative">
              <LucideIcons.Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Nome ou cargo do colaborador..."
                value={termoBusca}
                onChange={e => setTermoBusca(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {/* Resultados */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {carregandoColaboradores && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mr-3"></div>
                  <span className="text-gray-500">Buscando colaboradores...</span>
                </div>
              )}

              {!carregandoColaboradores && erroColaboradores && (
                <div className="text-center py-8">
                  <LucideIcons.AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-600">{erroColaboradores}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={buscarColaboradores}
                    className="mt-2"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              )}

              {!carregandoColaboradores && !erroColaboradores && colaboradores.map(colaborador => (
                <div
                  key={colaborador.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSelecionarColaborador(colaborador)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{colaborador.nome}</h3>
                      <p className="text-sm text-gray-600">{colaborador.cargo}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {colaborador.departamento}
                        </span>
                        <span className="text-xs text-gray-500">
                          Desde {formatarData(colaborador.data_admissao)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Tempo: {calcularTempoEmpresa(colaborador.data_admissao)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getCorScore(colaborador.score_satisfacao)}`}>
                        {colaborador.score_satisfacao}% satisfação
                      </div>
                      <div className={`text-sm ${getCorRisco(colaborador.score_risco)}`}>
                        {colaborador.score_risco}% risco
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overlay para modal */}
      {mostrarBusca && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMostrarBusca(false)}
        />
      )}

      {/* Abas Principais */}
      <Tabs value={abaSelecionada} onValueChange={handleMudarAba}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline" className="flex items-center">
            <LucideIcons.Clock className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="friccoes" className="flex items-center">
            <LucideIcons.AlertTriangle className="mr-2 h-4 w-4" />
            Fricções
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center">
            <LucideIcons.Trophy className="mr-2 h-4 w-4" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center">
            <LucideIcons.BarChart3 className="mr-2 h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-6">
          <TimelineSection 
            colaboradorSelecionado={colaboradorSelecionado}
            filtrosGlobais={filtrosGlobais}
          />
        </TabsContent>

        <TabsContent value="friccoes" className="mt-6">
          <FriccoesSection 
            colaboradorSelecionado={colaboradorSelecionado}
            filtrosGlobais={filtrosGlobais}
          />
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <MilestonesSection 
            colaboradorSelecionado={colaboradorSelecionado}
            filtrosGlobais={filtrosGlobais}
          />
        </TabsContent>

        <TabsContent value="relatorios" className="mt-6">
          <RelatoriosSection 
            colaboradorSelecionado={colaboradorSelecionado}
            filtrosGlobais={filtrosGlobais}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}