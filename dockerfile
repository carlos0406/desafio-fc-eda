FROM node:20

WORKDIR /usr/src/app
COPY . .

RUN yarn install
COPY start.sh .

RUN chmod +x start.sh


ENTRYPOINT [ "./start.sh" ]