import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useDark } from '../../contexts/ThemeContext';
import { tk } from '../../utils/theme';

// ── FOTOS DO CLOUDINARY ───────────────────────────────
const FOTOS = {
  local_equipamento_1: 'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434372/dipelnet/checklist/local_equipamento_1.webp',
  local_equipamento_2: 'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434373/dipelnet/checklist/local_equipamento_2.webp',
  local_equipamento_3: 'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434375/dipelnet/checklist/local_equipamento_3.webp',
  local_equipamento_4: 'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434376/dipelnet/checklist/local_equipamento_4.webp',
  teste_velocidade_1:  'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434377/dipelnet/checklist/teste_velocidade_1.webp',
  teste_velocidade_2:  'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434378/dipelnet/checklist/teste_velocidade_2.webp',
  teste_velocidade_3:  'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434379/dipelnet/checklist/teste_velocidade_3.webp',
  ipv6_1:              'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434379/dipelnet/checklist/ipv6_1.webp',
  pingtools_1:         'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434380/dipelnet/checklist/pingtools_1.webp',
  termo_1:             'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434381/dipelnet/checklist/termo_1.webp',
  termo_2:             'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434382/dipelnet/checklist/termo_2.webp',
  metragem_1:          'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434383/dipelnet/checklist/metragem_1.webp',
  metragem_2:          'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434384/dipelnet/checklist/metragem_2.webp',
  metragem_3:          'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434385/dipelnet/checklist/metragem_3.webp',
  pdo_sinal_1:         'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434386/dipelnet/checklist/pdo_sinal_1.webp',
  pdo_sinal_2:         'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434387/dipelnet/checklist/pdo_sinal_2.webp',
  pdo_sinal_3:         'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434388/dipelnet/checklist/pdo_sinal_3.webp',
  pdo_porta_1:         'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434389/dipelnet/checklist/pdo_porta_1.webp',
  pdo_codigo_1:        'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434390/dipelnet/checklist/pdo_codigo_1.webp',
  pdo_numeracao_1:     'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434391/dipelnet/checklist/pdo_numeracao_1.webp',
  fachada_1:           'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434392/dipelnet/checklist/fachada_1.webp',
  fachada_2:           'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434393/dipelnet/checklist/fachada_2.webp',
  dg_caixa_1:          'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434394/dipelnet/checklist/dg_caixa_1.webp',
  dg_caixa_2:          'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434395/dipelnet/checklist/dg_caixa_2.webp',
  ponto_adicional_1:   'https://res.cloudinary.com/dinfzopjh/image/upload/v1777434396/dipelnet/checklist/ponto_adicional_1.webp',
};

