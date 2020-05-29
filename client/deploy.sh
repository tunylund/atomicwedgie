#!/bin/sh
set -e

./build.sh

SOURCE_DIR=".deploy"
AWS_S3_BUCKET="atomicwedgie"
DEST_DIR=""

aws --profile atomicwedgie \
    --region eu-west-1 \
    s3 sync ${SOURCE_DIR:-.} s3://${AWS_S3_BUCKET}/${DEST_DIR} \
    --no-progress \
    --acl public-read \
    --delete
