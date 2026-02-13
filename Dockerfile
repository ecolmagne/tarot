# Dockerfile pour le jeu de Tarot

# Utiliser l'image Node.js officielle
FROM node:20-alpine

# Créer le répertoire de l'application
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le reste de l'application
COPY . .

# Exposer le port
EXPOSE 3000

# Variable d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Démarrer l'application
CMD ["node", "server.js"]
