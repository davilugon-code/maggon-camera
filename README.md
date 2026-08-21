# Maggon 📸 — Transmissão e Distribuição de Fotos de Eventos em Tempo Real

**Maggon** é uma solução completa para fotógrafos transmitirem fotos de eventos em tempo real direto da câmera Canon para a nuvem. Os convidados leem o QR Code impresso no evento e visualizam as fotos no celular instantaneamente, podendo baixar fotos individuais ou selecionar em lote para download em arquivo `.ZIP`.

---

## 🚀 Funcionalidades Principais

### 📱 Galeria Pública do Convidado (`/event/[eventId]`)
- **Acesso Direto:** Leitura simples de QR Code no celular, sem necessidade de login ou senha.
- **Grid Responsivo em Tempo Real:** Layout Masonry (estilo Pinterest) com atualização instantânea via Server-Sent Events (SSE). Novas fotos tiradas aparecem no topo com animação suave e alerta sonoro/visual.
- **Lightbox em Alta Resolução:** Modal com visualização completa, botão para baixar foto original e integração nativa com a Web Share API do celular ("Compartilhar").
- **Download em Lote (.ZIP):** Modo de seleção múltipla ("Selecionar Fotos") para marcar fotos favoritas e baixar todas em um único arquivo `.ZIP`.
- **Botão "Baixar Todas":** Baixe todas as fotos do evento compactadas de uma só vez.
- **Filtros e Ordenação:** Alternância rápida entre "Mais recentes primeiro" e "Mais antigas primeiro".

### 👨‍🎨 Painel Administrativo do Fotógrafo (`/admin`)
- **Gestão Completa de Eventos:** Criação de novos eventos, alteração de status (Ativo/Pausado) e exclusão.
- **Estúdio de QR Code:** Exibe a moldura/placa para impressão com logo e instrução *"Aponte a câmera para ver suas fotos"*, com exportação em PNG de alta resolução.
- **Estatísticas em Tempo Real:** Contador de fotos enviadas, total de downloads realizados e tamanho de armazenamento utilizado em MB/GB.
- **Gerador de Comando CLI:** Gera automaticamente a linha de comando do script de tethering em Python com a `API_KEY` preenchida para cópia em 1 clique.
- **Upload Manual via Web:** Arraste e solte fotos direto pelo navegador se precisar testar sem a câmera.

### ⚙️ Backend & Processamento de Mídia (Next.js App Router)
- **Otimização Inteligente com Sharp:** Gera thumbnails leves (WebP/JPEG progressivo) mantendo a imagem original em máxima resolução.
- **Streaming de ZIP (Archiver):** Compactação sob demanda de seleções personalizadas sem sobrecarregar a memória do servidor.
- **Integração com Supabase PostgreSQL:** Suporte completo para banco de dados relacional na nuvem para persistência em servidores Serverless (Vercel).

---

## 🌐 Como Fazer Deploy na Vercel

### Opção 1: Via Vercel CLI (Direto do Terminal)
1. Instale a CLI da Vercel: `npm install -g vercel` ou use `npx vercel`.
2. No terminal do projeto, execute:
   ```bash
   npx vercel
   ```
3. Siga as instruções no terminal para conectar sua conta da Vercel.
4. Adicione as Variáveis de Ambiente no painel da Vercel (`Settings > Environment Variables`):
   - `NEXT_PUBLIC_APP_URL`: URL do seu projeto na Vercel (ex: `https://maggon.vercel.app`)
   - `NEXT_PUBLIC_SUPABASE_URL`: URL do seu Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key do seu Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key do seu Supabase

### Opção 2: Via GitHub + Vercel Dashboard
1. Crie um repositório no GitHub e envie o código do projeto:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Maggon Event Platform"
   git remote add origin https://github.com/SEU_USUARIO/maggon.git
   git push -u origin main
   ```
2. Acesse [vercel.com/new](https://vercel.com/new), importe o repositório `maggon` e insira as variáveis de ambiente acima.
3. Clique em **Deploy**. O projeto estará online em segundos acessível de qualquer lugar!

---

## 📷 Como Conectar a Câmera Canon ao Maggon

### Passo 1: Configurar a Câmera Canon e EOS Utility
1. Conecte a câmera Canon ao notebook usando o cabo USB original da câmera.
2. Abra o software oficial **Canon EOS Utility**.
3. Selecione a opção **"Download images to computer"** ou **"Remote Shooting"**.
4. Nas configurações do EOS Utility, defina a pasta de destino onde as fotos serão salvas no computador (exemplo: `C:\FotosCanon`).

### Passo 2: Executar o Script de Tethering Python
No terminal do seu computador, acesse a pasta `tethering-client`:

```bash
# 1. Entre na pasta do cliente
cd tethering-client

# 2. Instale as dependências
pip install -r requirements.txt

# 3. Execute o script de monitoramento (substitua com a URL da sua Vercel e dados do evento)
python watcher.py --folder "C:\FotosCanon" --api-url "https://maggon.vercel.app" --event-id "demo-casamento" --api-key "ls_live_demo_key_2026"
```

---

## 🛡️ Licença & Suporte
Maggon © 2026 — Desenvolvido para fotógrafos e produtores de eventos.