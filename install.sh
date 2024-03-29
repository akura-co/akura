#https://vaneyckt.io/posts/safer_bash_scripts_with_set_euxo_pipefail/
set -euxo pipefail

echo "Setting hostname to akura.co"
sudo hostname akura.co
echo `hostname` | sudo tee /etc/hostname > /dev/null
sudo systemctl restart systemd-logind.service

if ! grep -Fqs '127.0.1.1' /etc/hosts; then
  echo "Adding `hostname` to /etc/hosts"
  echo "127.0.1.1 `hostname`"  | sudo tee -a /etc/hosts > /dev/null
fi

echo 'Updating packages'
sudo apt update -qq
sudo DEBIAN_FRONTEND=noninteractive apt upgrade -yqq

#Systemd has time daemon
#echo 'Installing NTP'
#sudo apt install -yqq ntp

echo 'Installing Node.js'
if ! command -v node; then
  sudo apt install -yqq nodejs
fi

if ! command -v npm; then
  echo 'Installing NPM'
  sudo apt install -yqq npm
fi

if ! grep -Fqs .npm-global ~/.profile; then
  echo 'Setting up .npm-global'
  mkdir -p ~/.npm-global
  npm config set prefix '~/.npm-global'
  echo 'PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.profile
  npm config set save-exact true
fi

if ! grep -Fqs NODE_ENV ~/.profile; then
  echo 'Setting NODE_ENV=production'
  echo 'export NODE_ENV=production' >> ~/.profile
  source ~/.profile
fi

github=`ssh-keyscan -t rsa github.com 2>/dev/null`
if ! grep -Fqs "$github" ~/.ssh/known_hosts; then
  echo 'Adding Github to known_hosts'
  echo "$github" >> ~/.ssh/known_hosts
fi

if [ ! -d ~/akura ] ; then
  git clone git@github.com:akura-co/akura.git
fi

if [ ! -e ~/.gitconfig ]; then
  echo 'Installing .gitconfig'
  cp ~/akura/etc/.gitconfig ~/.gitconfig
fi

echo 'Installing correct Node.js version'
npm i n -g
version=`node -v`
if [ ${version:1} != `node -p -e "require('./akura/package').engines.node"` ]; then
  sudo ~/.npm-global/bin/n `node -p -e "require('./akura/package').engines.node"`
fi

echo 'Removing old Node.js'
sudo apt remove -yqq nodejs
sudo apt autoremove -yqq
hash -r

if [ ! -e ~/.bash_aliases ]; then
  echo 'Installing .bash_aliases'
  cp ~/akura/etc/.bash_aliases ~/.bash_aliases
  source ~/.bash_aliases
fi

clone() {
  if [ ! -d ~/$1 ] ; then
    git clone git@github.com:akura-co/$1.git
    cd ~/$1
    npm i
    cd ~/
  fi
}

clone afanasy.com
clone akura.co
clone fanafan.co
clone hkd-bot
clone ninjson.com
clone podskazka-bot
clone pogovorka-bot
clone quote-bot
clone bin-bot
clone stebeneva.ru
clone trade

if [ ! -d ~/binlist ] ; then
  git clone git@github.com:binlist/data.git
  mv ~/data ~/binlistData
  cd ~/binlistData
  npm i
  cd ~/
fi

#manual - copy ~/.json configs and data
#scp 184.72.54.8:~/*.json ~/

echo 'Installing MySQL server'
sudo apt install -yqq mysql-server
sudo ln -sf /home/ubuntu/akura/etc/mysql/conf.d/akura.cnf /etc/mysql/mysql.conf.d/akura.cnf
sudo mkdir -p /etc/systemd/system/mysql.service.d
sudo cp ~/akura/etc/systemd/system/mysql.service.d/akura.conf /etc/systemd/system/mysql.service.d/akura.conf
echo '!include    /etc/mysql/mysql.conf.d/akura.cnf' | sudo tee -a /etc/mysql/my.cnf > /dev/null
echo '/home/ubuntu/akura/etc/mysql/conf.d/akura.cnf r,' | sudo tee -a /etc/apparmor.d/local/usr.sbin.mysqld > /dev/null
sudo apparmor_parser -r /etc/apparmor.d/usr.sbin.mysqld
sudo systemctl restart mysql

echo "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ''" | sudo mysql -uroot
#manual - copy *.gz backups
#scp -r 184.72.54.8:~/*.gz ~/

echo 'Installing Ethereum'
sudo add-apt-repository -yqq ppa:ethereum/ethereum
sudo apt install -yqq ethereum
#manual - copy ~/.ethereum
#scp -r 184.72.54.8:~/.ethereum ~/

echo 'Installing akura.service'
sudo ln -sf ~/akura/etc/systemd/system/akura.service /etc/systemd/system
sudo systemctl enable akura.service
sudo systemctl start akura

#manual - letsencrypt config
mkdir ~/akura.co/ssl
scp 184.72.54.8:/etc/letsencrypt/live/akura.co/*.pem ~/akura.co/ssl/
#manual - edit config to point to copied .pem
#vi ~/.akura.json
sudo apt-get install -yqq certbot
sudo certbot certonly --webroot -w ~/akura.co/public -d akura.co -n
sudo certbot certonly --webroot -w ~/afanasy.com/ -d afanasy.com -n
sudo certbot certonly --webroot -w ~/afanasy.com/ -d ysanafa.com -n
sudo certbot certonly --webroot -w ~/fanafan.co/ -d fanafan.co -n
sudo certbot certonly --webroot -w ~/fanafan.co/ -d fanafan.us -n
sudo certbot certonly --webroot -w ~/ninjson.com/ -d ninjson.com -n
sudo vi /etc/letsencrypt/renewal/akura.co.conf
#manual - add hook
#[renewalparams]
#post_hook = systemctl restart akura
