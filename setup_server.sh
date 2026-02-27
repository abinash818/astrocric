#!/bin/bash
set -e

echo "🚀 Starting server setup..."

# 1. Update and install basic dependencies
apt update && apt upgrade -y
apt install -y git curl nginx postgresql postgresql-contrib tar nodejs npm

# 2. Install NVM and Node 20 (more reliable than apt node)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20

# 3. Install PM2
npm install -g pm2

# 4. Extract project
mkdir -p /var/www/astrocric
tar -xzf /root/deploy.tar.gz -C /var/www/astrocric/

# 5. Setup Backend
cd /var/www/astrocric/backend
npm install
pm2 delete astrocric-backend || true
pm2 start server.js --name "astrocric-backend"

# 6. Setup Website
cd /var/www/astrocric/website
npm install
# Next build already done locally, but run npm build just in case of arch issues if needed.
# For now, let's try to run the pre-built version.
pm2 delete astrocric-website || true
pm2 start npm --name "astrocric-website" -- start

# 7. Setup Nginx
cat <<EOF > /etc/nginx/sites-available/astrocric
server {
    listen 80;
    server_name 64.227.136.71; # Use IP if no domain yet

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
    }

    location /admin {
        alias /var/www/astrocric/admin-panel/dist;
        try_files \$uri \$uri/ /admin/index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/astrocric /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo "✅ Setup complete! Backend and Website are running via PM2."
pm2 list
