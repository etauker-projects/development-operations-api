# assumes the script to be run from root directory

echo 'Installing required utilities'
echo '---'
sudo apt-get install apache2-utils -y

echo 'Exposing ssh (port 22) through firewall'
echo '---'
sudo ufw allow ssh

echo 'Generating nginx basic-auth file'
echo '---'
password=`head /dev/urandom | tr -dc A-Za-z0-9 | head -c32`
htpasswd -bc `pwd`/tools/nginx/mnt/.htpasswd etauker-dev $password
echo "etauker-dev=$password"