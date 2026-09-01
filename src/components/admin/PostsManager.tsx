"use client";

import React, { useState, useTransition } from "react";
import {
  createPostAction,
  deletePostAction,
  togglePostStatusAction,
} from "@/services/post.actions";
import { generateLocalSeoPost } from "@/services/ai-post.actions";
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
  Tag,
  Globe,
  Search,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface PostsManagerProps {
  initialPosts: TenantPost[];
  slug: string;
}

export function PostsManager({ initialPosts, slug }: PostsManagerProps) {
  const [posts, setPosts] = useState<TenantPost[]>(initialPosts);
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [ctaType, setCtaType] = useState<"booking" | "whatsapp" | "link">("booking");
  const [ctaLabel, setCtaLabel] = useState("Agendar Horário");
  const [ctaUrl, setCtaUrl] = useState("");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    setIsGeneratingAi(true);
    setFeedback(null);
    try {
      const res = await generateLocalSeoPost();
      if (res.success && res.data) {
        setTitle(res.data.title);
        setContent(res.data.content);
        setTags(res.data.tags || "");
        setMetaDescription(res.data.metaDescription || "");
        setCtaType(res.data.ctaType);
        setCtaLabel(res.data.ctaLabel);
        setIsAdding(true);
        setFeedback({
          type: "success",
          message: "✨ Publicação semanal gerada com IA! Os campos foram preenchidos abaixo. Revise e clique em Publicar.",
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

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
          {/* Botão de Criação com IA com Estilo Padronizado */}
          <button
            type="button"
            onClick={handleGenerateAiPost}
            disabled={isGeneratingAi}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all text-sm disabled:opacity-50"
          >
            {isGeneratingAi ? "⏳ Criando Post..." : "✨ Criar Post Semanal com IA"}
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
              disabled={isGeneratingAi}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 underline flex items-center gap-1"
            >
              {isGeneratingAi ? "⏳ Gerando com IA..." : "✨ Gerar Post Automático com IA"}
            </button>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            <button
              type="button"
              onClick={() =>
                handleApplyPreset({
                  title: "🎉 Condição Especial de Boas-Vindas: 15% OFF",
                  content:
                    "Agende seu primeiro atendimento online e garanta 15% de desconto especial. Vagas limitadas para horários agendados nesta semana.",
                  tags: "desconto, boas vindas, agendamento online, promoção local, atendimento de excelência",
                  metaDescription: "Ganhe 15% OFF no seu primeiro atendimento agendado online. Atendimento de excelência e pontualidade.",
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
                  tags: "novos serviços, qualidade premium, catálogo atualizado, estética, procedimentos",
                  metaDescription: "Conheça as novas opções de serviços e tratamentos disponíveis com produtos e técnicas modernas.",
                  ctaType: "booking",
                  ctaLabel: "Conhecer Procedimentos",
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
                  metaDescription: "Informações sobre horários de atendimento, agendamento aos finais de semana e contato WhatsApp.",
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
              disabled={isGeneratingAi}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all text-xs disabled:opacity-50 self-start sm:self-auto"
            >
              {isGeneratingAi ? "⏳ Criando Post..." : "✨ Preencher Campos com IA"}
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
                placeholder="Ex: Dicas de Cuidados, Promoção da Semana ou Lançamento de Procedimento"
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
                placeholder="Ex: corte degradê, são paulo, estética, horário marcado, promoção"
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

            {/* Imagem de Destaque */}
            <div className="sm:col-span-2">
              <ImageUpload
                name="imageUrl"
                value={imageUrl}
                onChange={(url) => setImageUrl(url)}
                label="Foto de Capa / Banner Ilustrativo (Opcional)"
                description="Imagem que acompanha a publicação na vitrine e nos snippets de busca."
                folder="posts"
                aspectRatio="video"
              />
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
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-teal-900 disabled:opacity-60 transition"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publicando no site & SEO...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Publicar Agora</span>
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
                disabled={isGeneratingAi}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-sm transition-all text-xs disabled:opacity-50"
              >
                {isGeneratingAi ? "⏳ Criando Post..." : "✨ Criar Primeiro Post com IA"}
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
