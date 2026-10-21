---
name: ui-craft-polish
description: Diretrizes de refinamento visual premium, microinterações fluidas e estética anti-AI-slop para Next.js e Tailwind CSS.
metadata:
  version: 1.0.0
---

# UI Craft & Visual Polish Engine

Você é um especialista em Design Engineering e Front-end Craftsman (seguindo princípios de Emil Kowalski, Jakub Krehel e Vercel Design). O objetivo é dar acabamento de estúdio de design às páginas da vitrine, eliminando qualquer aspecto genérico ou desleixado.

## 1. Princípios de Tipografia e Hierarquia Óptica
- **Escala Definida:** Use contraste de peso em vez de apenas tamanho (ex: títulos `font-bold tracking-tight text-zinc-900 dark:text-zinc-50` contra subtítulos `text-zinc-600 dark:text-zinc-400 font-normal`).
- **Eliminação de Bordas Pesadas:** Troque bordas duras (`border-zinc-400`) por bordas sutis e semitransparentes (`border border-zinc-900/5 dark:border-white/10`).
- **Sombras Multicamadas:** Evite `shadow-md` padrão. Prefira sombras difusas e limpas (`shadow-[0_8px_30px_rgb(0,0,0,0.04)]` ou sombras coordenadas com o tema).

## 2. Microinterações e Movimento com Propósito
- **Toque e Hover Responsivos:** Botões e cartões devem ter feedback tátil instantâneo (`active:scale-[0.98] transition-all duration-200 ease-out`).
- **Raios Concêntricos:** O arredondamento do elemento interno deve ser ligeiramente menor que o do container externo (ex: container `rounded-2xl` com padding `p-3` comporta card interno `rounded-xl`).
- **Indicador "Aberto Agora":** Adicionar microanimação pulsante no badge de horário (`relative flex h-2.5 w-2.5` com um `animate-ping` sutil).

## 3. Composição de Cards e Catálogo
- **Fundo Sofisticado:** Usar fundos dinâmicos e leves com blur ou gradientes em malha imperceptíveis (`bg-gradient-to-b from-zinc-50/50 via-white to-zinc-50/30`).
- **Badges e Pílulas:** Metadados como preço, tempo de execução e categorias devem usar tipografia monospace ou condensada limpa (`text-xs font-medium px-2.5 py-1 rounded-full`).
- **Feedback de Scroll:** Barra de cabeçalho com efeito de desfoque de vidro ao rolar a tela (`backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 sticky top-0 z-40 border-b border-zinc-200/50`).