# assumes the script to be run from root directory

echo 'Stopping docker daemon'
echo '---'
systemctl stop docker
systemctl stop docker.socket
