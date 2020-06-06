#!/bin/sh
set -e

./build.sh

mkdir -p .deploy/node_modules
cp -pR dist ./.deploy
cp -pR css ./.deploy
cp -pR img ./.deploy
cp -pR sounds ./.deploy
cp -pR node_modules/tiny-game-engine ./.deploy/node_modules
cp -pR node_modules/shared-state-client ./.deploy/node_modules
cp -pR node_modules/socket.io-client ./.deploy/node_modules
rm -rf ./.deploy/node_modules/*/node_modules
cp -pR ./*.png ./.deploy
cp -pR ./*.ico ./.deploy
cp -pR ./*.html ./.deploy

SOURCE_DIR=".deploy"
AWS_S3_BUCKET="atomicwedgie"
AWS_REGION="eu-west-1"
DEST_DIR=""

[[ -z "${AWS_ACCESS_KEY_ID}" ]] && AWS_PROFILE="--profile atomicwedgie" || AWS_PROFILE=""

aws ${AWS_PROFILE} \
    --region ${AWS_REGION} \
    s3 sync ${SOURCE_DIR:-.} s3://${AWS_S3_BUCKET}/${DEST_DIR} \
    --no-progress \
    --acl public-read \
    --delete
