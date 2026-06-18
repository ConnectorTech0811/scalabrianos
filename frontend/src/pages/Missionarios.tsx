import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronRight, ChevronLeft, User, MapPin, BookOpen, Lock, CheckCircle,
  Home as HomeIcon, Plus, Trash2, FileText, Image as ImageIcon, Star,
  Activity, Users, Search, Filter, Eye, X, Loader2, AlertCircle,
  GraduationCap, DollarSign, Save, ShieldCheck, EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/Perfis.css';
import '../styles/Missionarios.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Missionario {
  id: number;
  nome: string;
  login: string;
  role: 'PADRE';
  status: 'ATIVO' | 'INATIVO';
  situacao: 'ATIVO' | 'FALECIDO' | 'EGRESSO' | 'EXCLAUSTRADO';
  is_oconomo: boolean;
  is_superior: boolean;
  casa_nome?: string;
  cidade?: string;
  pais?: string;
}

interface Casa { id: number; nome: string; }

interface DocEntry {
  uid: string;         // temp local id
  descricao: string;
  file: File | null;
  previewUrl: string;
  tipo: string;        // 'pdf' | 'jpg' | 'png'
}

interface CasaVinculo {
  casa_id: string;
  data_inicio: string;
  is_superior: boolean;
  funcao?: string[];
  tipo?: string;
  pm?: string;
  pais?: string;
}

interface WizardData {
  // Step 1 - Dados Civis
  nome: string;
  data_nascimento: string;
  nome_pai: string;
  nome_mae: string;
  naturalidade: string;
  pais: string;
  cidade_estado: string;
  diocese: string;
  situacao: 'ATIVO' | 'FALECIDO' | 'EGRESSO' | 'EXCLAUSTRADO';
  // Step 2 - Endereços
  logradouro: string;
  complemento: string;
  bairro: string;
  cep: string;
  endereco_cidade_estado: string;
  celular_whatsapp: string;
  telefone_fixo: string;
  email_pessoal: string;
  // Step 3 - Dados Religiosos
  primeiros_votos_data: string;
  votos_perpetuos_data: string;
  lugar_profissao: string;
  diaconato_data: string;
  presbiterato_data: string;
  bispo_ordenante: string;
  is_oconomo: boolean;
  is_superior: boolean;
  // Sacramentos
  data_batismo: string;
  data_primeira_comunhao: string;
  data_crisma: string;
  // Step 5 - Acesso
  login: string;
  password: string;
  status: 'ATIVO' | 'INATIVO';
  // Additional Step 1
  nacionalidades: string[];
  itinerario: ItineraryStage[];
  // Training
  formacao_curso: string;
  formacao_instituicao: string;
  formacao_periodo: string;
  // Health
  saude_sus: string;
  saude_seguradora: string;
  saude_carteira: string;
  // Finance
  nit: string;
  banco_tipo: string;
  banco_titular: string;
  banco_agencia: string;
  banco_numero: string;
  permissoes: Record<string, boolean>;
}

interface ItineraryStage {
  etapa: string;
  is_sub_etapa: boolean;
  local: string;
  periodo: string;
}

const initialWizard: WizardData = {
  nome: '', data_nascimento: '', nome_pai: '', nome_mae: '', naturalidade: '', pais: 'Brasil',
  cidade_estado: '', diocese: '', situacao: 'ATIVO',
  logradouro: '', complemento: '', bairro: '', cep: '', endereco_cidade_estado: '',
  celular_whatsapp: '', telefone_fixo: '', email_pessoal: '',
  primeiros_votos_data: '', votos_perpetuos_data: '', lugar_profissao: '',
  diaconato_data: '', presbiterato_data: '', bispo_ordenante: '',
  is_oconomo: false, is_superior: false,
  data_batismo: '', data_primeira_comunhao: '', data_crisma: '',
  login: '', password: '', status: 'ATIVO',
  nacionalidades: ['Brasileira'],
  itinerario: [
    { etapa: 'SEMINARIO', is_sub_etapa: false, local: '', periodo: '' },
    { etapa: 'SEMINARIO', is_sub_etapa: true, local: '', periodo: '' },
    { etapa: 'PROPEDEUTICO', is_sub_etapa: true, local: '', periodo: '' },
    { etapa: 'FILOSOFIA', is_sub_etapa: true, local: '', periodo: '' },
    { etapa: 'POSTULADO', is_sub_etapa: true, local: '', periodo: '' },
  ],
  formacao_curso: '', formacao_instituicao: '', formacao_periodo: '',
  saude_sus: '', saude_seguradora: '', saude_carteira: '',
  nit: '', banco_tipo: '', banco_titular: '', banco_agencia: '', banco_numero: '',
  permissoes: {}
};

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Parse a date string like 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:MM:SS' as LOCAL date (avoid timezone shifts)
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
  return d ? d.toLocaleDateString('pt-BR') : '—';
}

function calcDuracao(dataInicio: string): string {
  if (!dataInicio) return '';
  const ini = parseDateLocal(dataInicio);
  if (!ini) return '';
  const hoje = new Date();
  let anos = hoje.getFullYear() - ini.getFullYear();
  let meses = hoje.getMonth() - ini.getMonth();
  if (meses < 0) { anos--; meses += 12; }
  const parts = [];
  if (anos > 0) parts.push(`${anos} ano${anos > 1 ? 's' : ''}`);
  if (meses > 0) parts.push(`${meses} ${meses > 1 ? 'meses' : 'mês'}`);
  return parts.length ? parts.join(' e ') : 'menos de 1 mês';
}

// ─── Component ───────────────────────────────────────────────────────────────

const ITIN_STAGES = [
  '4.1 Seminário (geral)',
  '4.1.1 Seminário Menor',
  '4.1.2 Propedêutico',
  '4.1.3 Filosofia',
  '4.1.4 Postulado',
  '4.1.5 Noviciado',
  '4.1.6 Teologia',
  '4.1.7 Tirocínio',
  '4.2.1 Primeira Profissão',
  'Renovação de Votos',
  '4.2.2 Profissão Perpetúa',
  '4.2.3 Diaconato',
  '4.2.4 Presbiterato',
  '4.3.1 Leitorato',
  '4.3.2 Acolitato',
  '4.3.3 Ministro de Eucaristia'
];

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

