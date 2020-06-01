#!/bin/sh
set -e

./build.sh

mkdir -p .deploy/node_modules
cp -pR dist ./.deploy
cp -pR css ./.deploy
cp -pR js ./.deploy
cp -pR img ./.deploy
cp -pR sounds ./.deploy
cp -pR node_modules/tiny-game-engine ./.deploy/node_modules
cp -pR node_modules/shared-state-client ./.deploy/node_modules
cp -pR node_modules/socket.io-client ./.deploy/node_modules
cp -pR node_modules/deep-diff ./.deploy/node_modules
rm -rf ./.deploy/node_modules/*/node_modules
cp -pR ./*.png ./.deploy
cp -pR ./*.ico ./.deploy
cp -pR ./*.html ./.deploy

SOURCE_DIR=".deploy"
AWS_S3_BUCKET="atomicwedgie"
DEST_DIR=""

aws --profile atomicwedgie \
    --region eu-west-1 \
    s3 sync ${SOURCE_DIR:-.} s3://${AWS_S3_BUCKET}/${DEST_DIR} \
    --no-progress \
    --acl public-read \
    --delete
