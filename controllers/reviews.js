const Listing = require("../models/listing");
const Review = require("../models/review");

// ==================== CREATE REVIEW ====================
module.exports.createReview = async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Review(req.body.review);
  newReview.author = req.user._id;
  listing.reviews.push(newReview);
  await newReview.save();
  await listing.save();

  if (req.headers.accept?.includes("application/json")) {
    return res.json({ success: true, message: "Review created" });
  }

  req.flash("success", "Listing Review Created");
  res.redirect(`/listings/${listing._id}`);
};

// ==================== DELETE REVIEW ====================
module.exports.destroyReview = async (req, res) => {
  let { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  if (req.headers.accept?.includes("application/json")) {
    return res.json({ success: true, message: "Review deleted" });
  }

  req.flash("success", "Review Deleted");
  res.redirect(`/listings/${id}`);
};