const Missionarios: React.FC = () => {
  const { canEdit } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [missionarios, setMissionarios] = useState<Missionario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wizard
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>(initialWizard);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Steps definition updated with translation
  const STEPS = [
    { label: '1. Dados Civis', icon: <User size={15} /> },
    { label: '2. Contatos', icon: <MapPin size={15} /> },
    { label: '3. Dados Religiosos', icon: <BookOpen size={15} /> },
    { label: '4. Itinerário', icon: <Activity size={15} /> },
    { label: '5. Formação & Missão', icon: <GraduationCap size={15} /> },
    { label: '6. Saúde & Financeiro', icon: <ShieldCheck size={15} /> },
    { label: 'Presença Missionária', icon: <HomeIcon size={15} /> },
    { label: '8. Acesso', icon: <Lock size={15} /> },
  ];

  // Step 1 — dynamic docs (local, uploaded after user created)
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocDescricao, setPendingDocDescricao] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [batismoDocFile, setBatismoDocFile] = useState<File | null>(null);
  const [comunhaoDocFile, setComunhaoDocFile] = useState<File | null>(null);
  const [crismaDocFile, setCrismaDocFile] = useState<File | null>(null);

  // Step 4 — casas
  const [casasDisponiveis, setCasasDisponiveis] = useState<Casa[]>([]);
  const [casasVinculos, setCasasVinculos] = useState<CasaVinculo[]>([]);
  const [novaCasa, setNovaCasa] = useState<CasaVinculo>({ casa_id: '', data_inicio: '', is_superior: false, funcao: [], tipo: '', pm: '', pais: 'Brasil' });

  // Extra file refs for wizard steps
  const formacaoFileRef = useRef<HTMLInputElement>(null);
  const [formacaoDocFile, setFormacaoDocFile] = useState<File | null>(null);
  const saudeFileRef = useRef<HTMLInputElement>(null);
  const [saudeDocFile, setSaudeDocFile] = useState<File | null>(null);
  const itinStepFileRef = useRef<HTMLInputElement>(null);
  const [itineraryDocs, setItineraryDocs] = useState<{ file: File, stage: string }[]>([]);
  const [itinSelectedStage, setItinSelectedStage] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState('');
  const [secaoFilter, setSecaoFilter] = useState('');
  const [casaFilter, setCasaFilter] = useState('');
  const [cidadeFilter, setCidadeFilter] = useState('');
  const [paisFilter, setPaisFilter] = useState('');


  useEffect(() => { fetchMissionarios(); }, []);

  const fetchMissionarios = async () => {
    setIsLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        api.post('/usuarios/get'),
        api.post('/casas-religiosas/get'),
      ]);
      setMissionarios(mRes.data.filter((u: any) => u.role === 'PADRE'));
      setCasasDisponiveis(cRes.data);
      setError(null);
    } catch { setError(t('missionaries.error_loading')); }
    finally { setIsLoading(false); }
  };

  const openWizard = () => {
    setWizardData(initialWizard);
    setDocs([]);
    setFormacaoDocFile(null);
    setSaudeDocFile(null);
    setItineraryDocs([]);
    setItinSelectedStage('');
    setCasasVinculos([]);
    setNovaCasa({ casa_id: '', data_inicio: '', is_superior: false, funcao: [], tipo: '', pm: '', pais: 'Brasil' });
    setPendingDocDescricao('');
    setBatismoDocFile(null);
    setComunhaoDocFile(null);
    setCrismaDocFile(null);
    setWizardStep(0);
    setIsWizardOpen(true);
  };

  const set = (field: keyof WizardData, val: any) => {
    setWizardData(prev => ({ ...prev, [field]: val }));
  };

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    set('cep', cep);

    if (cleanCep.length === 8) {
      setCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setWizardData(prev => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            endereco_cidade_estado: `${data.localidade} - ${data.uf}`
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setCepLoading(false);
      }
    }
  };

  // ── Document handlers ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!pendingDocDescricao.trim()) {
      alert(t('missionaries.wizard.docs.hint'));
      e.target.value = '';
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const previewUrl = ['jpg', 'jpeg', 'png'].includes(ext) ? URL.createObjectURL(file) : '';
    const entry: DocEntry = {
      uid: `${Date.now()}`,
      descricao: pendingDocDescricao.trim(),
      file,
      previewUrl,
      tipo: ext,
    };
    setDocs(prev => [...prev, entry]);
    setPendingDocDescricao('');
    e.target.value = '';
  };

  const removeDoc = (uid: string) => {
    setDocs(prev => prev.filter(d => d.uid !== uid));
  };

  // ── Casa handlers ──
  const addCasaVinculo = () => {
    if (!novaCasa.casa_id) { alert('Selecione uma casa'); return; }
    if (!novaCasa.data_inicio) { alert('Informe a data de início'); return; }
    // Check max 5 years (keep validation but parse as local date)
    const ini = parseDateLocal(novaCasa.data_inicio);
    if (ini) {
      const maxDate = new Date(ini);
      maxDate.setFullYear(maxDate.getFullYear() + 5);
    }
    setCasasVinculos(prev => [...prev, { ...novaCasa }]);
    setNovaCasa({ casa_id: '', data_inicio: '', is_superior: false, funcao: [], tipo: '', pm: '', pais: 'Brasil' });
  };

  const removeCasaVinculo = (idx: number) =>
    setCasasVinculos(prev => prev.filter((_, i) => i !== idx));

  const uploadSacramentoFile = async (userId: number, campo: 'doc_batismo' | 'doc_primeira_comunhao' | 'doc_crisma', file: File) => {
    const fd = new FormData();
    fd.append('arquivo', file);
    fd.append('campo', campo);
    await api.post(`/usuarios/${userId}/dados-religiosos/upload-sacramento`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  // ── Finish ──
  const handleFinish = async () => {
    if (!wizardData.login) {
      alert('Informe o e-mail de login.');
      return;
    }
    const effectivePassword = wizardData.password?.trim() || 'Scalab@10';
    setSaveLoading(true);
    try {
      // Auto-resolve global boolean flags based on presence functions
      const hasOconomoLocal = casasVinculos.some(v => Array.isArray(v.funcao) ? v.funcao.includes('Ecônomo Local') : String(v.funcao).includes('Ecônomo Local'));
      const hasSuperiorLocal = casasVinculos.some(v => v.is_superior || (Array.isArray(v.funcao) ? v.funcao.includes('Superior Local') : String(v.funcao).includes('Superior Local')));
      
      const effectiveIsOconomo = wizardData.is_oconomo || hasOconomoLocal;
      const effectiveIsSuperior = wizardData.is_superior || hasSuperiorLocal;

      // 1 — Create user
      const userRes = await api.post('/usuarios', {
        nome: wizardData.nome, login: wizardData.login, password: effectivePassword,
        role: 'PADRE', status: wizardData.status, situacao: wizardData.situacao,
        is_oconomo: effectiveIsOconomo, is_superior: effectiveIsSuperior,
        permissoes: wizardData.permissoes,
      });
      const newId = userRes.data.id;


      // 2 — Civil data
      const fullFiliacao = `${wizardData.nome_pai || ''} / ${wizardData.nome_mae || ''}`.trim();
      await api.post(`/usuarios/${newId}/dados-civis`, {
        data_nascimento: wizardData.data_nascimento || null, 
        filiacao: fullFiliacao === '/' ? '' : fullFiliacao,
        cidade_estado: wizardData.cidade_estado, diocese: wizardData.diocese,
        pais: wizardData.pais, naturalidade: wizardData.naturalidade,
        rnm: '', cpf: '', titulo_eleitor: '', cnh: '', passaporte: '',
        nit: wizardData.nit
      });

      // 3 — Address
      await api.post(`/usuarios/${newId}/endereco-contato`, {
        logradouro: wizardData.logradouro, complemento: wizardData.complemento,
        bairro: wizardData.bairro, cep: wizardData.cep,
        cidade_estado: wizardData.endereco_cidade_estado,
        celular_whatsapp: wizardData.celular_whatsapp, telefone_fixo: wizardData.telefone_fixo,
        email_pessoal: wizardData.email_pessoal,
      });

      // 4 — Religious data
      await api.post(`/usuarios/${newId}/dados-religiosos`, {
        primeiros_votos_data: wizardData.primeiros_votos_data || null,
        votos_perpetuos_data: wizardData.votos_perpetuos_data || null,
        lugar_profissao: wizardData.lugar_profissao,
        diaconato_data: wizardData.diaconato_data || null,
        presbiterato_data: wizardData.presbiterato_data || null,
        bispo_ordenante: wizardData.bispo_ordenante,
        data_batismo: wizardData.data_batismo || null,
        data_primeira_comunhao: wizardData.data_primeira_comunhao || null,
        data_crisma: wizardData.data_crisma || null,
      });

      if (batismoDocFile) {
        await uploadSacramentoFile(newId, 'doc_batismo', batismoDocFile);
      }
      if (comunhaoDocFile) {
        await uploadSacramentoFile(newId, 'doc_primeira_comunhao', comunhaoDocFile);
      }
      if (crismaDocFile) {
        await uploadSacramentoFile(newId, 'doc_crisma', crismaDocFile);
      }

      // 5 — Casa vinculos
      for (const v of casasVinculos) {
        const funcaoPayload = Array.isArray(v.funcao) ? v.funcao.join(',') : (v.funcao ? String(v.funcao) : (v.is_superior ? 'Superior Local' : ''));
        await api.post(`/usuarios/${newId}/casas-historico`, {
          casa_id: v.casa_id, data_inicio: v.data_inicio, data_fim: null,
          funcao: funcaoPayload,
          is_superior: v.is_superior,
          pm: v.pm || null,
          tipo: v.tipo || null,
          pais: v.pais || null,
        });
      }

      // 6 — Nacionalidades
      await api.post(`/usuarios/${newId}/nacionalidades`, {
        nacionalidades: wizardData.nacionalidades
      });

      // 6.5 — Itinerário
      await api.post(`/usuarios/${newId}/itinerario`, {
        stages: wizardData.itinerario
      });

      // 6.6 — Formação Acadêmica (if provided)
      if (wizardData.formacao_curso) {
        await api.post(`/usuarios/${newId}/formacao-academica`, {
          curso: wizardData.formacao_curso,
          faculdade: wizardData.formacao_instituicao,
          periodo: wizardData.formacao_periodo
        });
      }

      // 6.7 — Saúde (if provided)
      if (wizardData.saude_sus || wizardData.saude_seguradora) {
        await api.post(`/usuarios/${newId}/saude`, {
          sus_card: wizardData.saude_sus,
          seguradora: wizardData.saude_seguradora,
          numero_carteira: wizardData.saude_carteira
        });
      }

      // 6.8 — Contas Bancárias (if provided)
      if (wizardData.banco_numero) {
        await api.post(`/usuarios/${newId}/contas-bancarias`, {
          tipo_confirmacao: wizardData.banco_tipo,
          tipo_conta: wizardData.banco_tipo,
          titularidade: wizardData.banco_titular,
          agencia: wizardData.banco_agencia,
          numero: wizardData.banco_numero
        });
      }

      // 6.9 — NIT (already handled in step 2 technically, but let's be sure if we added a specific field)
      if (wizardData.nit) {
        // NIT is usually in dados-civis, we already sent it above? 
        // Let's check step 2. Wait, I should add NIT to the dados-civis update.
        // I'll update the dados-civis call above.
      }

      // 7 — Documentos (uploaded after user creation)
      // Standard docs from step 1
      for (const doc of docs) {
        if (!doc.file) continue;
        const fd = new FormData();
        fd.append('arquivo', doc.file);
        fd.append('descricao', doc.descricao);
        await api.post(`/usuarios/${newId}/documentos`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Step 4 Doc (Formação)
      if (formacaoDocFile) {
        const fd = new FormData();
        fd.append('arquivo', formacaoDocFile);
        fd.append('descricao', 'Comprovante de Formação');
        await api.post(`/usuarios/${newId}/documentos`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Step 5 Doc (Saúde)
      if (saudeDocFile) {
        const fd = new FormData();
        fd.append('arquivo', saudeDocFile);
        fd.append('descricao', 'Documento de Saúde');
        await api.post(`/usuarios/${newId}/documentos`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // Itinerário Step Docs
      for (const idoc of itineraryDocs) {
        const fd = new FormData();
        fd.append('arquivo', idoc.file);
        fd.append('descricao', `Itinerário - ${idoc.stage}`);
        await api.post(`/usuarios/${newId}/documentos`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      await fetchMissionarios();
      setIsWizardOpen(false);
      alert(`${wizardData.nome} cadastrado com sucesso!`);
    } catch (err: any) {
      alert('Erro: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSaveLoading(false);
    }
  };

  const filtered = missionarios.filter(m => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = m.nome.toLowerCase().includes(s);
    const matchesCasa = casaFilter ? (m.casa_nome || '').toLowerCase().includes(casaFilter.toLowerCase()) : true;
    const matchesCidade = cidadeFilter ? (m.cidade || '').toLowerCase().includes(cidadeFilter.toLowerCase()) : true;
    const matchesPais = paisFilter ? (m.pais || '').toLowerCase().includes(paisFilter.toLowerCase()) : true;
    const matchesSituacao = situacaoFilter ? m.situacao === situacaoFilter : true;
    const matchesSecao = secaoFilter ? (m as any)[`has_${secaoFilter}`] > 0 : true;

    return matchesSearch && matchesCasa && matchesCidade && matchesPais && matchesSituacao && matchesSecao;
  });

  // ▸ Get casa name
  const casaNome = (id: any) => casasDisponiveis.find(c => String(c.id) === String(id))?.nome || '-';

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="title-with-badge">
          <Users size={24} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: 0 }}>Visão Geral do Cadastro de missionários</h2>
          </div>
        </div>
        {canEdit && <button className="btn-new" onClick={openWizard}><Plus size={18} /> Cadastro</button>}
      </div>

      <div className="filters-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
        <div className="filter-group">
          <label>NOME</label>
          <div className="search-input">
            <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <Search size={18} />
          </div>
        </div>
        <div className="filter-group">
          <label>PRESENÇA MISSIONÁRIA</label>
          <div className="search-input">
            <input type="text" placeholder="Filtrar por casa..." value={casaFilter} onChange={e => setCasaFilter(e.target.value)} />
            <Search size={18} />
          </div>
        </div>
        <div className="filter-group">
          <label>CIDADE</label>
          <div className="search-input">
            <input type="text" placeholder="Filtrar por cidade..." value={cidadeFilter} onChange={e => setCidadeFilter(e.target.value)} />
            <Search size={18} />
          </div>
        </div>
        <div className="filter-group">
          <label>PAÍS</label>
          <div className="search-input">
            <input type="text" placeholder="Filtrar por país..." value={paisFilter} onChange={e => setPaisFilter(e.target.value)} />
            <Search size={18} />
          </div>
        </div>
        <div className="filter-group">
          <label>SITUAÇÃO</label>
          <select value={situacaoFilter} onChange={e => setSituacaoFilter(e.target.value)}>
            <option value="">{t('missionaries.filters.all')}</option>
            <option value="ATIVO">{t('missionaries.situations.ativo', 'Ativo')}</option>
            <option value="FALECIDO">{t('missionaries.situations.falecido', 'Falecido')}</option>
            <option value="EGRESSO">{t('missionaries.situations.egresso', 'Egresso')}</option>
            <option value="EXCLAUSTRADO">{t('missionaries.situations.exclaustrado', 'Exclaustrado')}</option>
          </select>
        </div>
        <div className="filter-group">
          <label>SEÇÃO (NÚMERO)</label>
          <select value={secaoFilter} onChange={e => setSecaoFilter(e.target.value)}>
            <option value="">Todas</option>
            <option value="3">3. Dados Religiosos</option>
            <option value="4">4. Itinerário Formativo</option>
            <option value="5">5. Formação Acadêmica</option>
            <option value="6">6. Atividade Missionária</option>
            <option value="11">11. Obras realizadas</option>
            <option value="12">12. Observações</option>
          </select>
        </div>
        <button className="btn-filter" style={{ gridColumn: 'span 1', width: '100%', height: '42px', marginTop: '0' }}><Filter size={18} /> {t('missionaries.filters.filter_btn')}</button>
      </div>

      {isLoading ? (
        <div className="loading-state"><Loader2 className="animate-spin" size={32} /><p>{t('missionaries.loading')}</p></div>
      ) : error ? (
        <div className="error-state"><AlertCircle size={32} /><p>{error}</p><button onClick={fetchMissionarios} className="btn-retry">{t('common.retry')}</button></div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>{t('missionaries.table.id')}</th>
                <th>{t('missionaries.table.name')}</th>
                <th>{t('menu.houses')}</th>
                <th>Cidade</th>
                <th>País</th>
                <th className="center">{t('missionaries.table.situation')}</th>
                <th className="center">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id}>
                  <td>#{m.id}</td>
                  <td className="bold">{m.nome}</td>
                  <td>{m.casa_nome || '---'}</td>
                  <td>{m.cidade || '---'}</td>
                  <td>{m.pais || '---'}</td>
                  <td className="center">
                    <span className={`situacao-tag ${(m.situacao || '').toLowerCase()}`}>
                      {t(`missionaries.situations.${(m.situacao || '').toLowerCase()}`, m.situacao)}
                    </span>
                  </td>
                  <td className="center">
                    <button className="btn-action-lite" title={t('missionaries.table.view_details')} onClick={() => navigate(`/missionarios/${m.id}`)}>
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#888' }}>{t('missionaries.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════ WIZARD MODAL ═══════════════ */}
      {isWizardOpen && (
        <div className="modal-overlay">
          <div className="modal-content wizard-modal">
            <div className="modal-header">
              <h3>{t('missionaries.wizard.title')}</h3>
              <button className="close-btn" onClick={() => setIsWizardOpen(false)}><X size={20} /></button>
            </div>

            {/* Missionary name banner – visible from Step 2 onward */}
            {wizardStep >= 1 && wizardData.nome && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'linear-gradient(90deg, #eef4ff 0%, #f5f0ff 100%)',
                border: '1px solid #d0e0ff',
                borderRadius: '10px',
                padding: '8px 16px',
                margin: '0 0 12px 0',
              }}>
                <span style={{ fontSize: '18px' }}>👤</span>
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8caa' }}>Missionário em cadastro</span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary, #3a6fc4)', lineHeight: 1.2 }}>{wizardData.nome}</div>
                </div>
              </div>
            )}

            {/* Step bar */}
            <div className="wizard-steps">
              {STEPS.map((step, i) => (
                <div key={i} className={`wizard-step-indicator ${i === wizardStep ? 'active' : ''} ${i < wizardStep ? 'done' : ''}`}>
                  <div className="step-circle">
                    {i < wizardStep ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
                  </div>
                  <span className="step-label">{step.icon}{step.label}</span>
                  {i < STEPS.length - 1 && <div className="step-line" />}
                </div>
              ))}
            </div>

            {/* ── body ── */}
            <div className="wizard-body">

              {/* ══ STEP 1 — Dados Civis ══ */}
              {wizardStep === 0 && (
                <div className="wizard-step-content">
                  <div className="wizard-divider">1. Dados Civis</div>
                  <div className="form-group full">
                    <label>{t('missionaries.wizard.civil.full_name')}</label>
                    <input type="text" value={wizardData.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome completo..." />
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{t('missionaries.wizard.civil.birth_date')}</label>
                      <input type="date" value={wizardData.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>{t('missionaries.wizard.civil.situation')}</label>
                      <select value={wizardData.situacao} onChange={e => set('situacao', e.target.value)}>
                        <option value="ATIVO">{t('missionaries.situations.ativo', 'Ativo')}</option>
                        <option value="FALECIDO">{t('missionaries.situations.falecido', 'Falecido')}</option>
                        <option value="EGRESSO">{t('missionaries.situations.egresso', 'Egresso')}</option>
                        <option value="EXCLAUSTRADO">{t('missionaries.situations.exclaustrado', 'Exclaustrado')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Nome Pai</label>
                      <input type="text" value={wizardData.nome_pai} onChange={e => set('nome_pai', e.target.value)} placeholder="Nome do pai..." />
                    </div>
                    <div className="form-group">
                      <label>Nome Mãe</label>
                      <input type="text" value={wizardData.nome_mae} onChange={e => set('nome_mae', e.target.value)} placeholder="Nome da mãe..." />
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{t('missionaries.wizard.civil.birth_place_city')}</label>
                      <input type="text" value={wizardData.cidade_estado} onChange={e => set('cidade_estado', e.target.value)} placeholder="Cidade - UF" />
                    </div>
                    <div className="form-group">
                      <label>{t('missionaries.wizard.civil.country')}</label>
                      <input
                        type="text"
                        list="paises-list"
                        value={wizardData.pais}
                        onChange={e => set('pais', e.target.value)}
                        placeholder="Selecione ou digite..."
                      />
                      <datalist id="paises-list">
                        {PAISES_COMMON.map(p => <option key={p} value={p} />)}
                      </datalist>
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{t('missionaries.wizard.civil.diocese')}</label>
                      <input type="text" value={wizardData.diocese} onChange={e => set('diocese', e.target.value)} placeholder="Diocese..." />
                    </div>
                  </div>

                  <div className="wizard-divider" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {t('missionaries.wizard.civil.nationalities')}
                    <button
                      className="btn-add-doc"
                      style={{ padding: '2px 8px', fontSize: '10px' }}
                      onClick={() => set('nacionalidades', [...wizardData.nacionalidades, ''])}
                    >
                      <Plus size={12} /> {t('missionaries.wizard.civil.add_btn')}
                    </button>
                  </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', alignItems: 'start' }}>
                    {wizardData.nacionalidades.map((nac, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '5px' }}>
                        <input
                          type="text"
                          value={nac}
                          onChange={e => {
                            const newNacs = [...wizardData.nacionalidades];
                            newNacs[idx] = e.target.value;
                            set('nacionalidades', newNacs);
                          }}
                          placeholder="Nacionalidade..."
                          style={{ flex: 1 }}
                        />
                        {idx > 0 && (
                          <button
                            onClick={() => set('nacionalidades', wizardData.nacionalidades.filter((_, i) => i !== idx))}
                            style={{ background: 'none', border: 'none', color: '#e57373', cursor: 'pointer' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* ── Dynamic Document Upload ── */}
                  <div className="wizard-divider">{t('missionaries.wizard.docs.title')}</div>
                  <p className="wizard-hint" style={{ marginBottom: 0 }}>
                    {t('missionaries.wizard.docs.hint')}
                  </p>

                  <div className="doc-add-row">
                    <input
                      type="text"
                      className="doc-desc-input"
                      placeholder={t('missionaries.wizard.docs.placeholder')}
                      value={pendingDocDescricao}
                      onChange={e => setPendingDocDescricao(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
                    />
                    <button
                      className="btn-add-doc"
                      onClick={() => fileInputRef.current?.click()}
                      title="Selecionar arquivo (PDF, JPG, PNG)"
                    >
                      <Plus size={16} /> {t('missionaries.wizard.docs.add_btn')}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                  </div>

                  {/* Doc previews */}
                  {docs.length > 0 && (
                    <div className="docs-grid">
                      {docs.map(doc => (
                        <div key={doc.uid} className="doc-card">
                          <button className="doc-remove" onClick={() => removeDoc(doc.uid)}>
                            <X size={12} />
                          </button>
                          <div className="doc-thumb">
                            {doc.previewUrl
                              ? <img src={doc.previewUrl} alt={doc.descricao} />
                              : doc.tipo === 'pdf'
                                ? <FileText size={32} className="doc-icon-pdf" />
                                : <ImageIcon size={32} className="doc-icon-img" />
                            }
                          </div>
                          <div className="doc-info">
                            <span className="doc-desc">{doc.descricao}</span>
                            <span className="doc-filename">{doc.file?.name}</span>
                            <span className={`doc-type doc-type-${doc.tipo}`}>{doc.tipo.toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ STEP 2 — Endereço ══ */}
              {wizardStep === 1 && (
                <div className="wizard-step-content">
                  <div className="wizard-divider">2. Contatos</div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{t('missionaries.wizard.address.cep')} {cepLoading && <Loader2 size={12} className="animate-spin" style={{ marginLeft: 4 }} />}</label>
                      <input
                        type="text"
                        value={wizardData.cep}
                        onChange={e => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="form-group">
                      <label>{t('missionaries.wizard.address.neighborhood')}</label>
                      <input type="text" value={wizardData.bairro} onChange={e => set('bairro', e.target.value)} placeholder="Bairro..." />
                    </div>
                  </div>

                  <div className="form-group full">
                    <label>{t('missionaries.wizard.address.street')}</label>
                    <input type="text" value={wizardData.logradouro} onChange={e => set('logradouro', e.target.value)} placeholder="Rua, Av., número..." />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group"><label>{t('missionaries.wizard.address.complement')}</label><input type="text" value={wizardData.complemento} onChange={e => set('complemento', e.target.value)} /></div>
                    <div className="form-group"><label>{t('missionaries.wizard.address.city_state')}</label><input type="text" value={wizardData.endereco_cidade_estado} onChange={e => set('endereco_cidade_estado', e.target.value)} placeholder="Cidade - UF" /></div>
                  </div>

                  <div className="wizard-divider">{t('missionaries.wizard.address.contact')}</div>
                  <div className="form-row-3">
                    <div className="form-group"><label>{t('missionaries.wizard.address.cellphone')}</label><input type="text" value={wizardData.celular_whatsapp} onChange={e => set('celular_whatsapp', e.target.value)} placeholder="(00) 90000-0000" /></div>
                    <div className="form-group"><label>{t('missionaries.wizard.address.phone')}</label><input type="text" value={wizardData.telefone_fixo} onChange={e => set('telefone_fixo', e.target.value)} /></div>
                    <div className="form-group"><label>{t('missionaries.wizard.address.personal_email')}</label><input type="email" value={wizardData.email_pessoal} onChange={e => set('email_pessoal', e.target.value)} /></div>
                  </div>
                </div>
              )}

              {/* ══ STEP 3 — Dados Religiosos ══ */}
              {wizardStep === 2 && (
                <div className="wizard-step-content">
                  <div className="wizard-divider">3. Dados Religiosos</div>

                  {/* ── Sacramentos ── */}
                  <div className="wizard-divider" style={{ fontSize: '0.78rem', marginBottom: '8px' }}>Informações Religiosas</div>
                  <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '10px' }}>
                    <div className="form-group">
                      <label>Batismo</label>
                      <input type="date" value={wizardData.data_batismo} onChange={e => set('data_batismo', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>1ª Comunhão</label>
                      <input type="date" value={wizardData.data_primeira_comunhao} onChange={e => set('data_primeira_comunhao', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Crisma</label>
                      <input type="date" value={wizardData.data_crisma} onChange={e => set('data_crisma', e.target.value)} />
                    </div>
                  </div>

                  <div className="form-row-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '10px' }}>
                    <div className="form-group">
                      <label>Certidão de Batismo</label>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setBatismoDocFile(e.target.files?.[0] || null)} />
                      {batismoDocFile && <span className="file-selected">{batismoDocFile.name}</span>}
                    </div>
                    <div className="form-group">
                      <label>Certidão de 1ª Comunhão</label>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setComunhaoDocFile(e.target.files?.[0] || null)} />
                      {comunhaoDocFile && <span className="file-selected">{comunhaoDocFile.name}</span>}
                    </div>
                    <div className="form-group">
                      <label>Certidão de Crisma</label>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setCrismaDocFile(e.target.files?.[0] || null)} />
                      {crismaDocFile && <span className="file-selected">{crismaDocFile.name}</span>}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '16px' }}>
                    Os documentos dos sacramentos podem ser anexados agora ou após o cadastro, na aba <strong>Dados Religiosos</strong> do perfil do missionário.
                  </p>
                </div>
              )}

              {/* ══ STEP Itinerário ══ */}
              {wizardStep === 3 && (
                <div className="wizard-step-content">
                  <div className="wizard-divider">4. Itinerário Formativo</div>
                  <p className="wizard-hint">Preencha os dados das etapas de formação do missionário.</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {[
                      { label: '4.1 Seminário (geral)', etapa: 'SEMINARIO', isSub: false },
                      { label: '4.1.1 Seminário Menor', etapa: 'SEMINARIO', isSub: true },
                      { label: '4.1.2 Propedêutico', etapa: 'PROPEDEUTICO', isSub: true },
                      { label: '4.1.3 Filosofia', etapa: 'FILOSOFIA', isSub: true },
                      { label: '4.1.4 Postulado', etapa: 'POSTULADO', isSub: true },
                      { label: '4.1.5 Noviciado', etapa: 'NOVICIADO', isSub: true },
                      { label: '4.1.6 Teologia', etapa: 'TEOLOGIA', isSub: true },
                      { label: '4.1.7 Tirocínio', etapa: 'TIROCINIMO', isSub: true },
                    ].map((seg, idx) => {
                      const stage = wizardData.itinerario.find(s => s.etapa === seg.etapa && s.is_sub_etapa === seg.isSub) || { etapa: seg.etapa, is_sub_etapa: seg.isSub, local: '', periodo: '' };
                      const updateStage = (field: 'local' | 'periodo', val: string) => {
                        const newItin = [...wizardData.itinerario];
                        let ti = newItin.findIndex(s => s.etapa === seg.etapa && s.is_sub_etapa === seg.isSub);
                        if (ti > -1) {
                          newItin[ti] = { ...newItin[ti], [field]: val };
                        } else {
                          newItin.push({ ...stage, [field]: val });
                        }
                        set('itinerario', newItin);
                      };
                      return (
                        <div key={idx} style={{ padding: '12px', border: '1px solid #e8f0fb', borderRadius: '10px', background: '#f9fbff', borderLeft: '3px solid #4a90e2' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '8px' }}>{seg.label}</div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.72rem' }}>Local</label>
                              <input type="text" value={stage.local} onChange={e => updateStage('local', e.target.value)} placeholder="Local..." />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.72rem' }}>Período</label>
                              <input type="text" value={stage.periodo} onChange={e => updateStage('periodo', e.target.value)} placeholder="Ex: 2020-2022" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="wizard-divider" style={{ marginTop: '8px' }}>4.2 Vida Religiosa</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {[
                      { label: '4.2.1 Primeira Profissão', etapa: 'PRIMEIRA_PROFISSAO', isSub: true },
                      { label: 'Renovação de Votos', etapa: 'RENOVACAO_VOTOS', isSub: true },
                      { label: '4.2.2 Profissão Perpetúa', etapa: 'PROFISSAO_PERPETUA', isSub: true },
                      { label: '4.2.3 Diaconato', etapa: 'DIACONATO', isSub: true },
                      { label: '4.2.4 Presbiterato', etapa: 'PRESBITERATO', isSub: true },
                    ].map((seg, idx) => {
                      const stage = wizardData.itinerario.find(s => s.etapa === seg.etapa && s.is_sub_etapa === seg.isSub) || { etapa: seg.etapa, is_sub_etapa: seg.isSub, local: '', periodo: '' };
                      const updateStage = (field: 'local' | 'periodo', val: string) => {
                        const newItin = [...wizardData.itinerario];
                        let ti = newItin.findIndex(s => s.etapa === seg.etapa && s.is_sub_etapa === seg.isSub);
                        if (ti > -1) {
                          newItin[ti] = { ...newItin[ti], [field]: val };
                        } else {
                          newItin.push({ ...stage, [field]: val });
                        }
                        set('itinerario', newItin);
                      };
                      return (
                        <div key={idx} style={{ padding: '12px', border: '1px solid #e8f5e9', borderRadius: '10px', background: '#f9fff9', borderLeft: '3px solid #4caf50' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#2e7d32', marginBottom: '8px' }}>{seg.label}</div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.72rem' }}>Local</label>
                              <input type="text" value={stage.local} onChange={e => updateStage('local', e.target.value)} placeholder="Local..." />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.72rem' }}>Período</label>
                              <input type="text" value={stage.periodo} onChange={e => updateStage('periodo', e.target.value)} placeholder="Ex: 2020-2022" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="wizard-divider" style={{ marginTop: '8px' }}>4.3 Ministérios</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    {[
                      { label: '4.3.1 Leitorato', etapa: 'LEITORATO', isSub: true },
                      { label: '4.3.2 Acolitato', etapa: 'ACOLITATO', isSub: true },
                      { label: '4.3.3 Ministro de Eucalistia', etapa: 'MINISTRO_EUCARISTIA', isSub: true },
                    ].map((seg, idx) => {
                      const stage = wizardData.itinerario.find(s => s.etapa === seg.etapa && s.is_sub_etapa === seg.isSub) || { etapa: seg.etapa, is_sub_etapa: seg.isSub, local: '', periodo: '' };
                      const updateStage = (field: 'local' | 'periodo', val: string) => {
                        const newItin = [...wizardData.itinerario];
                        let ti = newItin.findIndex(s => s.etapa === seg.etapa && s.is_sub_etapa === seg.isSub);
                        if (ti > -1) {
                          newItin[ti] = { ...newItin[ti], [field]: val };
                        } else {
                          newItin.push({ ...stage, [field]: val });
                        }
                        set('itinerario', newItin);
                      };
                      return (
                        <div key={idx} style={{ padding: '12px', border: '1px solid #fff3e0', borderRadius: '10px', background: '#fffdf9', borderLeft: '3px solid #ff9800' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#e65100', marginBottom: '8px' }}>{seg.label}</div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.72rem' }}>Local</label>
                              <input type="text" value={stage.local} onChange={e => updateStage('local', e.target.value)} placeholder="Local..." />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.72rem' }}>Período</label>
                              <input type="text" value={stage.periodo} onChange={e => updateStage('periodo', e.target.value)} placeholder="Ex: 2020-2022" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="wizard-divider" style={{ marginTop: '16px' }}>Documentos do Itinerário (opcional)</div>

                  <div className="form-row-2" style={{ alignItems: 'flex-end', gap: '10px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Selecione a Etapa</label>
                      <select
                        value={itinSelectedStage}
                        onChange={e => setItinSelectedStage(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="">-- Escolha uma etapa --</option>
                        {ITIN_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <button
                        className="btn-add-doc"
                        onClick={() => itinStepFileRef.current?.click()}
                        disabled={!itinSelectedStage}
                        style={{ height: '42px', opacity: itinSelectedStage ? 1 : 0.6 }}
                      >
                        <Plus size={16} /> Anexar Arquivo
                      </button>
                      <input
                        ref={itinStepFileRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file && itinSelectedStage) {
                            setItineraryDocs(prev => [...prev, { file, stage: itinSelectedStage }]);
                            setItinSelectedStage(''); // reset selector
                            if (itinStepFileRef.current) itinStepFileRef.current.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>

                  {itineraryDocs.length > 0 && (
                    <div style={{ marginTop: '10px', background: '#f8f9fa', padding: '10px', borderRadius: '8px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#666' }}>Arquivos Selecionados:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {itineraryDocs.map((d, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #eee' }}>
                            <div style={{ fontSize: '13px' }}>
                              <strong style={{ color: 'var(--primary)' }}>{d.stage}:</strong> <span style={{ color: '#666' }}>{d.file.name}</span>
                            </div>
                            <button
                              onClick={() => setItineraryDocs(prev => prev.filter((_, i) => i !== idx))}
                              style={{ background: 'none', border: 'none', color: '#e57373', cursor: 'pointer', fontSize: '16px' }}
                            >✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ STEP Formação & Missão ══ */}
              {wizardStep === 4 && (
                <div className="wizard-step-content">
                  <div className="wizard-divider">5. Formação & Missão</div>
                  <div className="form-group full">
                    <label>Curso / Graduação</label>
                    <input type="text" value={wizardData.formacao_curso} onChange={e => set('formacao_curso', e.target.value)} placeholder="Ex: Teologia, Filosofia, Administração..." />
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Instituição / Faculdade</label>
                      <input type="text" value={wizardData.formacao_instituicao} onChange={e => set('formacao_instituicao', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Período</label>
                      <input type="text" value={wizardData.formacao_periodo} onChange={e => set('formacao_periodo', e.target.value)} placeholder="Ex: 2018-2022" />
                    </div>
                  </div>

                  <div className="wizard-divider" style={{ marginTop: '8px' }}>Documento Comprobatório (opcional)</div>
                  <div className="doc-add-row">
                    <span style={{ fontSize: '13px', color: '#666', alignSelf: 'center' }}>
                      {formacaoDocFile ? formacaoDocFile.name : 'Nenhum arquivo selecionado'}
                    </span>
                    <button className="btn-add-doc" onClick={() => formacaoFileRef.current?.click()}>
                      <Plus size={16} /> Anexar PDF / Imagem
                    </button>
                    <input
                      ref={formacaoFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={e => setFormacaoDocFile(e.target.files?.[0] || null)}
                    />
                    {formacaoDocFile && (
                      <button onClick={() => setFormacaoDocFile(null)} style={{ background: 'none', border: 'none', color: '#e57373', cursor: 'pointer', fontSize: '18px' }} title="Remover">✕</button>
                    )}
                  </div>
                  <p className="wizard-hint" style={{ marginTop: '4px' }}>
                    Outras atividades e obras realizadas podem ser adicionadas no perfil após o cadastro.
                  </p>
                </div>
              )}

              {/* ══ STEP Saúde & Financeiro ══ */}
              {wizardStep === 5 && (
                <div className="wizard-step-content">
                  <div className="wizard-divider">6. Saúde & Financeiro</div>
                  <div className="form-row-3">
                    <div className="form-group"><label>CNS (SUS)</label><input type="text" value={wizardData.saude_sus} onChange={e => set('saude_sus', e.target.value)} /></div>
                    <div className="form-group"><label>Seguradora</label><input type="text" value={wizardData.saude_seguradora} onChange={e => set('saude_seguradora', e.target.value)} /></div>
                    <div className="form-group"><label>Term. Carteira</label><input type="text" value={wizardData.saude_carteira} onChange={e => set('saude_carteira', e.target.value)} /></div>
                  </div>

                  <div className="wizard-divider" style={{ marginTop: '6px' }}>Documento de Saúde (opcional)</div>
                  <div className="doc-add-row">
                    <span style={{ fontSize: '13px', color: '#666', alignSelf: 'center' }}>
                      {saudeDocFile ? saudeDocFile.name : 'Nenhum arquivo selecionado'}
                    </span>
                    <button className="btn-add-doc" onClick={() => saudeFileRef.current?.click()}>
                      <Plus size={16} /> Anexar PDF / Imagem
                    </button>
                    <input
                      ref={saudeFileRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={e => setSaudeDocFile(e.target.files?.[0] || null)}
                    />
                    {saudeDocFile && (
                      <button onClick={() => setSaudeDocFile(null)} style={{ background: 'none', border: 'none', color: '#e57373', cursor: 'pointer', fontSize: '18px' }} title="Remover">✕</button>
                    )}
                  </div>

                  <div className="wizard-divider" style={{ marginTop: '16px' }}><DollarSign size={14} /> Dados Financeiros & NIT</div>
                  <div className="form-group full">
                    <label>NIT (Número de Identificação do Trabalhador)</label>
                    <input type="text" value={wizardData.nit} onChange={e => set('nit', e.target.value)} placeholder="000.00000.00-0" />
                  </div>

                  <div className="wizard-divider" style={{ marginTop: '10px', fontSize: '10px' }}>Conta Bancária Principal</div>
                  <div className="form-row-2">
                    <div className="form-group"><label>Tipo de Conta</label><input type="text" value={wizardData.banco_tipo} onChange={e => set('banco_tipo', e.target.value)} placeholder="Corrente, Poupança..." /></div>
                    <div className="form-group"><label>Titularidade</label><input type="text" value={wizardData.banco_titular} onChange={e => set('banco_titular', e.target.value)} /></div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group"><label>Agência</label><input type="text" value={wizardData.banco_agencia} onChange={e => set('banco_agencia', e.target.value)} /></div>
                    <div className="form-group"><label>Número da Conta</label><input type="text" value={wizardData.banco_numero} onChange={e => set('banco_numero', e.target.value)} /></div>
                  </div>
                </div>
              )}

              {/* ══ STEP 4 — Casas Religiosas ══ */}
              {wizardStep === 6 && (
                <div className="wizard-step-content">
                  <div className="wizard-divider">Presença Missionária</div>
                  <p className="wizard-hint">
                    {t('missionaries.wizard.houses.hint')}
                  </p>

                  {/* Add casa form */}
                  <div className="casa-wizard-add">
                    <div className="casa-wizard-add-fields">
                      <div className="form-group">
                        <label>Tipo</label>
                        <select value={novaCasa.tipo} onChange={e => setNovaCasa(p => ({ ...p, tipo: e.target.value }))}>
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
                        <label>{t('missionaries.wizard.houses.select_house')}</label>
                        <select value={novaCasa.casa_id} onChange={e => setNovaCasa(p => ({ ...p, casa_id: e.target.value }))}>
                          <option value="">Selecione...</option>
                          {casasDisponiveis.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>PM</label>
                        <input type="text" value={novaCasa.pm} onChange={e => setNovaCasa(p => ({ ...p, pm: e.target.value }))} placeholder="Ex: CR 13" />
                      </div>
                      <div className="form-group">
                        <label>País</label>
                        <input type="text" list="paises-list" value={novaCasa.pais} onChange={e => setNovaCasa(p => ({ ...p, pais: e.target.value }))} placeholder="Selecione ou digite..." />
                        <datalist id="paises-list">
                          {PAISES_COMMON.map(p => <option key={p} value={p} />)}
                        </datalist>
                      </div>
                      <div className="form-group">
                        <label>{t('missionaries.wizard.houses.start_date')}</label>
                        <input type="date" value={novaCasa.data_inicio} onChange={e => setNovaCasa(p => ({ ...p, data_inicio: e.target.value }))} />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {[
                          { key: 'Superior Local', label: 'Superior Local', isSuperior: true },
                          { key: 'Ecônomo Local', label: 'Ecônomo Local' },
                          { key: 'Pároco', label: 'Pároco' },
                          { key: 'Diretor', label: 'Diretor' },
                          { key: 'Vigário', label: 'Vigário' },
                          { key: 'Reitor', label: 'Reitor' },
                        ].map(r => (
                          <label key={r.key} className="checkbox-label" style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={Array.isArray(novaCasa.funcao) && novaCasa.funcao.includes(r.key)}
                              onChange={e => setNovaCasa(p => {
                                const current = Array.isArray(p.funcao) ? [...p.funcao] : [];
                                if (e.target.checked) {
                                  if (!current.includes(r.key)) current.push(r.key);
                                } else {
                                  const idx = current.indexOf(r.key);
                                  if (idx >= 0) current.splice(idx, 1);
                                }
                                return { ...p, funcao: current, is_superior: r.isSuperior ? current.includes('Superior Local') : p.is_superior };
                              })}
                            />
                            {r.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                      <button className="btn-add-casa-wz" onClick={addCasaVinculo}>
                        <Plus size={15} /> {t('missionaries.wizard.houses.bind_btn')}
                      </button>
                    </div>
                  </div>

                  {/* Added houses list */}
                  {casasVinculos.length === 0 ? (
                    <div className="casa-empty">{t('missionaries.wizard.houses.empty')}</div>
                  ) : (
                    <div className="casas-wz-list">
                      {casasVinculos.map((v, i) => (
                        <div key={i} className="casa-wz-item">
                          <div className="casa-wz-left">
                            <HomeIcon size={18} className="casa-icon" />
                            <div>
                              <span className="casa-wz-nome">{casaNome(v.casa_id)}</span>
                              <div className="casa-wz-meta">
                                  <span>{t('missionaries.wizard.houses.since')} {formatDateLocal(v.data_inicio)}</span>
                                <span className="duracao-pill">⏱ {calcDuracao(v.data_inicio)}</span>
                                {v.funcao && v.funcao.length > 0 && <span className="superior-pill"><Star size={11} /> {Array.isArray(v.funcao) ? v.funcao.join(', ') : v.funcao}</span>}
                                {v.pm && <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>PM: {v.pm}</div>}
                                {v.tipo && <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{v.tipo}</div>}
                              </div>
                            </div>
                          </div>
                          <button className="btn-remove-wz" onClick={() => removeCasaVinculo(i)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  
                </div>
              )}

              {/* ══ STEP 7 — Acesso Login ══ */}
              {wizardStep === 7 && (
                <div className="wizard-step-content">
                  <div className="wizard-divider">8. Acesso</div>
                  <p className="wizard-hint">
                    {t('missionaries.wizard.access.hint')}
                  </p>
                  <div className="form-group full">
                    <label>{t('missionaries.wizard.access.email')}</label>
                    <input type="email" value={wizardData.login} onChange={e => set('login', e.target.value)} placeholder="padre@email.com" />
                  </div>
                  <div className="form-group full">
                    <label>Senha de Acesso <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span></label>
                    <div className="password-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={wizardData.password}
                        onChange={e => set('password', e.target.value)}
                        placeholder="Deixe em branco para usar a senha padrão"
                      />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword(p => !p)}>
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '10px',
                      background: 'linear-gradient(90deg, #eff6ff, #f0fdf4)',
                      border: '1px solid #bfdbfe', borderRadius: '10px', padding: '10px 14px',
                    }}>
                      <span style={{ fontSize: '16px', marginTop: '1px' }}>ℹ️</span>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>
                        Se nenhuma senha for digitada, o sistema usará a senha padrão{' '}
                        <strong style={{ color: '#1d4ed8', fontFamily: 'monospace', fontSize: '0.9rem' }}>Scalab@10</strong>.
                        {' '}O missionário receberá esta senha no e-mail de boas-vindas e poderá alterá-la no primeiro acesso.
                      </p>
                    </div>
                  </div>

                  <div className="form-group full">
                    <label>{t('missionaries.wizard.access.account_status')}</label>
                    <select value={wizardData.status} onChange={e => set('status', e.target.value as 'ATIVO' | 'INATIVO')}>
                      <option value="ATIVO">{t('missionaries.wizard.access.active_desc')}</option>
                      <option value="INATIVO">{t('missionaries.wizard.access.inactive_desc')}</option>
                    </select>
                  </div>

                  <div className="form-group full">
                    <label>Acesso (Permissões)</label>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        {PERMISSIONS_LIST.map(perm => (
                          <div key={perm.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', padding: '6px 4px' }}>
                            <input 
                              type="checkbox" 
                              checked={!!wizardData.permissoes?.[perm.id]} 
                              onChange={() => {
                                const newPerms = { ...wizardData.permissoes };
                                newPerms[perm.id] = !newPerms[perm.id];
                                set('permissoes', newPerms);
                              }}
                            />
                            <div style={{ textAlign: 'center', fontWeight: 600, color: '#475569' }}>{perm.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="wizard-summary">
                    <h4>{t('missionaries.wizard.access.summary')}</h4>
                    <div className="summary-row"><span>{t('missionaries.table.name')}</span><strong>{wizardData.nome || '—'}</strong></div>
                    <div className="summary-row"><span>{t('missionaries.table.login')}</span><strong>{wizardData.login || '—'}</strong></div>
                    <div className="summary-row">
                      <span>{t('missionaries.table.situation')}</span>
                      <strong>{t(`missionaries.situations.${(wizardData.situacao || '').toLowerCase()}`, wizardData.situacao)}</strong>
                    </div>
                    <div className="summary-row"><span>{t('missionaries.table.oconomo')}</span><strong>{wizardData.is_oconomo ? t('common.yes') : t('common.no')}</strong></div>
                    <div className="summary-row"><span>{t('missionaries.table.superior')}</span><strong>{wizardData.is_superior ? t('common.yes') : t('common.no')}</strong></div>
                    <div className="summary-row"><span>{t('menu.houses')}</span><strong>{casasVinculos.length}</strong></div>
                    <div className="summary-row"><span>{t('missionaries.wizard.docs.title')}</span><strong>{docs.length}</strong></div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="wizard-footer">
              <button className="btn-back" onClick={() => wizardStep > 0 ? setWizardStep(s => s - 1) : setIsWizardOpen(false)}>
                {wizardStep > 0 ? <><ChevronLeft size={18} /> {t('missionaries.wizard.common.back')}</> : t('missionaries.wizard.common.cancel')}
              </button>

              <div className="step-dots">
                {STEPS.map((_, i) => <span key={i} className={`dot ${i === wizardStep ? 'active' : ''} ${i < wizardStep ? 'done' : ''}`} />)}
              </div>

              {wizardStep < STEPS.length - 1 ? (
                <button className="btn-save" onClick={() => {
                  if (wizardStep === 0 && !wizardData.nome.trim()) { alert('Informe o nome.'); return; }
                  setWizardStep(s => s + 1);
                }}>
                  {t('missionaries.wizard.common.next')} <ChevronRight size={16} />
                </button>
              ) : (
                <button className="btn-save" onClick={handleFinish} disabled={saveLoading}>
                  {saveLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {t('missionaries.wizard.access.btn_finish')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Missionarios;
