/**
 * Utilitário de Composição de Imagens em Canvas para Vitrines e Redes Sociais
 * Gera cards profissionais de "Antes & Depois" no formato Feed Instagram / Status WhatsApp (1080 x 1080 px).
 */

export interface BeforeAfterCardOptions {
  beforeUrl: string;
  afterUrl: string;
  businessName: string;
  whatsapp: string;
  serviceTitle?: string;
}

export interface BeforeAfterCardResult {
  blob: Blob;
  dataUrl: string;
  file: File;
}

const WA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#ffffff"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.49-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.77 2.71 4.3 3.8 2.52 1.09 2.52.73 2.98.69.45-.04 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.23-.19-.48-.32"/></svg>`;

/**
 * Sanitiza o nome da empresa para gerar o nome do arquivo PNG
 */
export function sanitizeFileName(businessName: string): string {
  const sanitized = (businessName || "empresa")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `antes-e-depois-${sanitized || "trabalho"}.png`;
}

/**
 * Formata telefone brasileiro para exibição no card
 */
export function formatPhone(phone: string): string {
  if (!phone) return "WhatsApp";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 13 && cleaned.startsWith("55")) {
    return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Carrega uma imagem externa com crossOrigin = 'anonymous' para prevenir Canvas Tainted
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Se falhar devido a cache CORS no navegador, tenta com parâmetro de cache buster
      if (url.startsWith("data:") || url.startsWith("blob:")) {
        reject(new Error(`Falha ao carregar imagem interna: ${url.slice(0, 50)}`));
        return;
      }
      const retryImg = new Image();
      retryImg.crossOrigin = "anonymous";
      retryImg.onload = () => resolve(retryImg);
      retryImg.onerror = () => reject(new Error(`Falha ao carregar imagem para o Canvas (CORS): ${url}`));
      const separator = url.includes("?") ? "&" : "?";
      retryImg.src = `${url}${separator}em_cors_retry=${Date.now()}`;
    };
    img.src = url;
  });
}

/**
 * Carrega imagem SVG inline sem dependência de rede
 */
function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/**
 * Desenha imagem aplicando o corte no estilo "cover" (centralizado e proporcional)
 */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  if (!imgW || !imgH) return;

  const targetRatio = w / h;
  const imgRatio = imgW / imgH;

  let sW: number, sH: number, sx: number, sy: number;

  if (imgRatio > targetRatio) {
    sH = imgH;
    sW = imgH * targetRatio;
    sx = (imgW - sW) / 2;
    sy = 0;
  } else {
    sW = imgW;
    sH = imgW / targetRatio;
    sx = 0;
    sy = (imgH - sH) / 2;
  }

  ctx.drawImage(img, sx, sy, sW, sH, x, y, w, h);
}

/**
 * Utilitário de polígono arredondado com suporte retrocompatível
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}

/**
 * Trunca texto que excede largura máxima adicionando reticências
 */
function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + "...").width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "...";
}

/**
 * Cria o card composto de Antes e Depois em alta resolução (1080 x 1080 px)
 */
