#!/bin/bash

if [ -z "$REGISTRY" ]; then
    read -p "Registry URL: " registry
else 
    registry=$REGISTRY
fi

if [ -z "$EMAIL" ]; then
    read -p "Email: " email
else 
    email=$EMAIL
fi

if [ -z "$USERNAME" ]; then
    read -p "Username: " username
else 
    username=$USERNAME
fi

if [ -z "$TOKEN" ]; then
    read -p "Password / Token: " token
else 
    token=$TOKEN
fi

 kubectl create secret docker-registry github-registry \
    --docker-server=$registry \
    --docker-username=$username \
    --docker-password=$token \
    --docker-email=$email

kubectl apply -f deployment.yml
kubectl apply -f service.yml
