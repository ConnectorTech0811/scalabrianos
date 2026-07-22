const nodemailer = require('nodemailer');
require('dotenv').config();

const clean = (val) => typeof val === 'string' ? val.replace(/^["']|["']$/g, '').trim() : val;

const smtpHost = clean(process.env.SMTP_HOST);
const smtpPort = parseInt(clean(process.env.SMTP_PORT) || '465');
const smtpSecure = clean(process.env.SMTP_SECURE);
const isSecure = smtpSecure === 'true' || smtpSecure === 'ssl' || smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: isSecure,
  auth: {
    user: clean(process.env.SMTP_USER),
    pass: clean(process.env.SMTP_PASS),
  },
});

// Verify SMTP connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('[EMAIL] SMTP connection failed:', error.message);
  } else {
    console.log('[EMAIL] SMTP server is ready to send emails');
  }
});

/**
 * Sends a welcome email to a new user.
 * @param {string} email - Recipient email.
 * @param {string} nome - Recipient name.
 * @param {string} password - Generated password.
 */
async function sendWelcomeEmail(email, nome, password) {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'https://scalabrinianos.dev.connectortech.com.br';
    const resetUrl = `${frontendUrl}/reset-password`;

    const info = await transporter.sendMail({
      from: `"Sistema Scalabrinianos" <${clean(process.env.SMTP_FROM) || clean(process.env.SMTP_USER)}>`,
      to: email,
      subject: "Seja bem-vindo ao Sistema Scalabrinianos",
      text: `Olá ${nome},\n\nSeu cadastro no Sistema Scalabrinianos foi realizado com sucesso.\n\nPara o seu primeiro acesso, utilize as credenciais abaixo:\n\nE-mail: ${email}\nSenha: ${password}\n\nSe desejar redefinir sua senha antes do primeiro login, acesse:\n${resetUrl}\n\nRecomendamos que você altere sua senha após o primeiro login.\n\nAtenciosamente,\nEquipe Scalabrinianos`,
      html: `
        <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background: #f8fafc; padding: 32px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #2563eb 100%); padding: 32px; color: #ffffff;">
              <h1 style="margin: 0; font-size: 28px; letter-spacing: -0.5px;">Bem-vindo, ${nome}</h1>
              <p style="margin: 12px 0 0; font-size: 16px; color: rgba(255,255,255,0.85);">Seu acesso ao Sistema Scalabrinianos foi criado com sucesso.</p>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; margin: 0 0 18px;">Olá <strong>${nome}</strong>,</p>
              <p style="font-size: 15px; line-height: 1.8; color: #475569; margin: 0 0 24px;">Seu cadastro no <strong>Scalabrinianos</strong> está pronto. Use as credenciais abaixo para o primeiro acesso ao sistema:</p>
              <div style="border: 1px solid #e2e8f0; border-radius: 18px; padding: 22px; background: #f8fafc; margin-bottom: 28px;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #334155;"><strong>E-mail</strong>: ${email}</p>
                <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Senha</strong>: ${password}</p>
              </div>
              <a href="${resetUrl}" style="display: inline-block; background: #1d4ed8; color: #ffffff; padding: 14px 26px; border-radius: 999px; text-decoration: none; font-weight: 700; box-shadow: 0 18px 36px rgba(37, 99, 235, 0.28);">Redefinir minha senha</a>
              <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; line-height: 1.7;">Recomendamos que você altere sua senha após o primeiro login para manter sua conta segura.</p>
              <div style="margin-top: 28px; padding: 20px; background: #eff6ff; border-radius: 16px;">
                <p style="margin: 0; font-size: 14px; color: #334155;"><strong>Dica</strong>: caso prefira, você pode usar o botão acima para redefinir sua senha antes de acessar.</p>
              </div>
            </div>
            <div style="background: #f8fafc; padding: 24px 32px; color: #64748b; font-size: 13px;">
              <p style="margin: 0;">Atenciosamente,<br/><strong>Equipe Scalabrinianos</strong></p>
            </div>
          </div>
        </div>
      `,
    });
    console.log("Email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Sends a first-access notification email to Registro Regional users.
 * @param {string} recipientEmail - The email of the Registro Regional user.
 * @param {string} missionarioNome - Name of the missionary who accessed.
 * @param {string} missionarioEmail - Email/login of the missionary.
 * @param {Date} accessedAt - Date/time of the access.
 */
async function sendFirstAccessNotification(recipientEmail, missionarioNome, missionarioEmail, accessedAt) {
  try {
    const dateStr = accessedAt.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = accessedAt.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' });

    await transporter.sendMail({
      from: `"Sistema Scalabrinianos" <${clean(process.env.SMTP_FROM) || clean(process.env.SMTP_USER)}>`,
      to: recipientEmail,
      subject: `🔔 Primeiro Acesso — ${missionarioNome}`,
      text: `Notificação de Primeiro Acesso\n\nO missionário abaixo realizou seu primeiro acesso ao Sistema Scalabrinianos:\n\nNome: ${missionarioNome}\nE-mail: ${missionarioEmail}\nData: ${dateStr}\nHorário: ${timeStr}\n\nAtenciosamente,\nEquipe Scalabrinianos`,
      html: `
        <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background: #f8fafc; padding: 32px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #7c3aed 100%); padding: 32px; color: #ffffff;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 32px;">🔔</span>
                <div>
                  <h1 style="margin: 0; font-size: 22px; letter-spacing: -0.5px;">Notificação de Primeiro Acesso</h1>
                  <p style="margin: 6px 0 0; font-size: 14px; color: rgba(255,255,255,0.8);">Sistema Scalabrinianos — Registro Regional</p>
                </div>
              </div>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 15px; color: #475569; margin: 0 0 24px; line-height: 1.7;">
                Um missionário realizou seu <strong style="color: #1d4ed8;">primeiro acesso</strong> ao sistema redefinindo sua senha.
              </p>
              <div style="border: 1.5px solid #e0e7ff; border-radius: 18px; padding: 24px; background: #f5f3ff; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-size: 13px; color: #6b7280; font-weight: 600; width: 100px;">Nome</td>
                    <td style="padding: 8px 0; font-size: 15px; color: #111827; font-weight: 700;">${missionarioNome}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 13px; color: #6b7280; font-weight: 600;">E-mail</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #374151;">${missionarioEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 13px; color: #6b7280; font-weight: 600;">Data</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #374151;">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-size: 13px; color: #6b7280; font-weight: 600;">Horário</td>
                    <td style="padding: 8px 0; font-size: 14px; color: #374151;">${timeStr} (horário de Brasília)</td>
                  </tr>
                </table>
              </div>
              <p style="font-size: 13px; color: #94a3b8; margin: 0; line-height: 1.6;">
                Esta é uma notificação automática do Sistema Scalabrinianos. Nenhuma ação é necessária.
              </p>
            </div>
            <div style="background: #f8fafc; padding: 20px 32px; color: #64748b; font-size: 13px;">
              <p style="margin: 0;">Atenciosamente,<br/><strong>Equipe Scalabrinianos</strong></p>
            </div>
          </div>
        </div>
      `,
    });
    console.log(`[EMAIL] First-access notification sent to ${recipientEmail} for missionary ${missionarioNome}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to send first-access notification to ${recipientEmail}:`, error.message);
    return false;
  }
}

/**
 * Sends a password recovery email to a user.
 * @param {string} email - Recipient email.
 * @param {string} nome - Recipient name.
 */
async function sendPasswordResetEmail(email, nome) {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'https://scalabrinianos.dev.connectortech.com.br';
    const resetUrl = `${frontendUrl}/reset-password`;
    const fromAddr = clean(process.env.SMTP_FROM) || clean(process.env.SMTP_USER);

    const info = await transporter.sendMail({
      from: `"Sistema Scalabrinianos" <${fromAddr}>`,
      to: email,
      subject: "Recuperação de Senha — Sistema Scalabrinianos",
      text: `Olá ${nome},\n\nRecebemos uma solicitação de recuperação de senha para a sua conta no Sistema Scalabrinianos.\n\nPara cadastrar uma nova senha, acesse o link abaixo:\n${resetUrl}\n\nSe você não solicitou esta alteração, por favor desconsidere este e-mail.\n\nAtenciosamente,\nEquipe Scalabrinianos`,
      html: `
        <div style="font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background: #f8fafc; padding: 32px;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #2563eb 100%); padding: 32px; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; letter-spacing: -0.5px;">Recuperação de Senha</h1>
              <p style="margin: 8px 0 0; font-size: 15px; color: rgba(255,255,255,0.85);">Sistema Scalabrinianos</p>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; margin: 0 0 18px;">Olá <strong>${nome}</strong>,</p>
              <p style="font-size: 15px; line-height: 1.8; color: #475569; margin: 0 0 24px;">Recebemos uma solicitação de recuperação de senha para a sua conta no <strong>Sistema Scalabrinianos</strong>.</p>
              <div style="margin-bottom: 28px; text-align: center;">
                <a href="${resetUrl}" style="display: inline-block; background: #1d4ed8; color: #ffffff; padding: 14px 28px; border-radius: 999px; text-decoration: none; font-weight: 700; box-shadow: 0 18px 36px rgba(37, 99, 235, 0.28);">Redefinir Minha Senha</a>
              </div>
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.7;">Se você não solicitou esta redefinição, por favor desconsidere este e-mail. Sua senha continuará a mesma.</p>
            </div>
            <div style="background: #f8fafc; padding: 24px 32px; color: #64748b; font-size: 13px;">
              <p style="margin: 0;">Atenciosamente,<br/><strong>Equipe Scalabrinianos</strong></p>
            </div>
          </div>
        </div>
      `,
    });
    console.log(`[EMAIL] Password reset email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to send password reset email to ${email}:`, error.message);
    throw error;
  }
}

module.exports = { sendWelcomeEmail, sendFirstAccessNotification, sendPasswordResetEmail };
