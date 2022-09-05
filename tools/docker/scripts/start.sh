# assumes the script to be run from root directory

echo 'Starting docker daemon'
echo '---'
systemctl enable docker
systemctl start docker