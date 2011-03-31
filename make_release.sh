#!/usr/bin/env sh

if [ -z "$1" ]; then
echo "ERROR: need to specify version"
  exit
fi

echo "Release de jQuery SuperBox! $1..."

echo "Minification du script..."

java -jar ../yuicompressor-2.4.2.jar jquery.superbox.js -o jquery.superbox-min.js --type js --line-break 80 -v --charset utf8

sed "1i\\
	/*\\
	 * jQuery SuperBox! $1\\
	 * Copyright (c) 2011 Pierre Bertet (pierrebertet.net)\\
	 * Licensed under the MIT (MIT-LICENSE.txt)\\
	 *\\
	*/\\
" jquery.superbox-min.js > jquery.superbox-min-tmp.js

mv jquery.superbox-min-tmp.js jquery.superbox-min.js

release_dir="./release-$1"

if [ -d $release_dir ]
then
	rm -rf $release_dir
fi

mkdir $release_dir

# Archive

echo "Création de l'archive..."

temp_dir="${release_dir}/jquery-superbox-$1"
mkdir $temp_dir

cp -R ./doc ${temp_dir}/
cp ./jquery.superbox.js $temp_dir
cp ./jquery.superbox-min.js $temp_dir
cp ./jquery.superbox.css $temp_dir
cp ./MIT-LICENSE.txt $temp_dir

cd $release_dir
zip -r jquery-superbox-$1.zip jquery-superbox-$1 > /dev/null 2>&1
rm -rf jquery-superbox-$1


# Website

echo "Création du site web..."

cd ..

www_dir="${release_dir}/www"
mkdir $www_dir

cp -R ./doc/* $www_dir
mv ${www_dir}/english.html ${www_dir}/index.html
cp ./jquery.superbox-min.js $www_dir
cp ./jquery.superbox.css $www_dir

sed -e 's/\.\.\/jquery\.superbox\.js/jquery.superbox-min.js/' ${www_dir}/index.html > ${www_dir}/index-tmp.html
mv ${www_dir}/index-tmp.html ${www_dir}/index.html

sed -e 's/\.\.\/jquery\.superbox\.js/jquery.superbox-min.js/' ${www_dir}/francais.html > ${www_dir}/francais-tmp.html
mv ${www_dir}/francais-tmp.html ${www_dir}/francais.html

sed -e 's/\.\.\/jquery\.superbox\.css/jquery.superbox.css/' ${www_dir}/index.html > ${www_dir}/index-tmp.html
mv ${www_dir}/index-tmp.html ${www_dir}/index.html

sed -e 's/\.\.\/jquery\.superbox\.css/jquery.superbox.css/' ${www_dir}/francais.html > ${www_dir}/francais-tmp.html
mv ${www_dir}/francais-tmp.html ${www_dir}/francais.html


sed -e 's/english\.html/index.html/' ${www_dir}/index.html > ${www_dir}/index-tmp.html
mv ${www_dir}/index-tmp.html ${www_dir}/index.html

sed -e 's/english\.html/index.html/' ${www_dir}/francais.html > ${www_dir}/francais-tmp.html
mv ${www_dir}/francais-tmp.html ${www_dir}/francais.html

echo "Terminé."