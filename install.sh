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

echo 'Installing NTP'
sudo apt install -yqq ntp

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
clone podskazka-bot
clone pogovorka-bot
clone quote-bot
clone stebeneva.ru

if [ ! -d ~/trade ] ; then
  git clone git@github.com:afanasy/trade.git
  cd ~/trade
  npm i
  cd ~/
fi

if [ ! -d ~/binlist ] ; then
  git clone git@github.com:binlist/data.git
  cd ~/binlist
  npm i
  cd ~/
fi

echo 'Installing trade/crontab'
crontab ~/trade/crontab
crontab -l

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
echo 'CREATE DATABASE trade' | sudo mysql -uroot
echo 'ALTER DATABASE trade CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci' | sudo mysql -uroot
