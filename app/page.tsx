import Link from 'next/link';
import { Camera, QrCode, Zap, Download, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-brand-600/20 via-accent-violet/20 to-accent-cyan/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-rose/10 blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* Header Navigation */}
      <header className="w-full border-b border-gray-800/60 glass-panel sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-accent-violet to-accent-cyan p-0.5 shadow-lg shadow-brand-500/20">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <Camera className="w-5 h-5 text-brand-500" />
              </div>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-400 tracking-tight">
              Maggon
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/admin"
              className="px-4 py-2 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 transition-all shadow-md shadow-brand-600/30 flex items-center space-x-2"
            >
              <span>Painel do Fotógrafo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs sm:text-sm font-medium mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-accent-cyan" />
          <span>Transmissão Instantânea Câmera → Nuvem → Convidado</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-white leading-tight">
          Fotos do evento direto no celular dos convidados em{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-accent-violet to-accent-cyan">
            Tempo Real
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl font-normal leading-relaxed">
          Sua câmera Canon tira a foto, o script de tethering envia automaticamente para o <strong>Maggon</strong> e os convidados leem o QR Code para visualizar e baixar em alta resolução instantaneamente.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/admin"
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-2xl text-white bg-gradient-to-r from-brand-600 via-brand-500 to-accent-violet hover:opacity-95 transition-all shadow-xl shadow-brand-500/25 flex items-center justify-center space-x-3 group"
          >
            <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Criar Evento no Painel</span>
          </Link>

          <Link
            href="/event/demo-casamento"
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-2xl text-gray-200 glass-card hover:bg-gray-800/80 transition-all flex items-center justify-center space-x-3 border border-gray-700/60"
          >
            <QrCode className="w-5 h-5 text-accent-cyan" />
            <span>Ver Galeria de Exemplo</span>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-left">
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-brand-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Upload Instantâneo</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Watcher Python detecta cada clique da câmera Canon via EOS Utility e realiza a transmissão instantânea com otimização Sharp.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-center text-accent-violet mb-4 group-hover:scale-110 transition-transform">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Acesso Zero Friction</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Convidados apenas apontam a câmera do celular para o QR Code impresso no evento. Sem cadastro, sem aplicativo e sem senha.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center text-accent-emerald mb-4 group-hover:scale-110 transition-transform">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Download em Lote (.ZIP)</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Lightbox responsivo em alta resolução, seleção múltipla de fotos favoritas e download imediato em arquivo compactado.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-800/60 glass-panel py-6 text-center text-xs text-gray-500">
        <p>Maggon © 2026 — Plataforma de Fotografia de Eventos em Tempo Real.</p>
      </footer>
    </div>
  );
}
