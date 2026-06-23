-- Database Creation Script for Scalabrianos Project
-- Target: MySQL / MariaDB

CREATE DATABASE IF NOT EXISTS db_scalabrianos;
USE db_scalabrianos;

-- 1. Table for Users and Profiles
CREATE TABLE IF NOT EXISTS tb_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    login VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM(
        'ADMIN_GERAL', 'ADMINISTRADOR', 'COLABORADOR', 'INTERMITENTE', 'PADRE', 'REGISTRO_REGIONAL',
        'SUPERIOR_REGIONAL', 'SECRETARIO_REGIONAL', 'ECONOMO_REGIONAL',
        'SECRETARIADO_MISSAO', 'SECRETARIADO_VIDA_RELIGIOSA', 'SECRETARIADO_FORMACAO',
        'SUPERIOR_LOCAL', 'ECONOMO_LOCAL', 'MISSIONARIO'
    ) DEFAULT 'COLABORADOR',
    status ENUM('ATIVO', 'INATIVO') DEFAULT 'ATIVO',
    situacao ENUM('ATIVO', 'FALECIDO', 'EGRESSO', 'EXCLAUSTRADO') DEFAULT 'ATIVO',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Table for Religious Houses
CREATE TABLE IF NOT EXISTS tb_casas_religiosas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    endereco TEXT,
    status ENUM('ATIVO', 'INATIVO') DEFAULT 'ATIVO',
    regional VARCHAR(255),
    data_referencia_casa DATE,
    pm_code VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table for Civil Data
CREATE TABLE IF NOT EXISTS tb_dados_civis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    data_nascimento DATE,
    nascimento_doc_path VARCHAR(500),
    filiacao TEXT,
    cidade_estado VARCHAR(255),
    diocese VARCHAR(255),
    pais VARCHAR(100),
    naturalidade VARCHAR(100),
    rnm VARCHAR(50),
    rnm_doc_path VARCHAR(500),
    cpf VARCHAR(20),
    cpf_doc_path VARCHAR(500),
    titulo_eleitor VARCHAR(50),
    titulo_doc_path VARCHAR(500),
    cnh VARCHAR(50),
    cnh_doc_path VARCHAR(500),
    passaporte VARCHAR(50),
    passaporte_doc_path VARCHAR(500),
    FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
);

-- 4. Table for Nationalities (Multiple per user)
CREATE TABLE IF NOT EXISTS tb_nacionalidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nacionalidade VARCHAR(100) NOT NULL,
    doc_path VARCHAR(500),
    FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
);

-- 5. Table for RGs (Multiple per user)
CREATE TABLE IF NOT EXISTS tb_rgs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    numero VARCHAR(50) NOT NULL,
    doc_path VARCHAR(500),
    FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
);

-- 6. Table for Addresses and Contact Info
CREATE TABLE IF NOT EXISTS tb_enderecos_contatos (
    usuario_id INT PRIMARY KEY,
    logradouro VARCHAR(500),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cep VARCHAR(12),
    cidade_estado VARCHAR(255),
    celular_whatsapp VARCHAR(25),
    telefone_fixo VARCHAR(25),
    email_pessoal VARCHAR(255),
    FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
);

-- 7. Table for Religious Data
CREATE TABLE IF NOT EXISTS tb_dados_religiosos (
    usuario_id INT PRIMARY KEY,
    primeiros_votos_data DATE,
    votos_perpetuos_data DATE,
    lugar_profissao VARCHAR(255),
    diaconato_data DATE,
    presbiterato_data DATE,
    bispo_ordenante VARCHAR(255),
    FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
);

-- 8. Table for Formation Stages (Itinerário Formativo)
CREATE TABLE IF NOT EXISTS tb_itinerario_formativo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    etapa VARCHAR(100) NOT NULL, -- SEMINARIO, PROPEDEUTICO, FILOSOFIA, POSTULADO, etc.
    is_sub_etapa BOOLEAN DEFAULT FALSE, -- e.g. Seminário Menor
    local VARCHAR(255),
    periodo VARCHAR(100),
    doc_path VARCHAR(500),
    FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
);

-- 9. Table for Password Resets
CREATE TABLE IF NOT EXISTS tb_password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES tb_usuarios(id) ON DELETE CASCADE
);
