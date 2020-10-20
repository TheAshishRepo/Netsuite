#. /NS-CICD/config.sh.properties
echo  DEPLOY-ALL - $DEPLOY_ALL
echo ${WORKSPACE}
echo ---- ACCESSING NETSUITE ACCOUNT ----

#echo $NS_PASSWORD | /bin/bash $NS_SDFCLI revoketoken -account $NS_ACCOUNT -email $NS_USERNAME -role $NS_ROLE -url $NS_URL
#echo $NS_PASSWORD | /bin/bash $NS_SDFCLI issuetoken -account $NS_ACCOUNT -email $NS_USERNAME -role $NS_ROLE -url $NS_URL
#echo $NS_PASSWORD | /bin/bash ${WORKSPACE}/build/sdfcli.sh revoketoken -account $NS_ACCOUNT -email $NS_USERNAME -role $NS_ROLE -url $NS_URL
#echo $NS_PASSWORD | /bin/bash ${WORKSPACE}/build/sdfcli.sh issuetoken -account $NS_ACCOUNT -email $NS_USERNAME -role $NS_ROLE -url $NS_URL
 echo "saving the token"
/bin/bash ${WORKSPACE}/build/sdfcli.sh savetoken -account $NS_ACCOUNT -email $NS_USERNAME -role $NS_ROLE -url $NS_URL -tokenid $NS_TOKENID -tokensecret $NS_TOKENSECRET


if [ "$DEPLOY_ALL" == "NO" ] 
then
	javac ObjectFileDOMParser.java
	javac DD.java
	echo 'Starting git diff'
	echo 'Source Branch' origin/${ghprbSourceBranch}
	echo 'Target Branch' origin/${ghprbTargetBranch}
	pwd
	echo 'Switching to origin/'${ghprbTargetBranch}
	git checkout -f origin/${ghprbTargetBranch}
	echo 'Merging Source branch ('origin/${ghprbSourceBranch}') into Target branch ('origin/${ghprbTargetBranch}')'
	git merge --no-commit --no-ff ${ghprbSourceBranch}
	echo 'Merged. Looking for conflicts'
	git ls-files -u | awk '{$1=$2=$3=""; print $0}' | awk '{ sub(/^[ \t]+/, ""); print }' | sort -u > conflicts.txt
	if [ -s conflicts.txt ]
		then
			echo 'Conflicts found. Please resolve conflicts prior validation...'
			echo '============================================================='
			echo -e '\n\nConflicting files:\n'
			cat conflicts.txt
			exit 1
		else
			echo 'No Conflicts found'
			git status -s > changes.txt
			sed -i 's/^[^ ]* //' changes.txt
			echo 'Git diff done.'
			echo 'Clean double quotes'
   			sed -i 's/\"//g' changes.txt
    		echo 'Cleaned. Result:'
			cat changes.txt
	fi
	java DD
fi
if [ "$DEPLOY_ALL" == "YES" ]; then
	ls -d */ | sed '/build/d' > folders.txt
fi
pwd
echo ---- VALIDATION BEGINS  ----
file="${WORKSPACE}/folders.txt"

while IFS= read line
do
	echo "Processing folder --> " $line
	cd $line
	/bin/bash ${WORKSPACE}/build/sdfcli.sh validate -account $NS_ACCOUNT -email $NS_USERNAME -p ../$line -role $NS_ROLE -url $NS_URL
	cd ..
done <"$file"
