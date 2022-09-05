# assumes the script to be run from root directory
cd ./tools/nginx

# TODO: move to docker compose
docker run \
  --name nginx-proxy \
  -p 8000:80 \
  -d \
  -v `pwd`/mnt/:/etc/nginx \
  --net="host" \
  --rm nginx

  # http://localhost:8000/#/workloads?namespace=default - outside service
  # http://dev.etauker.ie/#/workloads?namespace=default - inside server