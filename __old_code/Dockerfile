FROM keymetrics/pm2:8-alpine
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
ENV GOOGLE_APPLICATION_CREDENTIALS=./Maana-DF-Test-a113c984d08f.json
ENV GCLOUD_PROJECT=Maana-DF-Test
CMD ["pm2-runtime", "src/index.js", "--instances 1", "--web"]
EXPOSE 4000