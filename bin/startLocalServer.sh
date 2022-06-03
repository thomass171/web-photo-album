#/bin/sh
#

if [ -z "$1" ]
then
    echo "usage: $0 <dirtoserve>"
    exit 1
fi
python3 bin/httpd.py $1

