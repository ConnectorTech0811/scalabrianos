import React, { useState, useEffect } from 'react';
import { Save, Plus, FileText, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/DadosCivis.css';

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

const DadosCivis: React.FC = () => {
  const { canEdit, user } = useAuth();
  const [formData, setFormData] = useState<CivilData>({
    data_nascimento: '',
    filiacao: '',
    nome_pai: '',
    nome_mae: '',
    cidade_estado: '',
    diocese: '',
    pais: '',
    naturalidade: '',
    rnm: '',
    cpf: '',
    titulo_eleitor: '',
    cnh: '',
    passaporte: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // For now, keeping these as local state until multi-row API is refined
  const [nationalities, setNationalities] = useState(['']);
  const [rgList, setRgList] = useState(['']);

  useEffect(() => {
    if (user?.id) {
      fetchCivilData();
    }
  }, [user?.id]);

  const fetchCivilData = async () => {
    setIsLoading(true);
    try {
      const response = await api.post(`/usuarios/${user?.id}/dados-civis/get`);
      if (response.data) {
        // Format date to YYYY-MM-DD for input type="date"
        const data = response.data;
        if (data.data_nascimento) {
          data.data_nascimento = data.data_nascimento.split('T')[0];
        }
        const parts = data.filiacao ? data.filiacao.split('/') : [];
        data.nome_pai = parts[0] ? parts[0].trim() : '';
        data.nome_mae = parts[1] ? parts[1].trim() : '';
        setFormData(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error('Error fetching civil data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveAll = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const filiacao = (formData.nome_pai || formData.nome_mae) ? `${formData.nome_pai || ''} / ${formData.nome_mae || ''}` : '';
      const dataToSave = { ...formData, filiacao };
      delete dataToSave.nome_pai;
      delete dataToSave.nome_mae;

      await api.post(`/usuarios/${user.id}/dados-civis`, dataToSave);
      alert('Dados salvos com sucesso!');
    } catch (err) {
      console.error('Error saving civil data:', err);
      alert('Erro ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNationality = () => setNationalities([...nationalities, '']);
  const handleRemoveNationality = (index: number) => setNationalities(nationalities.filter((_, i) => i !== index));

  const handleAddRG = () => setRgList([...rgList, '']);
  const handleRemoveRG = (index: number) => setRgList(rgList.filter((_, i) => i !== index));

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 className="animate-spin" size={48} />
        <p>Carregando dados civis...</p>
      </div>
    );
  }

  return (
    <div className="module-container">
      <div className="page-header">
        <h2>Dados Civis</h2>
        {canEdit && (
          <button className="btn-save-main" onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Salvando...' : 'Salvar Tudo'}
          </button>
        )}
      </div>

      <div className="form-card">
        <div className="form-grid">
          <div className="form-group">
            <label>Nascimento (Data)</label>
            <div className="input-with-upload">
              <input 
                type="date" 
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleInputChange}
                disabled={!canEdit} 
              />
              <button className="btn-upload"><FileText size={18} /></button>
            </div>
          </div>

          <div className="form-group">
            <label>Nome do Pai</label>
            <input 
              type="text" 
              name="nome_pai"
              placeholder="Nome do pai..." 
              value={formData.nome_pai}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>

          <div className="form-group">
            <label>Nome da Mãe</label>
            <input 
              type="text" 
              name="nome_mae"
              placeholder="Nome da mãe..." 
              value={formData.nome_mae}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>

          <div className="form-group">
            <label>Naturalidade</label>
            <input 
              type="text" 
              name="cidade_estado"
              placeholder="Cidade - UF" 
              value={formData.cidade_estado}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>

          <div className="form-group">
            <label>Diocese</label>
            <input 
              type="text" 
              name="diocese"
              placeholder="Diocese..." 
              value={formData.diocese}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>

          <div className="form-group">
            <label>País</label>
            <input 
              type="text" 
              name="pais"
              placeholder="Brasil" 
              value={formData.pais}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>
        </div>

        <div className="dynamic-section">
          <div className="section-header">
            <h3>Nacionalidade</h3>
            {canEdit && <button className="btn-add-circle" onClick={handleAddNationality}><Plus size={16} /></button>}
          </div>
          {nationalities.map((val, index) => (
            <div key={index} className="dynamic-row">
              <div className="input-with-upload full-width">
                <input 
                  type="text" 
                  placeholder="Nacionalidade..." 
                  value={val}
                  onChange={(e) => {
                    const newNats = [...nationalities];
                    newNats[index] = e.target.value;
                    setNationalities(newNats);
                  }}
                  disabled={!canEdit} 
                />
                <button className="btn-upload"><FileText size={18} /></button>
                {canEdit && index > 0 && <button className="btn-remove" onClick={() => handleRemoveNationality(index)}><Trash2 size={18} /></button>}
              </div>
            </div>
          ))}
        </div>

        <div className="dynamic-section">
          <div className="section-header">
            <h3>RG</h3>
            {canEdit && <button className="btn-add-circle" onClick={handleAddRG}><Plus size={16} /></button>}
          </div>
          {rgList.map((val, index) => (
            <div key={index} className="dynamic-row">
              <div className="input-with-upload full-width">
                <input 
                  type="text" 
                  placeholder="Número do RG..." 
                  value={val}
                  onChange={(e) => {
                    const newRgs = [...rgList];
                    newRgs[index] = e.target.value;
                    setRgList(newRgs);
                  }}
                  disabled={!canEdit} 
                />
                <button className="btn-upload"><FileText size={18} /></button>
                {canEdit && index > 0 && <button className="btn-remove" onClick={() => handleRemoveRG(index)}><Trash2 size={18} /></button>}
              </div>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label>RNM</label>
          <div className="input-with-upload">
            <input 
              type="text" 
              name="rnm"
              placeholder="Registro Nacional Migratório..." 
              value={formData.rnm}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
            <button className="btn-upload"><FileText size={18} /></button>
          </div>
        </div>

        <div className="form-grid mt-2">
          <div className="form-group">
            <label>CPF</label>
            <div className="input-with-upload">
              <input 
                type="text" 
                name="cpf"
                placeholder="000.000.000-00" 
                value={formData.cpf}
                onChange={handleInputChange}
                disabled={!canEdit} 
              />
              <button className="btn-upload"><FileText size={18} /></button>
            </div>
          </div>

          <div className="form-group">
            <label>Título de Eleitor</label>
            <div className="input-with-upload">
              <input 
                type="text" 
                name="titulo_eleitor"
                placeholder="Número do título..." 
                value={formData.titulo_eleitor}
                onChange={handleInputChange}
                disabled={!canEdit} 
              />
              <button className="btn-upload"><FileText size={18} /></button>
            </div>
          </div>

          <div className="form-group">
            <label>CNH</label>
            <div className="input-with-upload">
              <input 
                type="text" 
                name="cnh"
                placeholder="Número da CNH..." 
                value={formData.cnh}
                onChange={handleInputChange}
                disabled={!canEdit} 
              />
              <button className="btn-upload"><FileText size={18} /></button>
            </div>
          </div>

          <div className="form-group">
            <label>Passaporte</label>
            <div className="input-with-upload">
              <input 
                type="text" 
                name="passaporte"
                placeholder="Número do passaporte..." 
                value={formData.passaporte}
                onChange={handleInputChange}
                disabled={!canEdit} 
              />
              <button className="btn-upload"><FileText size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DadosCivis;
