import mongoose from "mongoose";
const DB_URI = process.env.MONGODB_URI || "mongodb://root:OaD7eI7J3wP7QGkH@ac-s7n3jdf-shard-00-00.dshblp1.mongodb.net:27017,ac-s7n3jdf-shard-00-01.dshblp1.mongodb.net:27017,ac-s7n3jdf-shard-00-02.dshblp1.mongodb.net:27017/Jewar?ssl=true&replicaSet=atlas-2y422f-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";
await mongoose.connect(DB_URI);
const db = mongoose.connection.db;
const orders = await db.collection('orders').find({"delivery_offers.status": "proposed"}).toArray();
for(const o of orders) {
    console.log("Order:", o._id);
    console.log("Status:", o.order_status);
    console.log("Offers:", o.delivery_offers);
}
process.exit(0);
