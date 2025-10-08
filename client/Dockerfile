FROM nginx:1.29.2-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY sites-available/chat.conf /etc/nginx/conf.d/

COPY ./src /var/www/public