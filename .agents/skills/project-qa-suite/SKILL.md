---
name: project-qa-suite
description: >-
  Use this skill when validating code changes, running full test suites, typechecking with TypeScript, testing database queries, or performing build verification in the EssMendes Local project.
---

# 🧪 Project QA & Test Suite Skill

Esta skill descreve o procedimento de garantia de qualidade (QA), verificação estática de tipos, execução de scripts de teste e validação de build para o projeto EssMendes Local.

---

## 📋 Checklist de Validação Passo a Passo

Antes de considerar qualquer tarefa ou refatoração concluída, execute os seguintes passos:

### 1️⃣ Verificação Estática de Tipos (TypeScript)
Garante que não existem erros de tipagem, imports quebrados ou incompatibilidades com React 19 / Next.js 15:
```bash
npx tsc --noEmit
```
*Critério de Sucesso:* 0 erros emitidos.

---

### 2️⃣ Bateria de Testes Automatizados da Aplicação
Executa os testes de integração com Supabase, integridade de tabelas, perfil, serviços, avaliações e posts:
```bash
node scripts/test_complete_suite.mjs
```
*Critério de Sucesso:* Todos os testes com status `✅ [PASS]`.

---

### 3️⃣ Testes Unitários de Utilitários e Parsers
Valida a lógica pura de parsing de URLs, coordenadas e tratamento de strings:
```bash
node scripts/test_unit_utils.mjs
```
*Critério de Sucesso:* Todos os testes com status `✅ [PASS]`.

---

### 4️⃣ Teste de Build de Produção
Valida se todas as páginas estáticas e dinâmicas (App Router) compilam com sucesso:
```bash
npm run build
```
*Critério de Sucesso:* Compilação bem-sucedida de todas as rotas sem falhas de SSR.

---

## 🛠️ Resolução Rápida de Problemas Comuns

- **Erro em `.env.local`:** Certifique-se de que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão presentes.
- **Falha de tipagem no Next 15 `params`:** No Next.js 15, `params` e `searchParams` em `page.tsx` ou `layout.tsx` são Promises (`await params`).
