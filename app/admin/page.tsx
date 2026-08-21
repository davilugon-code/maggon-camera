'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, Plus, QrCode, HardDrive, Download, Image as ImageIcon, ExternalLink, Calendar, Key, AlertCircle, RefreshCw } from 'lucide-react';
import { Event } from '@/lib/types';

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [creating, setCreating] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setCreating(true);
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          date: newDate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        setNewDescription('');
        setIsModalOpen(false);
        fetchEvents();
      }
    } catch (err) {
      console.error('Error creating event:', err);
    } finally {
      setCreating(false);
    }
  };

  // Calculate totals
  const totalPhotos = events.reduce((acc, e) => acc + (e.totalPhotosCount || 0), 0);
  const totalDownloads = events.reduce((acc, e) => acc + (e.totalDownloadsCount || 0), 0);
  const totalStorageBytes = events.reduce((acc, e) => acc + (e.totalStorageBytes || 0), 0);
  const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 pb-16">
      {/* Top Navbar */}
      <header className="w-full border-b border-gray-800/80 glass-panel sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan p-0.5 shadow-md shadow-brand-600/30">
                <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                  <Camera className="w-5 h-5 text-brand-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                Maggon Admin
              </span>
            </Link>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-brand-600 to-accent-violet hover:opacity-90 transition-all shadow-lg shadow-brand-600/30 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Evento</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Painel do Fotógrafo</h1>
            <p className="text-gray-400 text-sm mt-1">Gerencie os eventos ativos, chaves de API e monitore uploads em tempo real.</p>
          </div>

          <button
            onClick={fetchEvents}
            className="self-start sm:self-auto px-3 py-1.5 text-xs rounded-lg glass-button text-gray-300 hover:text-white flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold tracking-wider text-gray-400">Total de Fotos Enviadas</p>
              <p className="text-3xl font-extrabold text-white mt-1">{totalPhotos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <ImageIcon className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold tracking-wider text-gray-400">Downloads Realizados</p>
              <p className="text-3xl font-extrabold text-accent-cyan mt-1">{totalDownloads}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
              <Download className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs uppercase font-semibold tracking-wider text-gray-400">Armazenamento Utilizado</p>
              <p className="text-3xl font-extrabold text-accent-violet mt-1">{totalStorageMB} <span className="text-base font-medium text-gray-400">MB</span></p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-center text-accent-violet">
              <HardDrive className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Events List Header */}
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <span>Seus Eventos</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
            {events.length}
          </span>
        </h2>

        {loading ? (
          <div className="glass-card rounded-2xl p-12 text-center text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-500" />
            <p>Carregando eventos...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Nenhum evento criado ainda</h3>
            <p className="text-gray-400 text-sm mb-6">Crie seu primeiro evento para gerar a chave de API e o QR Code dos convidados.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-500 transition-colors inline-flex items-center space-x-2 shadow-lg shadow-brand-600/30"
            >
              <Plus className="w-5 h-5" />
              <span>Criar Evento Agora</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <div key={ev.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        ev.status === 'active'
                          ? 'bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30'
                          : 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30'
                      }`}
                    >
                      {ev.status === 'active' ? '● Ativo / Transmitindo' : 'Pausado'}
                    </span>

                    <span className="text-xs text-gray-400 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{ev.date}</span>
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors mb-2">
                    {ev.title}
                  </h3>

                  {ev.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{ev.description}</p>
                  )}

                  {/* API Key Box */}
                  <div className="bg-gray-900/80 rounded-xl p-3 border border-gray-800 text-xs text-gray-300 font-mono flex items-center justify-between mb-5">
                    <span className="flex items-center space-x-2 text-gray-400 truncate">
                      <Key className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
                      <span className="truncate">{ev.apiKey}</span>
                    </span>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-800/80 text-center mb-6">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Fotos</p>
                      <p className="text-base font-bold text-white">{ev.totalPhotosCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Downloads</p>
                      <p className="text-base font-bold text-accent-cyan">{ev.totalDownloadsCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Tamanho</p>
                      <p className="text-base font-bold text-accent-violet">
                        {((ev.totalStorageBytes || 0) / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3 pt-2">
                  <Link
                    href={`/admin/events/${ev.id}`}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-brand-600 hover:bg-brand-500 transition-colors text-center flex items-center justify-center space-x-2 shadow-md shadow-brand-600/20"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Gerenciar & QR Code</span>
                  </Link>

                  <Link
                    href={`/event/${ev.slug}`}
                    target="_blank"
                    className="p-2.5 rounded-xl glass-button text-gray-300 hover:text-white hover:border-brand-500/50 transition-colors"
                    title="Abrir Galeria do Convidado"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal: Create Event */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-8 relative border border-gray-700/80 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">Criar Novo Evento</h3>
            <p className="text-gray-400 text-sm mb-6">Cadastre as informações para gerar o link do convidado e a chave de tethering da câmera.</p>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-300 mb-1.5">
                  Nome do Evento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Casamento Lucas & Mariana"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/90 border border-gray-700 text-white focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-300 mb-1.5">
                  Descrição (Exibida aos convidados)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Cobertura fotográfica ao vivo. Aponte a câmera para ver suas fotos!"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/90 border border-gray-700 text-white focus:outline-none focus:border-brand-500 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-300 mb-1.5">
                  Data do Evento
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/90 border border-gray-700 text-white focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-brand-600 to-accent-violet hover:opacity-90 transition-all shadow-lg shadow-brand-600/30 flex items-center space-x-2"
                >
                  {creating && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{creating ? 'Criando...' : 'Criar Evento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
