'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  Download,
  Share2,
  CheckCircle2,
  Circle,
  X,
  Sparkles,
  ArrowUpDown,
  Check,
  Zap,
  RefreshCw,
  Image as ImageIcon,
  FolderArchive
} from 'lucide-react';
import { Photo, Event } from '@/lib/types';

export default function GuestGalleryPage({ params }: { params: { eventId: string } }) {
  const eventId = params.eventId;
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Multi-selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // SSE connection state
  const [isConnectedLive, setIsConnectedLive] = useState(false);
  const [newPhotoAlert, setNewPhotoAlert] = useState<Photo | null>(null);

  // Pagination for mobile performance (render initial batch, load more on scroll)
  const [visibleCount, setVisibleCount] = useState(30);

  // Fetch initial event & photos
  const fetchEventData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (data.success) {
        setEvent(data.event);
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error('Error fetching event photos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  // Server-Sent Events (SSE) Real-Time Connection
  useEffect(() => {
    if (!eventId) return;

    const eventSource = new EventSource(`/api/events/${eventId}/stream`);

    eventSource.onopen = () => {
      setIsConnectedLive(true);
    };

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'new_photo' && payload.photo) {
          const newPhoto: Photo = payload.photo;

          // Prepend new photo to gallery
          setPhotos((prev) => {
            if (prev.some((p) => p.id === newPhoto.id)) return prev;
            return [newPhoto, ...prev];
          });

          // Show floating micro-toast alert
          setNewPhotoAlert(newPhoto);
          setTimeout(() => setNewPhotoAlert(null), 4000);
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = () => {
      setIsConnectedLive(false);
    };

    return () => {
      eventSource.close();
    };
  }, [eventId]);

  // Sorted photos list
  const sortedPhotos = useMemo(() => {
    const list = [...photos];
    if (sortOrder === 'newest') {
      return list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    } else {
      return list.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
    }
  }, [photos, sortOrder]);

  const visiblePhotos = useMemo(() => {
    return sortedPhotos.slice(0, visibleCount);
  }, [sortedPhotos, visibleCount]);

  // Infinite Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 600) {
        setVisibleCount((prev) => Math.min(prev + 30, sortedPhotos.length));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sortedPhotos.length]);

  // Toggle selection of photo
  const toggleSelectPhoto = (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const selectAllPhotos = () => {
    if (selectedPhotoIds.size === photos.length) {
      setSelectedPhotoIds(new Set());
    } else {
      setSelectedPhotoIds(new Set(photos.map((p) => p.id)));
    }
  };

  // Download ZIP (Batch selected or All)
  const handleDownloadZip = (selectedOnly: boolean = false) => {
    if (!event) return;
    setDownloadingZip(true);

    let zipUrl = `/api/events/${event.id}/download-zip`;
    if (selectedOnly && selectedPhotoIds.size > 0) {
      const idsArray = Array.from(selectedPhotoIds);
      zipUrl += `?ids=${idsArray.join(',')}`;
    }

    const anchor = document.createElement('a');
    anchor.href = zipUrl;
    anchor.download = '';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => setDownloadingZip(false), 2000);
  };

  // Share photo link / Native Mobile Web Share
  const handleSharePhoto = async (photo: Photo) => {
    const fullPhotoUrl = `${window.location.origin}${photo.originalUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title || 'Maggon Photo',
          text: `Confira minha foto no evento ${event?.title}!`,
          url: fullPhotoUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(fullPhotoUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-500 mb-3" />
        <p className="text-gray-300 font-semibold">Carregando galeria do evento...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4 text-center">
        <Camera className="w-12 h-12 text-gray-500 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Galeria não encontrada</h2>
        <p className="text-gray-400 text-sm mb-6">Verifique se o QR Code lido está correto.</p>
        <Link href="/" className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold">
          Ir para Página Inicial
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 pb-32 select-none">
      {/* Real-time Toast Banner Alert */}
      {newPhotoAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up w-[90%] max-w-sm">
          <div className="bg-gradient-to-r from-brand-600 via-accent-violet to-accent-cyan text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center justify-center space-x-2 text-xs font-semibold">
            <Sparkles className="w-4 h-4 animate-spin text-amber-300 flex-shrink-0" />
            <span>Nova foto tirada pelo fotógrafo agora!</span>
          </div>
        </div>
      )}

      {/* Sticky Header Bar */}
      <header className="w-full border-b border-gray-800/80 glass-panel sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Live Status */}
          <div className="flex items-center space-x-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan p-0.5 shadow-md shadow-brand-500/20 flex-shrink-0">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <Camera className="w-4 h-4 text-brand-400" />
              </div>
            </div>

            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-bold text-white truncate max-w-[160px] sm:max-w-xs">
                {event.title}
              </h1>
              <div className="flex items-center space-x-1.5 text-[10px] text-gray-400">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isConnectedLive ? 'bg-accent-emerald animate-pulse' : 'bg-gray-500'
                  }`}
                />
                <span className="truncate">{isConnectedLive ? 'Ao Vivo' : 'Galeria Atualizada'}</span>
              </div>
            </div>
          </div>

          {/* Header Action: Baixar Todas */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => handleDownloadZip(false)}
              disabled={downloadingZip || photos.length === 0}
              className="px-3 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 transition-all shadow-md shadow-brand-600/30 flex items-center space-x-1.5"
            >
              {downloadingZip ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FolderArchive className="w-3.5 h-3.5 text-accent-cyan" />
              )}
              <span className="hidden sm:inline">Baixar Todas (.ZIP)</span>
              <span className="sm:hidden text-[11px]">Baixar Todas</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4">
        {/* Controls Bar: Sort & Selection Toggle */}
        <div className="flex items-center justify-between mb-4 glass-card p-2.5 sm:p-3 rounded-2xl gap-2">
          {/* Selection Mode Toggle */}
          <button
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) setSelectedPhotoIds(new Set());
            }}
            className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 ${
              selectionMode
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                : 'glass-button text-gray-300 hover:text-white'
            }`}
          >
            {selectionMode ? <CheckCircle2 className="w-4 h-4 text-brand-400" /> : <Circle className="w-4 h-4" />}
            <span>{selectionMode ? 'Cancelar Seleção' : 'Selecionar Fotos'}</span>
          </button>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="px-3 py-2 text-xs font-semibold rounded-xl glass-button text-gray-300 hover:text-white flex items-center space-x-1.5"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-accent-cyan" />
            <span>{sortOrder === 'newest' ? 'Mais recentes' : 'Mais antigas'}</span>
          </button>
        </div>

        {/* Gallery Content */}
        {photos.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center text-gray-400 my-8">
            <Camera className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">O evento acabou de começar!</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              As fotos tiradas pelo fotógrafo aparecerão aqui automaticamente na sua tela em tempo real.
            </p>
          </div>
        ) : (
          <>
            {/* Masonry Grid */}
            <div className="masonry-grid">
              {visiblePhotos.map((photo) => {
                const isSelected = selectedPhotoIds.has(photo.id);

                return (
                  <div
                    key={photo.id}
                    onClick={() => {
                      if (selectionMode) {
                        toggleSelectPhoto(photo.id);
                      } else {
                        setLightboxPhoto(photo);
                      }
                    }}
                    className={`masonry-item rounded-2xl overflow-hidden glass-card relative cursor-pointer group transition-all duration-300 ${
                      isSelected ? 'ring-4 ring-brand-500 scale-[0.98]' : 'hover:scale-[1.01]'
                    }`}
                  >
                    {/* Image */}
                    {/* eslint-disable-next-html-element-suppression */}
                    <img
                      src={photo.thumbnailUrl}
                      alt={photo.filename}
                      className="w-full h-auto object-cover rounded-2xl block"
                      loading="lazy"
                    />

                    {/* Selection Overlay Checkbox */}
                    {selectionMode && (
                      <div className="absolute top-2.5 right-2.5 z-20">
                        {isSelected ? (
                          <CheckCircle2 className="w-6 h-6 text-brand-500 fill-brand-500 bg-white rounded-full shadow-lg" />
                        ) : (
                          <Circle className="w-6 h-6 text-white/80 drop-shadow-md" />
                        )}
                      </div>
                    )}

                    {/* Hover Gradient Overlay */}
                    {!selectionMode && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end justify-between">
                        <span className="text-[10px] text-gray-300 font-mono">Alta Resolução</span>
                        <Download className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Load More Indicator if more photos exist */}
            {visiblePhotos.length < sortedPhotos.length && (
              <div className="text-center py-8">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 30)}
                  className="px-6 py-2.5 text-xs font-semibold rounded-full glass-button text-gray-300 hover:text-white"
                >
                  Carregar Mais Fotos ({sortedPhotos.length - visiblePhotos.length} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Action Bar during Multi-Selection Mode - Mobile First Centered */}
      {selectionMode && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md glass-panel bg-gray-950/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-brand-500/50 flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-slide-up">
          {/* Top/Left Row: Selection Counter & Marcar/Desmarcar Toggle */}
          <div className="flex items-center justify-between w-full sm:w-auto px-1">
            <span className="text-xs font-semibold text-gray-300">
              <span className="text-brand-400 font-bold">{selectedPhotoIds.size}</span> foto{selectedPhotoIds.size !== 1 ? 's' : ''} selecionada{selectedPhotoIds.size !== 1 ? 's' : ''}
            </span>

            <button
              onClick={selectAllPhotos}
              className="text-xs text-brand-400 font-medium hover:underline ml-3"
            >
              {selectedPhotoIds.size === photos.length ? 'Desmarcar Todas' : 'Marcar Todas'}
            </button>
          </div>

          {/* Centered Download ZIP Button */}
          <button
            onClick={() => handleDownloadZip(true)}
            disabled={selectedPhotoIds.size === 0 || downloadingZip}
            className="w-full sm:w-auto py-2.5 px-5 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-brand-600 via-brand-500 to-accent-violet hover:opacity-90 transition-all shadow-lg shadow-brand-600/40 flex items-center justify-center space-x-2 disabled:opacity-50 flex-shrink-0"
          >
            {downloadingZip ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Baixar Selecionadas (.ZIP)</span>
          </button>
        </div>
      )}

      {/* Fullscreen Lightbox Modal for Individual Photo */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in">
          {/* Top Bar */}
          <div className="flex items-center justify-between z-10">
            <div className="text-xs text-gray-400 font-mono">
              <span>{lightboxPhoto.width && lightboxPhoto.height ? `${lightboxPhoto.width}x${lightboxPhoto.height} • ` : ''}</span>
              <span>{(lightboxPhoto.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
            </div>

            <button
              onClick={() => setLightboxPhoto(null)}
              className="p-2.5 rounded-full bg-gray-800/80 text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image Display */}
          <div className="flex-1 flex items-center justify-center py-4 relative overflow-hidden">
            {/* eslint-disable-next-html-element-suppression */}
            <img
              src={lightboxPhoto.originalUrl}
              alt={lightboxPhoto.filename}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="max-w-md w-full mx-auto flex flex-col sm:flex-row items-center gap-3 pt-2">
            <a
              href={lightboxPhoto.originalUrl}
              download={`Maggon_${lightboxPhoto.filename}`}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 via-brand-500 to-accent-violet hover:opacity-95 transition-all shadow-xl shadow-brand-600/30 flex items-center justify-center space-x-2 text-center"
            >
              <Download className="w-5 h-5" />
              <span>Baixar Foto em Alta Resolução</span>
            </a>

            <button
              onClick={() => handleSharePhoto(lightboxPhoto)}
              className="w-full sm:w-auto py-3.5 px-5 rounded-2xl font-semibold text-sm text-gray-200 glass-card hover:text-white transition-all flex items-center justify-center space-x-2"
            >
              {copiedShare ? <Check className="w-5 h-5 text-accent-emerald" /> : <Share2 className="w-5 h-5" />}
              <span>{copiedShare ? 'Link Copiado!' : 'Compartilhar'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
