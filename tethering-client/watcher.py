#!/usr/bin/env python3
"""
Maggon Canon Camera Tethering Watcher
Monitors a folder for new photos saved by Canon EOS Utility (or tethering software)
and uploads them immediately to the Maggon cloud event server.
"""

import os
import sys
import time
import argparse
import logging
from pathlib import Path
import requests
from PIL import Image
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Force UTF-8 stdout encoding on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Terminal Colors for logging
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
RESET = "\033[0m"
BOLD = "\033[1m"

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".cr2", ".cr3", ".arw", ".nef", ".png"}

def wait_for_file_completion(file_path, timeout=10, check_interval=0.5):
    """Wait until the tethering software finishes writing the file to disk."""
    start_time = time.time()
    last_size = -1

    while time.time() - start_time < timeout:
        try:
            if os.path.exists(file_path):
                current_size = os.path.getsize(file_path)
                if current_size > 0 and current_size == last_size:
                    # File size stabilized, attempt to open
                    with open(file_path, "rb") as f:
                        f.read(1024)
                    return True
                last_size = current_size
        except (IOError, PermissionError):
            pass
        time.sleep(check_interval)
    return False

def upload_photo(file_path, api_url, event_id, api_key):
    """Compress image lightly if needed and upload to Maggon server."""
    filename = os.path.basename(file_path)
    ext = os.path.splitext(filename)[1].lower()

    if ext not in SUPPORTED_EXTENSIONS or filename.endswith("_maggon_tmp.jpg"):
        return

    print(f"\n{CYAN}[{time.strftime('%H:%M:%S')}]{RESET} {BOLD}Nova foto detectada:{RESET} {filename}")

    if not wait_for_file_completion(file_path):
        print(f"{RED}[X] Arquivo {filename} ocupado ou incompleto.{RESET}")
        return

    upload_url = f"{api_url.rstrip('/')}/api/events/{event_id}/upload"
    headers = {
        "x-api-key": api_key
    }

    start_upload_time = time.time()

    try:
        temp_upload_path = file_path
        is_temp = False

        if ext in {".cr2", ".cr3", ".arw", ".nef"} or os.path.getsize(file_path) > 10 * 1024 * 1024:
            print(f"  [>] Otimizando payload para transmissao ultra-rapida...")
            try:
                im = Image.open(file_path)
                im = im.convert("RGB")
                temp_upload_path = f"{file_path}_maggon_tmp.jpg"
                im.save(temp_upload_path, "JPEG", quality=90, optimize=True)
                is_temp = True
            except Exception as e:
                print(f"  [!] Aviso na conversao RAW: {e}. Enviando arquivo original.")
                temp_upload_path = file_path

        print(f"  [>] Enviando para Maggon ({event_id})...")

        with open(temp_upload_path, "rb") as f:
            files = {
                "file": (os.path.basename(temp_upload_path), f, "image/jpeg")
            }
            response = requests.post(upload_url, headers=headers, files=files, timeout=30)

        elapsed = time.time() - start_upload_time

        if is_temp and os.path.exists(temp_upload_path):
            try:
                os.remove(temp_upload_path)
            except Exception:
                pass

        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print(f"  {GREEN}[OK] UPLOAD CONCLUIDO!{RESET} ({elapsed:.2f}s) -- Foto ao vivo no QR Code dos convidados!")
            else:
                print(f"  {RED}[X] Erro no servidor:{RESET} {data.get('error')}")
        else:
            print(f"  {RED}[X] Falha HTTP {response.status_code}:{RESET} {response.text}")

    except Exception as e:
        print(f"  {RED}[X] Erro durante o upload:{RESET} {e}")

class PhotoFolderHandler(FileSystemEventHandler):
    def __init__(self, api_url, event_id, api_key):
        self.api_url = api_url
        self.event_id = event_id
        self.api_key = api_key
        self.processed = set()

    def on_created(self, event):
        if not event.is_directory:
            if event.src_path not in self.processed:
                self.processed.add(event.src_path)
                upload_photo(event.src_path, self.api_url, self.event_id, self.api_key)

    def on_modified(self, event):
        if not event.is_directory:
            if event.src_path not in self.processed:
                self.processed.add(event.src_path)
                upload_photo(event.src_path, self.api_url, self.event_id, self.api_key)

def main():
    parser = argparse.ArgumentParser(description="Maggon Canon Camera Tethering Watcher")
    parser.add_argument("--folder", required=True, help="Caminho da pasta monitorada (onde o EOS Utility salva as fotos)")
    parser.add_argument("--api-url", default="http://localhost:3000", help="URL base do servidor Maggon")
    parser.add_argument("--event-id", required=True, help="ID ou slug do evento no Maggon")
    parser.add_argument("--api-key", required=True, help="Chave de API do evento (copiada do painel admin)")

    args = parser.parse_args()

    watch_dir = os.path.abspath(args.folder)

    if not os.path.exists(watch_dir):
        print(f"{YELLOW}[!] Pasta '{watch_dir}' nao existe. Criando pasta automaticamente...{RESET}")
        os.makedirs(watch_dir, exist_ok=True)

    print(f"\n{GREEN}===================================================={RESET}")
    print(f"{BOLD}  Maggon Tethering Watcher -- Transmissao Canon{RESET}")
    print(f"{GREEN}===================================================={RESET}")
    print(f"  Pasta Monitorada : {watch_dir}")
    print(f"  Servidor Cloud   : {args.api_url}")
    print(f"  ID do Evento    : {args.event_id}")
    print(f"  API Key         : {args.api_key[:8]}...")
    print(f"{GREEN}===================================================={RESET}")
    print(f"{CYAN}Aguardando disparos da camera Canon... Pressione Ctrl+C para sair.{RESET}\n")

    event_handler = PhotoFolderHandler(args.api_url, args.event_id, args.api_key)
    observer = Observer()
    observer.schedule(event_handler, path=watch_dir, recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print(f"\n{YELLOW}Watcher finalizado.{RESET}")

    observer.join()

if __name__ == "__main__":
    main()
