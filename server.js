import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path, { dirname, extname } from "path";
import xlsx from "xlsx";
import csvtojson from "csvtojson";
import ExcelJS from "exceljs";
import { fileURLToPath } from "url";
import { User } from "./models/User.js";

mongoose.connect("mongodb://localhost:27017/testExcelDemo");

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, "public")));

// SET HEADER
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type",
    "application/form-data",
    "multipart/form-data"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Multer upload configuration for multiple files
const upload = multer({ storage: storage });

// without any validation
// app.post("/importUser", upload.array("files", 10), async (req, res, next) => {
//   try {
//     if (!req.files || req.files.length === 0) {
//       return res
//         .status(400)
//         .json({ status: 400, success: false, msg: "No files uploaded" });
//     }

//     let userData = [];

//     req.files.forEach(async (file) => {
//       let jsonData = [];

//       // Handle different file types
//       const fileExt = extname(file.originalname).toLowerCase();
//       if (fileExt === ".xlsx" || fileExt === ".xls") {
//         const workbook = xlsx.readFile(file.path);
//         const sheetName = workbook.SheetNames[0];
//         const worksheet = workbook.Sheets[sheetName];
//         jsonData = xlsx.utils.sheet_to_json(worksheet);
//       } else if (fileExt === ".csv") {
//         jsonData = await csvtojson().fromFile(file.path);
//       }

//       jsonData.forEach((row) => {
//         userData.push({
//           name: row.Name,
//           email: row.Email,
//           mobileNumber: row.MobileNumber,
//           city: row.City,
//         });
//       });
//     });

//     await User.insertMany(userData);

//     res.status(200).json({
//       status: 200,
//       success: true,
//       msg: "Data imported successfully",
//       data: userData,
//     });
//   } catch (error) {
//     console.log({ error });
//     res
//       .status(500)
//       .json({ status: 500, success: false, msg: "Internal server error" });
//   }
// });

//  same email and mobile number are not added again to the database
app.post("/importUser", upload.array("files", 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ status: 400, success: false, msg: "No files uploaded" });
    }

    let userData = [];

    for (const file of req.files) {
      let jsonData = [];

      // Handle different file types
      const fileExt = extname(file.originalname).toLowerCase();
      if (fileExt === ".xlsx" || fileExt === ".xls") {
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonData = xlsx.utils.sheet_to_json(worksheet);
      } else if (fileExt === ".csv") {
        jsonData = await csvtojson().fromFile(file.path);
      }

      for (const row of jsonData) {
        // Check if the email or mobile number already exists in the database
        const existingUser = await User.findOne({
          $or: [{ email: row.Email }, { mobileNumber: row.MobileNumber }],
        });

        // If the user with the same email or mobile number doesn't exist, add to userData
        if (!existingUser) {
          userData.push({
            name: row.Name,
            email: row.Email,
            mobileNumber: row.MobileNumber,
            city: row.City,
          });
        }
      }
    }

    // Insert only unique user data
    if (userData.length > 0) {
      await User.insertMany(userData);
    }

    res.status(200).json({
      status: 200,
      success: true,
      msg: "Data imported successfully",
      data: userData,
    });
  } catch (error) {
    console.log({ error });
    res
      .status(500)
      .json({ status: 500, success: false, msg: "Internal server error" });
  }
});

// Define routes to list all user data and export data to Excel

// Define a route to list all user data
app.get("/users", async (req, res) => {
  try {
    // Fetch all user data from the database
    const users = await User.find();

    // Return the user data as JSON response
    res.status(200).json({ status: 200, success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ status: 500, success: false, msg: "Internal server error" });
  }
});

// Define a route to export data to Excel
app.get("/exportToExcel", async (req, res) => {
  try {
    // Fetch all user data from the database
    const users = await User.find();

    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    // Define the headers for the Excel file
    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Mobile Number", key: "mobileNumber", width: 15 },
      { header: "City", key: "city", width: 20 },
    ];

    // Add data rows to the worksheet
    users.forEach((user) => {
      worksheet.addRow({
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        city: user.city,
      });
    });

    // Generate a timestamp for the file name
    const timestamp = new Date().toISOString().replace(/:/g, "-");

    // Set response headers to indicate file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=users_${timestamp}.xlsx`
    );

    // Write the workbook to the response stream
    await workbook.xlsx.write(res);

    // End the response
    res.end();
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    res
      .status(500)
      .json({ status: 500, success: false, msg: "Internal server error" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port: ${process.env.PORT || 3000}`);
});
