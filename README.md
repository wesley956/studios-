# Studio+

Studio+ é um micro-SaaS para negócios de beleza com:

- página pública por slug
- solicitação pública de agendamento
- painel da cliente
- painel admin
- Supabase Auth + Postgres
- deploy simples na Vercel

## Stack
- Next.js 15
- TypeScript
- Tailwind CSS
- Supabase

## Configuração
Crie um arquivo `.env.local` com base em `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=SUA_SERVICE_ROLE_KEY
```

## Banco
Rode o conteúdo de:

```txt
supabase/migrations/0001_init.sql
```

no SQL Editor do Supabase.

## Instalação
```bash
npm install
npm run dev
```

## Deploy
1. envie o projeto para o GitHub
2. importe na Vercel
3. configure as variáveis de ambiente
4. faça o deploy

## Primeiro acesso sem SQL manual
Depois do deploy:
1. abra `/setup`
2. crie o primeiro admin
3. faça login em `/auth/login`
4. use `/admin/clientes/novo` para criar as clientes e os negócios completos

## Observação
O painel admin já cria:
- usuário de login da dona do negócio
- perfil `client_owner`
- negócio dentro da plataforma

Então, depois do primeiro admin, o resto do onboarding pode ser feito direto pelo sistema.
