#. /opt/bitnami/apps/jenkins/NS-CICD/config.sh.properties

echo  DEPLOY-ALL - $DEPLOY_ALL
pwd
echo ---- ACCESSING NETSUITE ACCOUNT ----

#echo $NS_PASSWORD | $NS_SDFCLI revoketoken -account $NS_ACCOUNT -email $NS_USERNAME -role $NS_ROLE -url $NS_URL
#echo $NS_PASSWORD | $NS_SDFCLI issuetoken -account $NS_ACCOUNT -email $NS_USERNAME -role $NS_ROLE -url $NS_URL
#echo $NS_PASSWORD | /bin/bash ${WORKSPACE}/build/sdfcli.sh revoketoken -account $NS_ACCOUNT -email $NS_USERNAME -role $NS_ROLE -url $NS_URL
#echo $NS_PASSWORD | /bin/bash ${WORKSPACE}/build/sdfcli.sh issuetoken -account $NS_ACCOUNT -email $NS_USERNAME -role $NS_ROLE -url $NS_URL
echo "saving the token"
/bin/bash ${WORKSPACE}/build/sdfcli.sh savetoken -account $NS_ACCOUNT -email $NS_USERNAME -role $NS_ROLE -url $NS_URL -tokenid $NS_TOKENID -tokensecret $NS_TOKENSECRET
if [ "$DEPLOY_ALL" == "NO" ] 
then
	javac ObjectFileDOMParser.java
	javac DD.java
	echo 'Source Branch' origin/${ghprbSourceBranch}
	echo 'Target Branch' origin/${ghprbTargetBranch}
	git checkout -f origin/${ghprbTargetBranch}
	#git diff --name-only HEAD~1 > changes.txt
	git diff --name-only HEAD^ > changes.txt
	cat changes.txt
	java DD
fi

echo ---- DEPLOYMENT BEGINS  ----
file="${WORKSPACE}/folders.txt"

while IFS= read line
do
	echo "Processing folder --> " $line
	cd $line
	echo Yes|/bin/bash ${WORKSPACE}/build/sdfcli.sh deploy -account $NS_ACCOUNT -email $NS_USERNAME -p ../$line -role $NS_ROLE -url $NS_URL -sw
	cd ..
done <"$file"
