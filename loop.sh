#!/bin/bash
while [ true ] ; do
   read -n 1
   if [ $? = 0 ] ; then
      clear
      npm run test
      echo "test done"
   else
      echo waiting...
   fi
done