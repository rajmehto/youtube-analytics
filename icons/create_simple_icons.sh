#!/bin/bash

# Create simple colored PNG icons without external dependencies
# Using printf to create minimal PNG files

create_simple_icon() {
    size=$1
    output=$2
    
    # Simple approach - copy the 16px and it will work (Chrome accepts any size)
    # Or create a simple colored square
    
    if command -v sips > /dev/null 2>&1; then
        # macOS has sips - use it to resize
        sips -z $size $size icon16.png --out $output 2>/dev/null
        echo "Created $output using sips"
    else
        # Fallback - just copy the file (Chrome will scale it)
        cp icon16.png $output
        echo "Created $output (copied from icon16)"
    fi
}

create_simple_icon 48 icon48.png
create_simple_icon 128 icon128.png

echo "All icons created!"
ls -lh *.png
