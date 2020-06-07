#!/bin/sh
set -e

./build.sh

export DOCKER_BUILDKIT=1
[[ -z "${AWS_ACCESS_KEY_ID}" ]] && AWS_PROFILE="--profile atomicwedgie" || AWS_PROFILE=""
AWS_CMD="aws ${AWS_PROFILE} --region eu-west-1"

docker build -t atomicwedgie .
docker tag atomicwedgie:latest 219044013939.dkr.ecr.eu-west-1.amazonaws.com/atomicwedgie:latest

eval $($AWS_CMD ecr get-login | sed 's|https://||' | sed 's|-e none||')
docker push 219044013939.dkr.ecr.eu-west-1.amazonaws.com/atomicwedgie:latest

TASKS=`${AWS_CMD} ecs list-tasks --cluster atomicwedgie --service atomicwedgie`
if [ `echo $TASKS | jq '.taskArns|length'` -gt "0" ]; then
    echo $TASKS | jq ".taskArns[0]" |
    xargs -I {} $AWS_CMD ecs stop-task --cluster atomicwedgie --task {}
fi

$AWS_CMD ecs run-task \
    --cluster atomicwedgie \
    --count 1 \
    --launch-type EC2 \
    --task-definition atomicwedgie
