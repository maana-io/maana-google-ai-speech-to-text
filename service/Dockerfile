FROM node:alpine

WORKDIR /app

COPY package.json /app

RUN npm install
RUN npm build

COPY . /app

ENV GOOGLE_APPLICATION_CREDENTIALS=./google-api-key.json
ENV GCLOUD_PROJECT=Maana-DF-Test

CMD npm start

EXPOSE 8050