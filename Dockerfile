FROM node:alpine3.20

WORKDIR /tmp

COPY . .

EXPOSE 3000/tcp

RUN apk update && apk upgrade &&\
    apk add --no-cache openssl curl gcompat iproute2 coreutils tzdata &&\
    apk add --no-cache bash &&\
    npm install &&\
    npx javascript-obfuscator index.js --output indexhx.js \
    --compact true \
    --control-flow-flattening true \
    --control-flow-flattening-threshold 0.75 \
    --dead-code-injection true \
    --dead-code-injection-threshold 0.4 \
    --debug-protection false \
    --disable-console-output false \
    --identifier-names-generator hexadecimal \
    --log false \
    --numbers-to-expressions true \
    --rename-globals false \
    --self-defending true \
    --string-array true \
    --string-array-calls-transform true \
    --string-array-encoding rc4 \
    --string-array-index-shift true \
    --string-array-rotate true \
    --string-array-shuffle true \
    --string-array-wrappers-count 3 \
    --string-array-wrappers-chained-calls true \
    --string-array-wrappers-parameters-max-count 4 \
    --string-array-wrappers-type function \
    --string-array-threshold 0.75 \
    --transform-object-keys true \
    --unicode-escape-sequence false &&\
    chmod +x indexhx.js &&\
    rm -f index.js extract_strings.js find_context.js indexold.js.txt

CMD ["node", "indexhx.js"]
