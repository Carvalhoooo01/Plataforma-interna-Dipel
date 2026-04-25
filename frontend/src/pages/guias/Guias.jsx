import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const API_KEY    = import.meta.env.VITE_CLOUDINARY_API_KEY;
const PRESET     = import.meta.env.VITE_CLOUDINARY_PRESET;

const LS_KEY  = 'dp_guia_imgs';
const loadImgs = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)||'{}'); } catch { return {}; } };
const saveImgs = (d) => localStorage.setItem(LS_KEY, JSON.stringify(d));

const CHECKLIST_ITEMS = [
  { id:1,  texto: 'Foto do local do equipamento' },
  { id:2,  texto: 'Teste de velocidade (print)' },
  { id:3,  texto: 'IPv6 funcionando' },
  { id:4,  texto: 'Termo impresso com assinatura do cliente' },
  { id:5,  texto: 'PingTools — Análise de Espectro' },
  { id:6,  texto: 'Código do cliente registrado' },
  { id:7,  texto: 'Foto do PDO (mostrando numeração do PDO)' },
  { id:8,  texto: 'Metragem do cabo registrada' },
  { id:9,  texto: 'Foto do PDO (mostrando sinal e porta utilizada)' },
  { id:10, texto: 'Foto do PDO (mostrando plaqueta e porta utilizada)' },
  { id:11, texto: 'Foto da fachada (residência, empresa ou estabelecimento)' },
];

