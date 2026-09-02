npm install -g lazyufw

# one-time, explicit privilege setup — user has to run this deliberately
sudo lazyufw setup

# from then on, runs without a sudo password prompt for ufw specifically
lazyufw

# to revoke later
sudo lazyufw teardown