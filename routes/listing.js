const express  = require("express");
const router   = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");

const Listing   = require("../models/listing.js");
const Complaint = require("../models/complaint.js");
const { isLoggedIn, isOwner, validateListing, isAdmin } = require("../middleware.js");

const listingController = require("../controllers/listings.js");
const multer  = require("multer");
const { storage } = require("../cloudConfig.js");
const upload  = multer({ storage });

/* ─────────────────────────────────────────────
   INDEX  — only show APPROVED listings
   CREATE — save as "pending", wait for admin
───────────────────────────────────────────── */
router.route("/")
  .get(wrapAsync(listingController.index))          // controller already filters by status:approved (see note)
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)      // controller sets status:"pending"
  );

/* new listing form */
router.get("/new", isLoggedIn, listingController.renderNewForm);

/* ── MY LISTINGS — owner sees all their own (any status) ── */
router.get("/my-listings", isLoggedIn, wrapAsync(async (req, res) => {
  const listings = await Listing.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.render("listings/my-listings", { listings });
}));

/* ─────────────────────────────────────────────
   SHOW / EDIT / DELETE
───────────────────────────────────────────── */
router.route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(
    isLoggedIn,
    wrapAsync(async (req, res, next) => {
      const listing = await Listing.findById(req.params.id);
      if (!listing) { req.flash("error", "Listing not found."); return res.redirect("/listings"); }
      const isOwnerUser = listing.owner.equals(req.user._id);
      const isAdminUser = req.user.isAdmin;
      if (!isOwnerUser && !isAdminUser) {
        req.flash("error", "You don't have permission to delete this listing.");
        return res.redirect(`/listings/${req.params.id}`);
      }
      next();
    }),
    wrapAsync(listingController.destroyListing)
  );

router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));

/* ─────────────────────────────────────────────
   CONTACT OWNER
───────────────────────────────────────────── */
router.post("/:id/contact", isLoggedIn, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("owner");
    const { message } = req.body;
    const guestName   = req.user.username;
    const guestEmail  = req.user.email;
    const ownerEmail  = listing.owner.email;
    const listingTitle = listing.title;

    const htmlContent = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#1a1a2e;border-radius:18px 18px 0 0;padding:32px 40px;text-align:center;">
<p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d4a843;">✦ Wanderlust</p>
<h1 style="margin:0;font-size:24px;color:#ffffff;font-family:Georgia,serif;">New Message from a Guest</h1>
</td></tr>
<tr><td style="background:#ffffff;padding:36px 40px;">
<p style="font-size:15px;color:#1a1a2e;">Hi <strong>${listing.owner.username}</strong> 👋</p>
<p style="font-size:14px;color:#6b6b7b;line-height:1.7;">Someone is interested in <strong>${listingTitle}</strong>:</p>
<div style="background:#faf7f2;border-left:4px solid #c9783a;border-radius:8px;padding:16px 20px;margin:20px 0;">
<p style="margin:0;font-size:15px;color:#1a1a2e;line-height:1.7;">${message}</p></div>
<p style="font-size:13px;color:#6b6b7b;">From: <strong>${guestName}</strong> — ${guestEmail}</p>
</td></tr>
<tr><td style="background:#1a1a2e;border-radius:0 0 18px 18px;padding:24px 40px;text-align:center;">
<p style="margin:0;font-size:18px;color:#d4a843;font-family:Georgia,serif;letter-spacing:2px;">WANDERLUST</p>
</td></tr></table></td></tr></table></body></html>`;

    const { sendEmail } = require("../brevo");
    await sendEmail({
      toEmail: ownerEmail, toName: listing.owner.username,
      subject: `New message about your listing – ${listingTitle}`,
      htmlContent,
      replyTo: { email: guestEmail, name: guestName },
    });

    req.flash("success", "Your message has been sent to the owner! ✅");
    res.redirect(`/listings/${listing._id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Could not send message. Please try again.");
    res.redirect("back");
  }
});

/* ─────────────────────────────────────────────
   COMPLAINT FORM  (POST /listings/:id/complaint)
   Any logged-in user can file a complaint about a listing.
   Admin handles it from admin dashboard.
───────────────────────────────────────────── */
router.post("/:id/complaint", isLoggedIn, wrapAsync(async (req, res) => {
  const { name, email, subject, message } = req.body;
  await Complaint.create({
    listing:     req.params.id,
    submittedBy: req.user._id,
    name, email, subject, message,
  });
  req.flash("success", "Your complaint has been submitted. We'll review it shortly.");
  res.redirect(`/listings/${req.params.id}`);
}));

module.exports = router;
