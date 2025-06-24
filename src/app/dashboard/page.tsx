'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo, Fragment } from 'react'
import { toast, Toaster } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Importação das seções
import MetricasPrincipais from './metricas-principais'
import AnaliseDetalhada from './analise-detalhada'
import Relatorios from './relatorios'

// Tipos e interfaces
interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'executivo' | 'chro' | 'gestor';
  departamentos_acesso: string[];
}

interface AlertaCritico {
  id: string;
  tipo: 'enps_baixo' | 'turnover_alto' | 'risco_colaboradores';
  titulo: string;
  mensagem: string;
  severidade: 'alta' | 'media' | 'baixa';
  data_criacao: string;
  departamento?: string;
  valor_atual: number;
  valor_limite: number;
}

interface DadosGlobais {
  usuario: Usuario;
  alertas_criticos: AlertaCritico[];
  ultima_atualizacao: string;
  status_integracao: 'online' | 'offline' | 'erro';
}

// API Mock
const apiMock = {
  obterDadosGlobais: async (): Promise<DadosGlobais> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      usuario: {
        id: '1',
        nome: 'Ana Silva',
        email: 'ana.silva@empresa.com',
        perfil: 'executivo',
        departamentos_acesso: ['todos']
      },
      alertas_criticos: [
        {
          id: '1',
          tipo: 'turnover_alto',
          titulo: 'Turnover Alto - TI',
          mensagem: 'Departamento de TI com 22% de turnover no trimestre',
          severidade: 'alta',
          data_criacao: '2024-06-20T14:30:00',
          departamento: 'Tecnologia da Informação',
          valor_atual: 22,
          valor_limite: 20
        },
        {
          id: '2',
          tipo: 'risco_colaboradores',
          titulo: 'Colaboradores em Alto Risco',
          mensagem: '12 colaboradores identificados com alto risco de saída',
          severidade: 'alta',
          data_criacao: '2024-06-20T09:15:00',
          valor_atual: 12,
          valor_limite: 10
        },
        {
          id: '3',
          tipo: 'enps_baixo',
          titulo: 'eNPS Baixo - Vendas',
          mensagem: 'Departamento de Vendas com eNPS de -15',
          severidade: 'media',
          data_criacao: '2024-06-19T16:45:00',
          departamento: 'Vendas',
          valor_atual: -15,
          valor_limite: -10
        }
      ],
      ultima_atualizacao: '2024-06-23T06:00:00',
      status_integracao: 'online'
    };
  }
};

// Funções utilitárias defensivas
const formatarDataHora = (dataString: string | undefined): string => {
  if (!dataString) return 'N/A';
  
  try {
    const data = new Date(dataString);
    
    if (isNaN(data.getTime())) {
      return 'Data inválida';
    }
    
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Erro de formato';
  }
};

const obterCorSeveridade = (severidade: string): string => {
  switch (severidade) {
    case 'alta': return 'destructive';
    case 'media': return 'secondary';
    case 'baixa': return 'outline';
    default: return 'outline';
  }
};

const obterIconeAlerta = (tipo: string) => {
  switch (tipo) {
    case 'turnover_alto': return LucideIcons.TrendingDown;
    case 'risco_colaboradores': return LucideIcons.AlertTriangle;
    case 'enps_baixo': return LucideIcons.ThumbsDown;
    default: return LucideIcons.Alert;
  }
};

