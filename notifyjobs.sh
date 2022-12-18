#!/bin/zsh
# this script will read the jobs.json file and send a notification the user 
# for each job in the file
file=$(cat jobs.json)
# using sed to remove the first and last line of the json file
jobs=$(echo $file | /opt/homebrew/bin/jq '.[]')
title_tmp=$(echo $jobs | /opt/homebrew/bin/jq '.title')
posted_tmp=$(echo $jobs | /opt/homebrew/bin/jq '.posted')
type_tmp=$(echo $jobs | /opt/homebrew/bin/jq '.typeOfJob.type')
budget_tmp=$(echo $jobs | /opt/homebrew/bin/jq '.typeOfJob.budget')
link_tmp=$(echo $jobs | /opt/homebrew/bin/jq '.link')

# store the titles in an array
titles=($(echo "$title_tmp" | sed "s/ /-/g"))
posted=($(echo "$posted_tmp" | sed "s/ /-/g"))
types=($(echo "$type_tmp" | sed "s/ /-/g"))
budgets=($(echo "$budget_tmp" | sed "s/ /-/g"))
links=($(echo "$link_tmp" | sed "s/ /-/g"))

logo="/Users/wa5ina/Porn/automation/upwork-bot/logo.png"
brave="/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
# get length of an array
titlesLength=${#titles[@]}

for (( i=0; i<${titlesLength}; i++ ));
do 
    # getting each field at a time
    #removing the "-" and "\"" from the title
    title=${titles[$i]}
    title=$(echo $title | sed "s/-/ /g" | sed "s/\"//g")
    posted_each=${posted[$i]}
    posted_each=$(echo $posted_each | sed "s/-/ /g" | sed "s/\"//g")
    type_each=${types[$i]}
    type_each=$(echo $type_each | sed "s/-/ /g" | sed "s/\"//g")
    budget_each=${budgets[$i]}
    budget_each=$(echo $budget_each | sed "s/-/ /g" | sed "s/\"//g")
    link_each=${links[$i]}
    link_each=$(echo $link_each | sed "s/-/ /g" | sed "s/\"//g")
    if [ $i -eq 0 ]; then
        continue
    fi
    answer=$(/Users/wa5ina/bin/alerter.sh  -title "$title" -subtitle "posted: $posted_each " -message "type: $type_each budget: $budget_each" -timeout 10 -actions "open" -sender "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" -appIcon "$logo")
    if [ "$answer" = "open" ]; then
        open -a   "$brave" "$link_each"
    fi
    sleep 3

done

 
echo "" > jobs.json