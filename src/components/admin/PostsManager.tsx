"use client";

import React, { useState, useRef, useTransition } from "react";
import {
  createPostAction,
  deletePostAction,
  togglePostStatusAction,
} from "@/services/post.actions";
import {
  generateLocalSeoPost,
  generatePostCoverImageAction,
  uploadPostCoverPhotoAction,
} from "@/services/ai-post.actions";
import { createClient } from "@/lib/supabase/client";
import type { TenantPost } from "@/types";
import {
  Newspaper,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Camera,
  Wand2,
  RefreshCw,
  X,
  Tag,
  Globe,
  Search,
} from "lucide-react";

interface PostsManagerProps {
  initialPosts: TenantPost[];
  slug: string;
  tenantNiche?: string;
  tenantId?: string;
}

/**
 * Comprime a imagem no front-end via HTML5 Canvas (máximo 1280px de largura, qualidade 0.75 WebP/JPEG)
 */
async function compressImageViaCanvas(
  file: File,
  maxWidth = 1280,
  quality = 0.75
): Promise<{ blob: Blob; ext: "webp" | "jpg"; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler arquivo de imagem."));
    reader.onload = (event) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível inicializar o Canvas de compressão."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Tenta comprimir em WebP primeiro; se o navegador não suportar, usa JPEG
        canvas.toBlob(
          (webpBlob) => {
            if (webpBlob && webpBlob.type === "image/webp") {
              resolve({ blob: webpBlob, ext: "webp", mimeType: "image/webp" });
            } else {
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    resolve({ blob: jpegBlob, ext: "jpg", mimeType: "image/jpeg" });
                  } else {
                    reject(new Error("Falha ao comprimir imagem no Canvas."));
                  }
                },
                "image/jpeg",
                quality
              );
            }
          },
          "image/webp",
          quality
        );
      };
      img.src = String(event.target?.result || "");
    };
    reader.readAsDataURL(file);
  });
}

