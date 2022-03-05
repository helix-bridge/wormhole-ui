#!/bin/sh

function validate() {
    if [[ $1 =~ ^[a-zA-Z]+$ ]]; then
        echo "$1 is a valid name"
    else
        echo "Invalid name $1"
        exit 1
    fi
}

read -p "Pleash enter an target chain name: "

origin=$REPLY

validate $origin

read -p "Pleash enter an origin chain name: "

target=$REPLY

validate $target

function checkExist() {
    local departure=`echo ${origin:0:1} | tr a-z A-Z`${origin:1}"2"`echo ${target:0:1} | tr a-z A-Z`${target:1}
    local arrival=`echo ${target:0:1} | tr a-z A-Z`${target:1}"2"`echo ${origin:0:1} | tr a-z A-Z`${origin:1}
    local dir=$origin'-'$target
    
    for cur in $(ls ./src/bridges/)
    do
        if [ $cur = $dir ]; then
            echo "\033[31mCreate Failed!\033[0m Bridge $origin <-> $target exist"
            exit 1
        fi
    done
}

function indexFile () {
    echo "export * from './$1';" >> $2
}

function component() {
    echo "
                export function $1() {
                        return <span>$1</span>
                }
    " >> $2'/'$1'.tsx'
}

function indexEmpty() {
    echo "export {};" >> $1'/index.ts'
}

function init() {
    local departure=`echo ${origin:0:1} | tr a-z A-Z`${origin:1}"2"`echo ${target:0:1} | tr a-z A-Z`${target:1}
    local arrival=`echo ${target:0:1} | tr a-z A-Z`${target:1}"2"`echo ${origin:0:1} | tr a-z A-Z`${origin:1}
    
    local departureRecord=$departure'Record'
    local arrivalRecord=$arrival'Record'
    
    local dir=$origin'-'$target
    local path='./src/bridges/'$dir
    local index=$path'/index.ts'
    
    mkdir $path
    mkdir $path'/config'
    indexEmpty $path'/config'
    mkdir $path'/hooks'
    indexEmpty $path'/hooks'
    mkdir $path'/utils'
    indexEmpty $path'/utils'
    mkdir $path'/providers'
    indexEmpty $path'/providers'
    mkdir $path'/model'
    indexEmpty $path'/model'
    
    component $departure $path
    component $arrival $path
    component $departureRecord $path
    component $arrivalRecord $path
    
    indexFile $departure $index
    indexFile $arrival $index
    indexFile $departureRecord $index
    indexFile $arrivalRecord $index
    
    echo "\033[32mCreate success!\033[0m"
}

checkExist

init
