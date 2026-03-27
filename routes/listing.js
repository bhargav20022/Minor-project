const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");

const Listing= require("../models/listing.js");
const { isLoggedIn, isOwner, validateListing, isAdmin } = require("../middleware.js");


const listingController=require("../controllers/listings.js");
const multer=require("multer");
const {storage} = require("../cloudConfig.js");
const upload=multer({storage})


router.route("/")
.get(wrapAsync(listingController.index))
.post(
    isLoggedIn,
    upload.single('listing[image]'),
    validateListing,
    wrapAsync(listingController.createListing)
);

//new route
router.get("/new", isLoggedIn,listingController.renderNewForm);


// Your existing delete route — REPLACE it with this:
router.route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single('listing[image]'),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(
    isLoggedIn,
    async (req, res, next) => {
      // Allow if owner OR admin
      const listing = await require("../models/listing.js").findById(req.params.id);
      if (!listing) return next(new ExpressError(404, "Listing not found"));
      const isOwnerUser = listing.owner.equals(req.user._id);
      const isAdminUser = req.user.isAdmin;
      if (!isOwnerUser && !isAdminUser) {
        req.flash("error", "You don't have permission to delete this listing.");
        return res.redirect(`/listings/${req.params.id}`);
      }
      next();
    },
    wrapAsync(listingController.destroyListing)
  );


//edit route
router.get("/:id/edit", isLoggedIn,isOwner,wrapAsync(listingController.renderEditForm));




// Contact Owner
router.post("/:id/contact", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("owner");
    const { message } = req.body;
    const guestName = req.user.username;
    const guestEmail = req.user.email;
    const ownerEmail = listing.owner.email;
    const listingTitle = listing.title;

    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#1a1a2e;border-radius:18px 18px 0 0;padding:32px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d4a843;">✦ Wanderlust</p>
            <h1 style="margin:0;font-size:24px;color:#ffffff;font-family:Georgia,serif;">New Message from a Guest</h1>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;padding:36px 40px;">
            <p style="font-size:15px;color:#1a1a2e;">Hi <strong>${listing.owner.username}</strong> 👋</p>
            <p style="font-size:14px;color:#6b6b7b;line-height:1.7;">
              Someone is interested in your listing <strong>${listingTitle}</strong> and sent you a message:
            </p>
            <div style="background:#faf7f2;border-left:4px solid #c9783a;border-radius:8px;padding:16px 20px;margin:20px 0;">
              <p style="margin:0;font-size:15px;color:#1a1a2e;line-height:1.7;">${message}</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border-radius:10px;padding:16px 20px;border:1px solid #e0d8cc;margin-bottom:24px;">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b6b7b;">Guest Name</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#1a1a2e;">${guestName}</p>
                </td>
              </tr>
              <tr><td style="padding-top:12px;">
                  <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#6b6b7b;">Guest Email</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#c9783a;">${guestEmail}</p>
              </td></tr>
            </table>
            <p style="font-size:13px;color:#6b6b7b;line-height:1.7;">
              Simply reply to this email and your message will go directly to <strong>${guestName}</strong>. 🌍
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#1a1a2e;border-radius:0 0 18px 18px;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:18px;color:#d4a843;font-family:Georgia,serif;letter-spacing:2px;">WANDERLUST</p>
            <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.35);">Curated Journeys · Extraordinary Experiences</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const { sendEmail } = require("../brevo");
    await sendEmail({
      toEmail: ownerEmail,
      toName: listing.owner.username,
      subject: `New message about your listing – ${listingTitle}`,
      htmlContent,
      replyTo: { email: guestEmail, name: guestName }, // ✅ owner hits reply → goes to guest
    });

    req.flash("success", "Your message has been sent to the owner! ✅");
    res.redirect(`/listings/${listing._id}`);
  } catch (err) {
    console.error(err);
    req.flash("error", "Could not send message. Please try again.");
    res.redirect("back");
  }
});


module.exports=router;
