#!/usr/bin/env python3
"""
Maggon Câmera - Ingestor Gráfico de Fotos Canon
Interface gráfica (GUI) simples para fotógrafos iniciarem a transmissão
sem precisar digitar nenhum comando no terminal.
"""

import os
import sys
import time
import threading
import subprocess
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

# Try importing watcher modules
try:
  import requests
  from PIL import Image
  from watchdog.observers import Observer
  from watchdog.events import FileSystemEventHandler
except ImportError:
  # Auto-install dependencies if missing
  subprocess.check_call([sys.executable, "-m", "pip", "install", "watchdog", "requests", "pillow"])
  import requests
  from PIL import Image
  from watchdog.observers import Observer
  from watchdog.events import FileSystemEventHandler

class MaggonGuiApp:
  def __init__(self, root):
    self.root = root
    self.root.title("Maggon Câmera — Ingestor de Fotos Ao Vivo")
    self.root.geometry("580x640")
    self.root.resizable(False, False)
    self.root.configure(bg="#090d16")

    self.is_running = False
    self.observer = None

    # Load defaults from config file if available
    self.config_file = os.path.join(os.path.dirname(__file__), "maggon_config.txt")
    self.load_saved_config()

    self.build_ui()

  def load_saved_config(self):
    self.saved_folder = os.path.expanduser("~/Pictures")
    self.saved_url = "https://maggon-camera.vercel.app"
    self.saved_event_id = ""
    self.saved_api_key = ""

    if os.path.exists(self.config_file):
      try:
        with open(self.config_file, "r", encoding="utf-8") as f:
          lines = f.read().splitlines()
          for line in lines:
            if line.startswith("FOLDER="): self.saved_folder = line.split("=", 1)[1]
            elif line.startswith("URL="): self.saved_url = line.split("=", 1)[1]
            elif line.startswith("EVENT_ID="): self.saved_event_id = line.split("=", 1)[1]
            elif line.startswith("API_KEY="): self.saved_api_key = line.split("=", 1)[1]
      except Exception:
        pass

  def save_config(self):
    try:
      with open(self.config_file, "w", encoding="utf-8") as f:
        f.write(f"FOLDER={self.folder_var.get()}\n")
        f.write(f"URL={self.url_var.get()}\n")
        f.write(f"EVENT_ID={self.event_id_var.get()}\n")
        f.write(f"API_KEY={self.api_key_var.get()}\n")
    except Exception:
      pass

  def build_ui(self):
    # Title Header
    header = tk.Frame(self.root, bg="#111827", py=15, px=20)
    header.pack(fill="x")

    title_label = tk.Label(
      header,
      text="📸 Maggon Câmera",
      font=("Segoe UI", 18, "bold"),
      fg="#ffffff",
      bg="#111827"
    )
    title_label.pack(anchor="w")

    subtitle_label = tk.Label(
      header,
      text="Transmissão Automática de Fotos em Tempo Real",
      font=("Segoe UI", 10),
      fg="#38bdf8",
      bg="#111827"
    )
    subtitle_label.pack(anchor="w")

    # Form Container
    form = tk.Frame(self.root, bg="#090d16", px=20, py=15)
    form.pack(fill="both", expand=True)

    # 1. Folder Selection
    tk.Label(form, text="1. Pasta das Fotos da Câmera Canon:", font=("Segoe UI", 10, "bold"), fg="#e5e7eb", bg="#090d16").pack(anchor="w", pady=(5, 2))
    folder_frame = tk.Frame(form, bg="#090d16")
    folder_frame.pack(fill="x", pady=(0, 12))

    self.folder_var = tk.StringVar(value=self.saved_folder)
    folder_entry = tk.Entry(folder_frame, textvariable=self.folder_var, font=("Segoe UI", 10), bg="#1f2937", fg="#ffffff", insertbackground="white", bd=1, relief="solid")
    folder_entry.pack(side="left", fill="x", expand=True, ipady=6, ipadx=6)

    btn_browse = tk.Button(folder_frame, text="Procurar Pasta...", font=("Segoe UI", 9, "bold"), bg="#3b82f6", fg="white", activebackground="#2563eb", activeforeground="white", bd=0, px=12, command=self.browse_folder)
    btn_browse.pack(side="right", padx=(8, 0), ipady=5)

    # 2. Server URL
    tk.Label(form, text="2. Servidor Cloud Maggon:", font=("Segoe UI", 10, "bold"), fg="#e5e7eb", bg="#090d16").pack(anchor="w", pady=(0, 2))
    self.url_var = tk.StringVar(value=self.saved_url)
    url_entry = tk.Entry(form, textvariable=self.url_var, font=("Segoe UI", 10), bg="#1f2937", fg="#ffffff", insertbackground="white", bd=1, relief="solid")
    url_entry.pack(fill="x", pady=(0, 12), ipady=6, ipadx=6)

    # 3. Event ID
    tk.Label(form, text="3. ID do Evento (copiado do Painel Admin):", font=("Segoe UI", 10, "bold"), fg="#e5e7eb", bg="#090d16").pack(anchor="w", pady=(0, 2))
    self.event_id_var = tk.StringVar(value=self.saved_event_id)
    event_id_entry = tk.Entry(form, textvariable=self.event_id_var, font=("Segoe UI", 10), bg="#1f2937", fg="#ffffff", insertbackground="white", bd=1, relief="solid")
    event_id_entry.pack(fill="x", pady=(0, 12), ipady=6, ipadx=6)

    # 4. API Key
    tk.Label(form, text="4. Chave do Evento (API Key):", font=("Segoe UI", 10, "bold"), fg="#e5e7eb", bg="#090d16").pack(anchor="w", pady=(0, 2))
    self.api_key_var = tk.StringVar(value=self.saved_api_key)
    api_key_entry = tk.Entry(form, textvariable=self.api_key_var, font=("Segoe UI", 10), bg="#1f2937", fg="#ffffff", insertbackground="white", bd=1, relief="solid")
    api_key_entry.pack(fill="x", pady=(0, 15), ipady=6, ipadx=6)

    # Start / Stop Action Button
    self.btn_toggle = tk.Button(
      form,
      text="▶ INICIAR TRANSMISSÃO AO VIVO",
      font=("Segoe UI", 12, "bold"),
      bg="#10b981",
      fg="white",
      activebackground="#059669",
      activeforeground="white",
      bd=0,
      cursor="hand2",
      command=self.toggle_monitoring
    )
    self.btn_toggle.pack(fill="x", ipady=10, pady=(0, 15))

    # Log Terminal Output Box inside Window
    tk.Label(form, text="Status & Fotos Enviadas:", font=("Segoe UI", 9, "bold"), fg="#9ca3af", bg="#090d16").pack(anchor="w", pady=(0, 2))
    
    log_frame = tk.Frame(form, bg="#111827", bd=1, relief="solid")
    log_frame.pack(fill="both", expand=True)

    self.log_text = tk.Text(log_frame, font=("Consolas", 9), bg="#030712", fg="#10b981", insertbackground="white", bd=0)
    self.log_text.pack(side="left", fill="both", expand=True, pading=5 if hasattr(log_frame, 'pading') else 2)

    scrollbar = ttk.Scrollbar(log_frame, command=self.log_text.yview)
    scrollbar.pack(side="right", fill="y")
    self.log_text.config(yscrollcommand=scrollbar.set)

    self.log("Aplicativo pronto. Clique no botão acima para iniciar.")

  def log(self, message):
    timestamp = time.strftime("[%H:%M:%S] ")
    self.log_text.config(state="normal")
    self.log_text.insert("end", timestamp + message + "\n")
    self.log_text.see("end")
    self.log_text.config(state="disabled")

  def browse_folder(self):
    selected = filedialog.askdirectory(title="Selecione a pasta das fotos da Canon", initialdir=self.folder_var.get())
    if selected:
      self.folder_var.set(selected)

  def toggle_monitoring(self):
    if not self.is_running:
      self.start_monitoring()
    else:
      self.stop_monitoring()

  def start_monitoring(self):
    folder = self.folder_var.get().strip()
    url = self.url_var.get().strip()
    event_id = self.event_id_var.get().strip()
    api_key = self.api_key_var.get().strip()

    if not folder or not os.path.exists(folder):
      messagebox.showerror("Erro", "Por favor, selecione uma pasta válida no seu computador.")
      return

    if not event_id or not api_key:
      messagebox.showerror("Erro", "Por favor, informe o ID do Evento e a Chave de API.")
      return

    self.save_config()

    self.is_running = True
    self.btn_toggle.config(text="⏹ PARAR TRANSMISSÃO", bg="#ef4444", activebackground="#dc2626")
    self.log("🚀 Monitoramento iniciado com sucesso!")
    self.log(f"Pasta: {folder}")
    self.log("Aguardando novas fotos tiradas pela câmera Canon...")

    # Start watcher in background thread
    self.thread = threading.Thread(target=self.run_watcher, args=(folder, url, event_id, api_key), daemon=True)
    self.thread.start()

  def stop_monitoring(self):
    self.is_running = False
    if self.observer:
      try:
        self.observer.stop()
      except Exception:
        pass
    self.btn_toggle.config(text="▶ INICIAR TRANSMISSÃO AO VIVO", bg="#10b981", activebackground="#059669")
    self.log("⏹ Transmissão interrompida pelo usuário.")

  def run_watcher(self, folder, api_url, event_id, api_key):
    class Handler(FileSystemEventHandler):
      def __init__(app_self):
        app_self.processed = set()

      def on_created(app_self, event):
        if not event.is_directory:
          self.handle_file(event.src_path, api_url, event_id, api_key)

      def on_modified(app_self, event):
        if not event.is_directory:
          self.handle_file(event.src_path, api_url, event_id, api_key)

    event_handler = Handler()
    self.observer = Observer()
    self.observer.schedule(event_handler, path=folder, recursive=False)
    self.observer.start()

    while self.is_running:
      time.sleep(0.5)

  def handle_file(self, file_path, api_url, event_id, api_key):
    filename = os.path.basename(file_path)
    ext = os.path.splitext(filename)[1].lower()

    if ext not in {".jpg", ".jpeg", ".cr2", ".cr3", ".arw", ".nef", ".png"} or filename.endswith("_tmp.jpg"):
      return

    self.log(f"📸 Nova foto detectada: {filename}")
    time.sleep(1.0) # Wait for write completion

    upload_url = f"{api_url.rstrip('/')}/api/events/{event_id}/upload"
    headers = {"x-api-key": api_key}

    try:
      self.log(f"Enviando foto para os convidados...")
      with open(file_path, "rb") as f:
        files = {"file": (filename, f, "image/jpeg")}
        response = requests.post(upload_url, headers=headers, files=files, timeout=30)

      if response.status_code == 200 and response.json().get("success"):
        self.log(f"✅ UPLOAD CONCLUÍDO! Foto enviada com sucesso!")
      else:
        self.log(f"❌ Falha no envio: {response.text}")
    except Exception as e:
      self.log(f"❌ Erro de rede: {e}")

if __name__ == "__main__":
  root = tk.Tk()
  app = MaggonGuiApp(root)
  root.mainloop()
