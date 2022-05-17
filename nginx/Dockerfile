FROM public.ecr.aws/nginx/nginx:1.21

COPY nginx/nodejs-hostname.sh /docker-entrypoint.d/nodejs-hostname.sh
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY static/. /usr/share/nginx/html
RUN mkdir -p /data/nginx/cache
RUN mkdir -p /etc/nginx/logs
RUN ln -sf /dev/stderr /etc/nginx/logs/error.log

EXPOSE 443
