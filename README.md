# Winter Arc Tracker

Dashboard interativo para acompanhar o desafio Winter Arc (1º de outubro a 1º de janeiro), com foco em 4 pilares: **Fitness**, **Mente**, **Produtividade** e **Hábitos Diários**.

Construído em HTML/CSS/JS puro, sem frameworks nem backend — todo o progresso é salvo localmente no navegador via `localStorage`.

## Funcionalidades

- Contador regressivo até 1º de janeiro
- 4 pilares com toggle diário e streak counter
- Heatmap dos 92/93 dias do desafio
- Estatísticas: % de conclusão geral, melhor pilar, dias totais completados
- 100% offline, responsivo (mobile, tablet, desktop)

## Rodando localmente

Basta abrir o `index.html` em um navegador, ou servir a pasta com qualquer servidor estático:

```bash
npx serve .
```

## Deploy

O site é publicado automaticamente no GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`) a cada push na branch `main`.

Para habilitar pela primeira vez, em **Settings → Pages** do repositório, defina a fonte ("Source") como **GitHub Actions**.
