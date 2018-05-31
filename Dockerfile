FROM node:8.11.2-alpine

RUN apk add --no-cache --virtual .build-deps \
    && apk --no-cache add python py-pip py-setuptools \
    && apk add --no-cache --virtual .build-deps \
    zip \
    alpine-sdk \
    binutils-gold \
    curl \
    g++ \
    gcc \
    gnupg \
    libgcc \
    linux-headers \
    make \
    python

RUN apk add --update alpine-sdk
RUN pip --no-cache-dir install awscli

CMD [ "node" ]