// ── CATEGORIAS DO CHECKLIST ───────────────────────────
const CATEGORIAS = [
  {
    id: 'instalacao', label: 'Instalação Padrão', cor: '#1a56db', bg: '#dbeafe',
    descricao: 'Fotos obrigatórias para toda instalação de fibra residencial ou comercial.',
    itens: [
      { label: 'Local do equipamento', obs: '', fotos: [FOTOS.local_equipamento_1, FOTOS.local_equipamento_2, FOTOS.local_equipamento_3, FOTOS.local_equipamento_4] },
      { label: 'Teste de velocidade (print)', obs: 'Fast.com ou Speedtest', fotos: [FOTOS.teste_velocidade_1, FOTOS.teste_velocidade_2, FOTOS.teste_velocidade_3] },
      { label: 'IPv6 funcionando', obs: 'test-ipv6.com — pontuação 10/10', fotos: [FOTOS.ipv6_1] },
      { label: 'Termo comprovante com documento do cliente', obs: '', fotos: [FOTOS.termo_1, FOTOS.termo_2] },
      { label: 'Análise de Espectro (PingTools)', obs: '', fotos: [FOTOS.pingtools_1] },
      { label: 'Plaqueta com código do cliente', obs: '', fotos: [FOTOS.pdo_codigo_1] },
      { label: 'Foto do PDO (mostrando numeração do PDO)', obs: '', fotos: [FOTOS.pdo_numeracao_1] },
      { label: 'Metragem do cabo registrada', obs: 'Metragem inicial e final da fibra', fotos: [FOTOS.metragem_1, FOTOS.metragem_2, FOTOS.metragem_3] },
      { label: 'Foto do PDO (mostrando sinal e porta utilizada)', obs: 'Power meter aparecendo a porta utilizada', fotos: [FOTOS.pdo_sinal_1, FOTOS.pdo_sinal_2] },
      { label: 'Foto do PDO (mostrando plaqueta e porta utilizada)', obs: '', fotos: [FOTOS.pdo_porta_1] },
      { label: 'Foto da fachada (residência, empresa ou estabelecimento)', obs: '', fotos: [FOTOS.fachada_1, FOTOS.fachada_2] },
      { label: 'Print do sinal da fibra do equipamento', obs: '', fotos: [FOTOS.pdo_sinal_3] },
    ],
  },
  {
    id: 'predios', label: 'Instalação — Prédios / Pontos Adicionais', cor: '#7c3aed', bg: '#ede9fe',
    descricao: 'Segue o padrão de instalação padrão com as seguintes fotos adicionais.',
    itens: [
      { label: 'Local do equipamento', obs: '', fotos: [FOTOS.local_equipamento_1, FOTOS.local_equipamento_2] },
      { label: 'Teste de velocidade (print)', obs: '', fotos: [FOTOS.teste_velocidade_1, FOTOS.teste_velocidade_2] },
      { label: 'IPv6 funcionando', obs: '', fotos: [FOTOS.ipv6_1] },
      { label: 'Termo comprovante com documento do cliente', obs: '', fotos: [FOTOS.termo_1, FOTOS.termo_2] },
      { label: 'Análise de Espectro (PingTools)', obs: '', fotos: [FOTOS.pingtools_1] },
      { label: 'Plaqueta com código do cliente', obs: '', fotos: [FOTOS.pdo_codigo_1] },
      { label: 'Foto do PDO (mostrando numeração do PDO)', obs: '', fotos: [FOTOS.pdo_numeracao_1] },
      { label: 'Metragem do cabo registrada', obs: 'Metragem inicial e final da fibra', fotos: [FOTOS.metragem_1, FOTOS.metragem_2] },
      { label: 'Foto do PDO (mostrando sinal e porta utilizada)', obs: '', fotos: [FOTOS.pdo_sinal_1] },
      { label: 'Foto do PDO (mostrando plaqueta e porta utilizada)', obs: '', fotos: [FOTOS.pdo_porta_1] },
      { label: 'Print do sinal da fibra do equipamento', obs: '', fotos: [FOTOS.pdo_sinal_3] },
      { label: 'Foto da fachada', obs: '', fotos: [FOTOS.fachada_1, FOTOS.fachada_2] },
      { label: 'Foto dos DG e Caixa de passagens', obs: 'Verificar quantidade no checklist', fotos: [FOTOS.dg_caixa_1, FOTOS.dg_caixa_2] },
      { label: 'Foto do local do Ponto adicional', obs: 'Roteador ou cabo', fotos: [FOTOS.ponto_adicional_1] },
      { label: 'Metragem inicial e final do cabo de rede', obs: 'Válido para ambos os pontos adicionais', fotos: [FOTOS.metragem_3] },
    ],
  },
  {
    id: 'loss_ponteiras', label: 'Manutenção LOSS — Ponteiras / Sinal Alto', cor: '#d97706', bg: '#fef3c7',
    descricao: 'Fotos obrigatórias para manutenção de LOSS por ponteiras ou sinal alto.',
    itens: [
      { label: 'Local do equipamento', obs: '', fotos: [FOTOS.local_equipamento_1, FOTOS.local_equipamento_2] },
      { label: 'Teste de velocidade (print)', obs: '', fotos: [FOTOS.teste_velocidade_1, FOTOS.teste_velocidade_2] },
      { label: 'IPv6 funcionando', obs: '', fotos: [FOTOS.ipv6_1] },
      { label: 'Termo comprovante com documento do cliente', obs: '', fotos: [FOTOS.termo_1, FOTOS.termo_2] },
      { label: 'Análise de Espectro (PingTools)', obs: '', fotos: [FOTOS.pingtools_1] },
      { label: 'Teste de PING no CMD ou no PingTools', obs: '', fotos: [] },
      { label: 'Plaqueta com código do cliente', obs: '', fotos: [FOTOS.pdo_codigo_1] },
      { label: 'Foto do PDO (se foi no PDO)', obs: 'Mostrando sinal e porta utilizada — Power meter', fotos: [FOTOS.pdo_sinal_1, FOTOS.pdo_sinal_2] },
      { label: 'Foto da plaqueta com código e porta utilizada (se foi no PDO)', obs: '', fotos: [FOTOS.pdo_porta_1] },
      { label: 'Print do sinal da fibra do equipamento', obs: '', fotos: [FOTOS.pdo_sinal_3] },
      { label: 'Local onde estava a atenuação (se houver)', obs: '', fotos: [] },
    ],
  },
  {
    id: 'loss_relancamentos', label: 'Manutenção LOSS — Relançamentos', cor: '#dc2626', bg: '#fee2e2',
    descricao: 'Fotos obrigatórias para manutenção de LOSS por relançamento de fibra.',
    itens: [
      { label: 'Local do equipamento', obs: '', fotos: [FOTOS.local_equipamento_1, FOTOS.local_equipamento_2] },
      { label: 'Teste de velocidade (print)', obs: '', fotos: [FOTOS.teste_velocidade_1, FOTOS.teste_velocidade_2] },
      { label: 'IPv6 funcionando', obs: '', fotos: [FOTOS.ipv6_1] },
      { label: 'Termo comprovante com documento do cliente', obs: '', fotos: [FOTOS.termo_1, FOTOS.termo_2] },
      { label: 'Análise de Espectro (PingTools)', obs: '', fotos: [FOTOS.pingtools_1] },
      { label: 'Plaqueta com código do cliente', obs: '', fotos: [FOTOS.pdo_codigo_1] },
      { label: 'Foto do PDO', obs: 'Mostrando sinal e porta utilizada', fotos: [FOTOS.pdo_sinal_1, FOTOS.pdo_sinal_2] },
      { label: 'Foto da plaqueta com código e porta utilizada', obs: '', fotos: [FOTOS.pdo_porta_1] },
      { label: 'Print do sinal da fibra do equipamento', obs: '', fotos: [FOTOS.pdo_sinal_3] },
      { label: 'Teste de PING no CMD ou no PingTools', obs: '', fotos: [] },
      { label: 'Metragem inicial e final da fibra', obs: '', fotos: [FOTOS.metragem_1, FOTOS.metragem_2, FOTOS.metragem_3] },
      { label: 'Foto da emenda (se houver)', obs: 'Verificar observação do checklist', fotos: [] },
      { label: 'Foto dos DG e Caixa de passagens', obs: 'Verificar quantidade no checklist', fotos: [FOTOS.dg_caixa_1, FOTOS.dg_caixa_2] },
    ],
  },
  {
    id: 'suporte_geral', label: 'Manutenção — Suporte Geral / Ponto Adicional', cor: '#059669', bg: '#d1fae5',
    descricao: 'Fotos para manutenção de suporte geral, ponto adicional ou mudança de ponto.',
    itens: [
      { label: 'Local do equipamento', obs: '', fotos: [FOTOS.local_equipamento_1, FOTOS.local_equipamento_2] },
      { label: 'Teste de velocidade (print)', obs: '', fotos: [FOTOS.teste_velocidade_1, FOTOS.teste_velocidade_2] },
      { label: 'IPv6 funcionando', obs: '', fotos: [FOTOS.ipv6_1] },
      { label: 'Termo comprovante com documento do cliente', obs: '', fotos: [FOTOS.termo_1, FOTOS.termo_2] },
      { label: 'Análise de Espectro (PingTools)', obs: '', fotos: [FOTOS.pingtools_1] },
      { label: 'Teste de PING no CMD ou no PingTools', obs: '', fotos: [] },
      { label: 'Print do sinal da fibra do equipamento', obs: '', fotos: [FOTOS.pdo_sinal_3] },
      { label: 'Foto do local do Ponto adicional (se houver)', obs: 'Roteador ou cabo', fotos: [FOTOS.ponto_adicional_1] },
      { label: 'Metragem inicial e final do cabo de rede (se houver)', obs: 'Válido para ambos os pontos adicionais', fotos: [FOTOS.metragem_1, FOTOS.metragem_2] },
    ],
  },
];

