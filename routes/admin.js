const express   = require("express");
const router    = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isAdmin } = require("../middleware.js");

const Listing   = require("../models/listing.js");
const Complaint = require("../models/complaint.js");
const User      = require("../models/user.js");
const { sendEmail } = require("../brevo");

/* ── ADMIN DASHBOARD ── */
router.get("/", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
  const [pendingListings, allListings, complaints, users] = await Promise.all([
    Listing.find({ status: "pending" }).populate("owner").sort({ createdAt: -1 }),
    Listing.find({}).populate("owner").sort({ createdAt: -1 }),
    Complaint.find({}).populate("listing").populate("submittedBy").sort({ createdAt: -1 }),
    User.find({}).sort({ createdAt: -1 }),
  ]);
  res.render("admin/dashboard", {
    pendingListings, allListings, complaints, users,
    totalListings:  allListings.length,
    totalUsers:     users.length,
    openComplaints: complaints.filter(c => c.status === "open").length,
    pendingCount:   pendingListings.length,
  });
}));

/* ── APPROVE LISTING ── */
router.post("/listings/:id/approve", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
  const listing = await Listing.findByIdAndUpdate(
    req.params.id,
    { status: "approved", rejectionReason: "" },
    { new: true }
  ).populate("owner");

  /* send approval email */
  if (listing.owner?.email) {
    const html = approvalEmail(listing);
    await sendEmail({
      toEmail: listing.owner.email,
      toName:  listing.owner.username,
      subject: `✅ Your listing "${listing.title}" has been approved!`,
      htmlContent: html,
    });
  }

  req.flash("success", `"${listing.title}" approved and owner notified.`);
  res.redirect("/admin");
}));

/* ── REJECT LISTING ── */
router.post("/listings/:id/reject", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
  const { reason } = req.body;
  const listing = await Listing.findByIdAndUpdate(
    req.params.id,
    { status: "rejected", rejectionReason: reason || "Did not meet our quality standards." },
    { new: true }
  ).populate("owner");

  /* send rejection email */
  if (listing.owner?.email) {
    const html = rejectionEmail(listing, reason);
    await sendEmail({
      toEmail: listing.owner.email,
      toName:  listing.owner.username,
      subject: `❌ Your listing "${listing.title}" was not approved`,
      htmlContent: html,
    });
  }

  req.flash("error", `"${listing.title}" rejected and owner notified.`);
  res.redirect("/admin");
}));

/* ── UPDATE COMPLAINT STATUS ── */
router.post("/complaints/:id/update", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
  const { status, adminNote } = req.body;
  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    { status, adminNote },
    { new: true }
  ).populate("listing");

  /* ── Send email to customer only when status changes to reviewed or resolved ── */
  if (status === "reviewed" || status === "resolved") {
    const statusLabel = status === "resolved" ? "✅ Resolved" : "👀 Under Review";
    const statusColor = status === "resolved" ? "#2d7a4f" : "#c9783a";

    const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#1a1a2e;border-radius:18px 18px 0 0;padding:32px 40px;text-align:center;">
  <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d4a843;">✦ Wanderlust</p>
  <h1 style="margin:0;font-size:24px;color:#ffffff;font-family:Georgia,serif;">Complaint Update</h1>
</td></tr>
<tr><td style="background:#ffffff;padding:36px 40px;">
  <p style="font-size:15px;color:#1a1a2e;">Hi <strong>${complaint.name}</strong> 👋</p>
  <p style="font-size:14px;color:#6b6b7b;line-height:1.7;">
    Your complaint has been updated by our team.
  </p>

  <!-- Status badge -->
  <div style="text-align:center;margin:24px 0;">
    <span style="display:inline-block;background:${statusColor};color:white;font-size:14px;font-weight:700;padding:10px 28px;border-radius:30px;letter-spacing:0.5px;">
      ${statusLabel}
    </span>
  </div>

  <!-- Complaint details -->
  <div style="background:#faf7f2;border:1px solid #e0d8cc;border-radius:12px;padding:18px 22px;margin-bottom:20px;">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b6b7b;">Your Complaint</p>
    <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a1a2e;">${complaint.subject}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#6b6b7b;line-height:1.6;">${complaint.message}</p>
  </div>

  <!-- Admin note if any -->
  ${adminNote ? `
  <div style="background:#fff8ec;border-left:4px solid #c9783a;border-radius:8px;padding:14px 18px;margin-bottom:20px;">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b6b7b;">Message from our team</p>
    <p style="margin:0;font-size:14px;color:#1a1a2e;line-height:1.6;">${adminNote}</p>
  </div>` : ""}

  <p style="font-size:13px;color:#6b6b7b;line-height:1.7;">
    ${status === "resolved"
      ? "Your complaint has been fully resolved. Thank you for helping us maintain quality on Wanderlust."
      : "Our team is actively reviewing your complaint and will take necessary action shortly."}
  </p>
</td></tr>
<tr><td style="background:#1a1a2e;border-radius:0 0 18px 18px;padding:24px 40px;text-align:center;">
  <p style="margin:0;font-size:16px;color:#d4a843;font-family:Georgia,serif;letter-spacing:2px;">WANDERLUST</p>
  <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.35);">Curated Journeys · Extraordinary Experiences</p>
