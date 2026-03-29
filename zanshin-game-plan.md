# Planejamento: Zanshin - O Último Dojo

Este documento segue as fases "ANALYSIS", "PLANNING", "SOLUTIONING" contidas nas regras "project-planner", extraídas e analisadas a partir de `Manual Zanshin - O último Dojo.pdf`.

O foco é a infraestrutura do React orientada ao OS Linux (Ubuntu) e sua orquestração usando Docker Desktop.

## 1. Fase de Setup (Infraestrutura)
- **Técnica:** Utilização de `Node:20-alpine` mapeando o serviço app em Docker Compose para servir a stack Vite 5173.
- **Hot-Reload Linux:** Acionamento de `CHOKIDAR_USEPOLLING=true` e `usePolling` estrito no Vite.
- **PWA Ready:** Manifest pré-configurado com pacotes vitais. 

## 2. Fase de Lógica Global
- **Motor de Jogo Engine:** React Zustand, `requestAnimationFrame` centralizado, lógica "Ma-ai" de distanciamento e ataque dividida nas zonas de timing.
- **Audio/UX:** Howler.js implementado para os Sound Sprites sem delay; framer-motion configurado pra renderizar animações de tela pesadas via GPU.

## 3. Componentização
- Modularizado em pastas `components/`, `store/`, e `hooks/` focadas em renderizações estritas para não engarrafar framerates locais quando renderizado em Webviews de Mobile ou Desktops limitados limitados. Detalhamento dos estados (HIT, ATTACK, IDLE, MISS).

Para começar a fase de **IMPLEMENTATION** (Fase 4), basta que seja autorizado o kick-off via chat, permitindo a criação do projeto base usando npx e as modificações estruturais no repositório.
