import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, XCircle, CheckCircle } from 'lucide-react';
import logoVertical from '../assets/logo_vertical.png';
import '../styles/Login.css';
import api from '../api';

const ForgotPassword: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const res = await api.post('/auth/forgot-password', { email: email.trim() });
            setSuccessMsg(res.data?.message || 'E-mail de recuperação enviado com sucesso!');
            setIsSent(true);
        } catch (err: any) {
            console.error('[FORGOT PASSWORD ERROR]', err);
            const data = err?.response?.data;
            const detail = data?.smtpCode ? ` (${data.smtpCode})` : '';
            setErrorMsg((data?.message || 'Erro ao solicitar recuperação de senha.') + detail);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-overlay"></div>
            <div className="login-content">
                <div className="login-logo-container">
                    <img src={logoVertical} alt="Scalabrianos Logo" className="login-logo" />
                </div>

                {!isSent ? (
                    <form className="login-form" onSubmit={handleSubmit}>
                        <h2 style={{ color: 'var(--primary)', marginBottom: '1rem', fontWeight: 700 }}>
                            {t('forgot.title', 'Esqueceu a senha?')}
                        </h2>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            {t('forgot.description', 'Informe seu e-mail cadastrado para receber as instruções de redefinição de senha.')}
                        </p>

                        <div className="input-group">
                            <input
                                type="email"
                                placeholder={t('forgot.email_placeholder', 'Seu e-mail cadastrado')}
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {errorMsg && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#fef2f2', border: '1px solid #fca5a5',
                                borderRadius: '10px', padding: '12px 16px',
                                color: '#b91c1c', fontSize: '0.88rem', fontWeight: 600,
                                margin: '0.5rem 0'
                            }}>
                                <XCircle size={18} style={{ flexShrink: 0 }} />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="login-button" 
                            disabled={isLoading}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Enviando e-mail...
                                </>
                            ) : (
                                t('forgot.submit', 'Enviar e-mail de recuperação')
                            )}
                        </button>

                        <div className="login-footer">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                            >
                                ← {t('forgot.back_to_login', 'Voltar para o Login')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="login-form" style={{ textAlign: 'center' }}>
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                            background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                            border: '1.5px solid #6ee7b7', borderRadius: '18px', padding: '28px 20px',
                            marginBottom: '1rem'
                        }}>
                            <CheckCircle size={48} color="#059669" strokeWidth={1.5} />
                            <h2 style={{ margin: 0, color: '#065f46', fontWeight: 800, fontSize: '1.25rem' }}>
                                E-mail Enviado!
                            </h2>
                            <p style={{ color: '#047857', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                                {successMsg}
                            </p>
                        </div>
                        <button onClick={() => navigate('/login')} className="login-button">
                            {t('forgot.back_to_login', 'Voltar para o Login')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
