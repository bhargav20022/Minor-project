<div align="center">

<h1>🌍 Wanderlust</h1>
<p><strong>A Full-Stack Travel Listing & Booking Platform</strong></p>
<p><em>Inspired by Airbnb — Built from scratch with Node.js, Express, MongoDB & EJS</em></p>

<br/>

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Image_CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Mapbox](https://img.shields.io/badge/Mapbox-Maps-000000?style=for-the-badge&logo=mapbox&logoColor=white)

</div>

---

## 📌 About the Project

**Wanderlust** is a production-style full-stack web application where property owners (hosts) can list their homes, villas, and stays — and travellers can discover, book, and pay for them online.

Built entirely from scratch as a college minor project, it covers everything a real-world booking platform needs: authentication, image uploads, interactive maps, payment processing, admin controls, automated emails, and more.

---

## ✨ Features

### 👤 User System
- Register, login, logout with secure session-based authentication (Passport.js)
- Role-based access: **Guest**, **Host**, and **Admin**
- OTP-based forgot password / reset password flow via email
- Persistent sessions stored in MongoDB Atlas (connect-mongo)

### 🏠 Listings
- Hosts can **create, edit, and delete** property listings
- Image upload via **Cloudinary CDN** (Multer + multer-storage-cloudinary)
- Each listing includes: title, description, price per night, location, country, category, and photo
- All new listings go through **admin approval** before going live (pending → approved/rejected)

### 🗺️ Interactive Maps
- Each listing page shows a live **Mapbox map** with the exact location pinned
- Location is auto-geocoded using the **Mapbox Geocoding SDK** on create/update

### 📅 Booking System
- Guests can select **check-in date, check-out date, and number of guests**
- Total price is automatically calculated based on nights × price per night
- Booking data stored in MongoDB with full status tracking: `Pending → Paid → Cancelled`

### 💳 Payment Flow
- Dedicated payment page after booking confirmation
- On successful payment: booking status updates to **Paid**, unique Payment ID generated
- Styled **HTML confirmation email** sent to guest via Brevo API

### 📧 Automated Email Notifications
| Trigger | Recipient | Details |
|---|---|---|
| Booking confirmed | Guest | Full booking summary with dates, amount, property image |
| Listing approved | Host | Approval confirmation from admin |
| Listing rejected | Host | Rejection with reason |
| Checkout day | Guest | Automated reminder sent at 8 AM daily |

Emails built with styled HTML templates and sent via **Brevo (Sendinblue) Transactional Email API**.

### 🛡️ Admin Dashboard
- View all **pending, approved, and rejected** listings
- **Approve or reject** listings with custom rejection reason
- View all **registered users** and platform complaints
- Dashboard stats: total listings, total users, open complaints, pending approvals

### ⭐ Reviews & Ratings
- Guests can leave star ratings and text reviews on any listing
- Reviews are author-linked (only review author can delete their review)
- Owner cannot review their own listing (enforced via authorization middleware)

### 📋 Host Dashboard
- Hosts can see all bookings received across their listings
- Revenue tracking: total revenue, active bookings, listing count

### 📋 Guest Booking History
- Guests can view all their past and upcoming bookings
- Option to **cancel a booking** (updates status to Cancelled)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20+ |
| **Framework** | Express.js 5.x |
| **Database** | MongoDB Atlas + Mongoose ODM |
| **Templating** | EJS + EJS-Mate (layouts) |
| **Authentication** | Passport.js + Passport-Local-Mongoose |
| **Sessions** | express-session + connect-mongo |
| **Image Storage** | Cloudinary + Multer |
| **Maps** | Mapbox GL JS + Mapbox Geocoding SDK |
| **Email** | Brevo (Sendinblue) API + Nodemailer |
| **Validation** | Joi (server-side schema validation) |
| **Styling** | Bootstrap 5 + Custom CSS |
| **Deployment** | Render / Railway (Node.js) + MongoDB Atlas |

---

## 🏗️ Project Structure

```
wanderlust/
├── app.js                  # Entry point — Express app setup
├── cloudConfig.js          # Cloudinary configuration
├── brevo.js                # Brevo email client setup
├── middleware.js            # isLoggedIn, isOwner, isAdmin, validation
├── schema.js               # Joi validation schemas
│
├── models/
│   ├── listing.js          # Listing schema (title, price, location, status, geometry)
│   ├── booking.js          # Booking schema (checkIn, checkOut, guests, payment)
│   ├── review.js           # Review schema (rating, comment, author)
│   ├── user.js             # User schema (email, isAdmin, OTP fields)
│   ├── complaint.js        # Complaint schema
│   └── notification.js     # Notification schema
│
├── controllers/
│   ├── listings.js         # CRUD logic for listings + geocoding
│   ├── users.js            # Register, login, logout, forgot password
│   └── reviews.js          # Create and delete reviews
│
├── routes/
│   ├── listing.js          # /listings routes
│   ├── user.js             # /login, /register, /logout, /forgot-password
│   ├── review.js           # /listings/:id/reviews
│   ├── booking.js          # /booking — create, my-bookings, host-dashboard, cancel
│   ├── payment.js          # /payment — payment page + success handler
│   └── admin.js            # /admin — dashboard, approve, reject
│
├── utils/
│   ├── ExpressError.js     # Custom error class
│   ├── wrapAsync.js        # Async error handler wrapper
│   ├── sendEmail.js        # Nodemailer email sender
│   └── checkoutReminder.js # Daily 8 AM checkout reminder scheduler
│
├── views/
│   ├── listings/           # index, show, new, edit EJS templates
│   ├── bookings/           # my-bookings, host-dashboard, cancelled
│   ├── payment/            # pay, success pages
│   ├── admin/              # admin dashboard
│   └── users/             # login, register, forgot-password
│
└── public/
    ├── css/                # style.css, rating.css
    └── js/                 # map.js, script.js
```

---

## ⚙️ Architecture

Built using the **MVC (Model-View-Controller)** pattern:

```
Request → Route → Middleware (auth/validation) → Controller → Model → View → Response
```

- **Models** — Mongoose schemas define data structure and relationships
- **Views** — EJS templates render dynamic HTML (with EJS-Mate for shared layouts)
- **Controllers** — Business logic separated cleanly from routes
- **Middleware** — Reusable guards: `isLoggedIn`, `isOwner`, `isAdmin`, `validateListing`

---

## 🚀 Getting Started (Local Setup)

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (free tier works)
- Cloudinary account (free tier works)
- Mapbox account (free tier works)
- Brevo account for email (free tier works)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/wanderlust.git
cd wanderlust
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create `.env` file
```env
ATLASDB_URL=your_mongodb_atlas_connection_string
SECRET=your_session_secret_key

CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

MAP_TOKEN=your_mapbox_public_token

BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_NAME=Wanderlust
BREVO_SENDER_EMAIL=your_verified_sender@email.com

BASE_URL=http://localhost:3000
NODE_ENV=development
```



## 🔮 Future Improvements

- [ ] Integrate real payment gateway (Razorpay / Stripe)
- [ ] Add real-time availability calendar to prevent double booking
- [ ] React.js front-end migration
- [ ] Mobile app (React Native)
- [ ] Search and filter listings by category, price, location



## 👨‍💻 Author

**Bhargav Bommana**  
MCA Graduate · KIIT School of Computer Applications  
📧 bhargavbommana87@gmail.com  
🔗 [linkedin.com/in/bhargav2002](https://linkedin.com/in/bhargav2002)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<div align="center">
  <p>⭐ If you found this project helpful, please give it a star!</p>
  <p><em>Built with ❤️ as a Minor Project — KIIT, 2024</em></p>
</div>
