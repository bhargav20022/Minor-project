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


module.exports=router;
