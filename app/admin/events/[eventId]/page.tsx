'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  Camera,
  ArrowLeft,
  QrCode,
  Download,
  Copy,
  Check,
  UploadCloud,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  HardDrive,
  ImageIcon,
  Sparkles,
  Printer,
  RefreshCw,
  PlaySquare
} from 'lucide-react';
import { Event, Photo } from '@/lib/types';

export default function EventAdminDetail({ params }: { params: { eventId: string } }) {
  const eventId = params.eventId;
  const [event, setEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [folderPath, setFolderPath] = useState('C:\\CanonEOS_Photos');
  const qrRef = useRef<HTMLDivElement>(null);

  const [appBaseUrl, setAppBaseUrl] = useState('http://localhost:3000');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppBaseUrl(window.location.origin);
    }
  }, []);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (data.success) {
        setEvent(data.event);
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const guestUrl = `${appBaseUrl}/event/${event?.slug || eventId}`;

  // CLI Command string for Tethering Watcher
  const cliCommand = `python watcher.py --folder "${folderPath}" --api-url "${appBaseUrl}" --event-id "${event?.id}" --api-key "${event?.apiKey}"`;

  const copyCliCommand = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadPreconfiguredBat = () => {
    if (!event) return;

    const rawPythonScript = `import os, sys, time, requests
from PIL import Image
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

API_URL = "${appBaseUrl}"
EVENT_ID = "${event.id}"
API_KEY = "${event.apiKey}"

def upload_photo(file_path):
    filename = os.path.basename(file_path)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".cr2", ".cr3", ".arw", ".nef", ".png"] or filename.endswith("_tmp.jpg"):
        return
    print(f"\\n[+] Nova foto detectada: {filename}")
    time.sleep(1.0)
    url = f"{API_URL.rstrip('/')}/api/events/{EVENT_ID}/upload"
    headers = {"x-api-key": API_KEY}
    try:
        print(f"[>] Transmitindo foto para os convidados ao vivo...")
        with open(file_path, "rb") as f:
            files = {"file": (filename, f, "image/jpeg")}
            res = requests.post(url, headers=headers, files=files, timeout=30)
        if res.status_code == 200 and res.json().get("success"):
            print(f"[OK] FOTO TRANSMITIDA COM SUCESSO!")
        else:
            print(f"[X] Falha no envio: {res.text}")
    except Exception as e:
        print(f"[X] Erro de conexao: {e}")

class Handler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory:
            upload_photo(event.src_path)
    def on_modified(self, event):
        if not event.is_directory:
            upload_photo(event.src_path)

if __name__ == "__main__":
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk()
    root.withdraw()
    print("====================================================")
    print("   Maggon Camera Ingestor -- Transmissao Ao Vivo")
    print("====================================================")
    print("Selecione a pasta onde a camera Canon salva as fotos...")
    folder = filedialog.askdirectory(title="Selecione a pasta das fotos da Canon")
    if not folder:
        folder = os.path.expanduser("~/Pictures")
    print(f"Pasta Selecionada: {folder}")
    print("----------------------------------------------------")
    print("TRANSMISSAO ATIVA! Pressione Ctrl+C para encerrar.")
    print("Aguardando disparos da camera Canon...\\n")
    event_handler = Handler()
    observer = Observer()
    observer.schedule(event_handler, path=folder, recursive=False)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
`;

    // Base64 encode the Python script so it never triggers Windows Batch syntax parsing errors
    const b64Code = btoa(unescape(encodeURIComponent(rawPythonScript)));

    const batContent = `@echo off
title Maggon Camera Ingestor
color 0A
echo =====================================================
echo    Maggon Camera Ingestor -- Conectando a Camera
echo =====================================================
echo.

set PYTHON_CMD=python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    where py >nul 2>nul
    if %ERRORLEVEL% EQ 0 (
        set PYTHON_CMD=py
    ) else (
        echo [ERRO] Python nao foi encontrado no seu Windows!
        echo Por favor, instale o Python em https://www.python.org/downloads
        echo IMPORTANTE: Marque a opcao "Add Python to PATH" durante a instalacao.
        echo.
        pause
        exit /b 1
    )
)

echo Verificando dependencias Python...
%PYTHON_CMD% -c "import watchdog, requests, PIL" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Instalando bibliotecas necessarias (Watchdog, Requests, Pillow)...
    %PYTHON_CMD% -m pip install watchdog requests pillow
)

echo.
echo Iniciando Transmissao Ao Vivo...
%PYTHON_CMD% -c "import base64; exec(base64.b64decode('${b64Code}'))"

echo.
if %ERRORLEVEL% NEQ 0 (
    echo Ocorreu um erro durante a execução da transmissão.
)
pause
`;

    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INICIAR_TRANSMISSAO_${event.slug}.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleStatus = async () => {
    if (!event) return;
    const newStatus = event.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setEvent(data.event);
      }
    } catch (err) {
      console.error('Failed to toggle event status:', err);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    if (!confirm(`Tem certeza que deseja excluir o evento "${event.title}" e TODAS as suas fotos?`)) return;

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/admin';
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !event) return;
    try {
      setUploading(true);
      const files = Array.from(e.target.files);

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('apiKey', event.apiKey);

        await fetch(`/api/events/${event.id}/upload`, {
          method: 'POST',
          body: formData,
        });
      }

      fetchEventDetails();
    } catch (err) {
      console.error('Error uploading photos manually:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const downloadQrCodePng = () => {
    const svgElement = qrRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw poster card background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw poster card gradient border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 12;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(event?.title || 'Maggon Câmera Evento', canvas.width / 2, 120);

      // Subtitle Instruction
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('Aponte a câmera do celular para ver suas fotos!', canvas.width / 2, 180);

      // White QR background box
      ctx.fillStyle = '#ffffff';
      ctx.roundRect(200, 240, 600, 600, 30);
      ctx.fill();

      // Draw QR image centered inside white box
      ctx.drawImage(image, 250, 290, 500, 500);

      // Footer
      ctx.fillStyle = '#9ca3af';
      ctx.font = '24px sans-serif';
      ctx.fillText('Maggon Câmera • Fotos em Tempo Real', canvas.width / 2, 920);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `QRCode_Maggon_${event?.slug || 'evento'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    image.src = blobURL;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-gray-400">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-500 mr-3" />
        <span>Carregando detalhes do evento...</span>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4 text-center">
        <p className="text-xl font-bold text-white mb-4">Evento não encontrado</p>
        <Link href="/admin" className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl">
          Voltar ao Painel
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-100 pb-20">
      {/* Header Bar */}
      <header className="w-full border-b border-gray-800/80 glass-panel sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin"
              className="p-2 rounded-xl glass-button text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>{event.title}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    event.status === 'active'
                      ? 'bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/30'
                      : 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30'
                  }`}
                >
                  {event.status === 'active' ? '● Transmitindo' : 'Pausado'}
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleStatus}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all ${
                event.status === 'active'
                  ? 'bg-accent-amber/20 text-accent-amber hover:bg-accent-amber/30 border border-accent-amber/40'
                  : 'bg-accent-emerald/20 text-accent-emerald hover:bg-accent-emerald/30 border border-accent-emerald/40'
              }`}
            >
              {event.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{event.status === 'active' ? 'Pausar Transmissão' : 'Ativar Transmissão'}</span>
            </button>

            <button
              onClick={handleDeleteEvent}
              className="p-2 rounded-xl bg-accent-rose/10 text-accent-rose hover:bg-accent-rose/20 border border-accent-rose/30 transition-colors"
              title="Excluir Evento"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Main Grid: QR Studio + Tethering Helper */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: QR Code Frame Studio (5 Cols) */}
          <div className="lg:col-span-5 glass-card rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center relative border border-brand-500/20">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Moldura para Impressão do Convidado</span>
            </div>

            {/* Printable Card Frame Container */}
            <div className="w-full max-w-sm bg-gradient-to-b from-gray-900 via-gray-900 to-[#0c1220] border-2 border-brand-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden my-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-2xl rounded-full pointer-events-none" />

              <h2 className="text-xl font-bold text-white mb-1">{event.title}</h2>
              <p className="text-accent-cyan text-xs font-semibold mb-6">
                Aponte a câmera para ver suas fotos!
              </p>

              {/* QR Code Render */}
              <div ref={qrRef} className="bg-white p-4 rounded-2xl shadow-xl inline-block border-4 border-white mb-4">
                <QRCodeSVG
                  value={guestUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <p className="text-gray-400 text-[11px] font-mono truncate">{guestUrl}</p>
            </div>

            {/* QR Card Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-4">
              <button
                onClick={downloadQrCodePng}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-brand-600 to-accent-violet hover:opacity-90 transition-all shadow-md shadow-brand-600/30 flex items-center justify-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Placa de QR Code (.PNG)</span>
              </button>

              <Link
                href={`/event/${event.slug}`}
                target="_blank"
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-gray-200 glass-button hover:text-white transition-all flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-4 h-4 text-accent-cyan" />
                <span>Testar Galeria</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Tethering Integration + Manual Upload (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tethering Python Watcher Card */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 relative">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Integração com a Câmera Canon</h3>
                  <p className="text-xs text-gray-400">Arquivo autônomo de 1-clique para o seu cliente.</p>
                </div>
              </div>

              {/* 1-Click Self-Contained BAT Downloader Button */}
              <div className="bg-gradient-to-r from-brand-900/60 to-accent-violet/30 border border-brand-500/40 rounded-2xl p-5 mb-5 text-left">
                <div className="flex items-center space-x-2 text-brand-300 font-bold text-sm mb-1">
                  <PlaySquare className="w-5 h-5 text-accent-cyan" />
                  <span>Baixar Lançador Autônomo para o Cliente (.BAT)</span>
                </div>
                <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                  Baixe este arquivo `.bat` autônomo e envie para o seu cliente. Quando ele clicar no arquivo em qualquer pasta, o script abre uma janela para ele escolher a pasta das fotos e inicia a transmissão ao vivo automaticamente!
                </p>

                <button
                  onClick={downloadPreconfiguredBat}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-accent-emerald to-brand-600 hover:opacity-95 transition-all shadow-lg shadow-accent-emerald/20 flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Lançador Autônomo (.BAT)</span>
                </button>
              </div>

              {/* Manual CLI Command Box */}
              <div className="mb-2">
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                  Opção 2: Linha de Comando (Avançado)
                </label>
                <div className="bg-gray-950 rounded-2xl p-3.5 border border-gray-800 relative group font-mono text-xs text-brand-300 overflow-x-auto">
                  <pre className="whitespace-pre-wrap break-all pr-10">{cliCommand}</pre>

                  <button
                    onClick={copyCliCommand}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-200 transition-colors"
                    title="Copiar Comando"
                  >
                    {copied ? <Check className="w-4 h-4 text-accent-emerald" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Web Upload Dropzone Card */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 border border-dashed border-gray-700/80 text-center relative hover:border-brand-500/50 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleManualUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              <div className="w-12 h-12 rounded-2xl bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-center text-accent-violet mx-auto mb-3">
                {uploading ? (
                  <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>

              <h4 className="text-base font-bold text-white mb-1">
                {uploading ? 'Enviando fotos...' : 'Upload Manual de Fotos via Navegador'}
              </h4>
              <p className="text-xs text-gray-400">
                Arraste imagens JPG ou clique para selecionar fotos direto do computador.
              </p>
            </div>
          </div>
        </div>

        {/* Live Photo Gallery Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-brand-400" />
              <span>Fotos do Evento ({photos.length})</span>
            </h3>

            <button
              onClick={fetchEventDetails}
              className="px-3 py-1.5 text-xs rounded-xl glass-button text-gray-300 hover:text-white flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar Galeria</span>
            </button>
          </div>

          {photos.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center text-gray-400">
              <Camera className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="font-semibold text-white">Nenhuma foto enviada para este evento ainda</p>
              <p className="text-xs text-gray-400 mt-1">
                Inicie a transmissão pela câmera ou faça um upload manual acima para testar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="glass-card rounded-2xl overflow-hidden group relative aspect-square bg-gray-900 border border-gray-800"
                >
                  {/* eslint-disable-next-html-element-suppression */}
                  <img
                    src={photo.thumbnailUrl}
                    alt={photo.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                    <p className="text-[10px] font-mono text-gray-300 truncate">{photo.filename}</p>
                    <p className="text-[9px] text-gray-400">
                      {(photo.sizeBytes / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
