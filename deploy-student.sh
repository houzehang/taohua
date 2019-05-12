#! /bin/bash
if [ ! $1 ];then
	echo "usage: bash deploy.sh 1.0.4"
	exit 1;
fi
echo "upload to server."
SERVER=root@101.200.53.74
VERSION=$1
DIR=/var/www/downloadfile/software

scp -P 65522 build/student/*${VERSION}.exe  ${SERVER}:${DIR}
scp -P 65522 build/student/*${VERSION}.exe.blockmap  ${SERVER}:${DIR}
scp -P 65522 build/student/*${VERSION}*.zip  ${SERVER}:${DIR}
scp -P 65522 build/student/*${VERSION}*.dmg  ${SERVER}:${DIR}
scp -P 65522 build/student/*${VERSION}*.dmg.blockmap  ${SERVER}:${DIR}
scp -P 65522 build/student/*.yml  ${SERVER}:${DIR}
scp -P 65522 build/student/*.json ${SERVER}:${DIR}

# echo "upload to old server."
SERVER=root@59.110.14.106
DIR=/usr/share/nginx/html/muwen

scp build/student/*${VERSION}.exe  ${SERVER}:${DIR}
scp build/student/*${VERSION}.exe.blockmap ${SERVER}:${DIR}
scp build/student/*${VERSION}*.zip  ${SERVER}:${DIR}
scp build/student/*${VERSION}*.dmg  ${SERVER}:${DIR}
scp build/student/*${VERSION}*.dmg.blockmap ${SERVER}:${DIR}
scp build/student/*.yml  ${SERVER}:${DIR}
scp build/student/*.json ${SERVER}:${DIR}

echo "deploy done."