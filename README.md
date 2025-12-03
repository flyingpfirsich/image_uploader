# Minimal Image Uploader

A minimal web interface to upload images directly to your Raspberry Pi from anywhere.

## Architecture

- **Frontend:** React + Vite (Minimal Terminal Style)
- **Backend:** Node.js + Express
- **Transport:** SSH/SCP (via `node-ssh`) to Raspberry Pi
- **Deployment:** Docker (Single container)

## Prerequisites

1.  **Raspberry Pi** connected to the internet.
2.  **Hetzner Server** (or any VPS) running **Coolify** (or Docker).
3.  **Tailscale** (Recommended) for secure connection between VPS and Pi without port forwarding.

## Raspberry Pi Setup (The Target)

You need to expose your Pi so the web server can SSH into it. We recommend **Tailscale** for a secure, private network.

### 1. Install Tailscale on Raspberry Pi

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Note the IP address (e.g., `100.x.y.z`).

### 2. Create a dedicated user (Optional but recommended)

```bash
sudo adduser uploader
# Follow prompts to set a password
```

### 3. Ensure SSH is enabled

```bash
sudo systemctl enable ssh
sudo systemctl start ssh
```

### 4. Prepare the videos folder

```bash
mkdir -p /home/uploader/Videos
chown uploader:uploader /home/uploader/Videos
```

## VPS / Web Server Setup

### 1. Install Tailscale on VPS

Run the same install command as above. Ensure both devices can ping each other.

```bash
ping 100.x.y.z  # Ping the Pi from VPS
```

### 2. SSH Key Setup (Passwordless Auth)

On the **VPS** (where the web server runs), generate an SSH key:

```bash
ssh-keygen -t ed25519 -C "webserver" -f ./webserver_key
# Press enter for no passphrase
```

Copy the public key (`webserver_key.pub`) to the Pi's `authorized_keys`:

```bash
# Run this from the VPS
ssh-copy-id -i ./webserver_key.pub uploader@100.x.y.z
```

_Or manually append the content of `.pub` to `/home/uploader/.ssh/authorized_keys` on the Pi._

Save the **Private Key** (`webserver_key`). You will need this for the Docker container.

## Deployment (Coolify)

1.  **Create a new Resource** -> **Git Repository** (or Dockerfile).
2.  Select this repository.
3.  **Environment Variables:**
    Add the following variables in Coolify:

    ```env
    PORT=3000
    SHARED_PASSWORD=your_secret_upload_password

    # Pi Configuration
    PI_HOST=100.x.y.z          # Tailscale IP of the Pi
    PI_USER=uploader

    # Authentication (Choose one)
    PI_PASSWORD=               # If using password auth
    # OR (Recommended)
    # You need to mount the key or paste the content.
    # For node-ssh, we might need to adapt the code to read key from ENV string if you can't mount files easily in Coolify.
    ```

### SSH Key via Env Variable

If you cannot mount files easily, update `server.js` to read the key from a string variable `PI_KEY_STRING`.

**Update `backend/server.js` (if needed):**

```javascript
privateKey: process.env.PI_KEY_STRING || fs.readFileSync(process.env.PI_KEY_PATH);
```

## Local Development

1.  `cd backend && npm install`
2.  `cd frontend && npm install`
3.  Create `backend/.env` based on usage.
4.  Run Backend: `cd backend && npm run dev`
5.  Run Frontend: `cd frontend && npm run dev`
