FROM --platform=linux/amd64 ubuntu:22.04

RUN apt-get update && \
    apt-get -y install curl && \
    curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get -y install nodejs && \
    npm install yarn -g

# Create app directory
WORKDIR /app

ENV CLOUDINARY_CLOUD_NAME=""\
    CLOUDINARY_API_KEY=""\
    CLOUDINARY_API_SECRET=""\
    JWT_TOKEN_SECRET="123456"

# Install app dependencies
COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

# Bundle app source
COPY . .

RUN chmod +x fbx2gltf/linux/bin/FBX-glTF-conv
RUN rm -rf fbx2gltf/windows fbx2gltf/darwin

EXPOSE 3000

CMD [ "node", "./bin/www" ]
