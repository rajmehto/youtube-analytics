#!/bin/bash
# Create simple placeholder icons using ImageMagick (if available)
# If ImageMagick is not installed, you'll need to create icons manually

if command -v convert &> /dev/null; then
    echo "Creating icons with ImageMagick..."
    convert -size 16x16 xc:blue -fill white -pointsize 10 -gravity center -annotate +0+0 "YT" icons/icon16.png
    convert -size 48x48 xc:blue -fill white -pointsize 24 -gravity center -annotate +0+0 "YT" icons/icon48.png
    convert -size 128x128 xc:blue -fill white -pointsize 64 -gravity center -annotate +0+0 "YT" icons/icon128.png
    echo "Icons created successfully!"
else
    echo "ImageMagick not found. Creating placeholder text files..."
    echo "Please create icon16.png, icon48.png, and icon128.png manually" > icons/ICONS_NEEDED.txt
    echo "You can use any image editor or online tool to create simple 16x16, 48x48, and 128x128 PNG files"
fi
