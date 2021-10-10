require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const cookieParser = require("cookie-parser");
const morgan = require("morgan");

//const rfs = require("rotating-file-stream");
const fsr = require("file-stream-rotator");
//const fs = require("fs");
//const path = require("path");

const app = express();
app.use(express.json());
app.use(cookieParser());

//var logDirectory = path.join(__dirname, "log");
//fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);
// const rfsStream = rfs.createStream("log.log", {
//   size: "10M", // rotate every 10 MegaBytes written
//   interval: "1d", // rotate daily
//   compress: "gzip", // compress rotated files
// });
// app.use(morgan("dev"), {
//   stream: rfsStream,
// });

const writer = fsr.getStream({
  date_format: "YYYYMMDD",
  filename: "logs-%DATE%.txt",
  frequency: "daily",
  verbose: false,
});

morgan.token("custom", ":http-version (:method) :url => :status");

app.use(
  morgan("combined", {
    stream: writer,
  })
);

//Router
app.use("/user", require("./routes/userRouter"));

// Test port
app.get("/", (req, res) => {
  res.json({ msg: "Welcome my bookstore CHUANG CHUANG" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server1 is running on port:", PORT);
});

//Connect to database (mongodb)
const URI = process.env.MONGODB_URL;
mongoose.connect(URI, (err) => {
  if (err) throw err;
  console.log("Connect to MongoDB success");
});

//SQLite3
// const sqlite3 = require("./models/userModel-sqlite");
// sqlite3.connect("./models/db.sqlite3", (err) => {
//   if (err) throw err;
//   console.log("Connect to SQLite3 success");
// });
