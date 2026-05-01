const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// ==================== INDEX ====================
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({ status: "approved" });

  if (req.headers.accept?.includes("application/json")) {
    return res.json({ success: true, listings: allListings });
  }

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
    if (req.headers.accept?.includes("application/json")) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }
    req.flash("error", "Listing you requested doesn't exist");
    return res.redirect("/listings");
  }

  if (req.headers.accept?.includes("application/json")) {
    return res.json({ success: true, listing });
  }

  res.render("listings/show.ejs", { listing });
};

// ==================== CREATE LISTING ====================
module.exports.createListing = async (req, res) => {
  const newListing = new Listing(req.body.listing);
  newListing.status = "pending";

  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  try {
    const geoResponse = await geocodingClient
      .forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
      .send();

    if (geoResponse.body.features.length) {
      newListing.geometry = geoResponse.body.features[0].geometry;
    }
  } catch (err) {
    console.log("Geocoding failed (map won't show):", err.message);
  }

  newListing.owner = req.user._id;
  await newListing.save();

  if (req.headers.accept?.includes("application/json")) {
    return res.json({ success: true, listing: newListing });
  }

  req.flash("success", "Listing submitted for review! You'll be notified by email once approved.");
  res.redirect("/listings/my-listings");
};

// ==================== EDIT FORM ====================
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    if (req.headers.accept?.includes("application/json")) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }
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

  try {
    const geoResponse = await geocodingClient
      .forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
      })
      .send();

    if (geoResponse.body.features.length) {
      listing.geometry = geoResponse.body.features[0].geometry;
      await listing.save();
    }
  } catch (err) {
    console.log("Geocoding failed on update:", err.message);
  }

  if (req.headers.accept?.includes("application/json")) {
    return res.json({ success: true, listing });
  }

  req.flash("success", "Listing updated successfully!");
  return res.redirect(`/listings/${id}`);
};

// ==================== DELETE LISTING ====================
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);

  if (req.headers.accept?.includes("application/json")) {
    return res.json({ success: true, message: "Listing deleted successfully!" });
  }

  req.flash("success", "Listing deleted successfully!");
  return res.redirect("/listings");
};

// ==================== MY LISTINGS ====================
module.exports.myListings = async (req, res) => {
  const myListings = await Listing.find({ owner: req.user._id });

  if (req.headers.accept?.includes("application/json")) {
    return res.json({ success: true, listings: myListings });
  }

  res.render("listings/my-listings.ejs", { myListings });
};
