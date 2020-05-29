FROM node:14.3.0-stretch-slim
RUN apt-get update
RUN apt-get --assume-yes install git
WORKDIR '/usr/atomicwedgie'
COPY package.json .
COPY package-lock.json .
RUN npm ci --production
COPY .env .
COPY dist ./dist
EXPOSE 8888
ENTRYPOINT ["node","dist/index.mjs"]
