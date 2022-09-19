# instalation
# https://minikube.sigs.k8s.io/docs/start/


echo 'Configuring minikube cluster'
echo '---'
minikube config set driver docker
minikube addons enable metrics-server
minikube addons enable ingress
minikube addons enable default-storageclass
minikube addons enable storage-provisioner
minikube addons enable dashboard
