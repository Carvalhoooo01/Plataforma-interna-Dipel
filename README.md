# Dipelnet — Sistema Interno

**Stack:** React (frontend) · Node.js + Express (backend) · PostgreSQL (banco)

---

## Estrutura do projeto

```
dipelnet-completo/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js    → conexão PostgreSQL
│   │   │   └── migrate.js     → cria tabelas + dados iniciais
│   │   ├── middleware/
│   │   │   └── auth.js        → JWT + verificação de roles
│   │   ├── routes/
│   │   │   └── index.js       → todas as rotas da API
│   │   └── server.js          → ponto de entrada
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/layout/ → Sidebar + Layout
│   │   ├── contexts/          → AuthContext (login/logout global)
│   │   ├── pages/             → uma pasta por página
│   │   ├── services/api.js    → axios com token automático
│   │   ├── App.jsx            → rotas
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   └── package.json
│
├── dipelnet_v3.html   → versão standalone para referência visual
└── README.md
```

---

## Passo a passo para rodar

### Pré-requisitos
- Node.js v18+ → https://nodejs.org
- PostgreSQL → instalado e rodando
- pgAdmin → para criar o banco

### 1. Banco de dados
No pgAdmin: clique com botão direito em Databases → Create → Database → nome: `dipelnet` → Save

### 2. Backend
```bash
cd backend

# Instalar dependências
npm install

# Criar o .env (copie o .env.example e renomeie)
# Edite com suas credenciais do PostgreSQL

# Criar tabelas e dados iniciais
npm run db:migrate

# Iniciar servidor
npm run dev
```
API rodando em: http://localhost:3001

### 3. Frontend
```bash
cd frontend

# Instalar dependências
npm install

# Criar o .env (copie o .env.example e renomeie)
# Preencha com suas chaves do Cloudinary e Google Maps

# Iniciar
npm run dev
```
App rodando em: http://localhost:5173

---

## Primeiro acesso
- E-mail: **admin@dipelnet.com.br**
- Senha: **admin123**

⚠️ Troque a senha após o primeiro acesso!

---

## Configurar Cloudinary (para upload de prints nos guias)

1. Acesse https://cloudinary.com e crie uma conta gratuita
2. No dashboard, copie o **Cloud Name**
3. Vá em Settings → Upload → Upload Presets → Add upload preset
   - Mode: **Unsigned**
   - Preset name: `dipelnet_unsigned`
4. Edite o arquivo `frontend/.env`:
```
VITE_CLOUDINARY_CLOUD_NAME=seu-cloud-name-aqui
VITE_CLOUDINARY_API_KEY=754394543815596
VITE_CLOUDINARY_PRESET=dipelnet_unsigned
```

---

## Configurar Google Maps (para o mapa de técnicos)

O arquivo `.env` do frontend já tem a chave configurada:
```
VITE_GOOGLE_MAPS_KEY=AIzaSyBydCQdOJrFYnSdfbMJeWaNbJwai9gwztI
```
⚠️ Nunca commite o `.env` no GitHub! Ele já está no `.gitignore`.

---

## Perfis de acesso

| Perfil | Acesso |
|--------|--------|
| admin | Total — gerencia tudo |
| gestor | Seu setor — técnicos, guias, avisos |
| tecnico | Leitura — guias e equipamentos |
| colaborador | Leitura básica |

---

## .gitignore (adicione ao projeto)

```
# Variáveis de ambiente — NUNCA commitar!
backend/.env
frontend/.env

# Dependências
node_modules/
*/node_modules/

# Build
frontend/dist/
```

---

## Adicionar novos técnicos ao mapa

No sistema, vá em **Técnicos** → **Novo Técnico**. Preencha o nome, código, regiões e as coordenadas (Latitude/Longitude). Para descobrir as coordenadas, use o Google Maps: clique com botão direito no local → copie as coordenadas.
