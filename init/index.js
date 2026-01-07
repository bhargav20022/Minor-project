const mongoose=require("mongoose");
const initData=require("./data.js");
const Listing=require("../models/listing.js");

const MONGO_URL="mongodb://127.0.0.1:27017/wander";

main()
    .then(() => {
        console.log("connected to Db");
    })
    .catch((err) => {
        console.log(err);
    });


async function main() {
    await mongoose.connect(MONGO_URL);

}


const initDB = async () => {
    await Listing.deleteMany({});
    initData.data=initData.data.map((obj) => ({
        ...obj,
        owner:"6953b5a97a885e4146d7e24c",
    }));
    await Listing.insertMany(initData.data);
    console.log("data was intialized");
};

initDB();