FROM node:22.14.0-alpine3.21@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944

WORKDIR /app

# copy only package manifests first for better caching
COPY package.json package-lock.json ./

# install deps
RUN npm install

# copy the rest of your code
COPY . .

# expose Vite’s dev-server port
EXPOSE 5173
CMD ["sh"]