# assumes the script to be run from root directory

echo 'Starting minikube cluster'
echo '---'
minikube start

# # TODO: find out why this needs a password
# # NOTE: until then, tunnel might need to be started manually
# echo 'Starting minikube tunnel'
# echo '---'
# nohup minikube tunnel -c --rootless &> ./tools/minikube/mnt/minikube-tunnel.out &