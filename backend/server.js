import "./src/config/env.js"

import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { connectRedis } from "./src/config/redis.js";

export const startServer = async() => {
     const PORT = process.env.PORT || 3000;

    await connectDB();
    
    //redis database for caching i.e nothing but storing data for fast fetching for temporary puspose
    await connectRedis();

     app.listen(PORT, () => {
       console.log(`Server is running on port ${PORT}`);
     });
}

startServer();
