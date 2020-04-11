rm -f chickenonaline-js13k.zip

echo "minifying..."
npx rollup -c rollup.config.js

echo "zipping..."
zip chickenonaline-js13k.zip index.html col.js fav.gif

echo "zip file:"
ls -lh chickenonaline-js13k.zip
