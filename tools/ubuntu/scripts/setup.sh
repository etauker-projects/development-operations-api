# assumes the script to be run from root directory

echo 'Installing required utilities'
echo '---'
sudo apt-get install apache2-utils -y

echo 'Exposing ssh (port 22) through firewall'
echo '---'
sudo ufw allow ssh

echo 'Generating nginx basic-auth file'
echo '---'
# TODO: decide if this should be changed to Ubuntu
htpasswd -c `pwd`/mnt/.htpasswd etauker
