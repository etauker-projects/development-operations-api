# instalation
# https://minikube.sigs.k8s.io/docs/start/

# notes on remote access
# https://faun.pub/accessing-a-remote-minikube-from-a-local-computer-fd6180dd66dd


echo 'Configuring minikube cluster'
echo '---'
minikube config set driver docker
minikube addons enable metrics-server
minikube addons enable ingress
minikube addons enable default-storageclass
minikube addons enable storage-provisioner
minikube addons enable dashboard
