#!/bin/sh
set -e

./node_modules/.bin/tsc --build

for f in `find dist -name '*.js'`; do
  target=`echo $f | sed -e 's/\\.js/\\.mjs/'`
  echo "converting $f to $target"

  mv $f $target
  sed -i.bak -e "s/from ['\"]\\.\\(.*\\)['\"]/from '\\.\\1.mjs'/g" $target
done
rm dist/*.bak

echo "built happily 🐶"
