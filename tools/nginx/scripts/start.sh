# assumes the script to be run from root directory
cd ./tools/nginx

echo 'Dynamically generating minikube.conf file'
echo '---'
cat <<EOF > `echo $(pwd)/mnt`/conf.d/minikube.conf
server {

    listen       8443;

    auth_basic "Administrator’s Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
  
    location / {
        proxy_pass https://`minikube ip`:8443;
        proxy_ssl_certificate /etc/nginx/certs/minikube-client.crt;
        proxy_ssl_certificate_key /etc/nginx/certs/minikube-client.key;
    }
}
EOF

echo 'Starting nginx-proxy container'
echo '---'
docker run \
  --name nginx-proxy \
  -p 8011:80 \
  -p 8443:8443 \
  -d \
  -v `pwd`/mnt/.htpasswd:/etc/nginx/.htpasswd \
  -v `pwd`/mnt/nginx.conf:/etc/nginx/nginx.conf \
  -v `pwd`/mnt/conf.d/:/etc/nginx/conf.d \
  -v `pwd`/mnt/logs:/var/log/nginx \
  -v /home/etauker/.minikube/profiles/minikube/client.key:/etc/nginx/certs/minikube-client.key \
  -v /home/etauker/.minikube/profiles/minikube/client.crt:/etc/nginx/certs/minikube-client.crt \
  --net="host" \
  --rm nginx

echo 'Exposing ports through firewall'
echo '---'
sudo ufw allow 8011
sudo ufw allow 8443

# http://localhost:8000/#/workloads?namespace=default - outside server
# http://dev.etauker.ie/#/workloads?namespace=default - inside server
# http://localhost:8443 - outside server
