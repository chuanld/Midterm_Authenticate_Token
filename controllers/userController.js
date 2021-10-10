require("dotenv").config();
const Users = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Users_SQLite = require("../models/userModel-sqlite");

const { google } = require("googleapis");
const { OAuth2 } = google.auth;

const client = new OAuth2(process.env.MAILING_SERVICE_CLIENT_ID);

const userCtrl = {
  register: async (req, res) => {
    try {
      // const { email, password, name } = req.body;

      // const check = await Users.findOne({ email });
      // if (check)
      //   return res.status(400).json({ msg: "Email is already exist!" });
      // if (password.length < 6)
      //   return res
      //     .status(400)
      //     .json({ msg: "Password must be least 6 character!" });

      // const newUser = new Users({
      //   email,
      //   password,
      //   name,
      // });
      // await newUser.save();
      // res.json({ msg: "Register successfully" });

      const { name, email, address, password } = req.body;
      const user = await Users.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: "The email is already exist" }); //Check exist
      }

      //Check password
      if (password.length < 6)
        return res
          .status(400)
          .json({ msg: "Password is at least 6 characters" });

      //Encode password
      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = new Users({
        name,
        email,
        address,
        password: passwordHash,
      });

      //Save on cloud MongoDB
      await newUser.save();

      //Using jwt to authentication
      // const accesstoken = createAccessToken({ id: newUser._id });
      // const refreshtoken = createRefreshToken({ id: newUser._id });
      // res.cookie("refreshtoken", refreshtoken, {
      //   httpOnly: true,
      //   path: "/user/refresh_token",
      // });

      res.json({ msg: "Register successfully!" });
    } catch (err) {
      return res.status(500).json({ msg: err.messenge });
    }
  },
  login: async (req, res) => {
    try {
      // const { email, password } = req.body;
      // const user = await Users.findOne({ email });
      // if (!user) return res.status(400).json({ msg: "User does not exist!" });
      // if (password !== user.password) {
      //   return res.status(400).json({ msg: "Sign in failed! Try again" });
      // }
      // res.json({ msg: "Login success" });

      const { email, password } = req.body;

      const user = await Users.findOne({ email });
      if (!user) return res.status(400).json({ msg: "User does not exist" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res
          .status(400)
          .json({ msg: "Sign in failed. Please try again!" });

      // If login success, create access token and refresh token
      const accesstoken = createAccessToken({ id: user._id });
      const refreshtoken = createRefreshToken({ id: user._id });

      res.cookie("refreshtoken", refreshtoken, {
        httpOnly: true,
        path: "/user/refresh_token",
      });

      res.json({ msg: "Login Successfully!", accesstoken, refreshtoken });
    } catch (err) {
      return res.status(500).json({ msg: err.messenge });
    }
  },
  logout: async (req, res) => {
    try {
      res.clearCookie("refreshtoken", { path: "/user/refresh_token" });
      return res.json({ msg: "Logout success" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  refreshToken: (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;
      if (!rf_token)
        return res.status(400).json({ msg: "Please login or register" });

      jwt.verify(
        rf_token,
        process.env.REFRESH_TOKEN_SECRET,
        function (err, user) {
          if (err)
            return res.status(400).json({ msg: "Please login or register" });
          const accesstoken = createAccessToken({ id: user.id });
          res.json({ accesstoken });
        }
      );
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  getUser: async (req, res) => {
    try {
      const user = await Users.findById(req.user.id).select("-password");
      if (!user) return res.status(400).json({ msg: "User does not exist" });

      res.json(user);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  updateUser: async (req, res) => {
    try {
      const { name, address, phone } = req.body;
      await Users.findOneAndUpdate(
        { _id: req.user.id },
        {
          name,
          address,
          phone,
        }
      );
      res.json({ msg: "Update infomation successfully!" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  getAllUsers: async (req, res) => {
    try {
      const users = await Users.find();
      res.json(users);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  //sqlite
  register_sqlite: async (req, res) => {
    try {
      const { email, password, name } = req.body;

      const user = await Users_SQLite.read(email);
      if (user) return res.status(400).json({ msg: "Email is already exist" });

      const newUser = await Users_SQLite.create(email, name, password);

      res.json({ msg: "User has been created" });
    } catch (err) {
      return res.status(500).json({ msg: err.messenge });
    }
  },
  login_sqlite: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await Users_SQLite.read(email);

      if (!user) return res.status(400).json({ msg: "User Not Found" });
      console.log(user);
      if (user.password !== password)
        return res.status(400).json({ msg: "Sign in fail. Please try again" });

      res.status(400).json({ msg: "Login successfully!" });
    } catch (err) {
      return res.status(500).json({ msg: err.messenge });
    }
  },
  //OAuth
  loginGoogle: async (req, res) => {
    try {
      const { tokenId } = req.body;
      const verify = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.MAILING_SERVICE_CLIENT_ID,
      });

      console.log(verify);
      const { email_verified, email, name } = verify.payload;
      const password = email + process.env.GOOGLE_SECRET;

      if (!email_verified)
        return res.status(400).json({ msg: "Email verification fail!!" });

      const user = await Users.findOne({ email });
      if (user) {
        if (password !== user.password)
          return res.status(400).json({ msg: "Password is inccorect!" });

        const accesstoken = createAccessToken({ id: user._id });
        const refreshtoken = createRefreshToken({ id: user._id });

        res.cookie("refreshtoken", refreshtoken, {
          httpOnly: true,
          path: "/user/refresh_token",
        });

        res.json({ msg: "Login Successfully!", accesstoken, refreshtoken });
      } else {
        res.status(400).json({ msg: "Email doesn't exist. Please register!" });
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  registerGoogle: async (req, res) => {
    try {
      const { tokenId } = req.body;
      const verify = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.MAILING_SERVICE_CLIENT_ID,
      });

      console.log(verify);
      const { email_verified, email, name } = verify.payload;
      const password = email + process.env.GOOGLE_SECRET;

      if (!email_verified)
        return res.status(400).json({ msg: "Email verification fail!!" });

      const user = await Users.findOne({ email });
      if (user) {
        res.status(400).json({ msg: "Email already exist" });
      } else {
        const newUser = new Users({
          email,
          name,
          password,
        });
        await newUser.save();

        res.json({
          msg: "Register successfully. Let's sign in",
        });
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

const createAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
};
const createRefreshToken = (user) => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

module.exports = userCtrl;
