'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface PlanoDesenvolvimento {
  id: string;
  colaborador_nome: string;
  objetivo: string;
  cargo_atual: string;
  cargo_objetivo: string;
  status: string;
  progresso_geral: number;
  budget_aprovado: number;
  prazo_conclusao: string;
  acoes: AcaoDesenvolvimento[];
}

interface AcaoDesenvolvimento {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  custo: number;
  data_conclusao_prevista: string;
}

interface PerfilUsuario {
  id: string;
  nome: string;
  cargo: string;
  tipo_perfil: string;
}

interface PlanosSectionProps {
  perfilUsuario: PerfilUsuario | null;
  temPermissao: (acao: string) => boolean;
}

export default function PlanosSection({ perfilUsuario, temPermissao }: PlanosSectionProps) {
  const [planos, setPlanos] = useState<PlanoDesenvolvimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalPlanoAberto, setModalPlanoAberto] = useState(false);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoDesenvolvimento | null>(null);
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  const carregarPlanos = useCallback(async () => {
    setCarregando(true);
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (montadoRef.current) {
      const planosSimulados: PlanoDesenvolvimento[] = [
        {
          id: 'plano-001',
          colaborador_nome: perfilUsuario?.nome || 'Ana Silva Santos',
          objetivo: 'Promoção',
          cargo_atual: 'Gerente de RH',
          cargo_objetivo: 'Diretor de Pessoas',
          status: 'ativo',
          progresso_geral: 65,
          budget_aprovado: 15000,
          prazo_conclusao: '2024-12-31',
          acoes: [
            {
              id: 'acao-001',
              nome: 'MBA em Gestão de Pessoas',
              tipo: 'curso',
              status: 'em_andamento',
              custo: 12000,
              data_conclusao_prevista: '2024-11-30'
            },
            {
              id: 'acao-002',
              nome: 'Mentoria Executiva',
              tipo: 'mentoria',
              status: 'concluida',
              custo: 0,
              data_conclusao_prevista: '2024-08-31'
            }
          ]
        },
        {
          id: 'plano-002',
          colaborador_nome: 'Carlos Eduardo Silva',
          objetivo: 'Melhoria Performance',
          cargo_atual: 'Analista Sênior',
          cargo_objetivo: 'Especialista',
          status: 'ativo',
          progresso_geral: 40,
          budget_aprovado: 5000,
          prazo_conclusao: '2024-09-30',
          acoes: [
            {
              id: 'acao-003',
              nome: 'Certificação PMP',
              tipo: 'certificacao',
              status: 'em_andamento',
              custo: 2500,
              data_conclusao_prevista: '2024-09-30'
            }
          ]
        }
      ];
      
      setPlanos(planosSimulados);
      setCarregando(false);
    }
  }, [perfilUsuario]);

  useEffect(() => {
    carregarPlanos();
  }, [carregarPlanos]);

  const planosFiltrados = useMemo(() => {
    return planos.filter(plano => 
      filtroStatus === 'todos' || plano.status === filtroStatus
    );
  }, [planos, filtroStatus]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getCorStatus = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'suspenso': return 'bg-yellow-100 text-yellow-800';
      case 'concluido': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (carregando) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="ml-4 text-gray-500">Carregando planos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Planos de Desenvolvimento</h2>
          <p className="text-gray-500">Gerencie planos de carreira personalizados</p>
        </div>
        <Button onClick={() => setModalPlanoAberto(true)}>
          <LucideIcons.Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {planosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <LucideIcons.BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum plano encontrado</h3>
          <p className="text-gray-500">Não há planos de desenvolvimento</p>
        </div>
      ) : (
        <div className="space-y-4">
          {planosFiltrados.map(plano => (
            <Card key={plano.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{plano.colaborador_nome}</h3>
                    <p className="text-gray-600">{plano.cargo_atual} → {plano.cargo_objetivo}</p>
                    <Badge className={getCorStatus(plano.status)}>
                      {plano.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progresso</span>
                    <span className="text-sm font-medium">{plano.progresso_geral}%</span>
                  </div>
                  <Progress value={plano.progresso_geral} className="h-2" />
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                  <span>Ações: {plano.acoes.length}</span>
                  <span>Budget: {formatarMoeda(plano.budget_aprovado)}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPlanoSelecionado(plano);
                    setModalDetalhesAberto(true);
                  }}
                >
                  <LucideIcons.Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Novo Plano */}
      <Dialog open={modalPlanoAberto} onOpenChange={setModalPlanoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Plano</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Colaborador</Label>
              <Input placeholder="Nome do colaborador" />
            </div>
            <div>
              <Label>Cargo Atual</Label>
              <Input placeholder="Cargo atual" />
            </div>
            <div>
              <Label>Cargo Objetivo</Label>
              <Input placeholder="Cargo desejado" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPlanoAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              toast.success('Plano criado com sucesso');
              setModalPlanoAberto(false);
            }}>
              Criar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Plano - {planoSelecionado?.colaborador_nome}</DialogTitle>
          </DialogHeader>
          {planoSelecionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Objetivo</p>
                  <p className="font-medium">{planoSelecionado.objetivo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getCorStatus(planoSelecionado.status)}>
                    {planoSelecionado.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Ações ({planoSelecionado.acoes.length})</h4>
                <div className="space-y-2">
                  {planoSelecionado.acoes.map(acao => (
                    <div key={acao.id} className="border rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{acao.nome}</p>
                          <p className="text-sm text-gray-600">{acao.tipo}</p>
                        </div>
                        <Badge variant="outline">{acao.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setModalDetalhesAberto(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}