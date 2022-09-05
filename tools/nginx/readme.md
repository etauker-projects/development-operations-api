note: to start the server
docker run --name nginx-proxy -p 8000:80 -d -v `pwd`/nginx-mnt/:/etc/nginx --net="host" nginx && docker logs nginx-proxy --follow 

note: expose the port (should verify if this is neede)
sudo ufw allow 8000

note: access the cluster through proxy
$host:8000