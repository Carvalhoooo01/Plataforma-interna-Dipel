const pool    = require('./database');
const bcrypt  = require('bcryptjs');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS setores (
        id        SERIAL PRIMARY KEY,
        nome      VARCHAR(100) NOT NULL UNIQUE,
        descricao TEXT,
        ativo     BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS equipamentos (
        id          SERIAL PRIMARY KEY,
        marca       VARCHAR(100) NOT NULL,
        modelo      VARCHAR(100) NOT NULL,
        plano       VARCHAR(100),
        wifi        VARCHAR(100),
        diferencial TEXT,
        ativo       BOOLEAN DEFAULT TRUE,
        criado_em   TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id            SERIAL PRIMARY KEY,
        nome          VARCHAR(150) NOT NULL,
        email         VARCHAR(150) NOT NULL UNIQUE,
        senha_hash    VARCHAR(255) NOT NULL,
        role          VARCHAR(30)  NOT NULL DEFAULT 'colaborador',
        setor_id      INTEGER REFERENCES setores(id) ON DELETE SET NULL,
        ativo         BOOLEAN DEFAULT TRUE,
        ultimo_login  TIMESTAMP,
        criado_em     TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tecnicos (
        id        SERIAL PRIMARY KEY,
        nome      VARCHAR(150) NOT NULL,
        codigo    VARCHAR(20)  NOT NULL UNIQUE,
        telefone  VARCHAR(20),
        setor_id  INTEGER REFERENCES setores(id) ON DELETE SET NULL,
        regioes   TEXT[],
        status    VARCHAR(30) DEFAULT 'Disponível',
        lat       DOUBLE PRECISION,
        lng       DOUBLE PRECISION,
        ativo     BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS guias (
        id            SERIAL PRIMARY KEY,
        slug          VARCHAR(50) NOT NULL UNIQUE,
        titulo        VARCHAR(200) NOT NULL,
        descricao     TEXT,
        categoria     VARCHAR(80),
        conteudo      JSONB,
        setor_id      INTEGER REFERENCES setores(id) ON DELETE CASCADE,
        criado_por    INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        status        VARCHAR(30) DEFAULT 'Ativo',
        criado_em     TIMESTAMP DEFAULT NOW(),
        atualizado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS avisos (
        id         SERIAL PRIMARY KEY,
        titulo     VARCHAR(200) NOT NULL,
        corpo      TEXT NOT NULL,
        prioridade VARCHAR(20) DEFAULT 'normal',
        setor_id   INTEGER REFERENCES setores(id) ON DELETE CASCADE,
        criado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        ativo      BOOLEAN DEFAULT TRUE,
        criado_em  TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS colaboradores (
        id        SERIAL PRIMARY KEY,
        nome      VARCHAR(150) NOT NULL,
        cargo     VARCHAR(100) NOT NULL,
        setor     VARCHAR(50)  NOT NULL,
        ordem     INTEGER DEFAULT 0,
        criado_em TIMESTAMP DEFAULT NOW()
      );
    `);

    // Colunas extras existentes
    await client.query(`ALTER TABLE tecnicos ADD COLUMN IF NOT EXISTS raio DOUBLE PRECISION;`);
    await client.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permissoes JSONB DEFAULT '{}';`);
    await client.query(`CREATE TABLE IF NOT EXISTS configuracoes (chave VARCHAR(100) PRIMARY KEY, valor TEXT);`);

    // ── NOVAS COLUNAS: telefone e contrato ──────────
    await client.query(`ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);`);
    await client.query(`ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS contrato_url TEXT;`);
    await client.query(`ALTER TABLE tecnicos      ADD COLUMN IF NOT EXISTS contrato_url TEXT;`);

    // Seeds
    await client.query(`INSERT INTO setores (nome, descricao) VALUES ('Campo','Setor de instalação e manutenção') ON CONFLICT (nome) DO NOTHING;`);

    const hash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO usuarios (nome, email, senha_hash, role, setor_id)
      VALUES ('Administrador','admin@dipelnet.com.br',$1,'admin',(SELECT id FROM setores WHERE nome='Campo'))
      ON CONFLICT (email) DO NOTHING;
    `, [hash]);

    // ── GUIAS TÉCNICOS ──────────────────────────────
    const guiasData = [
      {
        slug: 'onu02b',
        titulo: 'Ativação 02B / AN5506',
        descricao: 'Autorização de ONU no NE Manager, PPPoE com VLAN, senhas web e interface local',
        categoria: 'Ativação',
        conteudo: {
          badge:'bb', badgeText:'9 passos',
          alerta:'Use o NE Manager (OLT PANTANAL – 10.125.24.46) para este procedimento.',
          steps:[
            {titulo:'Abrir ONU Authorization View',descricao:'No NE Manager, clique no ícone de autorização ONU na barra de ferramentas.',tip:null,imgs:[null]},
            {titulo:'Selecionar todas as caixas',descricao:'Na janela "Switch Object", selecione todas as caixas (OLT PANTANAL → AN5516-04_NODE1 → GC8B[1] e GC8B[2]) e clique OK.',tip:null,imgs:[null]},
            {titulo:'Localizar → Autorizar → Select Line → Create on Device',descricao:'1. Localize pelo SN. Botão direito → "Add to the ONU Authority List".\n2. Selecione "Select Line" → OK.\n3. Role até o final, confirme SN em azul → "Create on Device".',tip:'⚠ Confirme o SN antes de autorizar.',imgs:[null,null,null]},
            {titulo:'Verificar na ONU List e renomear',descricao:'Aba "ONU List" → pesquise pelo SN → confirme "ON LINE" → Botão direito → "Attribute" → renomeie: PDO [nº] [nome cliente].',tip:null,imgs:[null]},
            {titulo:'Abrir Service Configuration',descricao:'Botão direito no cliente → "Service Configuration".',tip:null,imgs:[null]},
            {titulo:'Configurar WAN Service',descricao:'Menu esquerdo → "WAN Service" → "Add":\n• WAN_Mode: INTERNET\n• WAN_Conn_Type: ROUTE\n• WAN_Vlan_Id: [VLAN da OLT]\n• Wan_D_S_P: PPPOE\n• USERNAME: [pppoe@dipelnet.com.br]\n• PASSWORD: [senha IXC]\n• Ativar: LAN1, LAN2, LAN3, LAN4, 2.4G_SSID1, 5G_SSID1\n→ "Create on Device"',tip:'PPPoE e senha são gerados no IXC.',imgs:[null,null]},
            {titulo:'Web Administrator Config',descricao:'"Web Administrator Config" → senha cactelvoip em todas as caixas → "Create on Device".',tip:null,imgs:[null]},
            {titulo:'ONU Local Manage Interface',descricao:'"ONU Local Manage Interface Configure" → todas em ENABLE → "Create on Device".',tip:null,imgs:[null]},
            {titulo:'Configurar DHCP e BroadBand no portal web',descricao:'1. Network → DHCP Service: DNS Primário 187.49.80.2, DNS Secundário 8.8.8.8, Lease Time 12h → Apply\n2. BroadBand Settings: confirmar VLAN ID, PPPoE e State: Connected',tip:'Se não autenticar, verifique PPPoE e senha no IXC.',imgs:[null,null,null]},
          ],
          aviso_perigo:'Sempre confirme o SN antes de criar no device. SN errado pode derrubar outro cliente.',
        }
      },
      {
        slug: 'huawei',
        titulo: 'Ativação Huawei em Bridge',
        descricao: 'iManager U2000 – ONT em modo bridge com VAS Profile ONT-BRIDGE-2020',
        categoria: 'Ativação',
        conteudo: {
          badge:'br', badgeText:'6 etapas',
          alerta:'Use o iManager U2000 para este procedimento.',
          steps:[
            {titulo:'Localizar o cliente no GPON ONU',descricao:'iManager U2000 → GPON Management → GPON ONU. Botão direito → "BIND GENERAL ONT VAS PROFILE".',tip:'ONT-BRIDGE-2020 é o padrão para modo bridge na Dipelnet.',imgs:[null]},
            {titulo:'SERVICE PORT INFO',descricao:'Botão direito → ADD → CONNECTION TYPE: LAN-ONT → VLAN ID da OLT → USER VLAN: 10.',tip:null,imgs:[null]},
            {titulo:'CURRENT ONU: UNI PORT INFO',descricao:'Botão direito na primeira porta ETH → MODIFY.',tip:null,imgs:[null]},
            {titulo:'MODIFY — DEFAULT VLAN ID',descricao:'Alterar DEFAULT VLAN ID para 10 → OK.',tip:null,imgs:[null]},
            {titulo:'Confirmar ativação no IXC',descricao:'Verifique no IXC se o cliente autenticou. Em modo bridge o PPPoE é configurado no roteador do cliente.',tip:'Em caso de falha, verifique se o VLAN ID confere com a VLAN da OLT.',imgs:[]},
          ],
          aviso_perigo:'',
        }
      },
      {
        slug: 'telefonia',
        titulo: 'Configuração de Telefonia VoIP',
        descricao: 'SIP na ONT Huawei – VLAN 240/20, servidor 187.49.80.21, porta POTS',
        categoria: 'Telefonia',
        conteudo: {
          badge:'bg', badgeText:'6 etapas',
          alerta:'Configuração feita na interface web da ONT Huawei. Cascavel e Corbélia usam servidor 187.49.80.21.',
          steps:[
            {titulo:'Acessar Voice → VoIP Basic',descricao:'Interface web da ONT → Voice → VoIP Basic → "Basic Profile Parameters (SIP)".',tip:null,imgs:[null]},
            {titulo:'Configurar servidores SIP',descricao:'Preencha 187.49.80.21 em:\n• Outbound Proxy Server\n• Standby Outbound Proxy Server\n• Primary Proxy Server\n• Standby Proxy Server\n• Home Domain\nPortas: todas em 5060',tip:'⚠ Todos os campos devem ter o mesmo IP.',imgs:[null,null]},
            {titulo:'Signaling Port e Region',descricao:'• Signaling Port: 2_VOIP_R_VID_20\n• Media Port: 2_VOIP_R_VID_20\n• Region: Brazil',tip:null,imgs:[]},
            {titulo:'Configurar usuário SIP',descricao:'Basic User Parameters → New:\n• Enable User: ✅\n• URI: [número da linha]\n• Registration User Name: [mesmo número]\n• Associated POTS Port: 1\n• Authentication User Name: [mesmo número]\n• Password: [senha fornecida]\n→ Apply',tip:'Linha e senha fornecidas pelo setor responsável.',imgs:[null]},
            {titulo:'Verificar registro VoIP',descricao:'Service Provisioning → VoIP:\n• User Status: Up\n• Call Status: Idle\n✅ Up + Idle = registrado com sucesso!',tip:null,imgs:[null]},
            {titulo:'IPs por região',descricao:'• Cascavel / Corbélia: 187.49.80.21 (cód. 6418)\n• Servidor cód. 6123: 187.49.80.19\n• Servidor cód. 6145: 187.49.80.18\n• Servidor cód. 6663: 187.49.80.22',tip:'Confirme o IP da região antes de configurar.',imgs:[null]},
          ],
          aviso_perigo:'Se User Status = Down, verifique o IP do servidor SIP para a região.',
        }
      },
      {
        slug: '02bbridge',
        titulo: '02B / HG em Bridge',
        descricao: 'NE Manager – Port Service Config, CVLAN Tag por porta LAN',
        categoria: 'Bridge',
        conteudo: {
          badge:'bp', badgeText:'4 etapas',
          alerta:'Use o NE Manager. Repita em todas as portas LAN disponíveis ou ativas.',
          steps:[
            {titulo:'Acessar Port Service Config',descricao:'NE Manager → cliente na ONU List → botão direito → "Port Service Config".',tip:null,imgs:[null]},
            {titulo:'LAN1 → Add serviço',descricao:'Painel esquerdo: PDO [número] → Data Port → LAN1 → "Service Configuration" → "Add".',tip:null,imgs:[null]},
            {titulo:'Configurar CVLAN como TAG',descricao:'"Add Port Service Configuration":\n• CVLAN Mode: "Tag"\n• CVLAN ID: VLAN da OLT\n→ OK',tip:'A VLAN é a mesma da autenticação da OLT.',imgs:[null]},
            {titulo:'Create on Device e repetir',descricao:'Confirme (Unicast, Tag, VLAN) → "Create on Device".\nRepita para LAN2, LAN3 e LAN4.',tip:'Sempre clique "Create on Device" ao finalizar cada porta.',imgs:[null]},
          ],
          aviso_perigo:'',
        }
      },
    ];

    for (const g of guiasData) {
      await client.query(`
        INSERT INTO guias (slug, titulo, descricao, categoria, conteudo, setor_id, status)
        VALUES ($1,$2,$3,$4,$5,(SELECT id FROM setores WHERE nome='Campo'),'Ativo')
        ON CONFLICT (slug) DO UPDATE SET titulo=$2, descricao=$3, conteudo=$5, atualizado_em=NOW();
      `, [g.slug, g.titulo, g.descricao, g.categoria, JSON.stringify(g.conteudo)]);
    }

    // ── CHECKLISTS DE CAMPO ──────────────────────────
    const checklists = [
      { slug:'checklist-instalacao',    titulo:'Checklist — Instalação Padrão',                 descricao:'Fotos obrigatórias para toda instalação.', categoria:'Checklist', conteudo:{badge:'bc',badgeText:'10 itens',steps:Array(10).fill({titulo:'',descricao:'',imgs:[]}),aviso_perigo:'Todas as fotos devem estar com localização do app Conota Camera e renomeadas no sistema.'} },
      { slug:'checklist-predios',       titulo:'Checklist — Prédios / Pontos Adicionais',       descricao:'Instalação padrão + fotos adicionais.',     categoria:'Checklist', conteudo:{badge:'bc',badgeText:'11 itens',steps:Array(11).fill({titulo:'',descricao:'',imgs:[]}),aviso_perigo:'Todas as fotos devem estar com localização do app Conota Camera e renomeadas no sistema.'} },
      { slug:'checklist-loss-ponteiras',titulo:'Checklist — LOSS: Ponteiras / Sinal Alto / Relançamentos', descricao:'Fotos para LOSS.',              categoria:'Checklist', conteudo:{badge:'bc',badgeText:'13 itens',steps:Array(13).fill({titulo:'',descricao:'',imgs:[]}),aviso_perigo:'Todas as fotos devem estar com localização do app Conota Camera e renomeadas no sistema.'} },
    ];

    for (const c of checklists) {
      await client.query(`
        INSERT INTO guias (slug, titulo, descricao, categoria, conteudo, setor_id, status)
        VALUES ($1,$2,$3,$4,$5,(SELECT id FROM setores WHERE nome='Campo'),'Ativo')
        ON CONFLICT (slug) DO NOTHING;
      `, [c.slug, c.titulo, c.descricao, c.categoria, JSON.stringify(c.conteudo)]);
    }

    await client.query('COMMIT');
    console.log('✅ Migration concluída!');
    console.log('🔧 Admin: admin@dipelnet.com.br / admin123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro na migration:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();