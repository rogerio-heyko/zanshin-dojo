# Usa a imagem estável do Node
FROM node:20-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências primeiro (otimiza o cache)
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código fonte
COPY . .

# Expõe a porta padrão do Vite
EXPOSE 5173

# Comando para rodar em modo desenvolvimento
# O flag --host é vital para o Docker conseguir acessar o server
CMD ["npm", "run", "dev", "--", "--host"]
