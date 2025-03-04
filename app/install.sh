#!/bin/bash

# Fungsi untuk menjalankan perintah dengan error handling
run_command() {
    echo "Menjalankan: $1"
    eval "$1"
    if [ $? -ne 0 ]; then
        echo "Error: Gagal menjalankan '$1'" >&2
        exit 1
    fi
}

# Hapus instalasi lama
run_command "sudo systemctl stop nginx"
run_command "sudo systemctl disable nginx"
run_command "sudo apt remove --purge -y nginx nginx-common nginx-full"
run_command "sudo rm -rf /etc/nginx /var/www/html /etc/letsencrypt /etc/nginx/sites-enabled/* /etc/nginx/sites-available/*"
run_command "sudo ufw delete allow 80/tcp"
run_command "sudo ufw delete allow 443/tcp"
run_command "rm -rf ~/dokasahv2"

# Update dan upgrade sistem
run_command "sudo apt update && sudo apt upgrade -y"

# Mengizinkan port HTTP (80) dan HTTPS (443) di firewall
run_command "sudo ufw allow 80/tcp"
run_command "sudo ufw allow 443/tcp"
run_command "sudo ufw reload"

# Instal Nginx
run_command "sudo apt install -y nginx"
run_command "sudo systemctl enable nginx"
run_command "sudo systemctl start nginx"

# Instal Node.js versi 22 jika belum ada
if ! command -v node &>/dev/null || [[ $(node -v) != "v22."* ]]; then
    run_command "sudo apt install -y unzip"
    run_command "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
    run_command "sudo apt install -y nodejs"
fi

# Instal Bun jika belum ada
if ! command -v bun &>/dev/null; then
    run_command "curl -fsSL https://bun.sh/install | bash"
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi

# Instal Certbot untuk SSL
run_command "sudo apt install -y certbot python3-certbot-nginx"

# Minta domain dari user
read -p "Masukkan domain utama Anda (contoh: adewahyudin.com): " DOMAIN
read -p "Masukkan subdomain backend Anda (contoh: lv.adewahyudin.com): " SUBDOMAIN

# Generate atau perbarui sertifikat SSL untuk frontend dan backend
run_command "sudo certbot --nginx --expand -d $DOMAIN -d $SUBDOMAIN --agree-tos --redirect --non-interactive --email admin@$DOMAIN"

# Clone repository frontend dan backend
run_command "git clone https://github.com/Myudi422/dokasahv2.git ~/dokasahv2"

# Instalasi frontend
cd ~/dokasahv2
run_command "bun install"
run_command "nohup bun run dev --port 3000 > frontend.log 2>&1 &"

# Instalasi backend
cd ~/dokasahv2/backend

# Buat file .env
cat <<EOF > .env
DB_HOST=143.198.85.46
DB_USER=ccgnimex
DB_PASSWORD=aaaaaaac
JWT_SECRET=dokasah
DB_NAME=ccgnimex
DOMAIN=$DOMAIN
EOF

run_command "npm install"
run_command "nohup node index.js > backend.log 2>&1 &"

# Konfigurasi Nginx untuk Reverse Proxy
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
echo "
server {
    listen 80;
    server_name $DOMAIN;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}

server {
    listen 80;
    server_name $SUBDOMAIN;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
" | sudo tee $NGINX_CONF

# Aktifkan konfigurasi Nginx
run_command "sudo ln -s $NGINX_CONF /etc/nginx/sites-enabled/"
run_command "sudo nginx -t"
run_command "sudo systemctl restart nginx"

# Pastikan layanan berjalan
echo "Skrip selesai!"
echo "Frontend berjalan di https://$DOMAIN"
echo "Backend berjalan di https://$SUBDOMAIN"
