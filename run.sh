#!/bin/bash
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
INPUTDIR="/mnt/GoPro/input/DCIM/100GOPRO"
OUTPUTDIR="/mnt/GoPro/output"
SUBJECT="GoPro Log"
SENDER="GoPro Offloader <logs@rhowell.io>"
RECEIVER="Ryan Howell <ryan@rhowell.io>"
TEXT=""
LOCK="/var/run/gopro.lock"
PID="$$"

if [ -f "$LOCK" ]; then
  LOCK_PID=$(cat "$LOCK")
  if [ -n "$LOCK_PID" -a -e /proc/$LOCK_PID ]; then
    echo "Locked" >>"/var/log/gopro-$PID.log" 2>&1
    exit 0
  fi
fi

echo "$PID" > "$LOCK"

if [ ! -d "$OUTPUTDIR" ]; then
  echo "No output dir" >>"/var/log/gopro-$PID.log" 2>&1
  exit 1
fi

rm -f "/var/log/gopro-$PID.log"
echo "Started Bash Script" >>"/var/log/gopro-$PID.log" 2>&1
sleep 10

if [ ! -d "$INPUTDIR" ]; then
  simple-mtpfs --device 1 /mnt/GoPro/input >>"/var/log/gopro-$PID.log" 2>&1
  if [ ! -d "$INPUTDIR" ]; then
    echo "Could not mount GoPro" >>"/var/log/gopro-$PID.log" 2>&1
    exit 3
  fi
fi


node "$DIR/index.js" -g "$INPUTDIR" -o "$OUTPUTDIR" >>"/var/log/gopro-$PID.log" 2>&1
chmod -R 0666 $OUTPUTDIR/*
TEXT=$(cat "/var/log/gopro-$PID.log")
MAIL_TXT="Subject: $SUBJECT\nFrom: $SENDER\nTo: $RECEIVER\n\n$TEXT"
echo -e "$MAIL_TXT" | ssmtp ryan@rhowell.io
echo "Email sent" >>"/var/log/gopro-$PID.log" 2>&1
cat "/var/log/gopro-$PID.log" >> /var/log/gopro.log
sleep 30
poweroff
