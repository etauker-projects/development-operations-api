# instalation
# https://minikube.sigs.k8s.io/docs/start/


echo 'Setting up clusters'
echo '---'
minikube kubectl -- config --kubeconfig=tools/minikube/scripts/resources/config.yaml set-cluster production --server=http://localhost --certificate-authority=fake-ca-file

