rm -f chickenonaline-js13k.zip

echo "minifying..."
uglifyjs js/*.js -o col.js -m -c --topleve

echo "zipping..."
zip chickenonaline-js13k.zip index.html col.js fav.gif

echo "zip file:"
ls -lh chickenonaline-js13k.zip
