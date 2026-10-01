#!/bin/bash
# Schritt 3 auf paloskin-1. Phase A (Standard): Updates, deploy, UFW, fail2ban, Zeitzone, Swap.
# Phase B (Argument "harden"): Root- und Passwort-Login abschalten, erst nach erfolgreichem Test von deploy und sudo.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
MODE="${1:-prepare}"
if [ "$MODE" = "harden" ]; then
  echo "== Phase B: SSH härten =="
  install -d -m 755 /etc/ssh/sshd_config.d
  printf 'PermitRootLogin no\nPasswordAuthentication no\nKbdInteractiveAuthentication no\nPubkeyAuthentication yes\n' > /etc/ssh/sshd_config.d/10-paloskin.conf
  [ -f /etc/ssh/sshd_config.d/50-cloud-init.conf ] && sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config.d/50-cloud-init.conf
  sshd -t && systemctl restart ssh
  sshd -T | grep -E '^(permitrootlogin|passwordauthentication|kbdinteractiveauthentication)'
  exit 0
fi
PUBKEY="$2"; DEPLOY_PW="$3"
echo "== Phase A =="
echo "== System aktualisieren =="
apt-get update -q && apt-get -y -q upgrade
echo "== Benutzer deploy =="
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
echo "deploy:${DEPLOY_PW}" | chpasswd
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
echo "$PUBKEY" > /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys
echo "== Firewall =="
apt-get -y -q install ufw fail2ban unattended-upgrades >/dev/null
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null; ufw default allow outgoing >/dev/null
ufw allow 22/tcp >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null
echo "== Automatische Sicherheitsupdates =="
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'CONF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
CONF
systemctl enable --now unattended-upgrades >/dev/null 2>&1 || true
systemctl enable --now fail2ban >/dev/null 2>&1 || true
echo "== Zeitzone =="
timedatectl set-timezone Europe/Berlin
echo "== Swap 2 GB =="
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
echo 'vm.swappiness=10' > /etc/sysctl.d/99-swap.conf && sysctl -q -p /etc/sysctl.d/99-swap.conf
echo "== Ergebnis =="
echo "deploy in sudo: $(id -nG deploy | tr ' ' ',')"
ufw status | sed -n '1,8p'
free -h | sed -n '1,3p'
timedatectl | grep 'Time zone'
echo "Neustart nötig: $( [ -f /var/run/reboot-required ] && echo ja || echo nein )"
