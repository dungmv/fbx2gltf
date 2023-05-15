build

```
docker build -t fbx2gltf .
```

run

```
docker run -d -p 8080:3000 -e JWT_TOKEN_SECRET=jwtSecretKey -e CLOUDINARY_CLOUD_NAME=suzuverse-uat -e CLOUDINARY_API_KEY=apikey -e CLOUDINARY_API_SECRET=apisecret --name fbx2gltf fbx2gltf
```

request

```
method: post
endpoint: /convert
Content-Type: form-data
Authorization: accessToken
body: file=@file
```