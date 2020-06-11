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
BUCKET="atomicwedgie"

gsutil -m rsync -d -r ${SOURCE_DIR} gs://${BUCKET}
gsutil -m setmeta -r -h "Cache-Control:public, max-age=300" "gs://${BUCKET}/**.html"
gsutil -m setmeta -r -h "Cache-Control:public, max-age=300" "gs://${BUCKET}/**.js"
gsutil -m setmeta -r -h "Cache-Control:public, max-age=300" "gs://${BUCKET}/**.js.map"
gsutil -m setmeta -r -h "Cache-Control:public, max-age=300" "gs://${BUCKET}/**.mjs"
gsutil -m setmeta -r -h "Cache-Control:public, max-age=300" "gs://${BUCKET}/**.mjs.map"
gsutil -m setmeta -r -h "Cache-Control:public, max-age=300" "gs://${BUCKET}/**.css"
gsutil -m setmeta -r -h "Cache-Control:public, max-age=3600" "gs://${BUCKET}/**.wav"
gsutil iam ch allUsers:objectViewer gs://${BUCKET}
gsutil web set -m index.html gs://${BUCKET}
