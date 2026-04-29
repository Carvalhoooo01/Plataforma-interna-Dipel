import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET     = import.meta.env.VITE_CLOUDINARY_PRESET;

// ── CONTEÚDO LOCAL DOS GUIAS ──────────────────────────
const CONTEUDO_LOCAL = {
  onu02b:{
    badge:'bb', badgeText:'9 passos',
    alerta:'Use o NE Manager (OLT PANTANAL — 10.125.24.46) para este procedimento.',
    steps:[
      {titulo:'Abrir ONU Authorization View',descricao:'No NE Manager, clique no ícone de autorização ONU na barra de ferramentas (ícone de lista com seta).',tip:null,imgs:[null]},
      {titulo:'Selecionar todas as caixas',descricao:'Na janela "Switch Object (Unauthorized ONU List)", selecione todas as caixas:\n• OLT PANTANAL\n• AN5516-04_NODE1\n• GC8B[1] e GC8B[2]\n\nClique OK.',tip:null,imgs:[null]},
      {titulo:'Localizar → Autorizar → Select Line → Create on Device',descricao:'1. Localize o equipamento pelo SN/Physical ID. Botão direito → "Add to the ONU Authority List" → "As Physical ID Authentication Mode Added to the Whitelist".\n\n2. Na janela "Configure the Selection Range" selecione "Select Line" e clique OK.\n\n3. Role a lista até o final. Localize o equipamento em azul, confirme o SN. Botão direito → "Create on Device" → "Select Line" novamente.',tip:'⚠ Verifique se o SN confere com o equipamento físico do cliente antes de autorizar.',imgs:[null,null,null]},
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
      {titulo:'Localizar o cliente no GPON ONU',descricao:'iManager U2000 → GPON Management → GPON ONU. Com o botão direito no cliente selecione "BIND GENERAL ONT VAS PROFILE".',tip:'ONT-BRIDGE-2020 é o padrão para modo bridge na Dipelnet.',imgs:[null]},
      {titulo:'Clicar na seta ">>17"',descricao:'Parte inferior da tela → clique na setinha ">>17" ou com o botão direito no cliente redirecione até a aba SERVICE PORT INFO.',tip:null,imgs:[null]},
      {titulo:'SERVICE PORT INFO',descricao:'Com botão direito clique em ADD → CONNECTION TYPE selecione (LAN-ONT) → coloque a VLAN ID da OLT que está autenticando → USER VLAN: 10.',tip:null,imgs:[null]},
      {titulo:'CURRENT ONU: UNI PORT INFO',descricao:'Selecionar com botão direito a primeira porta ETH → "MODIFY".',tip:null,imgs:[null]},
      {titulo:'MODIFY',descricao:'No modify realizar somente uma alteração: DEFAULT VLAN ID (1-4095), colocar 10 → OK.',tip:null,imgs:[null]},
      {titulo:'Confirmar ativação no IXC',descricao:'Verifique no IXC se o cliente autenticou. Em modo bridge o PPPoE é configurado no roteador do cliente.',tip:'Em caso de falha, verifique se o VLAN ID confere com a VLAN da OLT.',imgs:[]},
    ],
    aviso_perigo:'',
  },
  telefonia:{
    badge:'bg', badgeText:'6 etapas',
    alerta:'Configuração feita na interface web da ONT Huawei. Cascavel e Corbélia usam servidor 187.49.80.21.',
    steps:[
      {titulo:'Acessar Voice → VoIP Basic',descricao:'Interface web da ONT → Voice → VoIP Basic → "Basic Profile Parameters (SIP)".',tip:null,imgs:[null]},
      {titulo:'Configurar servidores SIP',descricao:'Preencha com o IP da região (Cascavel/Corbélia = 187.49.80.21):\n• Outbound Proxy Server Address\n• Address of the Standby Outbound Proxy Server\n• Address of the Primary Proxy Server\n• Address of the Standby Proxy Server\n• Home Domain\n\nPortas: todas em 5060',tip:'⚠ Todos os campos de endereço SIP devem ter o mesmo IP.',imgs:[null,null]},
      {titulo:'Signaling Port e Region',descricao:'• Signaling Port: 2_VOIP_R_VID_20\n• Media Port: 2_VOIP_R_VID_20\n• Region: Brazil',tip:'A VLAN de voz é a 20, diferente da VLAN de dados (240).',imgs:[]},
      {titulo:'Configurar usuário SIP',descricao:'Basic User Parameters → New:\n• Enable User: ✅\n• URI: [número da linha]\n• Registration User Name: [mesmo número]\n• Associated POTS Port: 1\n• Authentication User Name: [mesmo número]\n• Password: [senha fornecida]\n→ Apply',tip:'Linha e senha são fornecidas pelo setor responsável.',imgs:[null]},
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

// ── CHECKLIST CATEGORIAS ──────────────────────────────
const CHECKLIST_CATS = [
  {
    slug: 'checklist-instalacao',
    titulo: 'Checklist — Instalação Padrão',
    descricao: 'Fotos obrigatórias para toda instalação de fibra residencial ou comercial.',
    categoria: 'Checklist', badge: 'bc', badgeText: '12 itens',
    cor: '#1a56db',
    steps: [
      { titulo: 'Local do equipamento', descricao: 'Equipamento bem instalado em local apropriado, com canaleta, organizador de cabos e centralizado na parede ou balcão. Não pode ficar sobre outros aparelhos eletrônicos.', tip: 'Se estiver provisoriamente no chão ou cadeira, registre no checklist e no termo.', imgs: [null, null, null] },
      { titulo: 'Teste de velocidade (print)', descricao: 'Realizar com Fast.com ou Speedtest. Confirmar compatibilidade com o plano contratado. Teste deve estar totalmente concluído.', tip: null, imgs: [null, null] },
      { titulo: 'IPv6 funcionando', descricao: 'Realizar pelo site test-ipv6.com. Pontuação deve ser 10/10. Pode ser feito pelo celular ou computador.', tip: null, imgs: [null] },
      { titulo: 'Termo comprovante com documento do cliente', descricao: 'Termo devidamente preenchido: nome, endereço, protocolo da O.S., assinatura do cliente ou responsável, assinatura da equipe terceirizada e data.\n\nFoto deve mostrar o termo junto com o documento do cliente visível.', tip: 'Atendimentos só podem ser executados com maior de idade no local.', imgs: [null, null] },
      { titulo: 'Análise de Espectro — PingTools', descricao: 'Realizar testes no local do equipamento E no último cômodo da residência, verificando o sinal em ambos os pontos.', tip: 'Consulte o manual de Reciclagem Rede de Computadores (Wi-Fi) para referência de sinal correto.', imgs: [null, null] },
      { titulo: 'Plaqueta com código do cliente (PDO)', descricao: 'Foto mostrando a plaqueta com o código do cliente na porta utilizada do PDO.', tip: null, imgs: [null] },
      { titulo: 'Foto do PDO — numeração', descricao: 'Foto mostrando a numeração do PDO claramente visível.', tip: null, imgs: [null] },
      { titulo: 'Metragem do cabo — inicial e final', descricao: 'Foto das metragens inicial e final da fibra, conferindo com o que foi dado baixa no IXC.', tip: null, imgs: [null, null] },
      { titulo: 'Foto do PDO — sinal e porta utilizada', descricao: 'Power meter aparecendo a potência e a porta utilizada. Verificar se o sinal não apresenta perda superior a 1 dB em comparação ao sinal do PDO.', tip: 'Se houver perda maior que 1 dB, solicitar regularização à terceirizada.', imgs: [null, null] },
      { titulo: 'Foto do PDO — plaqueta e porta utilizada', descricao: 'Foto mostrando a plaqueta com o código do cliente e a porta utilizada no PDO.', tip: null, imgs: [null] },
      { titulo: 'Foto da fachada', descricao: 'Foto da fachada da residência, empresa ou estabelecimento onde foi realizada a instalação.', tip: null, imgs: [null, null] },
      { titulo: 'Print do sinal da fibra no equipamento', descricao: 'Print mostrando o sinal da fibra no equipamento. Deve ser anexado no IXC.\n\nSe não for TPLink, a equipe interna deve tirar o print no UNM2000, U2000 ou ACS.', tip: null, imgs: [null, null] },
    ],
    aviso_perigo: 'Todas as fotos devem estar com localização do app Conota Camera e renomeadas no sistema.',
  },
  {
    slug: 'checklist-predios',
    titulo: 'Checklist — Prédios / Pontos Adicionais',
    descricao: 'Segue o padrão de instalação padrão com fotos adicionais de DG, caixas de passagem e pontos adicionais.',
    categoria: 'Checklist', badge: 'bc', badgeText: '15 itens',
    cor: '#7c3aed',
    steps: [
      { titulo: 'Local do equipamento', descricao: 'Equipamento bem instalado em local apropriado, com canaleta e organizado.', tip: null, imgs: [null, null] },
      { titulo: 'Teste de velocidade (print)', descricao: 'Fast.com ou Speedtest, compatível com o plano contratado.', tip: null, imgs: [null, null] },
      { titulo: 'IPv6 funcionando', descricao: 'test-ipv6.com — pontuação 10/10.', tip: null, imgs: [null] },
      { titulo: 'Termo comprovante com documento do cliente', descricao: 'Termo preenchido com foto do documento visível.', tip: null, imgs: [null, null] },
      { titulo: 'Análise de Espectro — PingTools', descricao: 'Testes no local do equipamento e no último cômodo.', tip: null, imgs: [null, null] },
      { titulo: 'Plaqueta com código do cliente (PDO)', descricao: 'Foto da plaqueta na porta utilizada do PDO.', tip: null, imgs: [null] },
      { titulo: 'Foto do PDO — numeração', descricao: 'Foto mostrando a numeração do PDO.', tip: null, imgs: [null] },
      { titulo: 'Metragem da fibra — inicial e final', descricao: 'Fotos das metragens inicial e final da fibra.', tip: null, imgs: [null, null] },
      { titulo: 'Foto do PDO — sinal e porta utilizada', descricao: 'Power meter com potência e porta utilizada visíveis.', tip: null, imgs: [null] },
      { titulo: 'Foto do PDO — plaqueta e porta', descricao: 'Plaqueta com código e porta utilizada no PDO.', tip: null, imgs: [null] },
      { titulo: 'Print do sinal da fibra no equipamento', descricao: 'Print do sinal no equipamento, anexado no IXC.', tip: null, imgs: [null] },
      { titulo: 'Foto da fachada', descricao: 'Foto da fachada do local.', tip: null, imgs: [null] },
      { titulo: 'Foto dos DG e Caixa de passagens', descricao: 'Fibra bem acomodada no DG ou caixa de passagem. Verificar quantidade conforme o checklist.', tip: null, imgs: [null, null] },
      { titulo: 'Foto do local do Ponto adicional', descricao: 'Roteador: instalado com canaleta, organizador de cabos, em local adequado e bem posicionado.\n\nCabo: sobra adequada, tampa da tomada fechada corretamente.', tip: null, imgs: [null, null] },
      { titulo: 'Metragem do cabo de rede — inicial e final', descricao: 'Válido para ambos os pontos adicionais. Conferir com o registrado no IXC.', tip: null, imgs: [null, null] },
    ],
    aviso_perigo: 'Todas as fotos devem estar com localização do app Conota Camera e renomeadas no sistema.',
  },
  {
    slug: 'checklist-loss-ponteiras',
    titulo: 'Checklist — LOSS: Ponteiras / Sinal Alto',
    descricao: 'Fotos obrigatórias para manutenção de LOSS por ponteiras ou sinal alto.',
    categoria: 'Checklist', badge: 'bc', badgeText: '11 itens',
    cor: '#d97706',
    steps: [
      { titulo: 'Local do equipamento', descricao: 'Foto do local onde o equipamento está instalado.', tip: null, imgs: [null, null] },
      { titulo: 'Teste de velocidade (print)', descricao: 'Fast.com ou Speedtest, compatível com o plano contratado.', tip: null, imgs: [null, null] },
      { titulo: 'IPv6 funcionando', descricao: 'test-ipv6.com — pontuação 10/10.', tip: null, imgs: [null] },
      { titulo: 'Termo comprovante com documento do cliente', descricao: 'Termo preenchido com foto do documento visível.', tip: null, imgs: [null, null] },
      { titulo: 'Análise de Espectro — PingTools', descricao: 'Testes no local do equipamento e no último cômodo.', tip: null, imgs: [null, null] },
      { titulo: 'Teste de PING no CMD ou PingTools', descricao: 'Print do teste de ping realizado no CMD ou PingTools.', tip: null, imgs: [null] },
      { titulo: 'Plaqueta com código do cliente (PDO)', descricao: 'Se o atendimento foi no PDO: foto da plaqueta na porta utilizada.', tip: null, imgs: [null] },
      { titulo: 'Foto do PDO — sinal e porta (se foi no PDO)', descricao: 'Power meter com potência e porta utilizada. Verificar se o sinal não tem perda superior a 1 dB.', tip: null, imgs: [null, null] },
      { titulo: 'Foto do PDO — plaqueta e porta (se foi no PDO)', descricao: 'Plaqueta com código e porta utilizada no PDO.', tip: null, imgs: [null] },
      { titulo: 'Print do sinal da fibra no equipamento', descricao: 'Print do sinal no equipamento, anexado no IXC.', tip: null, imgs: [null, null] },
      { titulo: 'Local onde estava a atenuação (se houver)', descricao: 'Foto mostrando o local onde foi identificada a atenuação: imagem ampla e outra detalhando como ficou por dentro.', tip: null, imgs: [null, null] },
    ],
    aviso_perigo: 'Todas as fotos devem estar com localização do app Conota Camera e renomeadas no sistema.',
  },
  {
    slug: 'checklist-loss-relancamentos',
    titulo: 'Checklist — LOSS: Relançamentos',
    descricao: 'Fotos obrigatórias para manutenção de LOSS por relançamento de fibra.',
    categoria: 'Checklist', badge: 'bc', badgeText: '13 itens',
    cor: '#dc2626',
    steps: [
      { titulo: 'Local do equipamento', descricao: 'Foto do local onde o equipamento está instalado.', tip: null, imgs: [null, null] },
      { titulo: 'Teste de velocidade (print)', descricao: 'Fast.com ou Speedtest, compatível com o plano contratado.', tip: null, imgs: [null, null] },
      { titulo: 'IPv6 funcionando', descricao: 'test-ipv6.com — pontuação 10/10.', tip: null, imgs: [null] },
      { titulo: 'Termo comprovante com documento do cliente', descricao: 'Termo preenchido com foto do documento visível.', tip: null, imgs: [null, null] },
      { titulo: 'Análise de Espectro — PingTools', descricao: 'Testes no local do equipamento e no último cômodo.', tip: null, imgs: [null, null] },
      { titulo: 'Plaqueta com código do cliente (PDO)', descricao: 'Foto da plaqueta na porta utilizada do PDO.', tip: null, imgs: [null] },
      { titulo: 'Foto do PDO — sinal e porta utilizada', descricao: 'Power meter com potência e porta utilizada. Verificar perda não superior a 1 dB.', tip: null, imgs: [null, null] },
      { titulo: 'Foto do PDO — plaqueta e porta', descricao: 'Plaqueta com código e porta utilizada no PDO.', tip: null, imgs: [null] },
      { titulo: 'Print do sinal da fibra no equipamento', descricao: 'Print do sinal no equipamento, anexado no IXC.', tip: null, imgs: [null, null] },
      { titulo: 'Teste de PING no CMD ou PingTools', descricao: 'Print do teste de ping realizado no CMD ou PingTools.', tip: null, imgs: [null] },
      { titulo: 'Metragem da fibra — inicial e final', descricao: 'Fotos das metragens inicial e final, conferindo com o IXC.', tip: null, imgs: [null, null] },
      { titulo: 'Foto da emenda (se houver)', descricao: 'Foto mostrando o local da emenda: uma imagem ampla e outra detalhando como ficou por dentro.', tip: 'Verificar observação no checklist.', imgs: [null, null] },
      { titulo: 'Foto dos DG e Caixa de passagens', descricao: 'Fibra bem acomodada no DG ou caixa de passagem. Verificar quantidade conforme o checklist.', tip: null, imgs: [null, null] },
    ],
    aviso_perigo: 'Todas as fotos devem estar com localização do app Conota Camera e renomeadas no sistema.',
  },
  {
    slug: 'checklist-suporte-geral',
    titulo: 'Checklist — Suporte Geral / Ponto Adicional',
    descricao: 'Fotos para manutenção de suporte geral, ponto adicional ou mudança de ponto.',
    categoria: 'Checklist', badge: 'bc', badgeText: '9 itens',
    cor: '#059669',
    steps: [
      { titulo: 'Local do equipamento', descricao: 'Foto do local onde o equipamento está instalado.', tip: null, imgs: [null, null] },
      { titulo: 'Teste de velocidade (print)', descricao: 'Fast.com ou Speedtest, compatível com o plano contratado.', tip: null, imgs: [null, null] },
      { titulo: 'IPv6 funcionando', descricao: 'test-ipv6.com — pontuação 10/10.', tip: null, imgs: [null] },
      { titulo: 'Termo comprovante com documento do cliente', descricao: 'Termo preenchido com foto do documento visível.', tip: null, imgs: [null, null] },
      { titulo: 'Análise de Espectro — PingTools', descricao: 'Testes no local do equipamento e no último cômodo.', tip: null, imgs: [null, null] },
      { titulo: 'Teste de PING no CMD ou PingTools', descricao: 'Print do teste de ping realizado no CMD ou PingTools.', tip: null, imgs: [null] },
      { titulo: 'Print do sinal da fibra no equipamento', descricao: 'Print do sinal no equipamento, anexado no IXC.', tip: null, imgs: [null, null] },
      { titulo: 'Foto do Ponto adicional (se houver)', descricao: 'Roteador ou cabo: instalado corretamente, canaleta, organizado e bem posicionado.', tip: null, imgs: [null, null] },
      { titulo: 'Metragem do cabo de rede — inicial e final (se houver)', descricao: 'Válido para ambos os pontos adicionais. Conferir com o registrado no IXC.', tip: null, imgs: [null, null] },
    ],
    aviso_perigo: 'Todas as fotos devem estar com localização do app Conota Camera e renomeadas no sistema.',
  },
];

const GUIAS_LOCAL = [
  {id:1,slug:'onu02b',    titulo:'Ativação 02B / AN5506',       descricao:'NE Manager — PPPoE com VLAN, senhas web e interface local',          categoria:'Ativação', badge:'bb'},
  {id:2,slug:'huawei',    titulo:'Ativação Huawei em Bridge',   descricao:'iManager U2000 — ONT em modo bridge com VAS Profile ONT-BRIDGE-2020',categoria:'Ativação', badge:'br'},
  {id:3,slug:'telefonia', titulo:'Configuração Telefonia VoIP', descricao:'SIP na ONT Huawei — VLAN 240/20, servidor 187.49.80.21, porta POTS', categoria:'Telefonia',badge:'bg'},
  {id:4,slug:'02bbridge', titulo:'02B / HG em Bridge',          descricao:'NE Manager — Port Service Config, CVLAN Tag por porta LAN',          categoria:'Bridge',   badge:'bp'},
];

const CAT_CLS = {
  'Ativação':  'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'Telefonia': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'Bridge':    'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  'Checklist': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
};
const BC = {
  bb:'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  br:'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  bg:'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  bp:'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  bc:'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
};

// ── GALERIA DE FOTOS POR PASSO ────────────────────────
function Gallery({ imgs, stepIdx, isAdmin, onUpload, onRemove }) {
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
                <span className="text-[10px] text-gray-400 text-center">{imgs.length>1?`Foto ${idx+1}/${imgs.length}`:'Foto do passo'}</span>
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

// ── VISUALIZADOR DE GUIA ──────────────────────────────
function GuiaView({ guia, cont, onVoltar, isAdmin, onUpload, onRemove }) {
  const steps = cont.steps || [];
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <button onClick={onVoltar} className="text-blue-600 dark:text-blue-400 hover:underline">Guias</button>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100 font-medium">{guia.titulo}</span>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{guia.titulo}</div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${BC[cont.badge]||BC.bb}`}>{cont.badgeText}</span>
        </div>

        <div className="p-5 lg:p-6">
          {cont.alerta && (
            <div className="flex gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm mb-5">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {cont.alerta}
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
                <Gallery imgs={s.imgs||[]} stepIdx={i} isAdmin={isAdmin} onUpload={onUpload} onRemove={onRemove}/>
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

// ── COMPONENTE PRINCIPAL ──────────────────────────────
export default function Guias() {
  const { temRole } = useAuth();
  const isAdmin = temRole('admin','gestor');

  const [guias, setGuias]   = useState([]);
  const [busca, setBusca]   = useState('');
  const [atual, setAtual]   = useState(null);
  const [cont, setCont]     = useState(null);

  useEffect(() => {
    api.get('/guias').then(r => setGuias(r.data.length ? r.data : GUIAS_LOCAL)).catch(() => setGuias(GUIAS_LOCAL));
  }, []);

  const abrirGuia = async (g) => {
    setAtual(g);
    const local = CONTEUDO_LOCAL[g.slug];
    const base  = JSON.parse(JSON.stringify(local || {}));
    try {
      const { data } = await api.get(`/guias/${g.slug}`);
      if (data.conteudo?.steps?.length) {
        if (local) {
          base.steps = base.steps.map((localStep, si) => {
            const apiStep = data.conteudo.steps[si] || {};
            const imgsDB  = Array.isArray(apiStep.imgs) && apiStep.imgs.some(u => u) ? apiStep.imgs : localStep.imgs;
            return { ...localStep, imgs: imgsDB };
          });
        } else {
          base.steps = data.conteudo.steps;
        }
      }
    } catch {}
    setCont(base);
    window.scrollTo(0, 0);
  };

  const abrirChecklist = (cat) => {
    setAtual({ ...cat, isChecklist: true });
    // Carrega fotos salvas do banco se houver
    const base = JSON.parse(JSON.stringify(cat));
    api.get(`/guias/${cat.slug}`).then(({ data }) => {
      if (data.conteudo?.steps?.length) {
        base.steps = base.steps.map((localStep, si) => {
          const apiStep = data.conteudo.steps[si] || {};
          const imgsDB  = Array.isArray(apiStep.imgs) && apiStep.imgs.some(u => u) ? apiStep.imgs : localStep.imgs;
          return { ...localStep, imgs: imgsDB };
        });
        setCont(base);
      }
    }).catch(() => {});
    setCont(base);
    window.scrollTo(0, 0);
  };

  const upload = (stepIdx, imgIdx) => {
    if (!CLOUD_NAME) { alert('Configure VITE_CLOUDINARY_CLOUD_NAME'); return; }
    if (typeof cloudinary === 'undefined') { alert('Widget Cloudinary não carregado.'); return; }
    cloudinary.createUploadWidget({
      cloudName: CLOUD_NAME, uploadPreset: PRESET,
      sources: ['local','camera'], multiple: false, maxFileSize: 5000000,
      folder: `dipelnet/guias/${atual.slug}`,
    }, async (err, res) => {
      if (!res || res.event !== 'success') return;
      const url = res.info.secure_url;
      setCont(prev => {
        const c = JSON.parse(JSON.stringify(prev));
        if (!c.steps[stepIdx].imgs) c.steps[stepIdx].imgs = [];
        if (imgIdx < c.steps[stepIdx].imgs.length) c.steps[stepIdx].imgs[imgIdx] = url;
        else c.steps[stepIdx].imgs.push(url);
        return c;
      });
      try { await api.put(`/guias/${atual.id||atual.slug}/imagem`, { step_index: stepIdx, img_index: imgIdx, url }); } catch {}
    }).open();
  };

  const remover = (stepIdx, imgIdx) => {
    if (!confirm('Remover esta foto?')) return;
    setCont(prev => {
      const c = JSON.parse(JSON.stringify(prev));
      c.steps[stepIdx].imgs[imgIdx] = null;
      return c;
    });
  };

  // ── VISUALIZADOR ──
  if (atual && cont) {
    return <GuiaView guia={atual} cont={cont} onVoltar={() => { setAtual(null); setCont(null); }} isAdmin={isAdmin} onUpload={upload} onRemove={remover} />;
  }

  // ── LISTA ──
  const guiasFiltrados = guias.filter(g =>
    g.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    (g.categoria||'').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      {/* Busca */}
      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 mb-4">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar guia..."
          className="border-none outline-none text-sm flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"/>
      </div>

      <div className="flex flex-col gap-3">
        {/* ── CHECKLIST: 5 categorias ── */}
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1 mt-1 mb-1">Checklists de Campo</div>
        {CHECKLIST_CATS.map(cat => (
          <div key={cat.slug} onClick={() => abrirChecklist(cat)}
            className="bg-white dark:bg-gray-900 border rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:shadow-md transition-all"
            style={{ borderColor: cat.cor + '66' }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white" style={{ background: cat.cor }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{cat.titulo}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{cat.descricao}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${BC.bc}`}>Checklist</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${BC.bc}`}>{cat.badgeText}</span>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}

        {/* ── GUIAS TÉCNICOS ── */}
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1 mt-3 mb-1">Guias Técnicos</div>
        {guiasFiltrados.map(g => {
          const c = CONTEUDO_LOCAL[g.slug] || {};
          return (
            <div key={g.slug} onClick={() => abrirGuia(g)}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${CAT_CLS[g.categoria]||'bg-gray-100 text-gray-600'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{g.titulo}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{g.descricao}</div>
                <div className="flex flex-wrap gap-2 items-center mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${CAT_CLS[g.categoria]||'bg-gray-100 text-gray-600'}`}>{g.categoria}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${BC[g.badge]||BC.bb}`}>{(c.steps||[]).length} etapas</span>
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