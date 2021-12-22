#!/bin/bash
#

set -xe

echo "VERCEL_ENV: $VERCEL_ENV"
echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

node -v
npm -v

yarn install

if [[ "$VERCEL_GIT_COMMIT_REF" == "master" ]] ; then
  yarn build
  exit 0
fi

if [[ "$VERCEL_GIT_COMMIT_REF" == "staging" ]] ; then
  yarn build
  exit 0
fi

yarn build:dev

