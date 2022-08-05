# TODO: get from command line if env var not set

 kubectl create secret docker-registry github-registry \
    --docker-server=$REGISTRY \
    --docker-username=$USERNAME \
    --docker-password=$TOKEN \
    --docker-email=$EMAIL

kubectl apply -f deployment.yml
kubectl apply -f service.yml
