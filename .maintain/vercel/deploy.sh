#!/bin/bash
#

set -xe

echo "VERCEL_ENV: $VERCEL_ENV"
echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

yarn install

if [[ "$VERCEL_ENV" == "production" ]] ; then
    yarn build
  else
    yarn build:dev
fi

