# Dipelnet — Sistema Interno

Stack: **React** (front-end) · **Node.js + Express** (back-end) · **PostgreSQL** (banco de dados)

---

## Estrutura do projeto

```
dipelnet/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js      # Conexão com PostgreSQL
│   │   │   └── migrate.js       # Cria as tabelas e o admin padrão
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── usuariosController.js
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT + verificação de roles
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── usuarios.js
│   │   │   ├── tecnicos.js
│   │   │   └── ativacoes.js
│   │   └── server.js            # Ponto de entrada da API
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Layout.jsx   # Estrutura com sidebar + topbar
    │   │   │   └── Sidebar.jsx  # Menu lateral com nav dinâmico
    │   │   └── ProtectedRoute.jsx
    │   ├── contexts/
    │   │   └── AuthContext.jsx  # Estado global de autenticação
    │   ├── pages/
    │   │   ├── auth/Login.jsx
    │   │   ├── dashboard/Dashboard.jsx
    │   │   ├── guias/Guias.jsx
    │   │   ├── tecnicos/Tecnicos.jsx
    │   │   ├── usuarios/Usuarios.jsx
    │   │   ├── historico/Historico.jsx
    │   │   └── ...outras páginas
    │   ├── services/
    │   │   └── api.js           # Axios com interceptors (token + logout auto)
    │   ├── App.jsx              # Todas as rotas
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Pré-requisitos

- **Node.js** v18 ou superior → https://nodejs.org
- **PostgreSQL** v14 ou superior → https://postgresql.org
- Editor: **VS Code** (recomendado)

---

## Passo a passo para rodar

### 1. Banco de dados

Crie o banco no PostgreSQL:
```sql
CREATE DATABASE dipelnet;
```

### 2. Back-end

```bash
cd backend

# Instalar dependências
npm install

# Criar o arquivo de configuração
cp .env.example .env
# Edite o .env com suas credenciais do PostgreSQL

# Criar as tabelas e o usuário admin
npm run db:migrate

# Iniciar o servidor (modo desenvolvimento)
npm run dev
```

API rodando em: `http://localhost:3001`

### 3. Front-end

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

Aplicação rodando em: `http://localhost:5173`

---

## Primeiro acesso

Após rodar a migration, acesse o sistema com:

| Campo | Valor |
|-------|-------|
| E-mail | admin@dipelnet.com.br |
| Senha  | admin123 |

**⚠️ Troque a senha no primeiro acesso!**

---

## Perfis de acesso (roles)

| Role | Descrição |
|------|-----------|
| `admin` | Acesso total — gerencia usuários, setores, tudo |
| `gestor` | Gerencia seu setor: técnicos, guias, ativações |
| `tecnico` | Acessa checklist, agenda, guias do seu setor |
| `atendente` | Ativações, suporte, histórico |
| `visualizador` | Somente leitura |

---

## Como adicionar um novo setor

1. Acesse o PostgreSQL e insira:
```sql
INSERT INTO setores (nome, descricao) VALUES ('Nome do Setor', 'Descrição');
```
2. Crie os usuários com `setor_id` apontando para o novo setor
3. O sistema já isola os dados automaticamente por setor

---

## Como adicionar novas rotas/páginas

### Back-end — nova rota:
1. Crie `backend/src/routes/novaRota.js`
2. Adicione no `server.js`:
   ```js
   app.use('/api/nova-rota', require('./routes/novaRota'));
   ```

### Front-end — nova página:
1. Crie `frontend/src/pages/novaPagina/NovaPagina.jsx`
2. Importe e adicione em `App.jsx`:
   ```jsx
   import NovaPagina from './pages/novaPagina/NovaPagina';
   // ...
   <Route path="/nova-pagina" element={<NovaPagina />} />
   ```
3. Adicione o link no `Sidebar.jsx`

---

## Tabelas do banco

| Tabela | Descrição |
|--------|-----------|
| `setores` | Setores da empresa |
| `usuarios` | Colaboradores com acesso ao sistema |
| `tecnicos` | Equipe técnica de campo |
| `guias` | Guias de instrução por setor |
| `ativacoes` | Histórico de ativações de clientes |
| `fotos_instalacao` | Fotos vinculadas a cada ativação |
| `agendamentos` | Agenda de campo dos técnicos |
| `avisos` | Comunicados internos por setor |

---

## Deploy (produção)

### Opção recomendada: VPS (Contabo / DigitalOcean)

```bash
# No servidor Linux (Ubuntu 22.04)

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Instalar PM2 (mantém o backend rodando)
npm install -g pm2

# Back-end
cd backend
npm install --production
pm2 start src/server.js --name dipelnet-api

# Front-end — gerar build
cd frontend
npm run build
# Servir a pasta dist com nginx
```

---

## Dúvidas frequentes

**"Erro de CORS"** → Verifique se `FRONTEND_URL` no `.env` do backend bate com a URL do front.

**"Token expirado"** → O sistema redireciona automaticamente para `/login`. Aumente `JWT_EXPIRES_IN` no `.env` se necessário.

**"Não consigo conectar ao banco"** → Verifique as credenciais no `.env` e se o PostgreSQL está rodando com `sudo service postgresql status`.
