# Maggon Tethering Client (Ingestor de Fotos da Câmera)

Este diretório contém o script cliente em Python responsável por monitorar a pasta onde a câmera Canon (via Canon EOS Utility ou similar) descarrega as fotos no computador e enviá-las instantaneamente para o servidor Maggon.

## Requisitos
- Python 3.8+
- Módulos Python: `watchdog`, `requests`, `pillow`

## Instalação das Dependências
```bash
pip install -r requirements.txt
```

## Como Executar
```bash
python watcher.py --folder "C:\FotosCanon" --api-url "http://localhost:3000" --event-id "SEU_EVENT_ID" --api-key "SUA_API_KEY"
```

### Parâmetros
- `--folder`: Caminho absoluto da pasta onde o Canon EOS Utility salva as fotos no computador.
- `--api-url`: URL do seu servidor Maggon na Vercel ou local (ex: `https://maggon.vercel.app` ou `http://localhost:3000`).
- `--event-id`: O ID do evento gerado no painel `/admin`.
- `--api-key`: A chave de API única exibida no painel `/admin` do evento.