const CONTEUDO_LOCAL = {
  onu02b:{
    badge:'bb', badgeText:'9 passos',
    alerta:'Use o NE Manager (OLT PANTANAL — 10.125.24.46) para este procedimento.',
    steps:[
      {titulo:'Abrir ONU Authorization View',descricao:'No NE Manager, clique no ícone de autorização ONU na barra de ferramentas (ícone de lista com seta).',tip:null,imgs:[null]},
      {titulo:'Selecionar todas as caixas',descricao:'Na janela "Switch Object (Unauthorized ONU List)", selecione todas as caixas:\n• OLT PANTANAL\n• AN5516-04_NODE1\n• GC8B[1] e GC8B[2]\n\nClique OK.',tip:null,imgs:[null]},
      {titulo:'Localizar → Autorizar → Select Line → Create on Device',descricao:'1. Localize o equipamento pelo SN/Physical ID. Botão direito → "Add to the ONU Authority List" → "As Physical ID Authentication Mode Added to the Whitelist".\n\n2. Na janela "Configure the Selection Range" selecione "Select Line" e clique OK.\n\n3. Role a lista até o final. Localize o equipamento em azul, confirme o SN. Botão direito → "Create on Device" → "Select Line" novamente.',tip:'⚠️ Verifique se o SN confere com o equipamento físico do cliente antes de autorizar.',imgs:[null,null,null]},
      {titulo:'Verificar na ONU List e renomear',descricao:'Volte à aba "ONU List" e pesquise pelo SN. Confirme "ON LINE". Botão direito → "Attribute" e renomeie:\n\nPDO [número do PDO] [nome do cliente]\nEx: PDO 8104 GIOVANI MARTINS',tip:null,imgs:[null]},
      {titulo:'Abrir Service Configuration',descricao:'Com o cliente selecionado, clique com botão direito → "Service Configuration".',tip:null,imgs:[null]},
      {titulo:'Configurar WAN Service',descricao:'Menu esquerdo → "WAN Service" → "Add" e configure:\n• WAN_Mode: INTERNET\n• WAN_Conn_Type: ROUTE\n• WAN_Vlan_Id: [VLAN da OLT]\n• Wan_D_S_P: PPPOE\n• WAN_PPPOE_Username: [pppoe@dipelnet.com.br]\n• WAN_PPPOE_Password: [senha do IXC]\n• Ativar: LAN1, LAN2, LAN3, LAN4, 2.4G_SSID1, 5G_SSID1\n\nClicar em "Create on Device".',tip:'O PPPoE e senha são gerados no IXC junto ao cadastro do cliente.',imgs:[null,null]},
      {titulo:'Web Administrator Config',descricao:'Navegue até "Web Administrator Config Management Inquiry". Defina a senha cactelvoip em todas as caixas. Clique em "Create on Device".',tip:null,imgs:[null]},
      {titulo:'ONU Local Manage Interface',descricao:'Navegue até "ONU Local Manage Interface Configure". Selecione todas as opções e deixe em ENABLE:\n• Config Enable • Console • Telnet Uni / Ani • Web Uni / Ani\n\nClicar em "Create on Device".',tip:null,imgs:[null]},
      {titulo:'Configurar DHCP e BroadBand no portal web',descricao:'Acesse a página web do equipamento após autenticação no IXC.\n\n1. Network → DHCP Service:\n• DHCP Primary DNS: 187.49.80.2\n• DHCP Secondary DNS: 8.8.8.8\n• DHCP Lease Time: 12h → Apply\n\n2. BroadBand Settings → Internet Settings:\n• Confirmar VLAN ID e PPPoE configurado\n• State: Connected ✅',tip:'Se não autenticar, verifique PPPoE e senha no IXC.',imgs:[null,null,null]},
    ],
    aviso_perigo:'Sempre confirme o SN antes de criar no device. SN errado pode derrubar a conexão de outro cliente.',
  },
  huawei:{
    badge:'br', badgeText:'7 etapas',
    alerta:'Use o iManager U2000 para este procedimento.',
    steps:[
      {titulo:'Localizar o cliente no GPON ONU',descricao:'iManager U2000 → GPON Management → GPON ONU. com o botão direito no cliente você seleciona a opção "BIND GENERAL ONT VAS PROFILE".',tip:'ONT-BRIDGE-2020 é o padrão para modo bridge na Dipelnet.',imgs:[null]},
      {titulo:'Clicar na seta ">>17"',descricao:'Parte inferior da tela → clique na setinha ">>17" ou com o botão direito no cliente redirecione ate a aba SERVICE PORT INFO',tip:null,imgs:[null]},
      {titulo:'SERVICE PORT INFO',descricao:'Com botão direito clique em ADD -> CONNECTION TYPE selecione a opção (LAN-ONT) -> coloque a VLAN ID da OLT que esta autenticando -> USER VLAN: 10',tip:null,imgs:[null]},
      {titulo:'CURRENT ONU: UNI PORT INFO',descricao:'Selecionar como botão direito a primeira porta ETH mostrado a imagem a baixo -> MODIFY".',tip:null,imgs:[null]},
      {titulo:'MODIFY...',descricao:'Selecione Modify..',tip:null,imgs:[null]},
      {titulo:'MODIFY',descricao:'no modify vai ser realizado somente uma alteração que sera do DEFAULT VLAN ID(1-4095), voce deve colocar 10 -> OK',tip:null,imgs:[null]},
      {titulo:'Confirmar ativação no IXC',descricao:'Verifique no IXC se o cliente autenticou. Em modo bridge o PPPoE é configurado no roteador do cliente.',tip:'Em caso de falha, verifique se o VLAN ID confere com a VLAN da OLT.',imgs:[]},
    ],
    aviso_perigo:'',
  },
  telefonia:{
    badge:'bg', badgeText:'6 etapas',
    alerta:'Configuração feita na interface web da ONT Huawei. Cascavel e Corbélia usam servidor 187.49.80.21.',
    steps:[
      {titulo:'Acessar Voice → VoIP Basic',descricao:'Interface web da ONT → Voice → VoIP Basic → "Basic Profile Parameters (SIP)".',tip:null,imgs:[null]},
      {titulo:'Configurar servidores SIP',descricao:'Preencha com o IP da região (Cascavel/Corbélia = 187.49.80.21) nos campos:\n• Outbound Proxy Server Address\n• Address of the Standby Outbound Proxy Server\n• Address of the Primary Proxy Server\n• Address of the Standby Proxy Server\n• Home Domain\n\nPortas: todas em 5060',tip:'⚠️ Todos os campos de endereço SIP devem ter o mesmo IP.',imgs:[null,null]},
      {titulo:'Signaling Port e Region',descricao:'• Signaling Port: 2_VOIP_R_VID_20\n• Media Port: 2_VOIP_R_VID_20\n• Region: Brazil',tip:'A VLAN de voz é a 20, diferente da VLAN de dados (240).',imgs:[]},
      {titulo:'Configurar usuário SIP',descricao:'Basic User Parameters → New:\n• Enable User: ✅\n• URI: [número da linha] Ex: 30160294\n• Registration User Name: [mesmo número]\n• Associated POTS Port: 1\n• Authentication User Name: [mesmo número]\n• Password: [senha fornecida]\n→ Apply',tip:'Linha e senha são fornecidas pelo setor responsável.',imgs:[null]},
      {titulo:'Verificar registro VoIP',descricao:'Service Provisioning → VoIP. Confirme:\n• User Status: Up\n• Call Status: Idle\n\n✅ Up + Idle = telefonia registrada com sucesso!',tip:null,imgs:[null]},
      {titulo:'Tabela de IPs por região',descricao:'• Cascavel / Corbélia: 187.49.80.21 (cód. 6418)\n• Servidor cód. 6123: 187.49.80.19\n• Servidor cód. 6145: 187.49.80.18\n• Servidor cód. 6663: 187.49.80.22',tip:'Confirme sempre o IP correto da região antes de configurar.',imgs:[null]},
    ],
    aviso_perigo:'Se User Status = Down, verifique se o IP do servidor SIP está correto para a região.',
  },
  '02bbridge':{
    badge:'bp', badgeText:'4 etapas',
    alerta:'Use o NE Manager. Repita em todas as portas LAN disponíveis ou ativas.',
    steps:[
      {titulo:'Acessar Port Service Config',descricao:'NE Manager → cliente na ONU List → botão direito → "Port Service Config".',tip:null,imgs:[null]},
      {titulo:'LAN1 → Add serviço',descricao:'Painel esquerdo: PDO [número] → Data Port → LAN1 → aba "Service Configuration" → "Add".',tip:null,imgs:[null]},
      {titulo:'Configurar CVLAN como TAG',descricao:'"Add Port Service Configuration":\n• CVLAN Mode: altere de "Transparent" para "Tag"\n• CVLAN ID: VLAN da OLT\n→ OK',tip:'A VLAN é a mesma da autenticação da OLT.',imgs:[null]},
      {titulo:'Create on Device e repetir',descricao:'Confirme (Unicast, Tag, VLAN) → "Create on Device".\n\nRepita para LAN2, LAN3 e LAN4.',tip:'Sempre clique "Create on Device" ao finalizar cada porta.',imgs:[null]},
    ],
    aviso_perigo:'',
  },
};

