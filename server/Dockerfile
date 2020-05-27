FROM node:14.3.0-alpine3.10 as runtime
RUN apk add --update git openssh gcompat libc6-compat
WORKDIR '/usr/atomic-wedgie'
COPY package.json .
COPY package-lock.json .
RUN npm ci --production
COPY dist ./dist
EXPOSE 8888
ENTRYPOINT ["node","dist/index.mjs"]
