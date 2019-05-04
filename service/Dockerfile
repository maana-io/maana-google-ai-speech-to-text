FROM node:alpine

WORKDIR /app

# ensure early on that API key is present
COPY ./google-api-key.json /app

COPY package.json /app

RUN npm install
RUN npm build

COPY . /app

RUN apk update && apk add bash && apk add python && apk add ffmpeg

ENV GOOGLE_APPLICATION_CREDENTIALS=./google-api-key.json
ENV GCLOUD_PROJECT=Maana-DF-Test

CMD npm start

EXPOSE 8050