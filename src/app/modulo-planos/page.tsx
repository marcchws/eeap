'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast, Toaster } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// Importação das seções
import DashboardPlanos from './dashboard'
import CasosAtivos from './casos-ativos'
import BibliotecaAcoes from './biblioteca'
import RelatoriosEfetividade from './relatorios'

// Tipos principais
interface PerfilUsuario {
  id: string;
  nome: string;
  tipo: 'rh_estrategico' | 'rh_operacional' | 'gestor' | 'diretor';
  permissoes: string[];
}

interface MetricasGerais {
  casosAtivos: number;
  planosExecutados: number;
  taxaSucesso: number;
  roiMedio: number;
  casosUrgentes: number;
  aprovacoePendente: number;
}

// API Mock para dados gerais
const apiMockGeral = {
  obterPerfilUsuario: async (): Promise<PerfilUsuario> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      id: 'user_001',
      nome: 'Ana Silva',
      tipo: 'rh_operacional',
      permissoes: ['criar_planos', 'gerenciar_casos', 'aprovar_baixo_valor']
    };
  },

  obterMetricasGerais: async (): Promise<MetricasGerais> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      casosAtivos: 47,
      planosExecutados: 234,
      taxaSucesso: 73.5,
      roiMedio: 325,
      casosUrgentes: 8,
      aprovacoePendente: 12
    };
  }
};

export default function ModuloPlanos() {
  // Estados principais
  const [abaSelecionada, setAbaSelecionada] = useState<'dashboard' | 'casos' | 'biblioteca' | 'relatorios'>('dashboard');
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(null);
  const [metricas, setMetricas] = useState<MetricasGerais | null>(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);
  const [carregandoMetricas, setCarregandoMetricas] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Estados por aba
  const [abaDashboardCarregada, setAbaDashboardCarregada] = useState(false);
  const [abaCasosCarregada, setAbaCasosCarregada] = useState(false);
  const [abaBibliotecaCarregada, setAbaBibliotecaCarregada] = useState(false);
  const [abaRelatoriosCarregada, setAbaRelatoriosCarregada] = useState(false);

  // Ref de controle
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  const carregarDadosIniciais = useCallback(async () => {
    if (!montadoRef.current) return;

    setCarregandoPerfil(true);
    setCarregandoMetricas(true);
    setErro(null);

    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoPerfil(false);
        setCarregandoMetricas(false);
        setErro('Tempo de carregamento excedido. Tente novamente.');
      }
    }, 8000);

    try {
      const [perfilData, metricasData] = await Promise.all([
        apiMockGeral.obterPerfilUsuario(),
        apiMockGeral.obterMetricasGerais()
      ]);

      if (montadoRef.current) {
        setPerfilUsuario(perfilData);
        setMetricas(metricasData);
        setAbaDashboardCarregada(true); // Dashboard é carregada por padrão
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      if (montadoRef.current) {
        setErro('Falha ao carregar dados do sistema. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoPerfil(false);
        setCarregandoMetricas(false);
      }
    }
  }, []);

  // Handler para mudança de aba
  const handleMudarAba = useCallback((aba: 'dashboard' | 'casos' | 'biblioteca' | 'relatorios') => {
    setAbaSelecionada(aba);
    
    // Marcar aba como carregada quando acessada
    setTimeout(() => {
      if (montadoRef.current) {
        switch (aba) {
          case 'casos':
            setAbaCasosCarregada(true);
            break;
          case 'biblioteca':
            setAbaBibliotecaCarregada(true);
            break;
          case 'relatorios':
            setAbaRelatoriosCarregada(true);
            break;
        }
      }
    }, 0);
  }, []);

  // Verificar permissões
  const temPermissao = useCallback((permissao: string): boolean => {
    return perfilUsuario?.permissoes.includes(permissao) || false;
  }, [perfilUsuario]);

  // Verificar se é perfil estratégico
  const isPerfilEstrategico = useMemo(() => {
    return perfilUsuario?.tipo === 'rh_estrategico' || perfilUsuario?.tipo === 'diretor';
  }, [perfilUsuario]);

  // Handler para recarregar
  const handleRecarregar = useCallback(() => {
    carregarDadosIniciais();
  }, [carregarDadosIniciais]);

  // Renderizar loading inicial
  if (carregandoPerfil || carregandoMetricas) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="bottom-right" />
        <div className="flex justify-center items-center py-32">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"></div>
            <h3 className="text-lg font-medium mb-2">Carregando Módulo de Planos de Ação</h3>
            <p className="text-gray-500">Inicializando sistema...</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar erro
  if (!carregandoPerfil && !carregandoMetricas && erro) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="bottom-right" />
        <div className="flex justify-center items-center py-32">
          <div className="bg-red-50 border border-red-200 p-8 rounded-lg text-center max-w-md">
            <LucideIcons.AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Erro ao Carregar Sistema</h3>
            <p className="text-gray-700 mb-6">{erro}</p>
            <Button onClick={handleRecarregar}>
              <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="bottom-right" />
      
      {/* Header do módulo */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Planos de Ação</h1>
                <p className="text-gray-600">
                  Gestão inteligente de retenção e engajamento • {perfilUsuario?.nome}
                </p>
              </div>
              
              {/* Métricas de destaque */}
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{metricas?.casosAtivos}</div>
                  <div className="text-sm text-gray-500">Casos Ativos</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metricas?.taxaSucesso}%</div>
                  <div className="text-sm text-gray-500">Taxa Sucesso</div>
                </div>
                
                {metricas?.casosUrgentes && metricas.casosUrgentes > 0 && (
                  <div className="text-center">
                    <Badge variant="destructive" className="text-sm">
                      {metricas.casosUrgentes} Urgentes
                    </Badge>
                  </div>
                )}
                
                {metricas?.aprovacoePendente && metricas.aprovacoePendente > 0 && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-sm">
                      {metricas.aprovacoePendente} Aprovações
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com abas */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={abaSelecionada} onValueChange={handleMudarAba} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <LucideIcons.BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="casos" className="flex items-center space-x-2">
              <LucideIcons.Users className="h-4 w-4" />
              <span>Casos Ativos</span>
              {metricas?.casosUrgentes && metricas.casosUrgentes > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {metricas.casosUrgentes}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="biblioteca" className="flex items-center space-x-2">
              <LucideIcons.BookOpen className="h-4 w-4" />
              <span>Biblioteca</span>
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center space-x-2">
              <LucideIcons.TrendingUp className="h-4 w-4" />
              <span>Relatórios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {abaDashboardCarregada && perfilUsuario && metricas ? (
              <DashboardPlanos 
                perfilUsuario={perfilUsuario}
                metricas={metricas}
              />
            ) : (
              <div className="flex justify-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="casos" className="space-y-6">
            {abaCasosCarregada && perfilUsuario ? (
              <CasosAtivos 
                perfilUsuario={perfilUsuario}
                temPermissao={temPermissao}
              />
            ) : (
              <div className="flex justify-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="biblioteca" className="space-y-6">
            {abaBibliotecaCarregada && perfilUsuario ? (
              <BibliotecaAcoes 
                perfilUsuario={perfilUsuario}
                isPerfilEstrategico={isPerfilEstrategico}
              />
            ) : (
              <div className="flex justify-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="relatorios" className="space-y-6">
            {abaRelatoriosCarregada && perfilUsuario ? (
              <RelatoriosEfetividade 
                perfilUsuario={perfilUsuario}
                isPerfilEstrategico={isPerfilEstrategico}
              />
            ) : (
              <div className="flex justify-center py-16">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}