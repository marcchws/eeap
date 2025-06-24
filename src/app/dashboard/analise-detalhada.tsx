'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Tipos
interface Usuario {
  id: string;
  perfil: 'executivo' | 'chro' | 'gestor';
  departamentos_acesso: string[];
}

interface Filtros {
  departamento: string;
  localizacao: string;
  periodo: string;
  nivel_hierarquico: string;
  faixa_etaria: string;
}

interface DadosTendencia {
  periodo: string;
  enps: number;
  turnover: number;
  engajamento: number;
  colaboradores_risco: number;
}

interface HeatmapDepartamento {
  id: string;
  nome: string;
  satisfacao_geral: number;
  beneficios: number;
  lideranca: number;
  crescimento: number;
  ambiente: number;
  remuneracao: number;
}

interface Props {
  usuario?: Usuario;
}

// API Mock
const apiMock = {
  obterDadosTendencia: async (filtros: Filtros): Promise<DadosTendencia[]> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return [
      { periodo: 'Jan/24', enps: 35, turnover: 18.2, engajamento: 6.5, colaboradores_risco: 62 },
      { periodo: 'Fev/24', enps: 38, turnover: 17.1, engajamento: 6.7, colaboradores_risco: 58 },
      { periodo: 'Mar/24', enps: 40, turnover: 16.8, engajamento: 6.9, colaboradores_risco: 55 },
      { periodo: 'Abr/24', enps: 39, turnover: 15.5, engajamento: 7.1, colaboradores_risco: 52 },
      { periodo: 'Mai/24', enps: 41, turnover: 15.2, engajamento: 7.0, colaboradores_risco: 49 },
      { periodo: 'Jun/24', enps: 42, turnover: 14.5, engajamento: 7.2, colaboradores_risco: 47 }
    ];
  },
  
  obterHeatmapSatisfacao: async (filtros: Filtros): Promise<HeatmapDepartamento[]> => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return [
      {
        id: '1',
        nome: 'Produto & Design',
        satisfacao_geral: 8.4,
        beneficios: 8.1,
        lideranca: 8.6,
        crescimento: 8.9,
        ambiente: 8.7,
        remuneracao: 7.8
      },
      {
        id: '2',
        nome: 'Tecnologia',
        satisfacao_geral: 7.2,
        beneficios: 7.8,
        lideranca: 6.9,
        crescimento: 7.5,
        ambiente: 7.4,
        remuneracao: 8.2
      },
      {
        id: '3',
        nome: 'Marketing',
        satisfacao_geral: 6.8,
        beneficios: 7.2,
        lideranca: 6.5,
        crescimento: 6.9,
        ambiente: 7.1,
        remuneracao: 6.4
      },
      {
        id: '4',
        nome: 'RH',
        satisfacao_geral: 7.1,
        beneficios: 8.0,
        lideranca: 7.3,
        crescimento: 6.8,
        ambiente: 7.2,
        remuneracao: 6.9
      },
      {
        id: '5',
        nome: 'Vendas',
        satisfacao_geral: 4.2,
        beneficios: 5.1,
        lideranca: 3.8,
        crescimento: 4.5,
        ambiente: 4.0,
        remuneracao: 5.2
      },
      {
        id: '6',
        nome: 'Financeiro',
        satisfacao_geral: 6.3,
        beneficios: 6.8,
        lideranca: 6.1,
        crescimento: 5.9,
        ambiente: 6.5,
        remuneracao: 7.1
      }
    ];
  }
};

// Funções utilitárias
const obterCorHeatmap = (valor: number): string => {
  if (valor >= 8) return 'bg-green-500';
  if (valor >= 7) return 'bg-green-400';
  if (valor >= 6) return 'bg-yellow-400';
  if (valor >= 5) return 'bg-orange-400';
  if (valor >= 4) return 'bg-red-400';
  return 'bg-red-500';
};

const obterTextoCorHeatmap = (valor: number): string => {
  return valor >= 6 ? 'text-white' : 'text-white';
};

