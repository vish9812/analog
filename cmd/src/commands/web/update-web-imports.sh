#!/bin/bash

# This script updates the import statements in index.ts based on the
# hashed filenames found in the dist/assets directory.

# Navigate to the script's directory to ensure relative paths work correctly
cd "$(dirname "$0")"

# Define the target TypeScript file
ts_file="index.ts"
dist_dir="dist"
assets_dir="$dist_dir/assets"

# Find the asset files - assuming only one of each type exists
# Error handling added in case files are not found
css_file=$(find "$assets_dir" -name 'index-*.css' -print -quit)
js_file=$(find "$assets_dir" -name 'index-*.js' -print -quit)
ico_file=$(find "$assets_dir" -name 'favicon-*.ico' -print -quit)

# Check if files were found
if [ -z "$css_file" ] || [ -z "$js_file" ] || [ -z "$ico_file" ]; then
  echo "Error: One or more asset files (CSS, JS, ICO) not found in $assets_dir"
  exit 1
fi

# Extract just the filenames
css_basename=$(basename "$css_file")
js_basename=$(basename "$js_file")
ico_basename=$(basename "$ico_file")

# Construct the new import statements with comments
# Using ./ prefix to match the original style
start_comment='// --- BEGIN GENERATED IMPORTS - DO NOT EDIT MANUALLY ---'
import_html='import fileIndexHtml from "./dist/index.html" with { type: "file" };'
import_css="import fileIndexCss from \"./$assets_dir/$css_basename\" with { type: \"file\" };"
import_js="import fileIndexJs from \"./$assets_dir/$js_basename\" with { type: \"file\" };"
import_ico="import fileFavicon from \"./$assets_dir/$ico_basename\" with { type: \"file\" };"
end_comment='// --- END GENERATED IMPORTS ---'

# Use sed to replace the block of imports (lines 1 to 4) and add comments
# We use a temporary file for compatibility, especially on macOS sed.
sed -i.bak \
  "1s|.*|$start_comment|; \
   2s|.*|$import_html|; \
   3s|.*|$import_css|; \
   4s|.*|$import_js|; \
   5s|.*|$import_ico|; \
   6s|.*|$end_comment|" \
  "$ts_file"

# Remove the backup file created by sed -i
rm "${ts_file}.bak"

echo "Successfully updated imports in $ts_file"
