# 🎨 Pixal Botics Backend API

Professional REST API with authentication, email notifications, and complete CRUD operations.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Email (IMPORTANT!)

Edit `.env` file and replace `YOUR_EMAIL_PASSWORD_HERE` with your actual email password:

```env
EMAIL_PASSWORD=your_actual_password
```

**How to get password:**
1. Login to webmail: https://mail.pixalbotics.com
2. Use: info@pixalbotics.com
3. If you don't know password, reset it in cPanel

**If mail.pixalbotics.com doesn't work, try:**
- `SMTP_HOST=pixalbotics.com`
- `SMTP_HOST=smtp.pixalbotics.com`

### 3. Start Server
```bash
npm start
```

Server will run on:
- Local: http://localhost:3000
- Network: http://YOUR_IP:3000
- Docs: http://localhost:3000/api-docs

---

## 📧 Email Testing

Test if email configuration works:

```bash
node test-email.js
```

Enter your email when prompted. You should receive a test email from `info@pixalbotics.com`

---

## 🔐 First Admin Setup

Create first admin manually:

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@pixalbotics.com",
    "password": "admin123",
    "role": "admin"
  }'
```

**Note:** For first admin, you'll need to temporarily remove auth from `/register` or create directly in MongoDB.

---

## 📚 API Endpoints

### Authentication
- `POST /api/users/register` - Register (Admin only)
- `POST /api/users/login` - Login
- `POST /api/users/forgot-password` - Request password reset (Email sent)
- `POST /api/users/reset-password` - Reset password

### User Management (Admin Only)
- `GET /api/users/all` - Get all users
- `POST /api/users/create` - Create user (Welcome email sent)
- `PUT /api/users/:id` - Update user (Notification email sent)
- `DELETE /api/users/:id` - Delete user (Goodbye email sent)

### Blogs (Public GET, Admin POST/PUT/DELETE)
- `GET /api/blogs` - List blogs (pagination & search)
- `POST /api/blogs` - Create blog
- `GET /api/blogs/:id` - Get single blog
- `PUT /api/blogs/:id` - Update blog
- `DELETE /api/blogs/:id` - Delete blog

### Projects (Public GET, Admin POST/PUT/DELETE)
- `GET /api/projects` - List projects (pagination & search)
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get single project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Team (Public GET, Admin POST/PUT/DELETE)
- `GET /api/team` - List team members (pagination & search)
- `POST /api/team` - Add team member
- `GET /api/team/:id` - Get single member
- `PUT /api/team/:id` - Update member
- `DELETE /api/team/:id` - Delete member

### Testimonials (Public GET, Admin POST/PUT/DELETE)
- `GET /api/testimonials` - List testimonials (pagination & search)
- `POST /api/testimonials` - Create testimonial
- `GET /api/testimonials/:id` - Get single testimonial
- `PUT /api/testimonials/:id` - Update testimonial
- `DELETE /api/testimonials/:id` - Delete testimonial

---

## 🔒 Security

- JWT authentication
- Role-based access (user, admin, systemmanager)
- Only admin can manage users
- Only admin/systemmanager can manage content
- Password hashing with bcrypt
- Input validation
- File upload validation

---

## 📧 Email Features

All emails sent from: **Pixal Botics <info@pixalbotics.com>**

**Emails sent when:**
- Admin creates user → Welcome email with credentials
- User forgets password → Reset link email
- Password reset success → Confirmation email
- Admin updates user → Notification email
- Admin deletes user → Goodbye email

---

## 📱 Access from Phone

Server runs on all network interfaces, access from:
- Computer: http://localhost:3000
- Phone (same WiFi): http://YOUR_IP:3000

---

## 🛠️ Technology Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Multer (file upload)
- Nodemailer (emails)
- Express-validator
- Swagger/OpenAPI

---

## 📖 Documentation

Visit: http://localhost:3000/api-docs

---

## ⚠️ Troubleshooting

### Email not sending?

1. Check `.env` EMAIL_PASSWORD is correct
2. Verify SMTP_HOST (try: mail.pixalbotics.com or pixalbotics.com)
3. Run: `node test-email.js`
4. Check server console for errors
5. Try Port 587: `SMTP_PORT=587` and `SMTP_SECURE=false`

### Server crash?

1. Check all environment variables are set
2. Ensure MongoDB is running
3. Check `.env` syntax (no spaces around =)

---

## 📞 Support

For email issues, contact your hosting provider with:
- Email: info@pixalbotics.com
- Ask for: SMTP host, port, and settings

---

**Ready to use! 🎉**

