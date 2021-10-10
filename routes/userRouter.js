const router = require("express").Router();
const userCtrl = require("../controllers/userController");
const auth = require("../middleware/authen");
const authAdmin = require("../middleware/authenAdmin");

//MongoDB
router.post("/register", userCtrl.register);

router.post("/login", userCtrl.login);

router.get("/logout", userCtrl.logout);

router.get("/refresh_token", userCtrl.refreshToken);

router.get("/infor", auth, userCtrl.getUser);

router.patch("/update", auth, userCtrl.updateUser);
// router.get("/infor", userCtrl.info);
//admin
router.get("/all_infor", auth, authAdmin, userCtrl.getAllUsers);

//SQLite3
router.post("/register_sqlite", userCtrl.register_sqlite);

router.post("/login_sqlite", userCtrl.login_sqlite);

//OAuth (Google)
router.post("/login_google", userCtrl.loginGoogle);

router.post("/register_google", userCtrl.registerGoogle);

module.exports = router;
