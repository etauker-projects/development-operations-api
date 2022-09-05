echo 'Stopping nginx-proxy container'
echo '---'
docker stop nginx-proxy

echo 'Deleting firewall entry on port 8000'
echo '---'
sudo ufw delete allow 8000