const Users = require("../models/userModel");

const authAdmin = async (req, res, next) => {
  try {
    //Get user infor by id
    const user = await Users.findOne({ _id: req.user.id });
    if (user.role === 0)
      return res
        .status(400)
        .json({ msg: "Access denied. This is Admin systems" });
    next();
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
module.exports = authAdmin;
