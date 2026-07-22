import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, MapPin, BookOpen, Home as HomeIcon, Loader2, AlertCircle,
  Save, Trash2, Plus, Star, FileText, Download, ShieldCheck, Eye,
  Activity, ChevronLeft, DollarSign, GraduationCap, Upload, Lock,
  Users, CheckCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api, { getFileUrl } from '../api';
import '../styles/PerfilMissionario.css';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

interface Missionario {
  id: number;
  nome: string;
  login: string;
  situacao: string;
  is_oconomo: boolean;
  is_superior: boolean;
  proximos_passos: string;
  permissoes?: Record<string, boolean>;
}

interface ItineraryStage {
  etapa: string;
  local: string;
  periodo: string;
  is_sub_etapa: boolean;
  doc_path?: string;
}

interface CivilData {
  data_nascimento: string;
  filiacao: string;
  nome_pai?: string;
  nome_mae?: string;
  cidade_estado: string;
  diocese: string;
  pais: string;
  naturalidade: string;
  rnm: string;
  cpf: string;
  titulo_eleitor: string;
  cnh: string;
  passaporte: string;
}

interface EnderecoData {
  logradouro: string;
  complemento: string;
  bairro: string;
  cep: string;
  cidade_estado: string;
  celular_whatsapp: string;
  telefone_fixo: string;
  email_pessoal: string;
}

interface ReligiososData {
  primeiros_votos_data: string;
  votos_perpetuos_data: string;
  lugar_profissao: string;
  diaconato_data: string;
  presbiterato_data: string;
  bispo_ordenante: string;
  data_batismo: string;
  data_primeira_comunhao: string;
  data_crisma: string;
  doc_batismo: string;
  doc_primeira_comunhao: string;
  doc_crisma: string;
}

interface SituacaoData {
  data_falecimento: string;
  cidade_falecimento: string;
  certidao_obito_path: string;
  local_sepultamento: string;
  egresso_incardinado_path: string;
  egresso_desistencia_path: string;
  egresso_laicizado_path: string;
  egresso_transf_para_regiao_path: string;
  egresso_transf_da_regiao_path: string;
  exclaustrado_data: string;
  exclaustrado_processo: string;
}

const PAISES_COMMON = [
  'Afeganistão', 'África do Sul', 'Albânia', 'Alemanha', 'Andorra', 'Angola', 'Antígua e Barbuda', 'Arábia Saudita', 'Argélia', 'Argentina', 'Armênia', 'Austrália', 'Áustria', 'Azerbaijão',
  'Bahamas', 'Bangladesh', 'Barbados', 'Bahrein', 'Bélgica', 'Belize', 'Benim', 'Bielorrússia', 'Bolívia', 'Bósnia e Herzegovina', 'Botsuana', 'Brasil', 'Brunei', 'Bulgária', 'Burquina Faso', 'Burundi',
  'Butão', 'Cabo Verde', 'Camarões', 'Camboja', 'Canadá', 'Catar', 'Cazaquistão', 'Chade', 'Chile', 'China', 'Chipre', 'Colômbia', 'Comores', 'Congo-Brazzaville', 'Coreia do Norte', 'Coreia do Sul',
  'Costa do Marfim', 'Costa Rica', 'Croácia', 'Cuba', 'Dinamarca', 'Djibuti', 'Dominica', 'Egito', 'El Salvador', 'Emirados Árabes Unidos', 'Equador', 'Eritreia', 'Eslováquia', 'Eslovênia', 'Espanha',
  'Estados Unidos', 'Estônia', 'Etiópia', 'Fiji', 'Filipinas', 'Finlândia', 'França', 'Gabão', 'Gâmbia', 'Gana', 'Geórgia', 'Granada', 'Grécia', 'Guatemala', 'Guiana', 'Guiné', 'Guiné Equatorial',
  'Guiné-Bissau', 'Haiti', 'Honduras', 'Hungria', 'Iêmen', 'Ilhas Marechal', 'Ilhas Salomão', 'Índia', 'Indonésia', 'Irã', 'Iraque', 'Irlanda', 'Islândia', 'Israel', 'Itália', 'Jamaica', 'Japão',
  'Jordânia', 'Kiribati', 'Kuwait', 'Laos', 'Lesoto', 'Letônia', 'Líbano', 'Libéria', 'Líbia', 'Listenstaine', 'Lituânia', 'Luxemburgo', 'Macedônia do Norte', 'Madagascar', 'Malásia', 'Malaui',
  'Maldivas', 'Mali', 'Malta', 'Marrocos', 'Maurícia', 'Mauritânia', 'México', 'Mianmar', 'Micronésia', 'Moçambique', 'Moldávia', 'Mônaco', 'Mongólia', 'Montenegro', 'Namíbia', 'Nauru', 'Nepal',
  'Nicarágua', 'Níger', 'Nigéria', 'Noruega', 'Nova Zelândia', 'Omã', 'Países Baixos', 'Palau', 'Panamá', 'Papua-Nova Guiné', 'Paquistão', 'Paraguai', 'Peru', 'Polônia', 'Portugal', 'Quênia',
  'Quirguistão', 'Reino Unido', 'República Centro-Africana', 'República Checa', 'República Democrática do Congo', 'República Dominicana', 'Romênia', 'Ruanda', 'Rússia', 'Samoa', 'Santa Lúcia',
  'São Cristóvão e Neves', 'São Marinho', 'São Tomé e Príncipe', 'São Vicente e Granadinas', 'Seicheles', 'Senegal', 'Serra Leoa', 'Sérvia', 'Singapura', 'Síria', 'Somália', 'Sri Lanka', 'Suazilândia',
  'Sudão', 'Sudão do Sul', 'Suécia', 'Suíça', 'Suriname', 'Tailândia', 'Taiwan', 'Tajiquistão', 'Tanzânia', 'Timor-Leste', 'Togo', 'Tonga', 'Trindade e Tobago', 'Tunísia', 'Turquemenistão', 'Turquia',
  'Tuvalu', 'Ucrânia', 'Uganda', 'Uruguai', 'Usbequistão', 'Vanuatu', 'Vaticano', 'Venezuela', 'Vietname', 'Zâmbia', 'Zimbábue'
];

interface Documento {
  id: number;
  descricao: string;
  url: string;
  data_upload: string;
  tipo_arquivo?: string;
  arquivo_nome?: string;
}

interface FormacaoAcademica {
  id: number;
  curso: string;
  faculdade: string;
  periodo: string;
  doc_path?: string;
}

interface AtividadeMissionaria {
  id: number;
  lugar: string;
  periodo: string;
  missao?: string;
}

interface ObraRealizada {
  id: number;
  lugar: string;
  periodo: string;
  obra?: string;
}

interface SaudeRecord {
  id: number;
  seguradora?: string;
  sus_card?: string;
  numero_carteira?: string;
}

interface ContaBancaria {
  id: number;
  tipo_conta: string;
  titularidade: string;
  agencia: string;
  numero: string;
}

interface Contato {
  parentesco: string;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
}

interface ObservacaoGeral {
  id: number;
  created_at: string;
  texto: string;
}

interface CasaHistorico {
  id: number;
  casa_id: number;
  casa_nome: string;
  data_inicio: string;
  data_fim: string | null;
  funcao: string[];
  is_superior: boolean;
}

interface Casa { id: number; nome: string; }

