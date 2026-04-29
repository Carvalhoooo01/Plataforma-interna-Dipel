import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// URLs das fotos de exemplo no Cloudinary
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

const CATEGORIAS = [
  {
    id: 'instalacao',
    label: 'Instalação Padrão',
    cor: '#1a56db',
    bg: '#dbeafe',
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
    id: 'predios',
    label: 'Instalação — Prédios / Pontos Adicionais',
    cor: '#7c3aed',
    bg: '#ede9fe',
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
    id: 'loss_ponteiras',
    label: 'Manutenção LOSS — Ponteiras / Sinal Alto',
    cor: '#d97706',
    bg: '#fef3c7',
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
    id: 'loss_relancamentos',
    label: 'Manutenção LOSS — Relançamentos',
    cor: '#dc2626',
    bg: '#fee2e2',
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
    id: 'suporte_geral',
    label: 'Manutenção — Suporte Geral / Ponto Adicional',
    cor: '#059669',
    bg: '#d1fae5',
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

const AVISO = 'Todas as fotos devem estar com localização do app Conota Camera e renomeadas no sistema.';

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

function ChecklistCategoria({ cat, checked, onToggle }) {
  const [expandido, setExpandido] = useState(null);
  const total = cat.itens.length;
  const marcados = cat.itens.filter((_, i) => checked[`${cat.id}_${i}`]).length;
  const completo = marcados === total;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800" style={{ borderLeftWidth: 4, borderLeftColor: cat.cor, borderLeftStyle: 'solid' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{cat.label}</span>
              {completo && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">✓ Completo</span>}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cat.descricao}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold" style={{ color: cat.cor }}>{marcados}/{total}</div>
            <div className="text-[10px] text-gray-400">itens</div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(marcados/total)*100}%`, background: cat.cor }} />
        </div>
      </div>

      {/* Itens */}
      <div className="divide-y divide-gray-50 dark:divide-gray-800">
        {cat.itens.map((item, i) => {
          const key = `${cat.id}_${i}`;
          const isChecked = !!checked[key];
          const temFotos = item.fotos && item.fotos.length > 0;

          return (
            <div key={i} className={`px-5 py-3 transition-colors ${isChecked ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onToggle(key)}
                  className="mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all"
                  style={{ borderColor: isChecked ? cat.cor : '#d1d5db', background: isChecked ? cat.cor : 'transparent' }}
                >
                  {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium transition-colors ${isChecked ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {i + 1}. {item.label}
                  </div>
                  {item.obs && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.obs}</div>}

                  {/* Fotos de exemplo */}
                  {temFotos && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.fotos.map((url, fi) => (
                        <button key={fi} onClick={() => setExpandido(url)}
                          className="w-14 h-14 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-all flex-shrink-0 shadow-sm">
                          <img src={url} alt={`Exemplo ${fi+1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                      <div className="flex items-center">
                        <span className="text-[10px] text-gray-400 italic">Clique para ver exemplo</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {expandido && <FotoModal url={expandido} onClose={() => setExpandido(null)} />}
    </div>
  );
}

export default function Guias() {
  const [checked, setChecked] = useState({});
  const [catAtiva, setCatAtiva] = useState('instalacao');

  const onToggle = (key) => setChecked(p => ({ ...p, [key]: !p[key] }));

  const resetar = () => {
    if (!confirm('Resetar todos os itens marcados?')) return;
    setChecked({});
  };

  const catAtual = CATEGORIAS.find(c => c.id === catAtiva);
  const totalMarcados = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      {/* Aviso */}
      <div className="mb-4 px-4 py-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-start gap-2">
        <span className="text-yellow-500 flex-shrink-0 mt-0.5">⚠️</span>
        <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">{AVISO}</p>
      </div>

      {/* Tabs de categoria */}
      <div className="flex flex-wrap gap-2 mb-5">
        {CATEGORIAS.map(cat => {
          const ativa = catAtiva === cat.id;
          return (
            <button key={cat.id} onClick={() => setCatAtiva(cat.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
              style={{
                background: ativa ? cat.cor : 'transparent',
                color: ativa ? '#fff' : cat.cor,
                borderColor: cat.cor,
              }}>
              {cat.label}
            </button>
          );
        })}
        {totalMarcados > 0 && (
          <button onClick={resetar} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ml-auto">
            Resetar ({totalMarcados})
          </button>
        )}
      </div>

      {/* Checklist da categoria ativa */}
      {catAtual && (
        <ChecklistCategoria
          cat={catAtual}
          checked={checked}
          onToggle={onToggle}
        />
      )}
    </div>
  );
}