const GUIAS_LOCAL = [
  {id:1,slug:'onu02b',    titulo:'Ativação 02B / AN5506',       descricao:'NE Manager — PPPoE com VLAN, senhas web e interface local',          categoria:'Ativação', badge:'bb'},
  {id:2,slug:'huawei',    titulo:'Ativação Huawei em Bridge',   descricao:'iManager U2000 — ONT em modo bridge com VAS Profile ONT-BRIDGE-2020',categoria:'Ativação', badge:'br'},
  {id:3,slug:'telefonia', titulo:'Configuração Telefonia VoIP', descricao:'SIP na ONT Huawei — VLAN 240/20, servidor 187.49.80.21, porta POTS', categoria:'Telefonia',badge:'bg'},
  {id:4,slug:'02bbridge', titulo:'02B / HG em Bridge',          descricao:'NE Manager — Port Service Config, CVLAN Tag por porta LAN',          categoria:'Bridge',   badge:'bp'},
];

const CAT = {
  'Ativação':   'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Telefonia':  'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'Bridge':     'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'Instalação': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'Checklist':  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
};
const BC = {
  bb: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  br: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  bg: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  bp: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  bc: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
};

function Gallery({imgs, stepIdx, isAdmin, onUpload, onRemove}) {
  if (!imgs || imgs.length === 0) return null;
  return (
    <div className="mt-3">
      <div className={`grid gap-2 ${imgs.length === 1 ? 'grid-cols-1' : imgs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {imgs.map((url, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative bg-gray-50 dark:bg-gray-800">
            {url ? (
              <>
                <img src={url} alt={`print ${idx+1}`} onClick={() => window.open(url,'_blank')}
                  className="w-full block object-contain cursor-pointer bg-gray-900"
                  style={{maxHeight: imgs.length===1 ? 300 : 180}}/>
                {isAdmin && (
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    <button onClick={() => onUpload(stepIdx,idx)} className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">Trocar</button>
                    <button onClick={() => onRemove(stepIdx,idx)} className="bg-red-600/80 text-white text-[10px] px-1.5 py-0.5 rounded">×</button>
                  </div>
                )}
                {imgs.length > 1 && <div className="absolute bottom-1.5 left-1.5 bg-black/55 text-white text-[10px] px-1.5 py-0.5 rounded font-semibold">{idx+1}/{imgs.length}</div>}
              </>
            ) : (
              <div className="p-4 flex flex-col items-center justify-center gap-1.5 min-h-[80px]">
                <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span className="text-[10px] text-gray-400 text-center">{imgs.length>1?`Print ${idx+1}/${imgs.length}`:'Print do passo'}</span>
                {isAdmin && <button onClick={() => onUpload(stepIdx,idx)} className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 text-white text-[11px] font-medium">Enviar</button>}
              </div>
            )}
          </div>
        ))}
      </div>
      {isAdmin && (
        <button onClick={() => onUpload(stepIdx, imgs.length)} className="mt-1.5 flex items-center gap-1 px-2.5 py-1 rounded border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-[11px] hover:border-blue-400 transition-colors">
          + Adicionar foto
        </button>
      )}
    </div>
  );
}

function ChecklistPage({ onVoltar }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <button onClick={onVoltar} className="text-blue-600 dark:text-blue-400 hover:underline">Guias</button>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">Checklist pós-instalação</span>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">✅ Checklist pós-instalação</div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">{CHECKLIST_ITEMS.length} itens</span>
        </div>

        <div className="p-5 lg:p-6">
          <div className="flex gap-2.5 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 text-sm mb-5">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Itens obrigatórios a serem registrados após toda instalação. Sem registros fotográficos, não há comprovação em caso de irregularidade.</span>
          </div>

          <div className="flex flex-col gap-2">
            {CHECKLIST_ITEMS.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{item.texto}</span>
                <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            ))}
          </div>

          <div className="mt-5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs leading-relaxed">
            <strong>⚠️ Atenção:</strong> Em caso de irregularidade ou reclamação do cliente, somente os registros fotográficos servirão como comprovação. Sem fotos, não há defesa. Dúvidas, falar no PV.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Guias() {
  const {temRole}          = useAuth();
  const [guias,setGuias]   = useState([]);
  const [busca,setBusca]   = useState('');
  const [atual,setAtual]   = useState(null);
  const [cont,setCont]     = useState(null);
  const [verChecklist, setVerChecklist] = useState(false);

  useEffect(() => {
    api.get('/guias').then(r => setGuias(r.data.length ? r.data : GUIAS_LOCAL)).catch(() => setGuias(GUIAS_LOCAL));
  }, []);

  const abrir = async (g) => {
    setAtual(g);
    const local = CONTEUDO_LOCAL[g.slug];
    const base  = JSON.parse(JSON.stringify(local || {}));
    try {
      const {data} = await api.get(`/guias/${g.slug}`);
      if (data.conteudo?.steps?.length) {
        if (local) {
          base.steps = base.steps.map((localStep, si) => {
            const apiStep = data.conteudo.steps[si] || {};
            const imgsDB  = Array.isArray(apiStep.imgs) && apiStep.imgs.some(u => u) ? apiStep.imgs : localStep.imgs;
            return { ...localStep, imgs: imgsDB };
          });
        } else {
          base.steps = data.conteudo.steps;
          base.aviso = data.conteudo.aviso || null;
        }
      }
    } catch {}
    const saved = loadImgs();
    if (saved[g.slug]) {
      base.steps = base.steps.map((s, si) => {
        const lsImgs = saved[g.slug][si];
        const temImgBanco = s.imgs && s.imgs.some(u => u && u.startsWith('http'));
        if (!temImgBanco && Array.isArray(lsImgs) && lsImgs.some(u => u)) return { ...s, imgs: lsImgs };
        return s;
      });
    }
    setCont(base);
    window.scrollTo(0, 0);
  };

  const upload = (stepIdx, imgIdx) => {
    if (!CLOUD_NAME || CLOUD_NAME==='seu-cloud-name') { alert('Configure VITE_CLOUDINARY_CLOUD_NAME'); return; }
    if (typeof cloudinary === 'undefined') { alert('Widget Cloudinary não carregado.'); return; }
    cloudinary.createUploadWidget({
      cloudName:CLOUD_NAME, uploadPreset:PRESET, apiKey:API_KEY,
      sources:['local','camera'], multiple:false, maxFileSize:5000000,
      folder:`dipelnet/guias/${atual.slug}`,
    }, async (err, res) => {
      if (!res || res.event !== 'success') return;
      const url = res.info.secure_url;
      setCont(prev => {
        const c = JSON.parse(JSON.stringify(prev));
        if (!c.steps[stepIdx].imgs) c.steps[stepIdx].imgs = [];
        if (imgIdx < c.steps[stepIdx].imgs.length) c.steps[stepIdx].imgs[imgIdx] = url;
        else c.steps[stepIdx].imgs.push(url);
        const saved = loadImgs(); saved[atual.slug] = c.steps.map(s => s.imgs||[]); saveImgs(saved);
        return c;
      });
      try { await api.put(`/guias/${atual.id||atual.slug}/imagem`, {step_index:stepIdx, img_index:imgIdx, url}); } catch {}
    }).open();
  };

  const remover = (stepIdx, imgIdx) => {
    if (!confirm('Remover esta foto?')) return;
    setCont(prev => {
      const c = JSON.parse(JSON.stringify(prev));
      c.steps[stepIdx].imgs[imgIdx] = null;
      const saved = loadImgs(); saved[atual.slug] = c.steps.map(s => s.imgs||[]); saveImgs(saved);
      return c;
    });
  };

  // ── CHECKLIST PAGE ──
  if (verChecklist) {
    return <ChecklistPage onVoltar={() => setVerChecklist(false)} />;
  }

  // ── VISUALIZADOR ──
  if (atual && cont) {
    const steps = cont.steps || [];
    return (
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <button onClick={() => { setAtual(null); setCont(null); }} className="text-blue-600 dark:text-blue-400 hover:underline">Guias</button>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">{atual.titulo}</span>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{atual.titulo}</div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${BC[cont.badge]||BC.bb}`}>{cont.badgeText}</span>
          </div>

          <div className="p-5 lg:p-6">
            {cont.alerta && (
              <div className="flex gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm mb-5">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {cont.alerta}
              </div>
            )}
            {cont.aviso && (
              <div className="flex gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-300 mb-4">
                {cont.aviso}
              </div>
            )}
            {steps.map((s, i) => (
              <div key={i} className={`flex gap-4 py-4 ${i < steps.length-1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{s.titulo}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{s.descricao}</div>
                  {s.tip && (
                    <div className="flex gap-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg p-2.5 text-xs mt-2.5 leading-relaxed">
                      <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      {s.tip}
                    </div>
                  )}
                  <Gallery imgs={s.imgs||[]} stepIdx={i} isAdmin={temRole('admin')} onUpload={upload} onRemove={remover}/>
                </div>
              </div>
            ))}
            {cont.aviso_perigo && (
              <div className="flex gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm mt-4">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {cont.aviso_perigo}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── LISTA ──
  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 mb-4">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar guia..."
          className="border-none outline-none text-sm flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"/>
      </div>

      <div className="flex flex-col gap-3">
        {/* Card fixo do Checklist */}
        <div
          onClick={() => setVerChecklist(true)}
          className="bg-white dark:bg-gray-900 border border-emerald-300 dark:border-emerald-700 rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Checklist pós-instalação</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Itens obrigatórios de registro fotográfico após cada instalação</div>
            <div className="flex flex-wrap gap-2 items-center mt-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Checklist</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">{CHECKLIST_ITEMS.length} itens</span>
            </div>
          </div>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        {/* Guias normais */}
        {guias
          .filter(g => g.titulo.toLowerCase().includes(busca.toLowerCase()) || (g.categoria||'').toLowerCase().includes(busca.toLowerCase()))
          .map(g => {
            const c = CONTEUDO_LOCAL[g.slug] || {};
            const totalFotos = (c.steps||[]).reduce((a,s) => a + (s.imgs||[]).length, 0);
            return (
              <div key={g.slug} onClick={() => abrir(g)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${CAT[g.categoria] || 'bg-gray-100 text-gray-600'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{g.titulo}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{g.descricao}</div>
                  <div className="flex flex-wrap gap-2 items-center mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${CAT[g.categoria]||'bg-gray-100 text-gray-600'}`}>{g.categoria}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${BC[g.badge]||BC.bb}`}>{(c.steps||[]).length} etapas</span>
                    {totalFotos > 0 && <span className="text-[11px] text-gray-400">{totalFotos} fotos</span>}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            );
          })}
      </div>
    </div>
  );
}