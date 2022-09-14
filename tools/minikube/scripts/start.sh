# assumes the script to be run from root directory

echo 'Starting minikube cluster'
echo '---'
minikube start

# # TODO: find out why this needs a password
# echo 'Starting minikube tunnel'
# echo '---'
# nohup minikube tunnel -c --rootless &> ./tools/minikube/mnt/minikube-tunnel.out &