// ── BADGE CORES ───────────────────────────────────────
const BADGE = {
  bb: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  br: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  bg: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  bp: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  by: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
};

// ── FOTO MODAL ────────────────────────────────────────
function FotoModal({ url, onClose }) {
  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div onClick={e => e.stopPropagation()} className="relative max-w-2xl w-full">
        <button onClick={onClose} className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300">×</button>
        <img src={url} alt="Exemplo" className="w-full rounded-xl shadow-2xl object-contain max-h-[80vh]" />
      </div>
    </div>
  );
}

// ── CHECKLIST ─────────────────────────────────────────
function ChecklistView({ onVoltar }) {
  const [checked, setChecked] = useState({});
  const [catAtiva, setCatAtiva] = useState('instalacao');
  const [expandido, setExpandido] = useState(null);

  const onToggle = (key) => setChecked(p => ({ ...p, [key]: !p[key] }));
  const resetar = () => { if (!confirm('Resetar todos os itens?')) return; setChecked({}); };

  const catAtual = CATEGORIAS.find(c => c.id === catAtiva);
  const totalMarcados = Object.values(checked).filter(Boolean).length;

  const marcados = catAtual ? catAtual.itens.filter((_, i) => checked[`${catAtual.id}_${i}`]).length : 0;
  const total = catAtual ? catAtual.itens.length : 0;
  const completo = marcados === total && total > 0;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <button onClick={onVoltar} className="text-blue-600 dark:text-blue-400 hover:underline">Guias</button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600 dark:text-gray-300 font-medium">Checklist pós-instalação</span>
        <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-semibold">{CATEGORIAS.reduce((s,c) => s + c.itens.length, 0)} itens</span>
      </div>

      {/* Aviso */}
      <div className="mb-4 px-4 py-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-start gap-2">
        <span className="text-yellow-500 flex-shrink-0">⚠️</span>
        <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">
          Todas as fotos devem estar com localização do app <strong>Conota Camera</strong> e renomeadas no sistema.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIAS.map(cat => {
          const ativa = catAtiva === cat.id;
          return (
            <button key={cat.id} onClick={() => setCatAtiva(cat.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
              style={{ background: ativa ? cat.cor : 'transparent', color: ativa ? '#fff' : cat.cor, borderColor: cat.cor }}>
              {cat.label}
            </button>
          );
        })}
        {totalMarcados > 0 && (
          <button onClick={resetar} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all ml-auto">
            Resetar ({totalMarcados})
          </button>
        )}
      </div>

      {/* Card da categoria */}
      {catAtual && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800" style={{ borderLeftWidth: 4, borderLeftColor: catAtual.cor, borderLeftStyle: 'solid' }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{catAtual.label}</span>
                  {completo && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700">✓ Completo</span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{catAtual.descricao}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg font-bold" style={{ color: catAtual.cor }}>{marcados}/{total}</div>
                <div className="text-[10px] text-gray-400">itens</div>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(marcados/total)*100}%`, background: catAtual.cor }} />
            </div>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {catAtual.itens.map((item, i) => {
              const key = `${catAtual.id}_${i}`;
              const isChecked = !!checked[key];
              return (
                <div key={i} className={`px-5 py-3 transition-colors ${isChecked ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
                  <div className="flex items-start gap-3">
                    <button onClick={() => onToggle(key)}
                      className="mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all"
                      style={{ borderColor: isChecked ? catAtual.cor : '#d1d5db', background: isChecked ? catAtual.cor : 'transparent' }}>
                      {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium transition-colors ${isChecked ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {i + 1}. {item.label}
                      </div>
                      {item.obs && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.obs}</div>}
                      {item.fotos && item.fotos.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2 items-center">
                          {item.fotos.map((url, fi) => (
                            <button key={fi} onClick={() => setExpandido(url)}
                              className="w-14 h-14 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-all flex-shrink-0 shadow-sm">
                              <img src={url} alt={`Exemplo ${fi+1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                          <span className="text-[10px] text-gray-400 italic">Clique para ampliar</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {expandido && <FotoModal url={expandido} onClose={() => setExpandido(null)} />}
    </div>
  );
}

// ── GUIA DETALHE ──────────────────────────────────────
function GuiaDetalhe({ guia, onVoltar, dark }) {
  const c = tk(dark);
  const [stepAtivo, setStepAtivo] = useState(0);
  const ct = guia.conteudo || {};
  const steps = ct.steps || [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 text-sm">
        <button onClick={onVoltar} className="text-blue-600 dark:text-blue-400 hover:underline">Guias</button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600 dark:text-gray-300 font-medium truncate">{guia.titulo}</span>
      </div>

      {ct.alerta && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
          ℹ️ {ct.alerta}
        </div>
      )}

      <div className="flex gap-4" style={{ flexDirection: 'column' }}>
        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step, i) => {
            const ativo = stepAtivo === i;
            return (
              <div key={i} className={`rounded-xl border transition-all overflow-hidden ${ativo ? 'border-blue-400 dark:border-blue-500 shadow-md' : 'border-gray-200 dark:border-gray-700'}`}
                style={{ background: ativo ? (dark ? '#1e293b' : '#f0f7ff') : c.card }}>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setStepAtivo(ativo ? -1 : i)}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: ativo ? '#1a56db' : (dark ? '#334155' : '#e5e7eb'), color: ativo ? '#fff' : c.text }}>
                    {i + 1}
                  </div>
                  <span className={`text-sm font-semibold flex-1 ${ativo ? 'text-blue-700 dark:text-blue-300' : ''}`} style={{ color: ativo ? undefined : c.text }}>
                    {step.titulo}
                  </span>
                  <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${ativo ? 'rotate-180' : ''}`} style={{ color: c.textSub }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 9l-7 7-7-7"/></svg>
                </button>

                {ativo && (
                  <div className="px-4 pb-4">
                    <p className="text-sm whitespace-pre-wrap mb-3" style={{ color: c.text }}>{step.descricao}</p>
                    {step.tip && (
                      <div className="px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-xs text-yellow-800 dark:text-yellow-300 mb-3">
                        💡 {step.tip}
                      </div>
                    )}
                    {step.imgs && step.imgs.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {step.imgs.map((url, fi) => (
                          <img key={fi} src={url} alt="Passo" className="h-32 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shadow-sm" />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {ct.aviso_perigo && (
          <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-300">
            ⛔ {ct.aviso_perigo}
          </div>
        )}
      </div>
    </div>
  );
}

// ── LISTA DE GUIAS ────────────────────────────────────
export default function Guias() {
  const dark = useDark();
  const c = tk(dark);
  const [guias, setGuias] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [verChecklist, setVerChecklist] = useState(false);

  useEffect(() => {
    api.get('/guias').then(r => setGuias(r.data)).catch(() => {});
  }, []);

  if (verChecklist) return <ChecklistView onVoltar={() => setVerChecklist(false)} />;
  if (selecionado) return <GuiaDetalhe guia={selecionado} onVoltar={() => setSelecionado(null)} dark={dark} />;

  return (
    <div>
      {/* Card do Checklist pós-instalação */}
      <button onClick={() => setVerChecklist(true)} className="w-full text-left mb-6">
        <div className="rounded-xl border-2 border-blue-400 dark:border-blue-500 p-4 bg-blue-50 dark:bg-blue-900/20 hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl flex-shrink-0">✅</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-blue-800 dark:text-blue-200">Checklist pós-instalação</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-600 text-white">5 categorias</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Instalação • Prédios • LOSS Ponteiras • LOSS Relançamentos • Suporte Geral</p>
          </div>
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7"/></svg>
        </div>
      </button>

      {/* Guias do banco */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {guias.map(g => {
          const ct = g.conteudo || {};
          return (
            <button key={g.id} onClick={() => setSelecionado(g)} className="text-left">
              <div className="rounded-xl border p-4 h-full hover:shadow-md transition-all"
                style={{ background: c.card, borderColor: c.cardBorder }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {g.titulo.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: c.text }}>{g.titulo}</div>
                    <div className="text-xs mt-0.5" style={{ color: c.textMuted }}>{g.descricao}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {ct.badgeText && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${BADGE[ct.badge] || BADGE.bb}`}>
                      {ct.badgeText}
                    </span>
                  )}
                  {g.categoria && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                      {g.categoria}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {guias.length === 0 && (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">Carregando guias...</div>
      )}
    </div>
  );
}