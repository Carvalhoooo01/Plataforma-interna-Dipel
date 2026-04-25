import { useState, useEffect } from 'react';
import api from '../../services/api';

const EQUIPS_LOCAL = [
  {id:1,marca:'Huawei',modelo:'AX2 (AX1500)',plano:'Até 300 Mbps',wifi:'Wi-Fi 6 (AX1500)',diferencial:'Entrada de nível, fácil configuração'},
  {id:2,marca:'Huawei',modelo:'AX2 Dual-core',plano:'Plano 500 Mbps',wifi:'Wi-Fi 6 (AX3000)',diferencial:'Dual-core, melhor para múltiplos dispositivos'},
  {id:3,marca:'Huawei',modelo:'AX3 Pro +35',plano:'Todos os planos',wifi:'Wi-Fi 6 (AX3000)',diferencial:'Repetidor QuadCore, cobertura até 3 andares'},
  {id:4,marca:'TP-Link',modelo:'Archer C6 / C20',plano:'Até 300 Mbps',wifi:'Wi-Fi 5 (AC1200/1900)',diferencial:'Custo-benefício, MU-MIMO'},
  {id:5,marca:'TP-Link',modelo:'Archer AX10',plano:'1000 e 600 Mbps',wifi:'Wi-Fi 6 (AX1500)',diferencial:'Excelente para planos intermediários'},
  {id:6,marca:'TP-Link',modelo:'Archer AX23 / AX55',plano:'Plano 1 Gbit Mbps',wifi:'Wi-Fi 6 (AX3000)',diferencial:'Fácil setup, ampla cobertura'},
  {id:7,marca:'TP-Link',modelo:'Archer AX55 / AX73',plano:'Plano 1 Gbit Mbps',wifi:'Wi-Fi 6 (AX5400)',diferencial:'6 Antenas, Alta performance Gamer/Streaming'},
  {id:8,marca:'Mercusys',modelo:'MR70X / MR80X',plano:'Plano 1 Gbit Mbps',wifi:'Wi-Fi 6 (AX3000)',diferencial:'Excelente custo-benefício, alta performance'},
];

function SpeedBar({ plano }) {
  const pct = plano.includes('1 Gbit')||plano.includes('Gbps') ? 100
    : plano.includes('500') ? 70
    : plano.includes('300') ? 45
    : 60;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
        <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{width:`${pct}%`}}/>
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap hidden sm:block">{plano}</span>
    </div>
  );
}

const WIFI_BADGE = (wifi) => {
  if (wifi.includes('AX5')) return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
  if (wifi.includes('AX3')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  if (wifi.includes('AX1')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
};

export default function Equipamentos() {
  const [equips, setEquips] = useState([]);
  const [busca, setBusca]   = useState('');

  useEffect(() => {
    api.get('/equipamentos').then(r => setEquips(r.data.length ? r.data : EQUIPS_LOCAL)).catch(() => setEquips(EQUIPS_LOCAL));
  }, []);

  const filtrados = equips.filter(e =>
    [e.marca, e.modelo, e.plano, e.wifi].some(v => (v||'').toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-300 mb-5 flex items-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        Consulte a tabela para indicar o equipamento correto conforme o plano do cliente.
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 mb-4">
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por marca, modelo ou plano..."
          className="border-none outline-none text-sm flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"/>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Equipamentos Compatíveis</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Modelos homologados e seus planos suportados</div>
        </div>

        {/* Mobile — cards */}
        <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
          {filtrados.map(e => (
            <div key={e.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{e.marca}</span>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{e.modelo}</div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${WIFI_BADGE(e.wifi||'')}`}>{e.wifi}</span>
              </div>
              <SpeedBar plano={e.plano||''}/>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{e.diferencial}</div>
            </div>
          ))}
        </div>

        {/* Desktop — tabela */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                {['Marca','Modelo','Plano Suportado','Wi-Fi','Diferencial'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtrados.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{e.marca}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{e.modelo}</td>
                  <td className="px-4 py-3"><SpeedBar plano={e.plano||''}/></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${WIFI_BADGE(e.wifi||'')}`}>{e.wifi}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{e.diferencial}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}