export default function DashboardExecutivo() {
  // Estados globais
  const [abaSelecionada, setAbaSelecionada] = useState<'metricas' | 'analise' | 'relatorios'>('metricas');
  const [dadosGlobais, setDadosGlobais] = useState<DadosGlobais | null>(null);
  const [carregandoGlobal, setCarregandoGlobal] = useState(true);
  const [erroGlobal, setErroGlobal] = useState<string | null>(null);
  const [alertasVisiveis, setAlertasVisiveis] = useState(true);
  
  // Ref para controle de montagem
  const montadoRef = useRef(true);
  
  // Inicialização de montadoRef
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);
  
  // Carregar dados globais
  const carregarDadosGlobais = useCallback(async () => {
    if (!montadoRef.current) return;
    
    setCarregandoGlobal(true);
    setErroGlobal(null);
    
    const timeoutId = setTimeout(() => {
      if (montadoRef.current) {
        setCarregandoGlobal(false);
        setErroGlobal('Tempo de carregamento excedido. Tente novamente.');
      }
    }, 8000);
    
    try {
      const dados = await apiMock.obterDadosGlobais();
      if (montadoRef.current) {
        setDadosGlobais(dados);
        
        // Mostrar alertas críticos via toast
        if (dados.alertas_criticos.length > 0) {
          const alertasAltos = dados.alertas_criticos.filter(a => a.severidade === 'alta');
          if (alertasAltos.length > 0) {
            toast.error(`${alertasAltos.length} alerta(s) crítico(s) detectado(s)`, {
              description: 'Verifique a seção de alertas para mais detalhes'
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados globais:', error);
      if (montadoRef.current) {
        setErroGlobal('Falha ao carregar dados do sistema. Verifique a conexão.');
      }
    } finally {
      clearTimeout(timeoutId);
      if (montadoRef.current) {
        setCarregandoGlobal(false);
      }
    }
  }, []);
  
  // Carregar dados ao montar
  useEffect(() => {
    carregarDadosGlobais();
  }, [carregarDadosGlobais]);
  
  // Dismissar alerta específico
  const handleDismissAlerta = useCallback((alertaId: string) => {
    if (!dadosGlobais) return;
    
    setDadosGlobais(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        alertas_criticos: prev.alertas_criticos.filter(a => a.id !== alertaId)
      };
    });
    
    toast.success('Alerta marcado como visualizado');
  }, [dadosGlobais]);
  
  // Toggle visibilidade dos alertas
  const handleToggleAlertas = useCallback(() => {
    setAlertasVisiveis(prev => !prev);
  }, []);
  
  // Handler para mudança de aba
  const handleMudarAba = useCallback((aba: 'metricas' | 'analise' | 'relatorios') => {
    setAbaSelecionada(aba);
  }, []);
  
  // Verificar status da integração
  const statusIntegracao = useMemo(() => {
    if (!dadosGlobais) return 'carregando';
    return dadosGlobais.status_integracao;
  }, [dadosGlobais]);
  
  // Alertas críticos filtrados
  const alertasCriticos = useMemo(() => {
    return dadosGlobais?.alertas_criticos || [];
  }, [dadosGlobais]);
  
  // Renderização de loading global
  if (carregandoGlobal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Carregando Dashboard</h2>
          <p className="text-gray-600">Sincronizando dados do HRIS...</p>
        </div>
      </div>
    );
  }
  
  // Renderização de erro global
  if (erroGlobal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <LucideIcons.AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erro no Sistema</h2>
            <p className="text-gray-600 mb-6">{erroGlobal}</p>
            <Button onClick={carregarDadosGlobais} className="w-full">
              <LucideIcons.RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="bottom-right" />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Executivo</h1>
              <p className="text-sm text-gray-500">
                Employee Experience Analytics Platform
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status da integração */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  statusIntegracao === 'online' ? 'bg-green-500' : 
                  statusIntegracao === 'offline' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {statusIntegracao === 'online' ? 'Online' : 
                   statusIntegracao === 'offline' ? 'Offline' : 'Erro'}
                </span>
              </div>
              
              {/* Última atualização */}
              <div className="text-sm text-gray-500">
                Atualizado: {formatarDataHora(dadosGlobais?.ultima_atualizacao)}
              </div>
              
              {/* Usuário */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {dadosGlobais?.usuario.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium">{dadosGlobais?.usuario.nome}</span>
                <Badge variant="outline">{dadosGlobais?.usuario.perfil}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Alertas críticos */}
      {alertasCriticos.length > 0 && alertasVisiveis && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <LucideIcons.AlertTriangle className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-orange-800">
                    Alertas Críticos ({alertasCriticos.length})
                  </CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleToggleAlertas}
                >
                  <LucideIcons.X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {alertasCriticos.slice(0, 3).map((alerta) => {
                  const IconeAlerta = obterIconeAlerta(alerta.tipo);
                  return (
                    <Alert key={alerta.id} className="bg-white">
                      <IconeAlerta className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{alerta.titulo}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant={obterCorSeveridade(alerta.severidade)}>
                            {alerta.severidade}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismissAlerta(alerta.id)}
                          >
                            <LucideIcons.X className="h-3 w-3" />
                          </Button>
                        </div>
                      </AlertTitle>
                      <AlertDescription>
                        {alerta.mensagem}
                        {alerta.departamento && (
                          <span className="block text-xs text-gray-500 mt-1">
                            Departamento: {alerta.departamento}
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  );
                })}
                
                {alertasCriticos.length > 3 && (
                  <div className="text-center">
                    <Button variant="outline" size="sm">
                      Ver todos os {alertasCriticos.length} alertas
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={abaSelecionada} onValueChange={handleMudarAba}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="metricas" className="flex items-center space-x-2">
              <LucideIcons.BarChart3 className="h-4 w-4" />
              <span>Métricas Principais</span>
            </TabsTrigger>
            <TabsTrigger value="analise" className="flex items-center space-x-2">
              <LucideIcons.TrendingUp className="h-4 w-4" />
              <span>Análise Detalhada</span>
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="flex items-center space-x-2">
              <LucideIcons.FileText className="h-4 w-4" />
              <span>Relatórios</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="metricas">
            <MetricasPrincipais 
              usuario={dadosGlobais?.usuario}
              alertasCriticos={alertasCriticos}
            />
          </TabsContent>
          
          <TabsContent value="analise">
            <AnaliseDetalhada 
              usuario={dadosGlobais?.usuario}
            />
          </TabsContent>
          
          <TabsContent value="relatorios">
            <Relatorios 
              usuario={dadosGlobais?.usuario}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}