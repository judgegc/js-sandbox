FROM node:9.4
WORKDIR /usr/src/app
COPY package.json ./

RUN npm install
COPY . .
CMD ["node", "--max_old_space_size=250", "src/index.js"]