</td></tr>
</table></td></tr></table></body></html>`;

    await sendEmail({
      toEmail: complaint.email,
      toName:  complaint.name,
      subject: `Your Wanderlust complaint is ${statusLabel}`,
      htmlContent: html,
    });
  }

  req.flash("success", "Complaint updated and customer notified.");
  res.redirect("/admin");
}));

/* ── DELETE LISTING (admin) ── */
router.post("/listings/:id/delete", isLoggedIn, isAdmin, wrapAsync(async (req, res) => {
  const listing = await Listing.findByIdAndDelete(req.params.id);
  req.flash("success", `Listing "${listing?.title}" deleted.`);
  res.redirect("/admin");
}));

/* ═══════════════ EMAIL TEMPLATES ═══════════════ */
function approvalEmail(listing) {
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#1a1a2e;border-radius:18px 18px 0 0;padding:32px 40px;text-align:center;">
  <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d4a843;">✦ Wanderlust</p>
  <h1 style="margin:0;font-size:26px;color:#ffffff;font-family:Georgia,serif;">Your Listing is Approved! 🎉</h1>
</td></tr>
<tr><td style="background:#ffffff;padding:36px 40px;">
  <p style="font-size:15px;color:#1a1a2e;">Hi <strong>${listing.owner.username}</strong> 👋</p>
  <p style="font-size:14px;color:#6b6b7b;line-height:1.7;">
    Great news! Your listing has been reviewed and <strong style="color:#2d7a4f;">approved</strong> by our team.
    It is now live on Wanderlust and visible to all guests.
  </p>
  <div style="background:#faf7f2;border:1px solid #e0d8cc;border-radius:12px;padding:20px 24px;margin:24px 0;">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b6b7b;">Listing</p>
    <p style="margin:0;font-size:17px;font-weight:700;color:#1a1a2e;">${listing.title}</p>
    <p style="margin:4px 0 0;font-size:13px;color:#6b6b7b;">${listing.location}, ${listing.country}</p>
  </div>
  <p style="font-size:13px;color:#6b6b7b;line-height:1.7;">
    Guests can now discover and book your property. Make sure your calendar and pricing are up to date!
  </p>
  <div style="text-align:center;margin:28px 0 10px;">
    <a href="${process.env.BASE_URL || 'http://localhost:8080'}/listings"
       style="display:inline-block;background:linear-gradient(135deg,#c9783a,#a85e28);color:white;text-decoration:none;
              padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;">
      View My Listing →
    </a>
  </div>
</td></tr>
<tr><td style="background:#1a1a2e;border-radius:0 0 18px 18px;padding:24px 40px;text-align:center;">
  <p style="margin:0;font-size:16px;color:#d4a843;font-family:Georgia,serif;letter-spacing:2px;">WANDERLUST</p>
  <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.35);">Curated Journeys · Extraordinary Experiences</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function rejectionEmail(listing, reason) {
  return `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#1a1a2e;border-radius:18px 18px 0 0;padding:32px 40px;text-align:center;">
  <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d4a843;">✦ Wanderlust</p>
  <h1 style="margin:0;font-size:26px;color:#ffffff;font-family:Georgia,serif;">Listing Not Approved</h1>
</td></tr>
<tr><td style="background:#ffffff;padding:36px 40px;">
  <p style="font-size:15px;color:#1a1a2e;">Hi <strong>${listing.owner.username}</strong>,</p>
  <p style="font-size:14px;color:#6b6b7b;line-height:1.7;">
    Thank you for submitting your listing to Wanderlust. After review, we were unable to approve it at this time.
  </p>
  <div style="background:#fff5f5;border-left:4px solid #dc3545;border-radius:8px;padding:16px 20px;margin:20px 0;">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#842029;">Reason</p>
    <p style="margin:0;font-size:14px;color:#1a1a2e;line-height:1.6;">${reason || "Did not meet our quality standards."}</p>
  </div>
  <div style="background:#faf7f2;border:1px solid #e0d8cc;border-radius:12px;padding:16px 20px;margin:20px 0;">
    <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a2e;">${listing.title}</p>
    <p style="margin:4px 0 0;font-size:12px;color:#6b6b7b;">${listing.location}, ${listing.country}</p>
  </div>
  <p style="font-size:13px;color:#6b6b7b;line-height:1.7;">
    You are welcome to edit your listing to address the feedback above and resubmit it for review.
    If you believe this decision was made in error, please contact our support team.
  </p>
</td></tr>
<tr><td style="background:#1a1a2e;border-radius:0 0 18px 18px;padding:24px 40px;text-align:center;">
  <p style="margin:0;font-size:16px;color:#d4a843;font-family:Georgia,serif;letter-spacing:2px;">WANDERLUST</p>
  <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.35);">Curated Journeys · Extraordinary Experiences</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

module.exports = router;
