#!/bin/sh
set -e

CHANGED_FILE=$1
if [ -f "src/${CHANGED_FILE}" ]; then
  ./node_modules/.bin/tsc \
    --target ES2018 \
    --module ES2015 \
    --outDir dist \
    --strict true \
    --moduleResolution node \
    --esModuleInterop true \
    --forceConsistentCasingInFileNames true \
    "src/${CHANGED_FILE}"
else 
  ./node_modules/.bin/tsc --build
fi


for f in `find dist -name '*.js'`; do
  target=`echo $f | sed -e 's/\\.js/\\.mjs/'`
  echo "converting $f to $target"

  mv $f $target
  sed -i.bak -e "s/from ['\"]\\.\\(.*\\)['\"]/from '\\.\\1.mjs'/g" $target
  sed -i.bak -e "s/from ['\"]tiny-game-engine\\(.*\\)['\"]/from '\\.\\.\\/node_modules\\/tiny-game-engine\\1.mjs'/g" $target
  sed -i.bak -e "s/from ['\"]shared-state-client\\(.*\\)['\"]/from '\\.\\.\\/node_modules\\/shared-state-client\\1.mjs'/g" $target
done
rm dist/*.bak

mkdir -p deploy/node_modules
cp -R dist ./deploy
cp -R css ./deploy
cp -R js ./deploy
cp -R img ./deploy
cp -R sounds ./deploy
cp -R node_modules/tiny-game-engine ./deploy/node_modules
cp -R node_modules/shared-state-client ./deploy/node_modules
cp -R node_modules/socket.io-client ./deploy/node_modules
cp -R ./*.png ./deploy
cp -R ./*.ico ./deploy
cp -R ./*.html ./deploy

echo "built happily 🐶"