export function PostsManager({
  initialPosts,
  slug,
  tenantNiche = "general",
  tenantId,
}: PostsManagerProps) {
  const isAutomotive =
    tenantNiche === "automotive" ||
    tenantNiche.includes("auto") ||
    tenantNiche.includes("mecanica") ||
    tenantNiche.includes("oficina");

  const [posts, setPosts] = useState<TenantPost[]>(initialPosts);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [ctaType, setCtaType] = useState<"booking" | "whatsapp" | "link">(
    isAutomotive ? "whatsapp" : "booking"
  );
  const [ctaLabel, setCtaLabel] = useState(
    isAutomotive ? "Solicitar Orçamento no WhatsApp" : "Agendar Horário"
  );
  const [ctaUrl, setCtaUrl] = useState("");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isGeneratingImageAi, setIsGeneratingImageAi] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Histórico local da sessão para garantir deduplicação mesmo em múltiplos cliques seguidos antes de salvar
  const [sessionTitles, setSessionTitles] = useState<string[]>([]);
  const [sessionImages, setSessionImages] = useState<string[]>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleApplyPreset = (preset: {
    title: string;
    content: string;
    tags?: string;
    metaDescription?: string;
    ctaType: "booking" | "whatsapp" | "link";
    ctaLabel: string;
    imageUrl?: string;
  }) => {
    setTitle(preset.title);
    setContent(preset.content);
    setTags(preset.tags || "");
    setMetaDescription(preset.metaDescription || "");
    setCtaType(preset.ctaType);
    setCtaLabel(preset.ctaLabel);
    if (preset.imageUrl) setImageUrl(preset.imageUrl);
    setIsAdding(true);
  };

  const handleGenerateAiPost = async () => {
    if (isGeneratingAi || isPending) return;
    setIsGeneratingAi(true);
    setFeedback(null);
    setImageError(null);
    try {
      const excludeTitles = Array.from(
        new Set(
          [
            title,
            ...sessionTitles,
            ...posts.map((p) => p.title),
          ].filter(Boolean)
        )
      );
      const excludeImageUrls = Array.from(
        new Set(
          [
            imageUrl,
            ...sessionImages,
            ...posts.map((p) => p.image_url || ""),
          ].filter(Boolean)
        )
      );

      const res = await generateLocalSeoPost({
        niche: tenantNiche,
        excludeTitles,
        excludeImageUrls,
      });
      if (res.success && res.data) {
        setTitle(res.data.title);
        setContent(res.data.content);
        setTags(res.data.tags || "");
        setMetaDescription(res.data.metaDescription || "");
        setCtaType(res.data.ctaType);
        setCtaLabel(res.data.ctaLabel);
        setSessionTitles((prev) =>
          Array.from(new Set([...prev, res.data!.title]))
        );
        if (res.data.imageUrl) {
          setImageUrl(res.data.imageUrl);
          setSessionImages((prev) =>
            Array.from(new Set([...prev, res.data!.imageUrl!]))
          );
        }
        setIsAdding(true);
        const pillarInfo = res.data.pillar ? ` [${res.data.pillar}]` : "";
        setFeedback({
          type: "success",
          message: `✨ Publicação inédita gerada com IA${pillarInfo}! Os campos e a imagem de capa foram preenchidos abaixo. Revise e clique em "Postar Agora".`,
        });
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Não foi possível gerar o post com IA.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: "Erro ao comunicar com a IA para criar o post.",
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  /**
   * Opção A: Gerar Imagem com IA condizente com a descrição exata do post e sem repetir fotos anteriores
   */
  const handleGenerateCoverImageWithAi = async () => {
    if (isGeneratingImageAi || isUploadingPhoto || isPending) return;
    setIsGeneratingImageAi(true);
    setImageError(null);
    try {
      const excludeImageUrls = Array.from(
        new Set(
          [
            imageUrl,
            ...sessionImages,
            ...posts.map((p) => p.image_url || ""),
          ].filter(Boolean)
        )
      );

      const res = await generatePostCoverImageAction({
        title: title || (isAutomotive ? "Revisão Preventiva Automotiva" : "Serviço Especializado"),
        content,
        niche: tenantNiche,
        excludeImageUrls,
      });

      if (res.success && res.imageUrl) {
        setImageUrl(res.imageUrl);
        setSessionImages((prev) =>
          Array.from(new Set([...prev, res.imageUrl!]))
        );
        setFeedback({
          type: "success",
          message:
            "✨ Nova imagem ilustrativa gerada com IA e aplicada na capa com sucesso!",
        });
      } else {
        setImageError(res.error || "Não foi possível gerar a imagem com IA.");
      }
    } catch (err) {
      setImageError("Erro ao gerar imagem ilustrativa com IA.");
    } finally {
      setIsGeneratingImageAi(false);
    }
  };

  /**
   * Opções B e C: Tirar Foto (Câmera) ou Escolher da Galeria
   * Comprime via Canvas (máx 1280px, qualidade 0.75 WebP/JPEG) e faz upload direto
   * para o bucket `establishment-photos` na pasta `posts/`.
   */
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Selecione um arquivo de imagem válido (JPG, PNG ou WebP).");
      return;
    }

    setImageError(null);
    setIsUploadingPhoto(true);

    try {
      // 1. Compressão client-side via Canvas (máx 1280px largura, qualidade 0.75 WebP/JPEG)
      const { blob, ext, mimeType } = await compressImageViaCanvas(file, 1280, 0.75);
      const randomHash = Math.random().toString(36).substring(2, 8);
      const safeTenant = (tenantId || slug || "tenant").replace(/[^a-zA-Z0-9_-]/g, "_");
      const filePath = `posts/${safeTenant}-${Date.now()}-${randomHash}.${ext}`;

      const compressedFile = new File([blob], `post-cover.${ext}`, {
        type: mimeType,
      });

      // 2. Tenta upload direto para o bucket `establishment-photos` na pasta `posts/`
      const supabase = createClient();
      const { error: clientUploadError } = await supabase.storage
        .from("establishment-photos")
        .upload(filePath, compressedFile, {
          contentType: mimeType,
          cacheControl: "3600",
          upsert: true,
        });

      if (!clientUploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("establishment-photos").getPublicUrl(filePath);

        if (publicUrl) {
          setImageUrl(publicUrl);
          return;
        }
      }

      // 3. Fallback via Server Action autenticada (salva em `establishment-photos` -> `posts/`)
      const uploadForm = new FormData();
      uploadForm.append("file", compressedFile);
      const serverRes = await uploadPostCoverPhotoAction(uploadForm);

      if (serverRes.success && serverRes.imageUrl) {
        setImageUrl(serverRes.imageUrl);
      } else {
        setImageError(
          serverRes.error ||
            clientUploadError?.message ||
            "Não foi possível enviar a foto para o armazenamento."
        );
      }
    } catch (err: any) {
      console.error("[PostsManager] Erro ao comprimir/enviar foto:", err);
      setImageError(err?.message || "Erro ao processar e enviar a foto.");
    } finally {
      setIsUploadingPhoto(false);
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImageError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending || isGeneratingAi) return;
    setFeedback(null);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("content", content);
    formData.set("imageUrl", imageUrl);
    formData.set("tags", tags);
    formData.set("metaDescription", metaDescription);
    formData.set("ctaType", ctaType);
    formData.set("ctaLabel", ctaLabel);
    formData.set("ctaUrl", ctaUrl);

    const parsedTags = tags
      ? tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];

    startTransition(async () => {
      const res = await createPostAction({}, formData);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setFeedback({
          type: "success",
          message: "Publicação cadastrada e estruturada para indexação no Google!",
        });
        setPosts([
          {
            id: String(Date.now()),
            tenant_id: "",
            title,
            content,
            image_url: imageUrl || null,
            tags: parsedTags,
            meta_description: metaDescription || null,
            cta_type: ctaType,
            cta_label: ctaLabel,
            cta_url: ctaUrl || null,
            is_active: true,
            published_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...posts,
        ]);
        setTitle("");
        setContent("");
        setImageUrl("");
        setTags("");
        setMetaDescription("");
        setCtaType("booking");
        setCtaLabel("Agendar Horário");
        setCtaUrl("");
        setIsAdding(false);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Deseja realmente remover esta publicação?")) return;
    setDeletingId(id);

    startTransition(async () => {
      const res = await deletePostAction(id);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setPosts(posts.filter((p) => p.id !== id));
        setFeedback({
          type: "success",
          message: "Publicação excluída com sucesso.",
        });
      }
      setDeletingId(null);
    });
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await togglePostStatusAction(id, currentStatus);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setPosts(
          posts.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p))
        );
      }
    });
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header com Botões de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-600/20">
            <Globe className="h-3.5 w-3.5" />
            <span>Módulo de Posts & SEO Local</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Posts, Artigos & Novidades (SEO)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Publique novidades, dicas e avisos sobre seus serviços. Cada post gera metadados ricos (Schema.org) para ranqueamento nas buscas do Google na sua cidade.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Botão de Criação com IA com Estilo Padronizado e Proteção contra Duplo Clique */}
          <button
            type="button"
            onClick={handleGenerateAiPost}
            disabled={isGeneratingAi || isPending}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Criando Post com IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Criar Post Semanal com IA</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-900 transition"
          >
            <Plus className="h-4 w-4" />
            <span>{isAdding ? "Fechar Formulário" : "Nova Publicação Manual"}</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-start gap-2.5 rounded-xl p-4 text-xs sm:text-sm border ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Sugestões Rápidas de Publicação Otimizadas para SEO */}
      {!isAdding && (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-purple-50/50 via-teal-50/40 to-slate-50/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Modelos de Publicação com SEO Local (1 Clique)
              </h3>
            </div>
            <button
              type="button"
              onClick={handleGenerateAiPost}
              disabled={isGeneratingAi || isPending}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 underline flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Gerando com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Gerar Post Automático com IA</span>
                </>
              )}
            </button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {isAutomotive ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      title: "🔧 Troca de Óleo e Filtros: Evite o Desgaste Prematuro do Motor",
                      content:
                        "Manter o óleo lubrificante e os filtros em dia é essencial para proteger o motor contra superaquecimento e formação de borra. Traga seu veículo para uma avaliação preventiva rápida com nossa equipe.",
                      tags: "troca de óleo, filtro de óleo, revisão preventiva, oficina mecânica, manutenção automotiva",
                      metaDescription:
                        "Saiba quando realizar a troca de óleo e filtros do seu carro e proteja o motor contra desgaste prematuro.",
                      ctaType: "whatsapp",
                      ctaLabel: "Solicitar Orçamento no WhatsApp",
                      imageUrl:
                        "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1200&auto=format&fit=crop&q=80",
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-teal-400 hover:shadow-xs transition"
                >
                  <p className="text-xs font-bold text-slate-900">🔧 Dica de Troca de Óleo</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    Alerta preventivo sobre lubrificação do motor com chamada para orçamento.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      title: "🛑 Barulho ao Frear ou Pedal Baixo? Confira o Sistema de Freios",
                      content:
                        "Chiados nas rodas, trepidação no volante ao frear ou pedal fundo são sinais claros de desgaste nas pastilhas e discos de freio. Faça um check-up de segurança antes de pegar a estrada.",
                      tags: "freios, pastilha de freio, disco de freio, revisão de segurança, mecânica automotiva",
                      metaDescription:
                        "Identifique os sinais de desgaste nas pastilhas e discos de freio e agende uma revisão de segurança.",
                      ctaType: "whatsapp",
                      ctaLabel: "Avaliar Freios Agora",
                      imageUrl:
                        "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&auto=format&fit=crop&q=80",
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-teal-400 hover:shadow-xs transition"
                >
                  <p className="text-xs font-bold text-slate-900">🛑 Alerta de Freios & Suspensão</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    Post educativo sobre segurança veicular com botão direto para WhatsApp.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      title: "🚗 Revisão Preventiva Completa: Viaje com Tranquilidade",
                      content:
                        "Vai viajar ou atingir a quilometragem de revisão? Realizamos diagnóstico computadorizado de injeção, suspensão, bateria, arrefecimento e ar-condicionado automotivo com transparência total.",
                      tags: "revisão preventiva, check-up automotivo, suspensão, alinhamento, injeção eletrônica",
                      metaDescription:
                        "Revisão preventiva completa com diagnóstico eletrônico, freios, suspensão e arrefecimento.",
                      ctaType: "whatsapp",
                      ctaLabel: "Agendar Revisão pelo WhatsApp",
                      imageUrl:
                        "https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=1200&auto=format&fit=crop&q=80",
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-teal-400 hover:shadow-xs transition"
                >
                  <p className="text-xs font-bold text-slate-900">🚗 Revisão Preventiva</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    Chamada para check-up completo e orçamento rápido por placa ou WhatsApp.
                  </p>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      title: "🎉 Condição Especial de Boas-Vindas: 15% OFF",
                      content:
                        "Agende seu primeiro atendimento online e garanta 15% de desconto especial. Vagas limitadas para horários agendados nesta semana.",
                      tags: "desconto, boas vindas, agendamento online, promoção local, atendimento de excelência",
                      metaDescription:
                        "Ganhe 15% OFF no seu primeiro atendimento agendado online. Atendimento de excelência e pontualidade.",
                      ctaType: "booking",
                      ctaLabel: "Agendar com Desconto",
                      imageUrl:
                        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-teal-400 hover:shadow-xs transition"
                >
                  <p className="text-xs font-bold text-slate-900">🎉 Oferta de Boas-Vindas</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    Post promocional com chamada para agendamento online e palavras-chave de conversão.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      title: "✨ Novos Serviços & Procedimentos Especializados",
                      content:
                        "Atualizamos nosso catálogo com técnicas modernas e produtos de altíssimo padrão para garantir a melhor experiência e resultado impecável.",
                      tags: "novos serviços, qualidade premium, catálogo atualizado, atendimento, procedimentos",
                      metaDescription:
                        "Conheça as novas opções de serviços e tratamentos disponíveis com produtos e técnicas modernas.",
                      ctaType: "booking",
                      ctaLabel: "Conhecer Serviços",
                      imageUrl:
                        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80",
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-teal-400 hover:shadow-xs transition"
                >
                  <p className="text-xs font-bold text-slate-900">✨ Lançamento de Serviços</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    Aviso de novidades no catálogo com chamada para agendamento.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      title: "⏰ Atendimento aos Finais de Semana & Dúvidas Rápidas",
                      content:
                        "Consulte nossos horários especiais de atendimento e tire dúvidas diretamente com nossa equipe no WhatsApp para reservar seu horário com conforto.",
                      tags: "horario de atendimento, agendamento de sabado, whatsapp direto, tirar duvidas",
                      metaDescription:
                        "Informações sobre horários de atendimento, agendamento aos finais de semana e contato WhatsApp.",
                      ctaType: "whatsapp",
                      ctaLabel: "Falar no WhatsApp",
                      imageUrl:
                        "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80",
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-teal-400 hover:shadow-xs transition"
                >
                  <p className="text-xs font-bold text-slate-900">⏰ Comunicado & WhatsApp</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                    Informações de atendimento com botão direto para WhatsApp.
                  </p>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Formulário de Criação com Suporte a SEO */}
      {isAdding && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border-2 border-indigo-500/30 bg-white p-6 sm:p-7 shadow-sm space-y-5"
        >
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Publicação Otimizada para SEO Local</span>
                <span className="text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                  Schema.org JSON-LD
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Esta novidade aparecerá na vitrine pública e nos snippets indexados no Google.
              </p>
            </div>

            {/* Botão de Preenchimento com IA direto no Formulário */}
            <button
              type="button"
              onClick={handleGenerateAiPost}
              disabled={isGeneratingAi || isPending}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Criando Post...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Preencher Campos com IA</span>
                </>
              )}
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Título */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Título do Artigo / Publicação *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  isAutomotive
                    ? "Ex: 5 Sinais de que o Freio do seu Carro Precisa de Revisão"
                    : "Ex: Dicas de Cuidados, Promoção da Semana ou Lançamento de Serviço"
                }
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            {/* Conteúdo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Conteúdo da Publicação / Artigo *
              </label>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Descreva a novidade, dicas especializadas ou a oferta com clareza..."
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white p-3 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Tags de SEO Local */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-indigo-700" />
                <span>Palavras-chave de SEO Local (Separadas por vírgula)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={
                  isAutomotive
                    ? "Ex: revisão automotiva, troca de óleo, freios, suspensão, oficina mecânica"
                    : "Ex: corte degradê, são paulo, estética, horário marcado, promoção"
                }
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Termos que seus clientes buscam no Google para encontrar seu estabelecimento na região.
              </p>
            </div>

            {/* Meta Descrição */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-indigo-700" />
                <span>Resumo para o Google / Meta Descrição (Opcional)</span>
              </label>
              <input
                type="text"
                maxLength={160}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Breve resumo que aparece abaixo do link no Google (até 160 caracteres)"
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            {/* FOTO DE CAPA / BANNER ILUSTRATIVO (3 OPÇÕES: IA, CÂMERA, GALERIA) */}
            <div className="sm:col-span-2 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
              <input type="hidden" name="imageUrl" value={imageUrl} />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                    Foto de Capa / Banner Ilustrativo (Opcional)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gere uma arte ilustrativa com IA, tire uma foto na hora pela câmera ou escolha da galeria (compressão inteligente automática).
                  </p>
                </div>
              </div>

              {/* Grade com as 3 opções claras */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* A) BOTÃO "Gerar Imagem com IA" */}
                <button
                  type="button"
                  onClick={handleGenerateCoverImageWithAi}
                  disabled={isGeneratingImageAi || isUploadingPhoto || isPending}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-3 text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isGeneratingImageAi ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Gerando Imagem...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      <span>Gerar Imagem com IA</span>
                    </>
                  )}
                </button>

                {/* B) BOTÃO "Tirar Foto (Câmera)" */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isUploadingPhoto || isGeneratingImageAi || isPending}
                  className="flex items-center justify-center gap-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white px-4 py-3 text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processando Foto...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      <span>Tirar Foto (Câmera)</span>
                    </>
                  )}
                </button>

                {/* C) BOTÃO "Escolher da Galeria" */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isUploadingPhoto || isGeneratingImageAi || isPending}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 px-4 py-3 text-xs font-bold shadow-2xs transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ImageIcon className="h-4 w-4 text-indigo-600" />
                  <span>Escolher da Galeria</span>
                </button>
              </div>

              {/* Inputs ocultos de Câmera e Galeria */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                id="camera-input"
                className="hidden"
                onChange={handlePhotoFileChange}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                id="gallery-input"
                className="hidden"
                onChange={handlePhotoFileChange}
              />

              {/* Alerta de erro de imagem */}
              {imageError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{imageError}</span>
                </div>
              )}

              {/* Preview imediato da imagem carregada com botão para remover/trocar */}
              {imageUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative aspect-16/9 w-full sm:w-48 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={title || "Preview da capa do post"}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2 w-full">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>Foto de capa pronta para publicação</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate font-mono">
                        {imageUrl}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleGenerateCoverImageWithAi}
                          disabled={isGeneratingImageAi || isUploadingPhoto}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 px-2.5 py-1.5 text-[11px] font-bold transition"
                        >
                          <RefreshCw className={`h-3 w-3 ${isGeneratingImageAi ? "animate-spin" : ""}`} />
                          <span>Trocar com IA</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          disabled={isUploadingPhoto || isGeneratingImageAi}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 text-[11px] font-bold transition"
                        >
                          <ImageIcon className="h-3 w-3" />
                          <span>Trocar Foto</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={isUploadingPhoto || isGeneratingImageAi}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 px-2.5 py-1.5 text-[11px] font-bold transition"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Remover Imagem</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-4 text-center text-xs text-slate-500">
                  Nenhuma imagem selecionada. Use um dos 3 botões acima para gerar com IA, tirar uma foto com a câmera ou escolher da galeria.
                </div>
              )}
            </div>

            {/* Tipo de Chamada para Ação */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Ação do Botão (CTA)
              </label>
              <select
                value={ctaType}
                onChange={(e) => {
                  const val = e.target.value as "booking" | "whatsapp" | "link";
                  setCtaType(val);
                  if (val === "booking") setCtaLabel("Agendar Horário Online");
                  if (val === "whatsapp") setCtaLabel("Chamar no WhatsApp");
                  if (val === "link") setCtaLabel("Saiba Mais");
                }}
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
              >
                <option value="booking">📅 Abrir Agendamento Online</option>
                <option value="whatsapp">💬 Iniciar Conversa no WhatsApp</option>
                <option value="link">🔗 Abrir Link Externo</option>
              </select>
            </div>

            {/* Rótulo do Botão */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Texto do Botão
              </label>
              <input
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Ex: Agendar Horário"
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            {/* URL Externa (se ctaType === link) */}
            {ctaType === "link" && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Link de Destino
                </label>
                <input
                  type="url"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="Ex: https://instagram.com/seu-perfil"
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending || isGeneratingAi}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-teal-900 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Postando no site & SEO...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Postar Agora</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Lista de Publicações */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">
            Publicações Ativas ({posts.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Exibidas na vitrine pública e indexadas no Google
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <Newspaper className="mx-auto h-8 w-8 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">
              Nenhuma publicação cadastrada no momento.
            </p>
            <div>
              <button
                type="button"
                onClick={handleGenerateAiPost}
                disabled={isGeneratingAi || isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Criando Post com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Criar Primeiro Post com IA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`rounded-2xl border flex flex-col justify-between overflow-hidden transition shadow-2xs ${
                  post.is_active
                    ? "border-slate-200 bg-white"
                    : "border-slate-200 bg-slate-50 opacity-60"
                }`}
              >
                {/* Imagem do Post se houver */}
                {post.image_url && (
                  <div className="relative aspect-16/9 w-full bg-slate-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{formatDate(post.published_at)}</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full ${
                          post.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {post.is_active ? "Ativo" : "Oculto"}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                      {post.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {post.content}
                    </p>

                    {/* Tags de SEO */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        {post.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                          >
                            <Tag className="h-2.5 w-2.5 text-slate-400" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer do Card com CTA e Ações */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg">
                      {post.cta_type === "whatsapp" && <MessageCircle className="h-3 w-3 text-emerald-600" />}
                      {post.cta_type === "booking" && <Calendar className="h-3 w-3 text-teal-600" />}
                      {post.cta_type === "link" && <ExternalLink className="h-3 w-3 text-slate-500" />}
                      <span>{post.cta_label || "Ação"}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggle(post.id, post.is_active)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                        title={post.is_active ? "Ocultar da vitrine" : "Exibir na vitrine"}
                      >
                        {post.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Excluir post"
                      >
                        {deletingId === post.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
