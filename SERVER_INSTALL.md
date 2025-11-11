# Connect and update

Follow the guide https://help.ovhcloud.com/csm/fr-dedicated-servers-ssh-introduction?id=kb_article_view&sysparm_article=KB0044339

1. ````ssh root@your_vps_ip````
2. ````apt update && apt upgrade -y````


# Install Docker and Docker Compose

You now have access to your VPS using ssh. You need to install docker and docker compose manually

````curl -fsSL https://get.docker.com | bash````

## Give right to default user

The default user used is a user with sudo privileges but not root itself, we will give ourself the missing right on docker

````
sudo usermod -aG docker ubuntu
````

Then we log out and back in for the new group membership to apply. If done right, you can now
do the command below without an error.

````
docker ps
````

## Normally you're good to go

Just to be sure, you can check that Docker will start on boot automatically and is currently active

````
systemctl is-enabled docker
````
then
````
systemctl status docker
````

If it is not the case you can do it manually with the command below :
````
systemctl enable docker
systemctl start docker
````
## Optionnal : To double-check everything works as intended in can of a reboot

You can reboot manually using

````
sudo reboot
````

then log back in and check that :

````
systemctl is-enabled docker
# should return enabled
````
and
````
systemctl status docker
# should return active (running) since ...
````
and finally
````
docker ps
# should return CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS   PORTS   NAMES
````

## Github CI/CD

You can just launch the github CI/CD with the correct secrets and check with docker ps in the vps.

you can access the app on https://57.129.80.152:3000/

## Stop using the ip

### Configure DNS for Subdomain

Log in to your domain registrar (where samuel-legall.fr is managed).

Add an A record:

| Type | Name          | Content        | TTL   |
| ---- | ------------- |----------------| ----- |
| A    | mtl-parsor-ai | YOUR_PUBLIC_IP | 14400 |
TTL → keep 14400 (4 hours) or default

Wait for DNS propagation. Then test with

````
ping mtl-parsor-ai.samuel-legall.fr
````

## Stop specifying the port

It's ugly to use the port like this, so we will add a reverse-proxy using nginx to listen to port 80 (which is the default one so no need to specify it in the url)

First install nginx in the vps

````
sudo apt install nginx -y
````

Here is the location of the new file

````
sudo nano /etc/nginx/sites-available/default
````

````
server {
    listen 80;
    server_name mtl-parsor-ai.samuel-legall.fr;
    
    server_tokens off;  # hides Nginx version

    # Increase proxy timeout for slow upstream (backend)

    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;

          location / {
              proxy_pass http://localhost:3000;
              proxy_http_version 1.1;
              proxy_set_header Upgrade $http_upgrade;
              proxy_set_header Connection 'upgrade';
              proxy_set_header Host $host;
              proxy_cache_bypass $http_upgrade;
          }

    }
````

Test your Nginx Configuration and reload it
````
sudo nginx -t
sudo systemctl reload nginx
````

Now the app should be accessible via:

````
http://mtl-parsor-ai.samuel-legall.fr/
````

## Enable HTTPS with Let’s Encrypt

Install Certbot (official Let’s Encrypt client) and Nginx plugin:

````
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
````

Request a certificate for your subdomain:

````
sudo certbot --nginx -d mtl-parsor-ai.samuel-legall.fr
````

Certbot will automatically update your Nginx config for SSL.

Test HTTPS access:

````
https://mtl-parsor-ai.samuel-legall.fr/
````

You should see the green lock in the browser.
Certbot sets up auto-renewal via a cron job. You can check with:

````
sudo systemctl status certbot.timer
````