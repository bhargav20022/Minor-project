const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


// ==================== INDEX ====================
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};


// ==================== NEW FORM ====================
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};


// ==================== SHOW LISTING ====================
module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested doesn't exist");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};


// ==================== CREATE LISTING ====================
module.exports.createListing = async (req, res) => {
  // Mapbox Geocoding
  const geoResponse = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1,
    })
    .send();

  const newListing = new Listing(req.body.listing);

  // Image upload (Cloudinary)
  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  // Geometry from Mapbox
  if (geoResponse.body.features.length) {
    newListing.geometry = geoResponse.body.features[0].geometry;
  }

  newListing.owner = req.user._id;

  await newListing.save();

  req.flash("success", "New listing created successfully!");
  return res.redirect("/listings");
};


// ==================== EDIT FORM ====================
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing you requested doesn't exist");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};


// ==================== UPDATE LISTING ====================
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findByIdAndUpdate(
    id,
    { ...req.body.listing },
    { new: true }
  );

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
    await listing.save();
  }

  req.flash("success", "Listing updated successfully!");
  return res.redirect(`/listings/${id}`);
};


// ==================== DELETE LISTING ====================
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;

  await Listing.findByIdAndDelete(id);

  req.flash("success", "Listing deleted successfully!");
  return res.redirect("/listings");
};
