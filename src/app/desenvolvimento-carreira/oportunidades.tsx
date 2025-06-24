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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface OportunidadeInterna {
  id: string;
  titulo: string;
  tipo: string;
  departamento: string;
  localizacao: string;
  status: string;
  descricao: string;
  candidatos_count: number;
  score_compatibilidade: number;
  data_limite: string;
}

interface PerfilUsuario {
  id: string;
  nome: string;
  cargo: string;
  tipo_perfil: string;
}

interface OportunidadesSectionProps {
  perfilUsuario: PerfilUsuario | null;
  temPermissao: (acao: string) => boolean;
}

export default function OportunidadesSection({ perfilUsuario, temPermissao }: OportunidadesSectionProps) {
  const [oportunidades, setOportunidades] = useState<OportunidadeInterna[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [modalCandidaturaAberto, setModalCandidaturaAberto] = useState(false);
  const [oportunidadeSelecionada, setOportunidadeSelecionada] = useState<OportunidadeInterna | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => { montadoRef.current = false; };
  }, []);

  const carregarOportunidades = useCallback(async () => {
    setCarregando(true);
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (montadoRef.current) {
      const oportunidadesSimuladas: OportunidadeInterna[] = [
        {
          id: 'opp-001',
          titulo: 'Tech Lead - Transformação Digital',
          tipo: 'vaga',
          departamento: 'Tecnologia',
          localizacao: 'São Paulo - SP',
          status: 'aberta',
          descricao: 'Liderar iniciativas de transformação digital e gerenciar equipe de desenvolvedores.',
          candidatos_count: 12,
          score_compatibilidade: 85,
          data_limite: '2024-07-20'
        },
        {
          id: 'opp-002',
          titulo: 'Projeto Diversidade & Inclusão',
          tipo: 'projeto',
          departamento: 'Recursos Humanos',
          localizacao: 'Remoto',
          status: 'aberta',
          descricao: 'Liderar projeto global de diversidade e inclusão na organização.',
          candidatos_count: 8,
          score_compatibilidade: 92,
          data_limite: '2024-07-15'
        },
        {
          id: 'opp-003',
          titulo: 'Mentoria Executiva - High Potential',
          tipo: 'mentoria',
          departamento: 'Liderança',
          localizacao: 'Híbrido',
          status: 'em_analise',
          descricao: 'Programa de mentoria com executivos para desenvolvimento de líderes.',
          candidatos_count: 5,
          score_compatibilidade: 78,
          data_limite: '2024-07-01'
        }
      ];
      
      setOportunidades(oportunidadesSimuladas);
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarOportunidades();
  }, [carregarOportunidades]);

  const oportunidadesFiltradas = useMemo(() => {
    return oportunidades.filter(opp => 
      filtroTipo === 'todos' || opp.tipo === filtroTipo
    );
  }, [oportunidades, filtroTipo]);

  const formatarData = (dataString: string) => {
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  const getCorStatus = (status: string) => {
    switch (status) {
      case 'aberta': return 'bg-green-100 text-green-800';
      case 'em_analise': return 'bg-yellow-100 text-yellow-800';
      case 'preenchida': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCorTipo = (tipo: string) => {
    switch (tipo) {
      case 'vaga': return 'bg-blue-100 text-blue-800';
      case 'projeto': return 'bg-green-100 text-green-800';
      case 'mentoria': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (carregando) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="ml-4 text-gray-500">Carregando oportunidades...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Oportunidades Internas</h2>
          <p className="text-gray-500">Explore vagas, projetos e oportunidades</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="vaga">Vaga</SelectItem>
                <SelectItem value="projeto">Projeto</SelectItem>
                <SelectItem value="mentoria">Mentoria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {oportunidadesFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <LucideIcons.Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma oportunidade encontrada</h3>
          <p className="text-gray-500">Não há oportunidades disponíveis</p>
        </div>
      ) : (
        <div className="space-y-4">
          {oportunidadesFiltradas.map(oportunidade => (
            <Card key={oportunidade.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{oportunidade.titulo}</h3>
                      <Badge variant="outline" className="text-green-600">
                        {oportunidade.score_compatibilidade}% match
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">
                      {oportunidade.departamento} • {oportunidade.localizacao}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className={getCorTipo(oportunidade.tipo)}>
                        {oportunidade.tipo}
                      </Badge>
                      <Badge className={getCorStatus(oportunidade.status)}>
                        {oportunidade.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{oportunidade.descricao}</p>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span>{oportunidade.candidatos_count} candidatos</span>
                    <span className="ml-4">Prazo: {formatarData(oportunidade.data_limite)}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOportunidadeSelecionada(oportunidade);
                        setModalDetalhesAberto(true);
                      }}
                    >
                      <LucideIcons.Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Button>
                    
                    {oportunidade.status === 'aberta' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setOportunidadeSelecionada(oportunidade);
                          setModalCandidaturaAberto(true);
                        }}
                      >
                        <LucideIcons.Send className="mr-2 h-4 w-4" />
                        Candidatar-se
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Detalhes */}
      <Dialog open={modalDetalhesAberto} onOpenChange={setModalDetalhesAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{oportunidadeSelecionada?.titulo}</DialogTitle>
          </DialogHeader>
          {oportunidadeSelecionada && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Departamento</p>
                  <p className="font-medium">{oportunidadeSelecionada.departamento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Localização</p>
                  <p className="font-medium">{oportunidadeSelecionada.localizacao}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Descrição</p>
                <p className="text-gray-700">{oportunidadeSelecionada.descricao}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={getCorTipo(oportunidadeSelecionada.tipo)}>
                  {oportunidadeSelecionada.tipo}
                </Badge>
                <Badge className={getCorStatus(oportunidadeSelecionada.status)}>
                  {oportunidadeSelecionada.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setModalDetalhesAberto(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Candidatura */}
      <Dialog open={modalCandidaturaAberto} onOpenChange={setModalCandidaturaAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Candidatar-se para Oportunidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="font-medium">{oportunidadeSelecionada?.titulo}</p>
              <p className="text-sm text-gray-600">{oportunidadeSelecionada?.departamento}</p>
            </div>
            
            <div>
              <Label>Carta de Motivação</Label>
              <Textarea
                placeholder="Descreva por que tem interesse nesta oportunidade..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCandidaturaAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              toast.success('Candidatura enviada com sucesso!');
              setModalCandidaturaAberto(false);
            }}>
              Enviar Candidatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}