export async function createBeforeAfterCard(
  options: BeforeAfterCardOptions
): Promise<BeforeAfterCardResult> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("createBeforeAfterCard só pode ser executado em ambiente cliente (Browser).");
  }

  // 1. Carrega as imagens simultaneamente
  const [beforeImg, afterImg, waIconImg] = await Promise.all([
    loadImage(options.beforeUrl),
    loadImage(options.afterUrl),
    loadSvgImage(WA_SVG).catch(() => null),
  ]);

  // 2. Inicializa o Canvas 1080x1080
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Não foi possível obter o contexto 2D do Canvas.");
  }

  // Fundo base escuro
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 1080, 1080);

  // 3. Renderiza fotos com cover crop:
  // Lado esquerdo: Antes (540 x 960)
  drawImageCover(ctx, beforeImg, 0, 0, 540, 960);

  // Lado direito: Depois (540 x 960)
  drawImageCover(ctx, afterImg, 540, 0, 540, 960);

  // 4. Linha divisória vertical centralizada (branca com sombra âmbar sutil)
  ctx.save();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(540, 0);
  ctx.lineTo(540, 960);
  ctx.stroke();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(540, 0);
  ctx.lineTo(540, 960);
  ctx.stroke();
  ctx.restore();

  // Emblema central na linha divisória (↔)
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(540, 480, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#f59e0b"; // âmbar
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(540, 480, 24, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("↔", 540, 480);
  ctx.restore();

  // 5. Badges sobrepostas no topo:
  // Topo esquerdo: Pílula escura semitransparente "ANTES"
  const beforePillX = 36;
  const beforePillY = 36;
  const beforePillW = 140;
  const beforePillH = 46;
  const beforePillR = 23;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
  drawRoundedRect(ctx, beforePillX, beforePillY, beforePillW, beforePillH, beforePillR);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, beforePillX, beforePillY, beforePillW, beforePillH, beforePillR);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ANTES", beforePillX + beforePillW / 2, beforePillY + beforePillH / 2);
  ctx.restore();

  // Topo direito: Pílula destacada esmeralda com gradiente "DEPOIS"
  const afterPillW = 150;
  const afterPillH = 46;
  const afterPillR = 23;
  const afterPillX = 1080 - 36 - afterPillW;
  const afterPillY = 36;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = 12;

  const gradEmerald = ctx.createLinearGradient(
    afterPillX,
    afterPillY,
    afterPillX + afterPillW,
    afterPillY + afterPillH
  );
  gradEmerald.addColorStop(0, "#10b981");
  gradEmerald.addColorStop(1, "#059669");

  ctx.fillStyle = gradEmerald;
  drawRoundedRect(ctx, afterPillX, afterPillY, afterPillW, afterPillH, afterPillR);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, afterPillX, afterPillY, afterPillW, afterPillH, afterPillR);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DEPOIS", afterPillX + afterPillW / 2, afterPillY + afterPillH / 2);
  ctx.restore();

  // 6. Rodapé informativo (altura 120px: y = 960 a 1080)
  ctx.save();
  // Fundo escuro #0f172a
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 960, 1080, 120);

  // Linha de realce no topo do rodapé (âmbar)
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 960);
  ctx.lineTo(1080, 960);
  ctx.stroke();

  // Lado Esquerdo do Rodapé (Texto da Empresa / Serviço)
  const leftMargin = 44;
  const maxTitleWidth = 560;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  if (options.serviceTitle && options.serviceTitle.trim()) {
    // Título do serviço em destaque
    ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#ffffff";
    const displayedTitle = truncateText(ctx, options.serviceTitle.trim(), maxTitleWidth);
    ctx.fillText(displayedTitle, leftMargin, 1008);

    // Nome da empresa como subtítulo
    ctx.font = "600 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#94a3b8";
    const displayedSub = truncateText(ctx, options.businessName || "Empresa Local", maxTitleWidth);
    ctx.fillText(displayedSub, leftMargin, 1042);
  } else {
    // Nome da empresa como título principal
    ctx.font = "bold 30px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#ffffff";
    const displayedName = truncateText(
      ctx,
      options.businessName || "Nosso Estabelecimento",
      maxTitleWidth
    );
    ctx.fillText(displayedName, leftMargin, 1012);

    // Subtítulo padrão
    ctx.font = "600 18px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("Transformação Antes & Depois", leftMargin, 1045);
  }

  // Lado Direito do Rodapé (Selo WhatsApp / Atendimento)
  const phoneFormatted = formatPhone(options.whatsapp);
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const phoneTextWidth = ctx.measureText(phoneFormatted).width;

  const waIconSize = 22;
  const waIconGap = 8;
  const pillPaddingH = 18;
  const waPillH = 42;
  const waPillR = 21;
  const waPillW = pillPaddingH * 2 + waIconSize + waIconGap + phoneTextWidth;

  const rightMargin = 44;
  const waPillX = 1080 - rightMargin - waPillW;
  const waPillY = 992;

  // Micro-label de Atendimento
  ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#38bdf8";
  ctx.textAlign = "right";
  ctx.fillText("ATENDIMENTO & AGENDAMENTO", 1080 - rightMargin, 980);

  // Pílula verde do WhatsApp
  ctx.fillStyle = "#22c55e"; // Emerald / WhatsApp Green
  drawRoundedRect(ctx, waPillX, waPillY, waPillW, waPillH, waPillR);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, waPillX, waPillY, waPillW, waPillH, waPillR);
  ctx.stroke();

  // Desenha ícone do WhatsApp se disponível
  const iconDrawX = waPillX + pillPaddingH;
  const iconDrawY = waPillY + (waPillH - waIconSize) / 2;
  if (waIconImg) {
    ctx.drawImage(waIconImg, iconDrawX, iconDrawY, waIconSize, waIconSize);
  }

  // Número / Texto de contato
  ctx.font = "bold 19px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(phoneFormatted, iconDrawX + waIconSize + waIconGap, waPillY + waPillH / 2);

  // Assinatura Automática EssMendes Tecnologia (canto inferior direito com 80% opacidade)
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.font = "bold 18px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("⚡ Tecnologia: essmendes.com.br", 750, 1055);
  ctx.restore();

  ctx.restore();

  // 7. Conversão em Blob e File
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Falha ao exportar Blob do Canvas"));
      },
      "image/png",
      0.95
    );
  });

  const dataUrl = canvas.toDataURL("image/png", 0.95);
  const fileName = sanitizeFileName(options.businessName);
  const file = new File([blob], fileName, { type: "image/png" });

  return { blob, dataUrl, file };
}

/**
 * Dispara o download automático do card PNG
 */
export function downloadCard(file: File, dataUrl?: string): void {
  const url = dataUrl || URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (!dataUrl) {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * Dispara o compartilhamento nativo móvel via Web Share API
 */
export async function shareCard(options: {
  file: File;
  title: string;
  text: string;
}): Promise<boolean> {
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [options.file] })
  ) {
    await navigator.share({
      files: [options.file],
      title: options.title,
      text: options.text,
    });
    return true;
  }
  return false;
}
