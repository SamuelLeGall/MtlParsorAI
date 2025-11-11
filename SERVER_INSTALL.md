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