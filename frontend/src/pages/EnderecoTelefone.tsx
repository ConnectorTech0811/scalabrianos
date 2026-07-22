import React, { useState, useEffect } from 'react';
import { Save, MapPin, Phone, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../styles/EnderecoTelefone.css';

interface AddressContactData {
  logradouro: string;
  complemento: string;
  bairro: string;
  cep: string;
  cidade_estado: string;
  celular_whatsapp: string;
  telefone_fixo: string;
  email_pessoal: string;
}

const EnderecoTelefone: React.FC = () => {
  const { canEdit, user } = useAuth();
  const [formData, setFormData] = useState<AddressContactData>({
    logradouro: '',
    complemento: '',
    bairro: '',
    cep: '',
    cidade_estado: '',
    celular_whatsapp: '',
    telefone_fixo: '',
    email_pessoal: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    if (user?.id) {
      fetchAddressData();
    }
  }, [user?.id]);

  const fetchAddressData = async () => {
    setIsLoading(true);
    try {
      const response = await api.post(`${API_URL}/usuarios/${user?.id}/endereco-contato/get`);
      if (response.data) {
        setFormData(prev => ({ ...prev, ...response.data }));
      }
    } catch (err) {
      console.error('Error fetching address data:', err);
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
      await api.post(`${API_URL}/usuarios/${user.id}/endereco-contato`, formData);
      alert('Dados salvos com sucesso!');
    } catch (err) {
      console.error('Error saving address data:', err);
      alert('Erro ao salvar dados');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 className="animate-spin" size={48} />
        <p>Carregando endereço e contatos...</p>
      </div>
    );
  }

  return (
    <div className="module-container">
      <div className="page-header">
        <h2>Endereço e Telefones</h2>
        {canEdit && (
          <button className="btn-save-main" onClick={handleSaveAll} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Salvando...' : 'Salvar Tudo'}
          </button>
        )}
      </div>

      <div className="form-card">
        <div className="section-title">
          <MapPin size={20} /> <h3>Endereço de Residência</h3>
        </div>

        <div className="form-grid">
          <div className="form-group full-row">
            <label>Logradouro (Rua/Avenida)</label>
            <input 
              type="text" 
              name="logradouro"
              placeholder="Ex: Rua das Flores, 123" 
              value={formData.logradouro}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>
          <div className="form-group">
            <label>Complemento</label>
            <input 
              type="text" 
              name="complemento"
              placeholder="Apto, Bloco, etc." 
              value={formData.complemento}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>
          <div className="form-group">
            <label>Bairro</label>
            <input 
              type="text" 
              name="bairro"
              placeholder="Bairro..." 
              value={formData.bairro}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>
          <div className="form-group">
            <label>CEP</label>
            <input 
              type="text" 
              name="cep"
              placeholder="00000-000" 
              value={formData.cep}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>
          <div className="form-group">
            <label>Cidade/Estado</label>
            <input 
              type="text" 
              name="cidade_estado"
              placeholder="Cidade - UF" 
              value={formData.cidade_estado}
              onChange={handleInputChange}
              disabled={!canEdit} 
            />
          </div>
        </div>

        <div className="section-title mt-4">
          <Phone size={20} /> <h3>Contatos e Telefones</h3>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Telefone Celular (WhatsApp)</label>
            <div className="input-with-icon">
              <input 
                type="text" 
                name="celular_whatsapp"
                placeholder="(00) 00000-0000" 
                value={formData.celular_whatsapp}
                onChange={handleInputChange}
                disabled={!canEdit} 
              />
              <Phone size={18} className="field-icon" />
            </div>
          </div>
          <div className="form-group">
            <label>Telefone Fixo</label>
            <div className="input-with-icon">
              <input 
                type="text" 
                name="telefone_fixo"
                placeholder="(00) 0000-0000" 
                value={formData.telefone_fixo}
                onChange={handleInputChange}
                disabled={!canEdit} 
              />
              <Phone size={18} className="field-icon" />
            </div>
          </div>
          <div className="form-group full-row">
            <label>E-mail Pessoal</label>
            <div className="input-with-icon">
              <input 
                type="email" 
                name="email_pessoal"
                placeholder="email@exemplo.com" 
                value={formData.email_pessoal}
                onChange={handleInputChange}
                disabled={!canEdit} 
              />
              <Mail size={18} className="field-icon" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnderecoTelefone;
