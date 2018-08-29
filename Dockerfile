FROM node:10.5
WORKDIR /usr/src/app
COPY package.json ./

RUN npm install
COPY . .
CMD ["npm", "start"]