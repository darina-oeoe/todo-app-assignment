# build stage
FROM node:14-slim AS build
WORKDIR /app
EXPOSE 80


COPY ./package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/

CMD ["nginx", "-g", "daemon off;"]