# Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

Your Dean Appointment System is now ready for Vercel deployment! The following changes have been made:

### Files Created:
- ✅ `vercel.json` - Vercel configuration
- ✅ `.vercelignore` - Files to exclude from deployment

### Files Updated:
- ✅ `app.py` - Updated for serverless environment
- ✅ `admin-script.js` - Dynamic API URL detection
- ✅ `request-script.js` - Dynamic API URL detection
- ✅ `status-script.js` - Dynamic API URL detection
- ✅ `script.js` - Dynamic API URL detection

## 🚀 Deployment Steps

### 1. Create Vercel Account
- Go to [vercel.com](https://vercel.com)
- Sign up with GitHub, GitLab, or Bitbucket

### 2. Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 3. Deploy via Vercel Dashboard (Recommended)
1. Push your code to a Git repository (GitHub/GitLab/Bitbucket)
2. Go to Vercel Dashboard
3. Click "Add New Project"
4. Import your repository
5. Vercel will auto-detect settings
6. Click "Deploy"

### 4. Deploy via Vercel CLI (Alternative)
```bash
cd "C:\Users\prana\Desktop\project 2"
vercel
```

Follow the prompts to complete deployment.

## ⚠️ Important Notes

### Database Limitations
- **SQLite is temporary on Vercel**: Data resets on each deployment
- For production, use a cloud database:
  - [Supabase](https://supabase.com) (PostgreSQL)
  - [PlanetScale](https://planetscale.com) (MySQL)
  - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  - [Neon](https://neon.tech) (PostgreSQL)

### Admin Credentials
- Username: `admin`
- Password: `admin123`
- **⚠️ Change these in production!** Update in `app.py` line 91

### Environment Variables (Optional)
If you want to secure admin credentials, add in Vercel:
```
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_password
```

Then update `app.py`:
```python
username = os.environ.get('ADMIN_USERNAME', 'admin')
password = os.environ.get('ADMIN_PASSWORD', 'admin123')
```

## 🧪 Testing After Deployment

1. Visit your Vercel URL (e.g., `your-project.vercel.app`)
2. Test Request Appointment form
3. Test Check Status with phone number
4. Test Admin Login
5. Test Approve/Reject/Delete functions

## 📱 Features

- Dark themed UI (#141d28 background, #eff1f5 text)
- Request appointments with form validation
- Check appointment status by phone number
- Admin dashboard with approve/reject/delete
- Edit time slots for approved appointments
- Success/error popups
- Responsive design

## 🔧 Local Development

To run locally:
```bash
python app.py
```

Server runs on `http://localhost:5000`

## 📂 Project Structure

```
project/
├── index.html              # More/Info page
├── request.html            # Request appointment page
├── status.html             # Check status page
├── admin.html              # Admin dashboard
├── app.py                  # Flask backend
├── vercel.json             # Vercel config
├── requirements.txt        # Python dependencies
└── [various .js/.css files]
```

## 🐛 Troubleshooting

### Issue: "No module named 'flask'"
- Ensure `requirements.txt` exists with Flask dependencies

### Issue: "Database locked"
- On Vercel, this is normal due to concurrent serverless functions
- Solution: Migrate to cloud database

### Issue: "404 on API calls"
- Check browser console for API URL
- Verify `vercel.json` routes configuration

### Issue: "Data disappears after deployment"
- Expected with SQLite on Vercel
- Use cloud database for persistence

## 🔄 Redeployment

Changes are automatically deployed when you push to your connected Git repository.

## 📞 Contact Information

- Email: dmsbvdu@bharatividyapeeth.edu
- Phone: +91 8657008027 / +91 8657008028
- Address: Bharati Vidyapeeth (Deemed to be University), Department of Management Studies (off Campus), Plot No.KC1, Sector 3, Kharghar, Navi Mumbai - 410210

---

**Ready to deploy!** 🎉
