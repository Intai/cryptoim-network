#!/bin/sh

if ! getent hosts nodejs >/dev/null 2>&1; then
  echo "\n127.0.0.1 nodejs\n" >> /etc/hosts
fi
