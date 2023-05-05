FROM --platform=linux/amd64 ubuntu:22.04

RUN apt-get update && \
    apt-get -y install curl && \
    curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get -y install nodejs && \
    npm install yarn -g

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package.json yarn.lock ./

RUN yarn
# If you are building your code for production
# RUN npm ci --omit=dev

# Bundle app source
COPY . .

RUN chmod +x fbx2gltf/linux/bin/FBX-glTF-conv

EXPOSE 3000

CMD [ "node", "./bin/www" ]
