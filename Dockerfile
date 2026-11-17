# Une image par microservice : ici, Qualite de l'air.
FROM node:24-slim
WORKDIR /app
COPY package.json ./
COPY urbanhub-air ./urbanhub-air
# La configuration vient de l'environnement, jamais du code.
ENV PORT=8001 BASE_MESURES=/donnees/mesures.db
VOLUME /donnees
EXPOSE 8001
CMD ["node", "urbanhub-air/src/principal.ts"]
