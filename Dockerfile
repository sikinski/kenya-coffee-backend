# Dockerfile
FROM node:20

WORKDIR /backend

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
