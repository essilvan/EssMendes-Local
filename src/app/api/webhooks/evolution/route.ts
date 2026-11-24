import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function extractIncomingText(messageObj: any): string {
  if (!messageObj || typeof messageObj !== "object") return "";
  if (typeof messageObj.conversation === "string") {
    return messageObj.conversation.trim();
  }
  if (typeof messageObj.extendedTextMessage?.text === "string") {
    return messageObj.extendedTextMessage.text.trim();
  }
  if (typeof messageObj.imageMessage?.caption === "string") {
    return messageObj.imageMessage.caption.trim();
  }
  return "";
}

async function generateGeminiSdrReply(params: {
  businessName: string;
  demoSlug: string | null;
  chatHistory: Array<{ role: string; content: string }>;
}): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const demoLink = params.demoSlug
    ? `https://${params.demoSlug}.essmendes.com.br/mesa/01`
    : "https://app.essmendes.com.br";

  const systemInstruction = `Você é o consultor comercial SDR da EssMendes Local conversando pelo WhatsApp com o dono do bar/restaurante "${params.businessName}".
Regras obrigatórias:
- Responda em português brasileiro natural, simpático e direto, com NO MÁXIMO 3 frases curtas.
- Destaque os diferenciais conforme a dúvida do cliente:
  * Não precisa gastar com impressora na cozinha (os pedidos chegam em tempo real no celular/tablet com alerta sonoro e também no WhatsApp do garçom).
  * QR Code na mesa com opção de Conta Única da Mesa ou Comanda Individual por pessoa.
  * Cálculo automático opcional dos 10% do garçom no fechamento da conta.
  * Link direto de avaliação 5 estrelas no Google Meu Negócio enviado no fechamento da conta.
  * Plano Piloto por apenas R$ 89,90/mês com o cadastro completo do cardápio já incluso.
- Prévia pronta do estabelecimento: ${demoLink}
- Sempre finalize conduzindo para ativar o Plano Piloto ou tirar uma dúvida rápida.`;

  const contents = params.chatHistory.slice(-10).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 220,
        },
      }),
    }
  );

  if (!res.ok) return null;
  const json = await res.json();
  const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof reply === "string" && reply.trim() ? reply.trim() : null;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ ok: true, ignored: "empty_payload" });
    }

    const event = String(payload.event || "").toLowerCase();
    if (event && event !== "messages.upsert") {
      return NextResponse.json({ ok: true, ignored: event });
    }

    const data = payload.data || payload;
    const key = data?.key || {};
    const remoteJid = String(key.remoteJid || "");
    const fromMe = Boolean(key.fromMe);

    // Ignorar mensagens enviadas por nós mesmos e grupos
    if (fromMe || !remoteJid || remoteJid.endsWith("@g.us")) {
      return NextResponse.json({ ok: true, ignored: "fromMe_or_group" });
    }

    const incomingText = extractIncomingText(data?.message);
    if (!incomingText) {
      return NextResponse.json({ ok: true, ignored: "no_text" });
    }

    const remoteDigits = remoteJid.split("@")[0].replace(/\D/g, "");
    if (!remoteDigits || remoteDigits.length < 10) {
      return NextResponse.json({ ok: true, ignored: "invalid_phone" });
    }

    const suffix8 = remoteDigits.slice(-8);
    const supabase = createAdminClient();
    const { data: candidates } = await supabase
      .from("prospecting_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    const lead = (candidates || []).find((row: any) => {
      const rowDigits = String(row.phone || "").replace(/\D/g, "");
      return rowDigits.endsWith(suffix8);
    });

    if (!lead) {
      return NextResponse.json({ ok: true, ignored: "lead_not_found" });
    }

    const nowIso = new Date().toISOString();
    const currentHistory: Array<{
      role: string;
      content: string;
      timestamp?: string;
    }> = Array.isArray(lead.chat_history) ? lead.chat_history : [];

    const historyWithUser = [
      ...currentHistory,
      { role: "user", content: incomingText, timestamp: nowIso },
    ];

    const evoUrl = process.env.EVOLUTION_API_URL?.trim().replace(/\/+$/, "");
    const evoKey = process.env.EVOLUTION_API_KEY?.trim();
    const evoInstance = process.env.EVOLUTION_INSTANCE_NAME?.trim();
    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    if (!evoUrl || !evoKey || !evoInstance || !geminiKey) {
      await supabase
        .from("prospecting_leads")
        .update({
          status: "replied",
          last_message_at: nowIso,
          chat_history: historyWithUser,
        })
        .eq("id", lead.id);

      return NextResponse.json({ ok: true, autoReplied: false });
    }

    const replyText = await generateGeminiSdrReply({
      businessName: lead.business_name,
      demoSlug: lead.demo_slug || null,
      chatHistory: historyWithUser,
    });

    if (!replyText) {
      await supabase
        .from("prospecting_leads")
        .update({
          status: "replied",
          last_message_at: nowIso,
          chat_history: historyWithUser,
        })
        .eq("id", lead.id);

      return NextResponse.json({ ok: true, autoReplied: false });
    }

    await fetch(
      `${evoUrl}/message/sendText/${encodeURIComponent(evoInstance)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: evoKey,
        },
        body: JSON.stringify({
          number: remoteDigits,
          text: replyText,
        }),
      }
    );

    const finalHistory = [
      ...historyWithUser,
      {
        role: "assistant",
        content: replyText,
        timestamp: new Date().toISOString(),
      },
    ];

    await supabase
      .from("prospecting_leads")
      .update({
        status: "replied",
        last_message_at: new Date().toISOString(),
        chat_history: finalHistory,
      })
      .eq("id", lead.id);

    return NextResponse.json({ ok: true, autoReplied: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Erro no webhook Evolution." },
      { status: 200 }
    );
  }
}