export default function AnaliseDetalhada({ usuario }: Props) {
  // Estados
  const [filtros, setFiltros] = useState<Filtros>({
    departamento: 'todos',
    localizacao: 'todas',
    periodo: 'ultimo_semestre',
    nivel_hierarquico: 'todos',
    faixa_etaria: 'todas'
  });
  
  const [dadosTendencia, setDadosTendencia] = useState<DadosTendencia[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapDepartamento[]>([]);
  const [carregandoTendencia, setCarregandoTendencia] = useState(true);
  const [carregandoHeatmap, setCarregandoHeatmap] = useState(true);
  const [erroTendencia, setErroTendencia] = useState<string | null>(null);
  const [erroHeatmap, setErroHeatmap] = useState<string | null>(null);
  const [abaSelecionada, setAbaSelecionada] = useState<'tendencias' | 'heatmap'>('tendencias');
  
  const montadoRef = useRef(true);
  
  // Inicialização
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);
  
  // Carregar dados de tendência
  const carregarTendencia = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoTendencia(true);
    setErroTendencia(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoTendencia(false);
        setErroTendencia('Tempo excedido ao carregar tendências.');
      }
    }, 6000);
    
    try {
      const dados = await apiMock.obterDadosTendencia(filtros);
      if (montadoRef.current) {
        setDadosTendencia(dados);
      }
    } catch (error) {
      console.error('Erro ao carregar tendência:', error);
      if (montadoRef.current) {
        setErroTendencia('Falha ao carregar dados de tendência.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoTendencia(false);
      }
    }
  }, [filtros]);
  
  // Carregar heatmap
  const carregarHeatmap = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoHeatmap(true);
    setErroHeatmap(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoHeatmap(false);
        setErroHeatmap('Tempo excedido ao carregar heatmap.');
      }
    }, 6000);
    
    try {
      const dados = await apiMock.obterHeatmapSatisfacao(filtros);
      if (montadoRef.current) {
        setHeatmapData(dados);
      }
    } catch (error) {
      console.error('Erro ao carregar heatmap:', error);
      if (montadoRef.current) {
        setErroHeatmap('Falha ao carregar heatmap de satisfação.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoHeatmap(false);
      }
    }
  }, [filtros]);
  
  // Carregar dados ao montar ou mudar filtros
  useEffect(() => {
    carregarTendencia();
    carregarHeatmap();
  }, [carregarTendencia, carregarHeatmap]);
  
  // Handler para mudança de filtros
  const handleFiltroChange = useCallback((campo: keyof Filtros, valor: string) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  }, []);
  
  // Limpar filtros
  const handleLimparFiltros = useCallback(() => {
    setFiltros({
      departamento: 'todos',
      localizacao: 'todas',
      periodo: 'ultimo_semestre',
      nivel_hierarquico: 'todos',
      faixa_etaria: 'todas'
    });
    toast.success('Filtros limpos');
  }, []);
  
  // Verificar se tem filtros aplicados
  const filtrosAplicados = useMemo(() => {
    return filtros.departamento !== 'todos' ||
           filtros.localizacao !== 'todas' ||
           filtros.periodo !== 'ultimo_semestre' ||
           filtros.nivel_hierarquico !== 'todos' ||
           filtros.faixa_etaria !== 'todas';
  }, [filtros]);
  
  // Dados para o gráfico de tendência (simulação)
  const dadosGrafico = useMemo(() => {
    return dadosTendencia.map((item, index) => ({
      ...item,
      x: index,
      maxTurnover: Math.max(...dadosTendencia.map(d => d.turnover)),
      maxEnps: Math.max(...dadosTendencia.map(d => d.enps)),
      maxEngajamento: Math.max(...dadosTendencia.map(d => d.engajamento))
    }));
  }, [dadosTendencia]);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Análise Detalhada</h2>
          <p className="text-gray-600">Análises profundas e tendências históricas</p>
        </div>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LucideIcons.Filter className="h-5 w-5" />
            <span>Filtros de Análise</span>
          </CardTitle>
          <CardDescription>
            Configure os filtros para personalizar as análises
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="departamento">Departamento</Label>
              <Select
                value={filtros.departamento}
                onValueChange={(valor) => handleFiltroChange('departamento', valor)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="vendas">Vendas</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="rh">Recursos Humanos</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="produto">Produto & Design</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="localizacao">Localização</Label>
              <Select
                value={filtros.localizacao}
                onValueChange={(valor) => handleFiltroChange('localizacao', valor)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="sao_paulo">São Paulo</SelectItem>
                  <SelectItem value="rio_janeiro">Rio de Janeiro</SelectItem>
                  <SelectItem value="belo_horizonte">Belo Horizonte</SelectItem>
                  <SelectItem value="remoto">Remoto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="periodo">Período</Label>
              <Select
                value={filtros.periodo}
                onValueChange={(valor) => handleFiltroChange('periodo', valor)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ultimo_mes">Último Mês</SelectItem>
                  <SelectItem value="ultimo_trimestre">Último Trimestre</SelectItem>
                  <SelectItem value="ultimo_semestre">Último Semestre</SelectItem>
                  <SelectItem value="ultimo_ano">Último Ano</SelectItem>
                  <SelectItem value="ultimos_2_anos">Últimos 2 Anos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="nivel">Nível Hierárquico</Label>
              <Select
                value={filtros.nivel_hierarquico}
                onValueChange={(valor) => handleFiltroChange('nivel_hierarquico', valor)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="estagiario">Estagiário</SelectItem>
                  <SelectItem value="junior">Júnior</SelectItem>
                  <SelectItem value="pleno">Pleno</SelectItem>
                  <SelectItem value="senior">Sênior</SelectItem>
                  <SelectItem value="lideranca">Liderança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="faixa_etaria">Faixa Etária</Label>
              <Select
                value={filtros.faixa_etaria}
                onValueChange={(valor) => handleFiltroChange('faixa_etaria', valor)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="18_25">18-25 anos</SelectItem>
                  <SelectItem value="26_35">26-35 anos</SelectItem>
                  <SelectItem value="36_45">36-45 anos</SelectItem>
                  <SelectItem value="46_55">46-55 anos</SelectItem>
                  <SelectItem value="56_mais">56+ anos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filtrosAplicados && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Filtros aplicados</Badge>
                <span className="text-sm text-gray-500">
                  Visualizando dados filtrados
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLimparFiltros}>
                <LucideIcons.X className="mr-2 h-3 w-3" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Análises */}
      <Tabs value={abaSelecionada} onValueChange={setAbaSelecionada}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tendencias" className="flex items-center space-x-2">
            <LucideIcons.TrendingUp className="h-4 w-4" />
            <span>Tendências Temporais</span>
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center space-x-2">
            <LucideIcons.Grid3X3 className="h-4 w-4" />
            <span>Heatmap de Satisfação</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tendencias" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendências das Métricas Principais</CardTitle>
              <CardDescription>
                Evolução temporal dos principais indicadores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {carregandoTendencia ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Carregando gráfico de tendências...</p>
                  </div>
                </div>
              ) : erroTendencia ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <LucideIcons.AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Erro ao Carregar</h3>
                    <p className="text-gray-600 mb-6">{erroTendencia}</p>
                    <Button onClick={carregarTendencia}>Tentar Novamente</Button>
                  </div>
                </div>
              ) : dadosTendencia.length === 0 ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <LucideIcons.BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum Dado</h3>
                    <p className="text-gray-500">Não há dados de tendência para os filtros selecionados.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Gráfico simulado com dados tabulares */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left">Período</th>
                          <th className="border border-gray-200 px-4 py-2 text-center">eNPS</th>
                          <th className="border border-gray-200 px-4 py-2 text-center">Turnover (%)</th>
                          <th className="border border-gray-200 px-4 py-2 text-center">Engajamento</th>
                          <th className="border border-gray-200 px-4 py-2 text-center">Risco</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dadosTendencia.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2 font-medium">
                              {item.periodo}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <span className={`inline-flex px-2 py-1 rounded text-sm ${
                                item.enps >= 50 ? 'bg-green-100 text-green-800' :
                                item.enps >= 0 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.enps}
                              </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <span className={`inline-flex px-2 py-1 rounded text-sm ${
                                item.turnover <= 12 ? 'bg-green-100 text-green-800' :
                                item.turnover <= 20 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.turnover.toFixed(1)}%
                              </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <span className={`inline-flex px-2 py-1 rounded text-sm ${
                                item.engajamento >= 8 ? 'bg-green-100 text-green-800' :
                                item.engajamento >= 6 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.engajamento.toFixed(1)}/10
                              </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                              <span className={`inline-flex px-2 py-1 rounded text-sm ${
                                item.colaboradores_risco <= 30 ? 'bg-green-100 text-green-800' :
                                item.colaboradores_risco <= 50 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.colaboradores_risco}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Resumo das tendências */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="text-center">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">
                          {dadosTendencia[dadosTendencia.length - 1]?.enps || 0}
                        </div>
                        <p className="text-sm text-gray-500">eNPS Atual</p>
                        <div className="flex items-center justify-center mt-2">
                          <LucideIcons.TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-600">+4pts vs Jan</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="text-center">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">
                          {dadosTendencia[dadosTendencia.length - 1]?.turnover.toFixed(1) || '0.0'}%
                        </div>
                        <p className="text-sm text-gray-500">Turnover Atual</p>
                        <div className="flex items-center justify-center mt-2">
                          <LucideIcons.TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-600">-3.7% vs Jan</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="text-center">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-purple-600">
                          {dadosTendencia[dadosTendencia.length - 1]?.engajamento.toFixed(1) || '0.0'}
                        </div>
                        <p className="text-sm text-gray-500">Engajamento</p>
                        <div className="flex items-center justify-center mt-2">
                          <LucideIcons.TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-600">+0.7pts vs Jan</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="text-center">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">
                          {dadosTendencia[dadosTendencia.length - 1]?.colaboradores_risco || 0}
                        </div>
                        <p className="text-sm text-gray-500">Em Risco</p>
                        <div className="flex items-center justify-center mt-2">
                          <LucideIcons.TrendingDown className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-600">-15 vs Jan</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="heatmap" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Heatmap de Satisfação por Departamento</CardTitle>
              <CardDescription>
                Análise detalhada de satisfação por área e dimensão
              </CardDescription>
            </CardHeader>
            <CardContent>
              {carregandoHeatmap ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Carregando heatmap...</p>
                  </div>
                </div>
              ) : erroHeatmap ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <LucideIcons.AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Erro ao Carregar</h3>
                    <p className="text-gray-600 mb-6">{erroHeatmap}</p>
                    <Button onClick={carregarHeatmap}>Tentar Novamente</Button>
                  </div>
                </div>
              ) : heatmapData.length === 0 ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <LucideIcons.Grid3X3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum Dado</h3>
                    <p className="text-gray-500">Não há dados de satisfação para os filtros selecionados.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Legenda */}
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <span>Satisfação:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span>1-4</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-orange-400 rounded"></div>
                      <span>4-5</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                      <span>5-6</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-400 rounded"></div>
                      <span>6-7</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span>8-10</span>
                    </div>
                  </div>
                  
                  {/* Heatmap */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left p-2 font-medium">Departamento</th>
                          <th className="text-center p-2 font-medium">Geral</th>
                          <th className="text-center p-2 font-medium">Benefícios</th>
                          <th className="text-center p-2 font-medium">Liderança</th>
                          <th className="text-center p-2 font-medium">Crescimento</th>
                          <th className="text-center p-2 font-medium">Ambiente</th>
                          <th className="text-center p-2 font-medium">Remuneração</th>
                        </tr>
                      </thead>
                      <tbody>
                        {heatmapData.map((dept) => (
                          <tr key={dept.id}>
                            <td className="p-2 font-medium">{dept.nome}</td>
                            <td className="p-2">
                              <div className={`
                                w-16 h-8 rounded flex items-center justify-center text-sm font-medium mx-auto
                                ${obterCorHeatmap(dept.satisfacao_geral)} ${obterTextoCorHeatmap(dept.satisfacao_geral)}
                              `}>
                                {dept.satisfacao_geral.toFixed(1)}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className={`
                                w-16 h-8 rounded flex items-center justify-center text-sm font-medium mx-auto
                                ${obterCorHeatmap(dept.beneficios)} ${obterTextoCorHeatmap(dept.beneficios)}
                              `}>
                                {dept.beneficios.toFixed(1)}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className={`
                                w-16 h-8 rounded flex items-center justify-center text-sm font-medium mx-auto
                                ${obterCorHeatmap(dept.lideranca)} ${obterTextoCorHeatmap(dept.lideranca)}
                              `}>
                                {dept.lideranca.toFixed(1)}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className={`
                                w-16 h-8 rounded flex items-center justify-center text-sm font-medium mx-auto
                                ${obterCorHeatmap(dept.crescimento)} ${obterTextoCorHeatmap(dept.crescimento)}
                              `}>
                                {dept.crescimento.toFixed(1)}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className={`
                                w-16 h-8 rounded flex items-center justify-center text-sm font-medium mx-auto
                                ${obterCorHeatmap(dept.ambiente)} ${obterTextoCorHeatmap(dept.ambiente)}
                              `}>
                                {dept.ambiente.toFixed(1)}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className={`
                                w-16 h-8 rounded flex items-center justify-center text-sm font-medium mx-auto
                                ${obterCorHeatmap(dept.remuneracao)} ${obterTextoCorHeatmap(dept.remuneracao)}
                              `}>
                                {dept.remuneracao.toFixed(1)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}