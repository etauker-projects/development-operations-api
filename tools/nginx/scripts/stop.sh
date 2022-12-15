echo 'Stopping nginx-proxy container'
echo '---'
docker stop nginx-proxy

echo 'Deleting firewall entries'
echo '---'
sudo ufw delete allow 8000
sudo ufw delete allow 8443
# sudo ufw delete allow 8123