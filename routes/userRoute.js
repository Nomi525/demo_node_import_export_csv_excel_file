// import express from "express";
// import csvtojson from "csvtojson";
// import { User } from "../models/User.js";
// const userRoutes = express();

// userRoutes.post("/importUser", async (req, res, next) => {
//   try {
//     console.log(req.file);
//     let userData = [];
//     // if (!req.file) {
//     //   return res
//     //     .status(400)
//     //     .json({ status: 400, success: false, msg: "No file uploaded" });
//     // }
//     csvtojson()
//       .fromFile(req.file.path)
//       .then(async (res) => {
//         for (let x = 0; x < res.length; x++) {
//           userData.push({
//             name: res[x].name,
//             email: res[x].email,
//             mobileNumber: res[x].mobileNumber,
//             city: res[x].city,
//           });
//         }
//         await User.insertMany(userData);
//         res.status(200).json({ status: 200, success: true, msg: userData });
//       })
//       .catch((error) => {
//         console.log({ error });
//         res
//           .status(400)
//           .json({ status: 400, success: false, msg: error.message });
//       });
//   } catch (error) {
//     console.log({ error });
//     res
//       .status(500)
//       .json({ status: 500, success: false, msg: "Internal server error" });
//   }
// });

// export default userRoutes;
