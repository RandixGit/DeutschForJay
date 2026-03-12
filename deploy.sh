#!/bin/bash
# DeutschForJay — Deploy to Synology
#
# Before running: make sure the Synology share is mounted in Finder
#   Go → Connect to Server → smb://NAS007._smb._tcp.local
#   Then mount the "web" share
#
# Usage: ./deploy.sh

MOUNT_PATH="/Volumes/web/GermanTutor"

if [ ! -d "$MOUNT_PATH" ]; then
  echo "ERROR: Synology share not mounted at $MOUNT_PATH"
  echo ""
  echo "In Finder: Go → Connect to Server → smb://NAS007._smb._tcp.local"
  echo "Then mount the 'web' share and re-run this script."
  exit 1
fi

echo "🔨 Building..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Fix errors above and try again."
  exit 1
fi

echo "🚀 Deploying to $MOUNT_PATH ..."
rsync -av --delete dist/ "$MOUNT_PATH/"

echo ""
echo "✅ Done! Open https://randix.synology.me/GermanTutor/ in your browser"
