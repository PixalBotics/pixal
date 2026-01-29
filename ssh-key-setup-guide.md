# SSH Key Setup Guide for pixalbotics.com
## Server: 167.235.182.213 | Domain: pixalbotics.com

## 🔑 SSH Key Authentication Setup

### Step 1: Generate SSH Key Pair in cPanel

1. **Login to cPanel**
   - Go to: `https://pixalbotics.com:2083`
   - Enter your cPanel credentials

2. **Navigate to SSH Access**
   - Go to Security section
   - Click "SSH Access"
   - Click "Manage SSH Keys"

3. **Generate New Key**
   ```
   Key Name: pixalbotics-key
   Key Type: RSA
   Key Size: 2048 (or 4096 for better security)
   Passphrase: (optional but recommended)
   ```

4. **Download Private Key**
   - Click "Download" next to your private key
   - Save as `pixalbotics-private-key.ppk`

5. **Authorize Public Key**
   - Click "Manage" next to your public key
   - Click "Authorize"
   - The key will be added to authorized_keys

### Step 2: Convert Key for PuTTY (if needed)

If you downloaded an OpenSSH key, convert it to PuTTY format:

1. **Open PuTTYgen**
2. **Load your private key**
   - Click "Load"
   - Select your private key file
   - Choose "All Files (*.*)" if needed

3. **Save as PuTTY Key**
   - Click "Save private key"
   - Save as `pixalbotics-private-key.ppk`

### Step 3: PuTTY Configuration

#### 3.1 Basic Connection Settings
```
Host Name: 167.235.182.213
Port: 22
Connection Type: SSH
```

#### 3.2 SSH Authentication
1. **Go to Connection > SSH > Auth**
2. **Browse for your private key**
   - Click "Browse"
   - Select `pixalbotics-private-key.ppk`

#### 3.3 Username Configuration
1. **Go to Connection > Data**
2. **Enter Auto-login username:**
   - Try: `cpanel_username`
   - Or: `root`
   - Or: `admin`

#### 3.4 Save Session
1. **Go to Session**
2. **Enter session name:** `pixalbotics-ssh`
3. **Click Save**

### Step 4: Alternative Connection Methods

#### Method 1: Password Authentication
If SSH keys don't work, try password:

1. **In PuTTY:**
   - Go to Connection > SSH > Auth
   - Uncheck "Attempt authentication using a private key file"
   - Leave "Allow agent forwarding" checked

2. **Connection Settings:**
   ```
   Host Name: 167.235.182.213
   Port: 22
   Username: (enter when prompted)
   Password: (enter when prompted)
   ```

#### Method 2: Different Ports
Try these ports if 22 doesn't work:
```
Port 2222
Port 2022
Port 2200
```

#### Method 3: Domain Name
```
Host Name: pixalbotics.com
Port: 22
```

### Step 5: Test Connection

#### 5.1 Basic Test
```bash
# Test server reachability
ping 167.235.182.213

# Test SSH port
telnet 167.235.182.213 22
```

#### 5.2 PuTTY Connection Test
1. **Open PuTTY**
2. **Load your saved session**
3. **Click Open**
4. **If prompted for username/password, enter them**

### Step 6: Common Issues & Solutions

#### Issue 1: "Server refused our key"
**Solution:**
- Check if public key is authorized in cPanel
- Verify private key matches public key
- Try regenerating key pair

#### Issue 2: "Permission denied"
**Solution:**
- Check username format
- Try different usernames:
  - `cpanel_username`
  - `root`
  - `admin`
  - `username`

#### Issue 3: "Connection refused"
**Solution:**
- Check if SSH is enabled in cPanel
- Try different ports (22, 2222, 2022)
- Contact hosting provider

#### Issue 4: "Host key verification failed"
**Solution:**
- Go to Connection > SSH > Host Keys
- Click "Yes" when prompted
- Or clear known hosts and try again

### Step 7: File Transfer Setup

#### 7.1 Using SCP with SSH Key
```bash
# Upload files using SSH key
scp -i pixalbotics-private-key.ppk -r C:\Users\Alihasan\Desktop\pixal_backend\pixal\* username@167.235.182.213:public_html/api/
```

#### 7.2 Using PuTTY SCP (PSCP)
```bash
# Download PSCP from PuTTY website
pscp -i pixalbotics-private-key.ppk -r C:\Users\Alihasan\Desktop\pixal_backend\pixal\* username@167.235.182.213:public_html/api/
```

### Step 8: Alternative Solutions

#### Option 1: cPanel File Manager
1. **Login to cPanel**
2. **Go to File Manager**
3. **Navigate to public_html**
4. **Upload files directly**

#### Option 2: FileZilla (SFTP)
1. **Download FileZilla**
2. **Connect using:**
   - Host: `167.235.182.213`
   - Protocol: `SFTP`
   - Port: `22`
   - Username/Password: Your cPanel credentials

#### Option 3: Git Deployment
If Git is available:
```bash
# Connect via SSH first
ssh username@167.235.182.213

# Clone your repository
git clone https://github.com/A-hasan-code/pixal.git
cd pixal
npm install --production
```

### Step 9: Verification Steps

#### 9.1 Test SSH Connection
```bash
# Connect via PuTTY
ssh username@167.235.182.213

# Check if you can access server
pwd
ls -la
```

#### 9.2 Test File Upload
```bash
# Test file transfer
scp test.txt username@167.235.182.213:public_html/
```

#### 9.3 Check Server Status
- Visit `https://pixalbotics.com/`
- Check if server is running
- Verify cPanel access

### Step 10: Troubleshooting Checklist

- [ ] SSH Access enabled in cPanel
- [ ] SSH key pair generated
- [ ] Public key authorized on server
- [ ] Private key downloaded and converted
- [ ] PuTTY configured with private key
- [ ] Correct username format
- [ ] Server reachable via ping
- [ ] SSH port accessible
- [ ] File permissions correct
- [ ] Connection successful

## 🆘 Still Having Issues?

### Contact Your Hosting Provider
1. **Ask for SSH access** if not enabled
2. **Get correct SSH credentials**
3. **Request server specifications**
4. **Ask for alternative connection methods**

### Alternative Deployment Methods
1. **cPanel File Manager** - Upload files directly
2. **Git deployment** - If Git is available
3. **Hosting provider tools** - Use their deployment tools
4. **FTP/SFTP** - Use FileZilla or similar tools

### Test Commands
```bash
# Test server connectivity
ping 167.235.182.213

# Test SSH port
telnet 167.235.182.213 22

# Test SSH connection
ssh -v username@167.235.182.213
```


