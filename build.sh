#! /bin/bash
if [ -d ./output ];then
	echo "removing output dir"
	rm -rf ./output
fi
TOTAL_STEP=4
TEACHER=false
CONFIG_FILE=./electron-builder-helper.yml

# if [ "$2" = "-teacher" ];then
# 	TEACHER=true
# 	CONFIG_FILE=./electron-builder-teacher.yml
# fi

echo "step(1/${TOTAL_STEP}) compiling files"
# if [ "$3" = "-debug" ];then
# 	echo 'debug mode:线上包，会显示调试窗口'
# 	echo "module.exports = {DEBUG : false,TC_DEBUG : true,TEST : false,TEACHER: ${TEACHER}}" > env.js
# elif [ "$3" = "-xdebug" ];then
# 	echo 'xdebug mode:技术连接本地测试包'
# 	echo "module.exports = {DEBUG : true,TC_DEBUG : true,TEST : false,TEACHER: ${TEACHER}}" > env.js
# elif [ "$3" = "-test" ];then
# 	echo 'test mode:连接测试环境，会显示调试窗口'
# 	echo "module.exports = {DEBUG : false,TC_DEBUG : false,TEST : true,TEACHER: ${TEACHER}}" > env.js
# else
# 	echo "module.exports = {DEBUG : false,TC_DEBUG : false,TEST : false,TEACHER: ${TEACHER}}" > env.js
# fi
npm run build; 
mkdir output
echo "step(2/${TOTAL_STEP}) copy files"
cp -r dist output
cp -r installers output
cp -r config output
cp env.js output
cp main.js output
cp staticserv.js output
cp package.json output


echo "step(3/${TOTAL_STEP}) package bundles"

if [ "$1" = "-mac" -o "$1" = "-all" ];then
	cp -r libs/AgoraSDK/native-mac output/dist/libs/AgoraSDK
	rm -rf output/dist/libs/AgoraSDK/native-win
	echo "packaging for mac platform"
	./node_modules/.bin/build --config $CONFIG_FILE --mac -p always
fi
if [ "$1" = "-win" -o "$1" = "-all" ];then
	cp -r libs/AgoraSDK/native-win output/dist/libs/AgoraSDK
	rm -rf output/dist/libs/AgoraSDK/native-mac
	echo "packaging for windows platform"
	./node_modules/.bin/build --config $CONFIG_FILE --win -p always
fi

echo "step(4/${TOTAL_STEP}) cleaning files"
echo 'module.exports = {DEBUG : true,TC_DEBUG : true,TEST : false,TEACHER : true}' > env.js;
rm -rf ./output