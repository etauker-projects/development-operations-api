# instalation
# https://minikube.sigs.k8s.io/docs/start/


# configuration
minikube config set driver docker
minikube addons enable metrics-server
minikube addons enable dashboard
minikube addons enable ingress
minikube addons enable default-storageclass
minikube addons enable storage-provisioner

# start the tunnel
nohup minikube tunnel -c --rootless &> ./tools/minikube/mnt/minikube-tunnel.out &