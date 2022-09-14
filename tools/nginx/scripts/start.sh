# assumes the script to be run from root directory
cd ./tools/nginx

echo 'Starting nginx-proxy container'
echo '---'
docker run \
  --name nginx-proxy \
  -p 8000:80 \
  -d \
  -v `pwd`/mnt/:/etc/nginx \
  --net="host" \
  --rm nginx

echo 'Exposing port 8000 through firewall'
echo '---'
sudo ufw allow 8000

# http://localhost:8000/#/workloads?namespace=default - outside service
# http://dev.etauker.ie/#/workloads?namespace=default - inside server