interface QuadroPessoal {
  funcao_atual?: string;
  competencias?: string;
  cv_path?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDateLocal(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const base = String(dateStr).split('T')[0].split(' ')[0];
  const parts = base.split('-');
  if (parts.length === 3) {
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) return new Date(y, m, d);
  }
  const d = new Date(dateStr as string);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateLocal(dateStr?: string | null): string {
  const d = parseDateLocal(dateStr);
  return d ? d.toLocaleDateString('pt-BR') : '?';
}

function calcDuracao(dataInicio: string, dataFim?: string | null): string {
  if (!dataInicio) return '';
  const ini = parseDateLocal(dataInicio);
  if (!ini) return '';
  const fim = dataFim ? (parseDateLocal(dataFim) || new Date()) : new Date();
  let anos = fim.getFullYear() - ini.getFullYear();
  let meses = fim.getMonth() - ini.getMonth();
  if (meses < 0) { anos--; meses += 12; }
  const parts = [];
  if (anos > 0) parts.push(`${anos} ano${anos > 1 ? 's' : ''}`);
  if (meses > 0) parts.push(`${meses} ${meses > 1 ? 'meses' : 'mês'}`);
  return parts.length ? parts.join(' e ') : 'menos de 1 mês';
}

const PERMISSIONS_LIST = [
  { id: 'dados_civis', label: '1. Dados Civis (visualização)' },
  { id: 'contatos', label: '2. Contatos (visualização)' },
  { id: 'dados_religiosos', label: '3. Dados Religiosos (visualização)' },
  { id: 'itinerario_formativo', label: '4. Itinerário Formativo (Visualização)' },
  { id: 'formacao_academica', label: '5. Formação Acadêmica (Visualização)' },
  { id: 'atividade_missionaria', label: '6. Atividade Missionária (Visualização)' },
  { id: 'saude', label: '7. Saúde (Visualização)' },
  { id: 'previdenciario_ir', label: '8. Previdenciário/IR (Visualização)' },
  { id: 'conta_bancaria', label: '9. Conta Bancária (Visualização)' },
  { id: 'documentos', label: '10. Documentos (Visualização)' },
  { id: 'obras_realizadas', label: '11. Obras realizadas (Visualização)' },
  { id: 'observacoes', label: '12. Observações (Visualização)' },
  { id: 'quadro_pessoal', label: '13. Quadro de Pessoal CV (Visualização)' },
];

// ─── Component ───────────────────────────────────────────────────────────────

const PerfilMissionario: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEdit, user: authUser, isAdminGeral, isOconomo, isSuperior, isRegional } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dados');

  const [missionario, setMissionario] = useState<Missionario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [civilData, setCivilData] = useState<CivilData>({ data_nascimento: '', filiacao: '', nome_pai: '', nome_mae: '', cidade_estado: '', diocese: '', pais: '', naturalidade: '', rnm: '', cpf: '', titulo_eleitor: '', cnh: '', passaporte: '' });
  const [enderecoData, setEnderecoData] = useState<EnderecoData>({ logradouro: '', complemento: '', bairro: '', cep: '', cidade_estado: '', celular_whatsapp: '', telefone_fixo: '', email_pessoal: '' });
  const [religiososData, setReligiososData] = useState<ReligiososData>({ primeiros_votos_data: '', votos_perpetuos_data: '', lugar_profissao: '', diaconato_data: '', presbiterato_data: '', bispo_ordenante: '', data_batismo: '', data_primeira_comunhao: '', data_crisma: '', doc_batismo: '', doc_primeira_comunhao: '', doc_crisma: '' });
  const [casasHistorico, setCasasHistorico] = useState<CasaHistorico[]>([]);
  const [casasDisponiveis, setCasasDisponiveis] = useState<Casa[]>([]);
  const [novaVinculacao, setNovaVinculacao] = useState({ casa_id: '', data_inicio: '', data_fim: '', funcao: [] as string[], is_superior: false });
  const [isSaving, setIsSaving] = useState(false);
  // const [cepLoading, setCepLoading] = useState(false);
  const [nacionalidades, setNacionalidades] = useState<string[]>([]);

  // Documents state
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [pendingDocDesc, setPendingDocDesc] = useState('');
  const [pendingReligiousDocDesc, setPendingReligiousDocDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const religiousFileInputRef = useRef<HTMLInputElement>(null);

  // Itinerary state
  const [itinerarioStages, setItinerarioStages] = useState<ItineraryStage[]>([]);
  const [isSavingItinerary, setIsSavingItinerary] = useState(false);
  // const [_itinDocUploading, setItinDocUploading] = useState<number | null>(null);
  const itinFileInputRef = useRef<HTMLInputElement>(null);
  const activeEtapaRef = useRef<string | null>(null);
  // New Sections State
  const [formacaoAcademica, setFormacaoAcademica] = useState<FormacaoAcademica[]>([]);
  const [atividadesMissionarias, setAtividadesMissionarias] = useState<AtividadeMissionaria[]>([]);
  const [obrasRealizadas, setObrasRealizadas] = useState<ObraRealizada[]>([]);
  const [saudeRecords, setSaudeRecords] = useState<SaudeRecord[]>([]);
  const [contasBancarias, setContasBancarias] = useState<ContaBancaria[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [observacoesGerais, setObservacoesGerais] = useState<ObservacaoGeral[]>([]);
  const [quadroPessoal, setQuadroPessoal] = useState<QuadroPessoal | null>(null);
  const [nit, setNit] = useState('');
  const [situacaoData, setSituacaoData] = useState<SituacaoData>({
    data_falecimento: '', cidade_falecimento: '', certidao_obito_path: '', local_sepultamento: '',
    egresso_incardinado_path: '', egresso_desistencia_path: '', egresso_laicizado_path: '',
    egresso_transf_para_regiao_path: '', egresso_transf_da_regiao_path: '',
    exclaustrado_data: '', exclaustrado_processo: ''
  });

  // Forms for adding
  const [showAddForm, setShowAddForm] = useState<string | null>(null);
  const [tempForm, setTempForm] = useState<Record<string, any>>({});
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || '/api';
  void API_URL;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (id) {
      const isOwner = authUser?.id === parseInt(id);
      const isManager = isAdminGeral || canEdit || isOconomo || isSuperior || isRegional;

      if (!isManager && !isOwner) {
        navigate('/home');
        return;
      }
      fetchData();
    }
  }, [id, authUser, isAdminGeral, canEdit, isOconomo, isSuperior, isRegional]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [mRes, civRes, endRes, relRes, casasRes, histRes, nacRes, docRes, itinRes] = await Promise.all([
        api.get(`/usuarios/${id}`),
        api.get(`/usuarios/${id}/dados-civis`),
        api.get(`/usuarios/${id}/endereco-contato`),
        api.get(`/usuarios/${id}/dados-religiosos`),
        api.post(`/casas-religiosas/get`),
        api.get(`/usuarios/${id}/casas-historico`),
        api.get(`/usuarios/${id}/nacionalidades`),
        api.get(`/usuarios/${id}/documentos`),
        api.get(`/usuarios/${id}/itinerario`),
      ]);

      setMissionario(mRes.data);
      if (civRes.data) {
        const parts = civRes.data.filiacao ? civRes.data.filiacao.split('/') : [];
        setCivilData({
          ...civRes.data,
          nome_pai: parts[0] ? parts[0].trim() : '',
          nome_mae: parts[1] ? parts[1].trim() : '',
          data_nascimento: civRes.data.data_nascimento ? civRes.data.data_nascimento.split('T')[0] : ''
        });
      }
      if (endRes.data) setEnderecoData(endRes.data);
      if (relRes.data) setReligiososData({
        ...relRes.data,
        primeiros_votos_data: relRes.data.primeiros_votos_data ? relRes.data.primeiros_votos_data.split('T')[0] : '',
        votos_perpetuos_data: relRes.data.votos_perpetuos_data ? relRes.data.votos_perpetuos_data.split('T')[0] : '',
        diaconato_data: relRes.data.diaconato_data ? relRes.data.diaconato_data.split('T')[0] : '',
        presbiterato_data: relRes.data.presbiterato_data ? relRes.data.presbiterato_data.split('T')[0] : '',
        data_batismo: relRes.data.data_batismo ? relRes.data.data_batismo.split('T')[0] : '',
        data_primeira_comunhao: relRes.data.data_primeira_comunhao ? relRes.data.data_primeira_comunhao.split('T')[0] : '',
        data_crisma: relRes.data.data_crisma ? relRes.data.data_crisma.split('T')[0] : '',
        doc_batismo: relRes.data.doc_batismo || '',
        doc_primeira_comunhao: relRes.data.doc_primeira_comunhao || '',
        doc_crisma: relRes.data.doc_crisma || '',
      });
      setCasasDisponiveis(casasRes.data);
      setCasasHistorico(histRes.data.map((h: any) => ({ ...h, funcao: h.funcao ? h.funcao.split(',').map((s: string) => s.trim()) : [] })));
      setNacionalidades(nacRes.data.nacionalidades || []);
      setDocumentos(docRes.data);
      setItinerarioStages(itinRes.data || []);
      setNit(civRes.data?.nit || '');

      // Load new sections
      const [fRes, aRes, oRes, sRes, bRes, obsRes, qRes, contRes] = await Promise.all([
        api.get(`/usuarios/${id}/formacao-academica`),
        api.get(`/usuarios/${id}/atividade-missionaria`),
        api.get(`/usuarios/${id}/obras-realizadas`),
        api.get(`/usuarios/${id}/saude`),
        api.get(`/usuarios/${id}/contas-bancarias`),
        api.get(`/usuarios/${id}/observacoes-gerais`),
        api.get(`/usuarios/${id}/quadro-pessoal`),
        api.get(`/usuarios/${id}/contatos`),
      ]);
      setFormacaoAcademica(fRes.data);
      setAtividadesMissionarias(aRes.data);
      setObrasRealizadas(oRes.data);
      setSaudeRecords(sRes.data);
      setContasBancarias(bRes.data);
      setObservacoesGerais(obsRes.data);
      setQuadroPessoal(qRes.data[0] || null);
      setContatos(contRes.data || []);

      const sitRes = await api.get(`/usuarios/${id}/situacao`);
      if (sitRes.data) setSituacaoData({
        ...sitRes.data,
        data_falecimento: sitRes.data.data_falecimento ? sitRes.data.data_falecimento.split('T')[0] : '',
        exclaustrado_data: sitRes.data.exclaustrado_data ? sitRes.data.exclaustrado_data.split('T')[0] : '',
      });

    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /*
  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    setEnderecoData(prev => ({ ...prev, cep }));

    if (cleanCep.length === 8) {
      setCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setEnderecoData(prev => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            cidade_estado: `${data.localidade} - ${data.uf}`
          }));
        }
      } catch { }
      finally { setCepLoading(false); }
    }
  };
  */

  const saveCivil = async () => {
    setIsSaving(true);
    try {
      const filiacao = (civilData.nome_pai || civilData.nome_mae) ? `${civilData.nome_pai || ''} / ${civilData.nome_mae || ''}` : '';
      const civilDataToSave = { ...civilData, filiacao };
      delete civilDataToSave.nome_pai;
      delete civilDataToSave.nome_mae;

      await Promise.all([
        api.post(`/usuarios/${id}/dados-civis`, { ...civilDataToSave, nit }),
        api.post(`/usuarios/${id}/nacionalidades`, { nacionalidades })
      ]);
      alert('Dados civis atualizados!');
    } catch { alert('Erro ao salvar dados civis'); }
    finally { setIsSaving(false); }
  };

  const saveReligiosos = async () => {
    setIsSaving(true);
    try {
      await api.put(`/usuarios/${id}/dados-religiosos`, {
        ...religiososData,
        data_batismo: religiososData.data_batismo || null,
        data_primeira_comunhao: religiososData.data_primeira_comunhao || null,
        data_crisma: religiososData.data_crisma || null,
      });

      // Update main user status and roles
      await api.put(`/usuarios/${id}`, {
        nome: missionario?.nome,
        login: missionario?.login,
        is_oconomo: missionario?.is_oconomo,
        is_superior: missionario?.is_superior,
        situacao: missionario?.situacao,
        proximos_passos: missionario?.proximos_passos,
      });

      // Update Situation Details
      await api.post(`/usuarios/${id}/situacao`, situacaoData);

      alert('Dados religiosos e situação atualizados!');
    } catch { alert('Erro ao salvar dados religiosos'); }
    finally { setIsSaving(false); }
  };


  const saveEndereco = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        api.post(`/usuarios/${id}/endereco-contato`, enderecoData),
        api.post(`/usuarios/${id}/contatos`, { contatos })
      ]);
      alert('Endereço e contatos atualizados!');
    } catch { alert('Erro ao salvar endereço e contatos'); }
    finally { setIsSaving(false); }
  };

  const addCasa = async () => {
    try {
      await api.post(`/usuarios/${id}/casas-historico`, {
        casa_id: novaVinculacao.casa_id,
        data_inicio: novaVinculacao.data_inicio,
        data_fim: novaVinculacao.data_fim || null,
        funcao: Array.isArray(novaVinculacao.funcao) ? novaVinculacao.funcao.join(',') : (novaVinculacao.funcao || ''),
        is_superior: novaVinculacao.is_superior,
        pm: (novaVinculacao as any).pm || null,
        tipo: (novaVinculacao as any).tipo || null,
        pais: (novaVinculacao as any).pais || null,
      });
      fetchData();
      setNovaVinculacao({ casa_id: '', data_inicio: '', data_fim: '', funcao: [] as string[], is_superior: false, pm: '', tipo: '', pais: 'Brasil' } as any);
    } catch { alert('Erro ao vincular casa'); }
  };

  const removeCasa = async (vinculoId: number) => {
    if (!window.confirm('Remover este vínculo?')) return;
    try {
      await api.delete(`/usuarios/${id}/casas-historico/${vinculoId}`);
      fetchData();
    } catch { alert('Erro ao remover vínculo'); }
  };

  const uploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!pendingDocDesc.trim()) return alert('Informe a descrição do documento');

    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('descricao', pendingDocDesc);

    setIsSaving(true);
    try {
      await api.post(`/usuarios/${id}/documentos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPendingDocDesc('');
      if (fileInputRef.current) fileInputRef.current.value = ''; // reset input
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }, message?: string };
      const msg = err?.response?.data?.message || err?.message || 'Erro ao enviar documento';
      alert(`Erro ao enviar documento: ${msg}`);
    } finally { setIsSaving(false); }
  };

  const uploadReligiousDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!pendingReligiousDocDesc.trim()) return alert('Informe a descrição do documento');

    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('descricao', pendingReligiousDocDesc);

    setIsSaving(true);
    try {
      await api.post(`/usuarios/${id}/documentos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPendingReligiousDocDesc('');
      if (religiousFileInputRef.current) religiousFileInputRef.current.value = ''; // reset input
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }, message?: string };
      const msg = err?.response?.data?.message || err?.message || 'Erro ao enviar documento';
      alert(`Erro ao enviar documento: ${msg}`);
    } finally { setIsSaving(false); }
  };

  const removeDocument = async (docId: number) => {
    if (!window.confirm('Excluir este documento permanentemente?')) return;
    try {
      await api.delete(`/usuarios/${id}/documentos/${docId}`);
      fetchData();
    } catch { alert('Erro ao remover documento'); }
  };

  const saveItinerary = async () => {
    setIsSavingItinerary(true);
    try {
      await api.post(`/usuarios/${id}/itinerario`, { stages: itinerarioStages });
      alert('Itinerário atualizado com sucesso!');
    } catch { alert('Erro ao salvar itinerário'); }
    finally { setIsSavingItinerary(false); }
  };

  const saveBasicInfo = async () => {
    if (!missionario) return;
    setIsSaving(true);
    try {
      const payload: any = {
        nome: missionario.nome,
        login: missionario.login,
        situacao: missionario.situacao,
        is_oconomo: missionario.is_oconomo,
        is_superior: missionario.is_superior,
        proximos_passos: missionario.proximos_passos,
        role: 'PADRE',
        status: 'ATIVO'
      };

      if (newPassword.trim()) {
        payload.password = newPassword;
      }

      await api.put(`/usuarios/${id}`, payload);
      alert('Informações atualizadas com sucesso!');
      setNewPassword('');
    } catch (err: any) {
      alert('Erro ao salvar informações: ' + (err.response?.data?.message || err.message));
    }
    finally { setIsSaving(false); }
  };

  const saveProximosSteps = async () => {
    if (!missionario) return;
    setIsSaving(true);
    try {
      await api.put(`/usuarios/${id}`, { proximos_passos: missionario.proximos_passos });
      alert('Próximos passos atualizados!');
    } catch { alert('Erro ao salvar próximos passos'); }
    finally { setIsSaving(false); }
  };

  /*
  const handleItinDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, etapa: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setItinDocUploading(1); // placeholder
    const fd = new FormData();
    fd.append('arquivo', file);
    fd.append('descricao', `Doc Etapa: ${etapa}`);

    try {
      const res = await api.post(`/usuarios/${id}/documentos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newPath = res.data.url || res.data.arquivo_path;
      const existing = itinerarioStages.find(s => s.etapa === etapa);
      let newStages = [];
      if (existing) {
        newStages = itinerarioStages.map(s => s.etapa === etapa ? { ...s, doc_path: newPath } : s);
      } else {
        newStages = [...itinerarioStages, { etapa, local: '', periodo: '', doc_path: newPath, is_sub_etapa: false }];
      }
      setItinerarioStages(newStages);
      await api.post(`/usuarios/${id}/itinerario`, { stages: newStages });
    } catch {
      alert('Erro ao anexar documento');
    } finally {
      setItinDocUploading(null);
    }
  };
  */


  const handleGenericAdd = async (endpoint: string, data: Record<string, any>) => {
    setIsSaving(true);
    try {
      await api.post(`/usuarios/${id}/${endpoint}`, data);
      setShowAddForm(null);
      setTempForm({});
      fetchData();
    } catch { alert('Erro ao salvar registro'); }
    finally { setIsSaving(false); }
  };

  const uploadGenericDoc = async (e: React.ChangeEvent<HTMLInputElement>, endpoint: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('arquivo', file);
    formData.append('descricao', `Documento ${endpoint}`);

    setIsSaving(true);
    try {
      const res = await api.post(`/usuarios/${id}/documentos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTempForm(prev => ({ ...prev, cv_path: res.data.url }));
      alert('Documento enviado com sucesso!');
    } catch { alert('Erro ao enviar documento'); }
    finally { setIsSaving(false); }
  };

  const handleGenericDelete = async (endpoint: string, itemId: number) => {
    if (!window.confirm('Excluir este registro?')) return;
    try {
      await api.delete(`/usuarios/${id}/${endpoint}/${itemId}`);
      fetchData();
    } catch { alert('Erro ao remover registro'); }
  };

  if (isLoading) return <div className="perfil-loading"><Loader2 className="animate-spin" size={40} /><p>{t('profile.loading')}</p></div>;
  if (!missionario) return <div className="perfil-loading"><AlertCircle size={40} /><p>{t('profile.not_found')}</p></div>;

  // Tabs principais (só Dados Civis e Contatos)
  const mainTabs = [
    { key: 'dados', label: t('profile.tabs.personal'), icon: <User size={16} />, perm: 'dados_civis' },
    { key: 'contatos', label: t('profile.tabs.contact'), icon: <MapPin size={16} />, perm: 'contatos' },
  ];

  // Itens da sidebar esquerda em cascata (abas que saíram do menu)
  const sidebarItems = [
    { key: 'religiosos', label: t('profile.tabs.religious'), icon: <BookOpen size={16} />, perm: 'dados_religiosos' },
    { key: 'itinerario', label: t('profile.tabs.itinerary'), icon: <Activity size={16} />, perm: 'itinerario_formativo' },
    { key: 'carreira', label: t('profile.tabs.career'), icon: <GraduationCap size={16} />, perm: 'formacao_academica' },
    { key: 'saude', label: t('profile.tabs.health_finance'), icon: <ShieldCheck size={16} />, perm: 'saude' },
    { key: 'casas', label: t('profile.tabs.houses'), icon: <HomeIcon size={16} />, perm: null },
    { key: 'acesso', label: t('profile.tabs.access'), icon: <Lock size={16} />, perm: null },
    { key: 'obs', label: t('profile.tabs.obs'), icon: <FileText size={16} />, perm: 'observacoes' },
    { key: 'permissoes', label: t('profile.tabs.permissions'), icon: <ShieldCheck size={16} />, perm: null },
  ];

  const TABS = mainTabs.filter(tab => {
    if (isAdminGeral || (canEdit && authUser?.id !== missionario.id)) return true;
    if (!tab.perm) return true;
    return !!missionario.permissoes?.[tab.perm];
  });

  const SIDEBAR = sidebarItems.filter(tab => {
    if (isAdminGeral || (canEdit && authUser?.id !== missionario.id)) return true;
    if (!tab.perm) return true;
    return !!missionario.permissoes?.[tab.perm];
  });

  return (
    <div className="page-container">
      <div className="perfil-header">
        <button className="btn-back" onClick={() => navigate('/missionarios')}>
          <ChevronLeft size={18} /> {t('profile.back_btn')}
        </button>
        <div className="perfil-id">ID: #{missionario.id}</div>
      </div>

      <div className="perfil-top-card">
        <div className="perfil-avatar-wrapper">
          <div className="perfil-avatar">{missionario.nome.charAt(0)}</div>
          <div className={`perfil-status-dot ${(missionario.situacao || '').toLowerCase()}`}></div>
        </div>
        <div className="perfil-main-info" style={{ flex: 1 }}>
          <div className="perfil-name-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <h1>{missionario.nome}</h1>
              <span className={`situacao-tag-premium ${(missionario.situacao || '').toLowerCase()}`}>
                {missionario.situacao}
              </span>
            </div>
            {canEdit && (
              <button
                className="btn-edit-access"
                onClick={() => setActiveTab('acesso')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: '#013375',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Lock size={14} />
                Editar Minhas Informações
              </button>
            )}
          </div>
          <div className="perfil-badges-row">
            <div className="perfil-badge-item">
              <User size={14} />
              <span>{t('profile.missionary_role')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Layout principal: sidebar esquerda + conteúdo ── */}
      <div className="perfil-layout">

        {/* Sidebar esquerda em cascata */}
        <aside className="perfil-sidebar">
          <div className="sidebar-section-title">Mais Informações</div>
          <nav className="sidebar-nav">
            {SIDEBAR.map(item => (
              <button
                key={item.key}
                className={`sidebar-nav-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <span className="sidebar-nav-icon">{item.icon}</span>
                <span className="sidebar-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Área principal com tabs Dados Civis e Contatos */}
        <div className="perfil-main-area">
          <div className="perfil-tabs">
            {TABS.map(tab => (
              <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="perfil-content">
            {/* --- 1. DADOS CIVIS --- */}
            {activeTab === 'dados' && (
              <div className="tab-panel">
                <div className="section-card">
                  <h3 className="section-title"><User size={16} /> {t('profile.sections.civil')}</h3>
                  <div className="form-grid-3">

                    {/* Data de Nascimento */}
                    <div className="form-group">
                      <label>{t('missionaries.wizard.civil.birth_date')}</label>
                      <input type="date" value={civilData.data_nascimento} onChange={e => setCivilData({ ...civilData, data_nascimento: e.target.value })} disabled={!canEdit} />
                    </div>

                    {/* Nome do Pai */}
                    <div className="form-group">
                      <label>{t('profile.labels.father_name')}</label>
                      <input
                        type="text"
                        value={civilData.nome_pai || ''}
                        onChange={e => {
                          const v = e.target.value.replace(/[0-9]/g, '');
                          setCivilData({ ...civilData, nome_pai: v });
                        }}
                        disabled={!canEdit}
                        placeholder={t('profile.labels.father_name')}
                      />
                    </div>

                    {/* Nome da Mãe */}
                    <div className="form-group">
                      <label>{t('profile.labels.mother_name')}</label>
                      <input
                        type="text"
                        value={civilData.nome_mae || ''}
                        onChange={e => {
                          const v = e.target.value.replace(/[0-9]/g, '');
                          setCivilData({ ...civilData, nome_mae: v });
                        }}
                        disabled={!canEdit}
                        placeholder={t('profile.labels.mother_name')}
                      />
                    </div>

                    {/* Naturalidade — Cidade/Estado nascimento */}
                    <div className="form-group">
                      <label>{t('missionaries.wizard.civil.birth_place_city')}</label>
                      <input
                        type="text"
                        value={civilData.cidade_estado}
                        onChange={e => {
                          const v = e.target.value.replace(/[0-9]/g, '');
                          setCivilData({ ...civilData, cidade_estado: v });
                        }}
                        disabled={!canEdit}
                        placeholder="Ex: São Paulo, SP"
                      />
                    </div>

                    {/* País — texto */}
                    <div className="form-group">
                      <label>{t('missionaries.wizard.civil.country')}</label>
                      <input
                        type="text"
                        list="paises"
                        value={civilData.pais}
                        onChange={e => {
                          const v = e.target.value.replace(/[0-9]/g, '');
                          setCivilData({ ...civilData, pais: v });
                        }}
                        disabled={!canEdit}
                        placeholder="Ex: Brasil"
                      />
                      <datalist id="paises">{PAISES_COMMON.map(p => <option key={p} value={p} />)}</datalist>
                    </div>

                    {/* Diocese — texto */}
                    <div className="form-group">
                      <label>{t('missionaries.wizard.civil.diocese')}</label>
                      <input
                        type="text"
                        value={civilData.diocese}
                        onChange={e => {
                          const v = e.target.value.replace(/[0-9]/g, '');
                          setCivilData({ ...civilData, diocese: v });
                        }}
                        disabled={!canEdit}
                        placeholder="Ex: Diocese de São Paulo"
                      />
                    </div>

                    {/* RNM — até 10 dígitos */}
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        RG / RNM / CI / DI <FileText size={14} style={{ opacity: 0.5 }} />
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={civilData.rnm}
                        maxLength={10}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setCivilData({ ...civilData, rnm: v });
                        }}
                        disabled={!canEdit}
                        placeholder="000000000"
                      />
                    </div>

                    {/* CPF — exatamente 11 dígitos */}
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        CPF <FileText size={14} style={{ opacity: 0.5 }} />
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={civilData.cpf}
                        maxLength={11}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setCivilData({ ...civilData, cpf: v });
                        }}
                        disabled={!canEdit}
                        placeholder="00000000000"
                      />
                    </div>

                    {/* Título de Eleitor — exatamente 12 dígitos */}
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        Título Eleitor <FileText size={14} style={{ opacity: 0.5 }} />
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={civilData.titulo_eleitor}
                        maxLength={12}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 12);
                          setCivilData({ ...civilData, titulo_eleitor: v });
                        }}
                        disabled={!canEdit}
                        placeholder="000000000000"
                      />
                    </div>

                    {/* CNH — exatamente 11 dígitos */}
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        CNH <FileText size={14} style={{ opacity: 0.5 }} />
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={civilData.cnh}
                        maxLength={11}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setCivilData({ ...civilData, cnh: v });
                        }}
                        disabled={!canEdit}
                        placeholder="00000000000"
                      />
                    </div>

                    {/* Passaporte — alfanumérico, até 9 chars, letras maiúsculas */}
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        Passaporte <FileText size={14} style={{ opacity: 0.5 }} />
                      </label>
                      <input
                        type="text"
                        value={civilData.passaporte}
                        maxLength={9}
                        onChange={e => {
                          const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9);
                          setCivilData({ ...civilData, passaporte: v });
                        }}
                        disabled={!canEdit}
                        placeholder="AA000000"
                        style={{ fontFamily: 'monospace', letterSpacing: '2px' }}
                      />
                    </div>

                  </div>

                  <div className="section-header-flex" style={{ marginTop: '20px', marginBottom: '10px' }}>
                    <h4 className="wizard-divider-lite">{t('missionaries.wizard.civil.nationalities')}</h4>
                    {canEdit && (
                      <button className="btn-action-lite-text" onClick={() => setNacionalidades([...nacionalidades, ''])}>
                        <Plus size={14} /> {t('missionaries.wizard.civil.add_btn')}
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {nacionalidades.map((nac, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '5px' }}>
                        <input type="text" value={nac} onChange={e => {
                          const nn = [...nacionalidades];
                          nn[idx] = e.target.value;
                          setNacionalidades(nn);
                        }} placeholder="Nacionalidade..." style={{ flex: 1 }} disabled={!canEdit} />
                        {canEdit && idx > 0 && <button onClick={() => setNacionalidades(nacionalidades.filter((_, i) => i !== idx))} className="btn-action-lite delete"><Trash2 size={16} /></button>}
                      </div>
                    ))}
                  </div>
                  {canEdit && (
                    <div className="section-actions" style={{ marginTop: '20px' }}>
                      <button className="btn-save-perfil" onClick={saveCivil} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {t('profile.actions.save_civil')}
                      </button>
                    </div>
                  )}
                </div>



                {/* Seção de Documentos dentro da aba Dados */}
                <div className="section-card docs-section">
                  <h3 className="section-title"><FileText size={16} /> {t('profile.sections.docs')}</h3>

                  {canEdit && (
                    <div className="doc-upload-zone">
                      <div className="doc-upload-icon-area">
                        <Upload size={28} className="doc-upload-icon" />
                      </div>
                      <div className="doc-upload-fields">
                        <div className="form-group">
                          <label>{t('missionaries.wizard.docs.placeholder')}</label>
                          <input
                            type="text"
                            placeholder="Ex: RG, Passaporte, CPF..."
                            value={pendingDocDesc}
                            onChange={e => setPendingDocDesc(e.target.value)}
                          />
                        </div>
                        <input type="file" ref={fileInputRef} onChange={uploadDocument} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" />
                        <button
                          className="btn-upload-doc"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSaving}
                        >
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          {isSaving ? 'Enviando...' : t('profile.actions.upload_btn')}
                        </button>
                      </div>
                      <p className="doc-upload-hint">PDF, JPG ou PNG · máx. 20MB</p>
                    </div>
                  )}

                  {documentos.length === 0 ? (
                    <p className="empty-msg">Nenhum documento anexado.</p>
                  ) : (
                    <div className="docs-grid">
                      {documentos.map(doc => {
                        const ext = (doc.tipo_arquivo || 'file').toUpperCase();
                        const isPdf = ext === 'PDF';
                        const isImg = ['PNG', 'JPG', 'JPEG'].includes(ext);
                        return (
                          <div key={doc.id} className="doc-card">
                            <div className={`doc-card-icon ${isPdf ? 'pdf' : isImg ? 'img' : 'file'}`}>
                              {isPdf ? <FileText size={22} /> : isImg ? <Eye size={22} /> : <FileText size={22} />}
                              <span className="doc-type-badge">{ext}</span>
                            </div>
                            <div className="doc-card-body">
                              <span className="doc-card-name" title={doc.descricao}>{doc.descricao}</span>
                              <span className="doc-card-meta">
                                {doc.arquivo_nome && <span className="doc-filename" title={doc.arquivo_nome}>{doc.arquivo_nome}</span>}
                                <span className="doc-date">· {new Date(doc.data_upload).toLocaleDateString('pt-BR')}</span>
                              </span>
                            </div>
                            <div className="doc-card-actions">
                              <a href={getFileUrl(doc.url) || '#'} target="_blank" rel="noreferrer" className="doc-btn view" title="Visualizar">
                                <Eye size={15} />
                              </a>
                              <a href={getFileUrl(doc.url) || '#'} download={doc.arquivo_nome} className="doc-btn download" title="Download">
                                <Download size={15} />
                              </a>
                              {canEdit && (
                                <button className="doc-btn delete" onClick={() => removeDocument(doc.id)} title="Excluir">
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- 2. CONTATOS --- */}
            {activeTab === 'contatos' && (
              <div className="tab-panel">
                <div className="section-card">
                  <div className="section-header-flex">
                    <h3 className="section-title"><MapPin size={16} /> 2. Contatos</h3>
                    {canEdit && contatos.length < 3 && (
                      <button className="btn-action-lite-text" onClick={() => setContatos([...contatos, { parentesco: '', nome: '', endereco: '', telefone: '', email: '' }])}>
                        <Plus size={16} /> Adicionar Contato
                      </button>
                    )}
                  </div>

                  <div className="contatos-list" style={{ marginTop: '20px' }}>
                    {contatos.length === 0 && (
                      <p style={{ opacity: 0.6, textAlign: 'center', padding: '20px' }}>Nenhum contato cadastrado. Adicione até 3 contatos.</p>
                    )}
                    {contatos.map((contato, idx) => (
                      <div key={idx} className="contato-item-premium" style={{
                        padding: '20px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        border: '1px solid #e2e8f0',
                        position: 'relative'
                      }}>
                        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                          {canEdit && (
                            <button className="btn-action-lite delete" onClick={() => setContatos(contatos.filter((_, i) => i !== idx))}>
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                        <div className="form-grid-3">
                          <div className="form-group">
                            <label>Parentesco</label>
                            <select
                              value={['Pai', 'Mãe', 'Tio(a)', 'Primo'].includes(contato.parentesco) || contato.parentesco === '' ? contato.parentesco : 'Outros'}
                              onChange={e => {
                                const val = e.target.value;
                                const newC = [...contatos];
                                newC[idx].parentesco = val === 'Outros' ? 'Outros' : val;
                                setContatos(newC);
                              }}
                              disabled={!canEdit}
                              style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: 'white'
                              }}
                            >
                              <option value="">Selecione...</option>
                              <option value="Pai">Pai</option>
                              <option value="Mãe">Mãe</option>
                              <option value="Tio(a)">Tio(a)</option>
                              <option value="Primo">Primo</option>
                              <option value="Outros">Outros</option>
                            </select>

                            {(!['Pai', 'Mãe', 'Tio(a)', 'Primo'].includes(contato.parentesco) && contato.parentesco !== '') || contato.parentesco === 'Outros' ? (
                              <input
                                type="text"
                                placeholder="Qual parentesco? (ex: Padrasto)"
                                value={contato.parentesco === 'Outros' ? '' : contato.parentesco}
                                onChange={e => {
                                  const newC = [...contatos];
                                  newC[idx].parentesco = e.target.value;
                                  setContatos(newC);
                                }}
                                disabled={!canEdit}
                                style={{ marginTop: '8px', width: '100%' }}
                              />
                            ) : null}
                          </div>
                          <div className="form-group">
                            <label>Nome</label>
                            <input
                              type="text"
                              placeholder="Nome..."
                              value={contato.nome}
                              onChange={e => {
                                const newC = [...contatos];
                                newC[idx].nome = e.target.value;
                                setContatos(newC);
                              }}
                              disabled={!canEdit}
                            />
                          </div>
                          <div className="form-group">
                            <label>Telefone</label>
                            <input
                              type="text"
                              placeholder="(00) 00000-0000"
                              value={contato.telefone}
                              onChange={e => {
                                const newC = [...contatos];
                                newC[idx].telefone = e.target.value;
                                setContatos(newC);
                              }}
                              disabled={!canEdit}
                            />
                          </div>
                          <div className="form-group full">
                            <label>Endereço</label>
                            <input
                              type="text"
                              placeholder="Endereço completo..."
                              value={contato.endereco}
                              onChange={e => {
                                const newC = [...contatos];
                                newC[idx].endereco = e.target.value;
                                setContatos(newC);
                              }}
                              disabled={!canEdit}
                            />
                          </div>
                          <div className="form-group">
                            <label>E-mail</label>
                            <input
                              type="email"
                              placeholder="email@exemplo.com"
                              value={contato.email}
                              onChange={e => {
                                const newC = [...contatos];
                                newC[idx].email = e.target.value;
                                setContatos(newC);
                              }}
                              disabled={!canEdit}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {canEdit && (
                    <div className="section-actions" style={{ marginTop: '20px' }}>
                      <button className="btn-save-perfil" onClick={saveEndereco} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Salvar Contatos
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- ACESSO AO SISTEMA --- */}
            {activeTab === 'acesso' && (
              <div className="tab-panel">
                <div className="section-card">
                  <h3 className="section-title"><ShieldCheck size={16} /> Acesso ao Sistema</h3>
                  <div className="form-grid-2">
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Nome</label>
                      <input
                        type="text"
                        value={missionario.nome}
                        onChange={e => {
                          const v = e.target.value.replace(/[0-9]/g, '');
                          setMissionario({ ...missionario, nome: v });
                        }}
                        disabled={!canEdit}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="form-group">
                      <label>E-mail de Login</label>
                      <input
                        type="email"
                        value={missionario.login}
                        onChange={e => setMissionario({ ...missionario, login: e.target.value })}
                        disabled={!canEdit}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>Nova Senha (deixe em branco para não alterar)</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          disabled={!canEdit}
                          placeholder="••••••••"
                          style={{ width: '100%' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                        >
                          {showPassword ? <Eye size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="section-actions" style={{ marginTop: '20px' }}>
                      <button className="btn-save-perfil" onClick={saveBasicInfo} disabled={isSaving}>
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Atualizar Acesso
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- RELIGIOSOS & ITINERÁRIO --- */}
            {activeTab === 'religiosos' && (
              <div className="tab-panel">
                <div className="section-card">
                  <h3 className="section-title"><BookOpen size={16} /> {t('profile.sections.religious')}</h3>
                  <div className="form-grid-3">
                    <div className="form-group"><label>Batismo</label><input type="date" value={religiososData.data_batismo} onChange={e => setReligiososData({ ...religiososData, data_batismo: e.target.value })} disabled={!canEdit} /></div>
                    <div className="form-group"><label>1ª Comunhão</label><input type="date" value={religiososData.data_primeira_comunhao} onChange={e => setReligiososData({ ...religiososData, data_primeira_comunhao: e.target.value })} disabled={!canEdit} /></div>
                    <div className="form-group"><label>Crisma</label><input type="date" value={religiososData.data_crisma} onChange={e => setReligiososData({ ...religiososData, data_crisma: e.target.value })} disabled={!canEdit} /></div>
                  </div>

                  <div className="section-title mt-4">
                    <h3>Anexar Certidão</h3>
                  </div>
                  <div className="form-grid-1">
                    <div className="form-group full">
                      <label>Descrição do documento</label>
                      <input
                        type="text"
                        placeholder="Ex: Certidão de Batismo"
                        value={pendingReligiousDocDesc}
                        onChange={e => setPendingReligiousDocDesc(e.target.value)}
                        disabled={!canEdit}
                      />
                    </div>
                    <div className="form-group full">
                      <label>Anexar arquivo</label>
                      <div className="file-input-wrapper" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input type="file" ref={religiousFileInputRef} onChange={uploadReligiousDocument} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png" disabled={!canEdit} />
                        <button type="button" className="btn-upload-doc" onClick={() => religiousFileInputRef.current?.click()} disabled={!canEdit || isSaving}>
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          {isSaving ? 'Enviando...' : 'Selecionar arquivo'}
                        </button>
                        <span style={{ color: '#555', fontSize: '0.95rem' }}>PDF/JPG/PNG</span>
                      </div>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="section-actions" style={{ marginTop: '20px' }}>
                      <button className="btn-save-perfil" onClick={saveReligiosos} disabled={isSaving}>
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={18} />}
                        {t('profile.actions.save_religious')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- 4. ITINERÁRIO FORMATIVO --- */}
            {activeTab === 'itinerario' && (
              <div className="tab-panel">
                <div className="section-card">
                  <h3 className="section-title"><Activity size={16} /> 4. Itinerário Formativo</h3>
                  <div className="itinerary-full-grid">
                    <div className="wizard-divider-lite" style={{ gridColumn: '1 / -1' }}>4.1 Formação Inicial</div>
                    {[
                      { label: '4.1.1 Seminário Menor', etapa: '4.1.1' },
                      { label: '4.1.2 Propedêutico', etapa: '4.1.2' },
                      { label: '4.1.3 Filosofia', etapa: '4.1.3' },
                      { label: '4.1.4 Postulado', etapa: '4.1.4' },
                      { label: '4.1.5 Noviciado', etapa: '4.1.5' },
                      { label: '4.1.6 Teologia', etapa: '4.1.6' },
                      { label: '4.1.7 Tirocínio', etapa: '4.1.7' },
                    ].map((seg) => {
                      const stage = itinerarioStages.find(s => s.etapa === seg.etapa) || { etapa: seg.etapa, local: '', periodo: '', doc_path: '', is_sub_etapa: false };
                      return (
                        <div key={seg.etapa} className="itinerary-row-card">
                          <div className="itin-label">{seg.label}</div>
                          <div className="itin-inputs">
                            <input type="text" placeholder="Local" value={stage.local} onChange={e => {
                              const ns = [...itinerarioStages.filter(s => s.etapa !== seg.etapa), { ...stage, local: e.target.value }];
                              setItinerarioStages(ns);
                            }} disabled={!canEdit} />
                            <input type="text" placeholder="Período" value={stage.periodo} onChange={e => {
                              const ns = [...itinerarioStages.filter(s => s.etapa !== seg.etapa), { ...stage, periodo: e.target.value }];
                              setItinerarioStages(ns);
                            }} disabled={!canEdit} />
                            <div className="itin-doc-actions">
                              {stage.doc_path ? (
                                <a href={getFileUrl(stage.doc_path) || '#'} target="_blank" rel="noreferrer" className="btn-itin-doc success"><FileText size={14} /> Ver</a>
                              ) : (
                                <button className="btn-itin-doc" onClick={() => { activeEtapaRef.current = seg.etapa; itinFileInputRef.current?.click(); }} disabled={!canEdit}>
                                  <Plus size={14} /> Anexar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="wizard-divider-lite" style={{ gridColumn: '1 / -1', marginTop: '20px' }}>4.2 Vida Religiosa & 4.3 Ministérios</div>
                    {[
                      { label: '4.2.1 Primeira Profissão', etapa: '4.2.1' },
                      { label: '4.2.2 Renovação Votos', etapa: '4.2.2' },
                      { label: '4.2.3 Profissão Perpétua', etapa: '4.2.3' },
                      { label: '4.3.1 Leitorado', etapa: '4.3.1' },
                      { label: '4.3.2 Acolitado', etapa: '4.3.2' },
                      { label: '4.3.3 Diaconato', etapa: '4.3.3' },
                      { label: '4.3.4 Presbiterato', etapa: '4.3.4' },
                      { label: '4.4 Destinação', etapa: '4.4' },
                    ].map((seg) => {
                      const stage = itinerarioStages.find(s => s.etapa === seg.etapa) || { etapa: seg.etapa, local: '', periodo: '', doc_path: '', is_sub_etapa: false };
                      return (
                        <div key={seg.etapa} className="itinerary-row-card simple">
                          <div className="itin-label">{seg.label}</div>
                          <div className="itin-inputs">
                            <input type="text" placeholder="Observação/Lugar" value={stage.local} onChange={e => {
                              const ns = [...itinerarioStages.filter(s => s.etapa !== seg.etapa), { ...stage, local: e.target.value }];
                              setItinerarioStages(ns);
                            }} disabled={!canEdit} />
                            <div className="itin-doc-actions">
                              {stage.doc_path ? (
                                <a href={getFileUrl(stage.doc_path) || '#'} target="_blank" rel="noreferrer" className="btn-itin-doc success"><FileText size={14} /> Ver</a>
                              ) : (
                                <button className="btn-itin-doc" onClick={() => { activeEtapaRef.current = seg.etapa; itinFileInputRef.current?.click(); }} disabled={!canEdit}>
                                  <Plus size={14} /> Doc
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {canEdit && (
                    <button className="btn-save-perfil" onClick={saveItinerary} disabled={isSavingItinerary} style={{ marginTop: '20px' }}>
                      {isSavingItinerary ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Salvar Itinerário
                    </button>
                  )}
                </div>

                <div className="section-card">
                  <h3 className="section-title"><Activity size={16} /> Próximos Passos</h3>
                  <textarea
                    className="steps-textarea"
                    placeholder="Descreva os próximos passos para este missionário..."
                    value={missionario.proximos_passos || ''}
                    onChange={e => setMissionario({ ...missionario, proximos_passos: e.target.value })}
                    disabled={!canEdit}
                    rows={5}
                  />
                  {canEdit && <button className="btn-save-perfil" onClick={saveProximosSteps} style={{ marginTop: '10px' }}>{t('common.save')}</button>}
                </div>
              </div>
            )}

            {/* --- CARREIRA & MISSÃO --- */}
            {activeTab === 'carreira' && (
              <div className="tab-panel">
                <div className="section-card">
                  <div className="section-header-flex">
                    <h3 className="section-title"><GraduationCap size={16} /> 5. Formação Acadêmica</h3>
                    {canEdit && <button className="btn-action-lite-text" onClick={() => setShowAddForm('formacao')}><Plus size={14} /> Adicionar</button>}
                  </div>
                  <div className="generic-list">
                    {formacaoAcademica.map(f => (
                      <div key={f.id} className="list-item-card-premium">
                        <div className="item-icon-container icon-formacao">
                          <GraduationCap size={20} />
                        </div>
                        <div className="item-main-content">
                          <strong>{f.curso}</strong>
                          <div className="item-subtitle">{f.faculdade} • {f.periodo}</div>
                        </div>
                        <div className="item-actions-premium">
                          {f.doc_path && <a href={getFileUrl(f.doc_path) || '#'} target="_blank" rel="noreferrer" className="btn-action-lite" title="Baixar Diploma"><Download size={14} /></a>}
                          {canEdit && <button className="btn-action-lite delete" onClick={() => handleGenericDelete('formacao-academica', f.id)} title="Excluir"><Trash2 size={14} /></button>}
                        </div>
                      </div>
                    ))}
                    {formacaoAcademica.length === 0 && <p className="empty-msg">Nenhuma formação acadêmica registrada.</p>}
                  </div>
                </div>

                <div className="section-card">
                  <div className="section-header-flex">
                    <h3 className="section-title"><MapPin size={16} /> 6. Atividade Missionária</h3>
                    {canEdit && <button className="btn-action-lite-text" onClick={() => setShowAddForm('atividade')}><Plus size={14} /> Adicionar</button>}
                  </div>
                  <div className="generic-list">
                    {atividadesMissionarias.map(a => (
                      <div key={a.id} className="list-item-card-premium">
                        <div className="item-icon-container icon-missao">
                          <MapPin size={20} />
                        </div>
                        <div className="item-main-content">
                          <strong>{a.lugar}</strong>
                          <div className="item-subtitle">{a.periodo}</div>
                          {a.missao && <div className="item-description">{a.missao}</div>}
                        </div>
                        <div className="item-actions-premium">
                          {canEdit && <button className="btn-action-lite delete" onClick={() => handleGenericDelete('atividade-missionaria', a.id)} title="Excluir"><Trash2 size={14} /></button>}
                        </div>
                      </div>
                    ))}
                    {atividadesMissionarias.length === 0 && <p className="empty-msg">Nenhuma atividade missionária registrada.</p>}
                  </div>
                </div>

                <div className="section-card">
                  <div className="section-header-flex">
                    <h3 className="section-title"><Star size={16} /> 11. Obras Realizadas</h3>
                    {canEdit && <button className="btn-action-lite-text" onClick={() => setShowAddForm('obras')}><Plus size={14} /> Adicionar</button>}
                  </div>
                  <div className="generic-list">
                    {obrasRealizadas.map(o => (
                      <div key={o.id} className="list-item-card-premium">
                        <div className="item-icon-container icon-obra">
                          <Star size={20} />
                        </div>
                        <div className="item-main-content">
                          <strong>{o.lugar}</strong>
                          <div className="item-subtitle">{o.periodo}</div>
                          {o.obra && <div className="item-description">{o.obra}</div>}
                        </div>
                        <div className="item-actions-premium">
                          {canEdit && <button className="btn-action-lite delete" onClick={() => handleGenericDelete('obras-realizadas', o.id)} title="Excluir"><Trash2 size={14} /></button>}
                        </div>
                      </div>
                    ))}
                    {obrasRealizadas.length === 0 && <p className="empty-msg">Nenhuma obra registrada.</p>}
                  </div>
                </div>

                {/* --- 13. QUADRO DE PESSOAL CV --- */}
                <div className="section-card">
                  <div className="section-header-flex">
                    <h3 className="section-title"><ShieldCheck size={16} /> 13. Quadro de Pessoal CV</h3>
                    {canEdit && (
                      <button className="btn-action-lite-text" onClick={() => {
                        setTempForm({
                          funcao_atual: quadroPessoal?.funcao_atual || '',
                          competencias: quadroPessoal?.competencias || '',
                          cv_path: quadroPessoal?.cv_path || ''
                        });
                        setShowAddForm('quadro');
                      }}>
                        <Plus size={14} /> {quadroPessoal ? 'Editar' : 'Adicionar'}
                      </button>
                    )}
                  </div>
                  {quadroPessoal ? (
                    <div className="list-item-card-premium">
                      <div className="item-icon-container" style={{ background: '#eff6ff', color: '#1d4ed8', padding: '10px', borderRadius: '10px' }}>
                        <Users size={20} />
                      </div>
                      <div className="item-main-content">
                        <strong>Função Atual: {quadroPessoal.funcao_atual}</strong>
                        <div className="item-description" style={{ marginTop: '10px' }}>
                          <strong>Competências/Resumo:</strong>
                          <p>{quadroPessoal.competencias}</p>
                        </div>
                      </div>
                      <div className="item-actions-premium">
                        {quadroPessoal.cv_path && (
                          <a href={getFileUrl(quadroPessoal.cv_path) || '#'} target="_blank" rel="noreferrer" className="btn-action-lite" title="Ver CV">
                            <Eye size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="empty-msg">Nenhuma informação de quadro de pessoal registrada.</p>
                  )}
                </div>
              </div>
            )}

            {/* --- SAÚDE & FINANCEIRO --- */}
            {activeTab === 'saude' && (
              <div className="tab-panel">
                <div className="section-card">
                  <div className="section-header-flex">
                    <h3 className="section-title"><Activity size={16} /> 7. Saúde</h3>
                    {canEdit && <button className="btn-action-lite-text" onClick={() => setShowAddForm('saude')}><Plus size={14} /> Adicionar Registro</button>}
                  </div>
                  <div className="generic-list">
                    {saudeRecords.map(s => (
                      <div key={s.id} className="list-item-card-premium">
                        <div className="item-icon-container icon-saude">
                          <Activity size={20} />
                        </div>
                        <div className="item-main-content">
                          <strong>{s.seguradora || 'Seguradora não informada'}</strong>
                          <div className="item-subtitle">CNS: {s.sus_card || 'N/A'} • Carteira: {s.numero_carteira || 'N/A'}</div>
                        </div>
                        <div className="item-actions-premium">
                          {canEdit && <button className="btn-action-lite delete" onClick={() => handleGenericDelete('saude', s.id)} title="Excluir"><Trash2 size={14} /></button>}
                        </div>
                      </div>
                    ))}
                    {saudeRecords.length === 0 && <p className="empty-msg">Nenhum registro de saúde cadastrado.</p>}
                  </div>
                </div>

                <div className="section-card">
                  <h3 className="section-title"><ShieldCheck size={16} /> 8. Previdenciário / IR</h3>
                  <div className="form-group" style={{ maxWidth: '400px' }}>
                    <label>NIT (Número de Identificação do Trabalhador)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="text" value={nit} onChange={e => setNit(e.target.value)} disabled={!canEdit} placeholder="Digite o NIT..." />
                      {canEdit && <button className="btn-save-perfil" onClick={saveCivil} style={{ padding: '0 15px' }} title="Salvar NIT"><Save size={16} /></button>}
                    </div>
                  </div>
                </div>

                <div className="section-card">
                  <div className="section-header-flex">
                    <h3 className="section-title"><DollarSign size={16} /> 9. Contas Bancárias</h3>
                    {canEdit && <button className="btn-action-lite-text" onClick={() => setShowAddForm('banco')}><Plus size={14} /> Adicionar</button>}
                  </div>
                  <div className="generic-list">
                    {contasBancarias.map(b => (
                      <div key={b.id} className="list-item-card-premium">
                        <div className="item-icon-container icon-banco">
                          <DollarSign size={20} />
                        </div>
                        <div className="item-main-content">
                          <strong>{b.tipo_conta} • {b.titularidade}</strong>
                          <div className="item-subtitle">Ag: {b.agencia} • Conta: {b.numero}</div>
                        </div>
                        <div className="item-actions-premium">
                          {canEdit && <button className="btn-action-lite delete" onClick={() => handleGenericDelete('contas-bancarias', b.id)} title="Excluir"><Trash2 size={14} /></button>}
                        </div>
                      </div>
                    ))}
                    {contasBancarias.length === 0 && <p className="empty-msg">Nenhuma conta bancária registrada.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* --- CASAS --- */}
            {activeTab === 'casas' && (
              <div className="tab-panel">
                {canEdit && (
                  <div className="section-card">
                    <h3 className="section-title"><Plus size={16} /> Presença Missionária</h3>
                    <div className="form-grid-3">
                      <div className="form-group">
                        <label>{t('missionaries.wizard.houses.select_house')}</label>
                        <select value={novaVinculacao.casa_id} onChange={e => setNovaVinculacao(p => ({ ...p, casa_id: e.target.value }))}>
                          <option value="">Selecione...</option>
                          {casasDisponiveis.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Tipo</label>
                        <select value={(novaVinculacao as any).tipo || ''} onChange={e => setNovaVinculacao(p => ({ ...p, tipo: e.target.value }))}>
                          <option value="">Selecione...</option>
                          <option value="CI">Casas de Idosos – CI</option>
                          <option value="CR">Casas Religiosas – CR</option>
                          <option value="M">Obras – M</option>
                          <option value="P">Paróquia – P</option>
                          <option value="PV">Pastoral Vocacional - PV</option>
                          <option value="CS">Seminário - CS</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>PM</label>
                        <input type="text" value={(novaVinculacao as any).pm || ''} onChange={e => setNovaVinculacao(p => ({ ...p, pm: e.target.value }))} placeholder="Ex: CR 13" />
                      </div>
                      <div className="form-group">
                        <label>País</label>
                        <input type="text" list="paises-list" value={(novaVinculacao as any).pais || 'Brasil'} onChange={e => setNovaVinculacao(p => ({ ...p, pais: e.target.value }))} placeholder="Selecione ou digite..." />
                        <datalist id="paises-list">
                          {PAISES_COMMON.map(p => <option key={p} value={p} />)}
                        </datalist>
                      </div>
                      <div className="form-group"><label>{t('missionaries.wizard.houses.start_date')}</label><input type="date" value={novaVinculacao.data_inicio} onChange={e => setNovaVinculacao(p => ({ ...p, data_inicio: e.target.value }))} /></div>
                      <div className="form-group"><label>Data de Saída (opcional)</label><input type="date" value={novaVinculacao.data_fim} onChange={e => setNovaVinculacao(p => ({ ...p, data_fim: e.target.value }))} /></div>
                      <div className="form-group" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {[
                          { key: 'Superior Local', label: 'Superior Local', isSuperior: true },
                          { key: 'Pároco', label: 'Pároco' },
                          { key: 'Diretor', label: 'Diretor (rádios, escolas, fundações, escritórios)' },
                          { key: 'Ecônomo Local', label: 'Ecônomo Local' },
                          { key: 'Vigário', label: 'Vigário' },
                          { key: 'Reitor', label: 'Reitor (seminários)' },
                        ].map(r => (
                            <label key={r.key} className="checkbox-label" style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                checked={Array.isArray(novaVinculacao.funcao) && novaVinculacao.funcao.includes(r.key)}
                                onChange={e => setNovaVinculacao(p => {
                                  const current = Array.isArray(p.funcao) ? [...p.funcao] : [];
                                  if (e.target.checked) {
                                    if (!current.includes(r.key)) current.push(r.key);
                                  } else {
                                    const idx = current.indexOf(r.key);
                                    if (idx >= 0) current.splice(idx, 1);
                                  }
                                  return { ...p, funcao: current, is_superior: current.includes('Superior Local') };
                                })}
                              />
                              {r.label}
                            </label>
                        ))}
                      </div>
                  </div>
                  <button className="btn-save-perfil" onClick={addCasa}><Plus size={16} /> {t('profile.actions.bind_btn')}</button>
                </div>
                )}
                <div className="section-card">
                  <h3 className="section-title"><HomeIcon size={16} /> Histórico de Presença</h3>
                  <div className="casas-list">
                    {casasHistorico.filter(c => Array.isArray(c.funcao) && ['Superior Local','Pároco','Diretor','Ecônomo Local','Vigário','Reitor'].some(r => c.funcao.includes(r))).map(c => (
                      <div key={c.id} className={`casa-item ${!c.data_fim ? 'casa-ativa' : ''}`}>
                        <div className="casa-info">
                          <span className="casa-nome">{c.casa_nome}</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                            {c.is_superior && <span className="superior-badge"><Star size={11} /> Superior</span>}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '6px', flexWrap: 'wrap' }}>
                              {Array.isArray(c.funcao) && c.funcao.length > 0 ? (
                                c.funcao.map((f, idx) => (
                                  <span key={idx} className="role-badge" style={{ background: '#eef2ff', color: '#1e3a8a', padding: '4px 8px', borderRadius: '8px', fontSize: '12px' }}>{f}</span>
                                ))
                              ) : null}
                            </div>
                            <span className="duracao-pill" style={{ background: '#f0f4f8', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>⏱ {calcDuracao(c.data_inicio, c.data_fim)}</span>
                          </div>
                          <span className="casa-periodo" style={{ marginTop: '4px', display: 'block', fontSize: '12px', color: '#666' }}>
                            {formatDateLocal(c.data_inicio)} → {c.data_fim ? formatDateLocal(c.data_fim) : 'Atual'}
                          </span>
                        </div>
                        {canEdit && <button className="btn-action-lite delete" onClick={() => removeCasa(c.id)}><Trash2 size={16} /></button>}
                      </div>
                    ))}
                    {casasHistorico.filter(c => Array.isArray(c.funcao) && ['Superior Local','Pároco','Diretor','Ecônomo Local','Vigário','Reitor'].some(r => c.funcao.includes(r))).length === 0 && <p className="empty-msg">Nenhuma casa vinculada.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* --- OBSERVATIONS --- */}
            {activeTab === 'obs' && (
              <div className="tab-panel">
                <div className="section-card">
                  <div className="section-header-flex">
                    <h3 className="section-title"><FileText size={16} /> 12. Observações Gerais</h3>
                    {canEdit && <button className="btn-save-perfil" onClick={() => setShowAddForm('obs')}><Plus size={16} /> Nova Obs</button>}
                  </div>
                  <div className="obs-list" style={{ marginTop: '20px' }}>
                    {observacoesGerais.map(o => (
                      <div key={o.id} className="obs-entry-card">
                        <div className="obs-date">{new Date(o.created_at).toLocaleString()}</div>
                        <div className="obs-text">{o.texto}</div>
                        {canEdit && (
                          <div className="obs-actions">
                            <button className="btn-action-lite delete" onClick={() => handleGenericDelete('observacoes-gerais', o.id)}><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- PERMISSÕES --- */}
            {activeTab === 'permissoes' && (
              <div className="tab-panel">
                <div className="section-card">
                  <h3 className="section-title"><ShieldCheck size={16} /> Permissões de Visualização</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Abaixo estão as seções do cadastro que este missionário tem permissão para visualizar no seu próprio perfil.
                  </p>

                  <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                      {PERMISSIONS_LIST.map(perm => {
                        const isGranted = !!missionario.permissoes?.[perm.id];
                        return (
                          <div key={perm.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: 'white',
                            borderRadius: '8px',
                            border: `1px solid ${isGranted ? '#10b981' : '#e2e8f0'}`,
                            opacity: isGranted ? 1 : 0.6
                          }}>
                            {isGranted ? (
                              <CheckCircle size={18} style={{ color: '#10b981' }} />
                            ) : (
                              <Lock size={18} style={{ color: '#94a3b8' }} />
                            )}
                            <span style={{
                              fontSize: '0.85rem',
                              fontWeight: isGranted ? 600 : 400,
                              color: isGranted ? '#0f172a' : '#64748b'
                            }}>
                              {perm.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {(isAdminGeral || canEdit) && (
                    <div style={{ marginTop: '20px', padding: '15px', background: '#eff6ff', borderRadius: '8px', color: '#1e40af', fontSize: '0.85rem' }}>
                      <strong>Nota de Administrador:</strong> Você pode alterar estas permissões na tela de <a href="/administradores" style={{ color: '#013375', fontWeight: 700 }}>Gestão de Acessos</a> ou editando o cadastro do missionário.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- MODAL --- */}
            {showAddForm && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Adicionar {showAddForm === 'formacao' ? 'Formação' : showAddForm === 'atividade' ? 'Atividade' : showAddForm === 'obras' ? 'Obra' : showAddForm === 'saude' ? 'Registro de Saúde' : showAddForm === 'banco' ? 'Conta Bancária' : 'Observação'}</h3>
                  <div className="form-grid-1" style={{ gap: '15px' }}>
                    {showAddForm === 'formacao' && (
                      <>
                        <div className="form-group"><label>Curso</label><input type="text" onChange={e => setTempForm({ ...tempForm, curso: e.target.value })} /></div>
                        <div className="form-group"><label>Instituição</label><input type="text" onChange={e => setTempForm({ ...tempForm, faculdade: e.target.value })} /></div>
                        <div className="form-group"><label>Período</label><input type="text" placeholder="Ex: 2018-2022" onChange={e => setTempForm({ ...tempForm, periodo: e.target.value })} /></div>
                      </>
                    )}
                    {showAddForm === 'atividade' && (
                      <>
                        <div className="form-group"><label>Lugar</label><input type="text" onChange={e => setTempForm({ ...tempForm, lugar: e.target.value })} /></div>
                        <div className="form-group"><label>Período</label><input type="text" onChange={e => setTempForm({ ...tempForm, periodo: e.target.value })} /></div>
                        <div className="form-group"><label>Descrição da Missão</label><textarea rows={3} onChange={e => setTempForm({ ...tempForm, missao: e.target.value })} /></div>
                      </>
                    )}
                    {showAddForm === 'obras' && (
                      <>
                        <div className="form-group"><label>Lugar</label><input type="text" onChange={e => setTempForm({ ...tempForm, lugar: e.target.value })} /></div>
                        <div className="form-group"><label>Período</label><input type="text" onChange={e => setTempForm({ ...tempForm, periodo: e.target.value })} /></div>
                        <div className="form-group"><label>Obra Realizada</label><textarea rows={3} onChange={e => setTempForm({ ...tempForm, obra: e.target.value })} /></div>
                      </>
                    )}
                    {showAddForm === 'saude' && (
                      <>
                        <div className="form-group"><label>CNS (Cartão SUS)</label><input type="text" onChange={e => setTempForm({ ...tempForm, sus_card: e.target.value })} /></div>
                        <div className="form-group"><label>Seguradora</label><input type="text" onChange={e => setTempForm({ ...tempForm, seguradora: e.target.value })} /></div>
                        <div className="form-group"><label>Nº Carteira</label><input type="text" onChange={e => setTempForm({ ...tempForm, numero_carteira: e.target.value })} /></div>
                      </>
                    )}
                    {showAddForm === 'banco' && (
                      <>
                        <div className="form-group"><label>Tipo de Conta</label><input type="text" placeholder="Ex: Corrente, Poupança" onChange={e => setTempForm({ ...tempForm, tipo_conta: e.target.value })} /></div>
                        <div className="form-group"><label>Titularidade</label><input type="text" onChange={e => setTempForm({ ...tempForm, titularidade: e.target.value })} /></div>
                        <div className="form-group"><label>Agência</label><input type="text" onChange={e => setTempForm({ ...tempForm, agencia: e.target.value })} /></div>
                        <div className="form-group"><label>Número Conta</label><input type="text" onChange={e => setTempForm({ ...tempForm, numero: e.target.value })} /></div>
                      </>
                    )}
                    {showAddForm === 'quadro' && (
                      <>
                        <div className="form-group"><label>Função Atual</label><input type="text" value={tempForm.funcao_atual || ''} onChange={e => setTempForm({ ...tempForm, funcao_atual: e.target.value })} /></div>
                        <div className="form-group"><label>Competências / Resumo</label><textarea rows={4} value={tempForm.competencias || ''} onChange={e => setTempForm({ ...tempForm, competencias: e.target.value })} /></div>
                        <div className="form-group">
                          <label>CV / Documento (PDF ou JPEG)</label>
                          <div className="file-input-wrapper">
                            <input type="file" onChange={e => uploadGenericDoc(e, 'quadro-pessoal')} />
                          </div>
                        </div>
                      </>
                    )}
                    {showAddForm === 'obs' && (
                      <div className="form-group"><label>Texto da Observação</label><textarea rows={6} onChange={e => setTempForm({ ...tempForm, texto: e.target.value })} /></div>
                    )}
                  </div>
                  <div className="modal-actions" style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="btn-back" onClick={() => setShowAddForm(null)}>Cancelar</button>
                    <button className="btn-save-perfil" onClick={() => {
                      const endpoint = showAddForm === 'formacao' ? 'formacao-academica' :
                        showAddForm === 'atividade' ? 'atividade-missionaria' :
                          showAddForm === 'obras' ? 'obras-realizadas' :
                            showAddForm === 'saude' ? 'saude' :
                              showAddForm === 'banco' ? 'contas-bancarias' :
                                showAddForm === 'obs' ? 'observacoes-gerais' :
                                  showAddForm === 'quadro' ? 'quadro-pessoal' : '';
                      handleGenericAdd(endpoint, tempForm);
                    }}>Confirmar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>{/* fim perfil-main-area */}
      </div>{/* fim perfil-layout */}
    </div>
  );
};

export default PerfilMissionario;
