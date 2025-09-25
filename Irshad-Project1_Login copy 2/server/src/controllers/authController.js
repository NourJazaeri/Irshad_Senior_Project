/*import jwt from "jsonwebtoken";
import Employee from "../models/Employees.js";
import Admin from "../models/Admin.js";
// import Supervisor and Trainee models similarly if needed

// Helper: Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { userID: user.userID, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

export const login = async (req, res) => {
  try {
    const { role, email, password } = req.body;

    if (!role || !email || !password) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    // 1️⃣ Check Employee collection
    const employee = await Employee.findOne({ email, password }); // In production, use hashed password
    if (!employee) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 2️⃣ Check role collection
    let roleModel;
    switch (role.toLowerCase()) {
      case "admin":
        roleModel = Admin;
        break;
      // case "supervisor": roleModel = Supervisor; break;
      // case "trainee": roleModel = Trainee; break;
      default:
        return res.status(400).json({ message: "Invalid role" });
    }

    const roleRecord = await roleModel.findOne({ userID: employee.userID });
    if (!roleRecord) {
      return res.status(403).json({ message: `User is not assigned as ${role}` });
    }

    // 3️⃣ Generate token
    const token = generateToken({ userID: employee.userID, email: employee.email, role });

    // 4️⃣ Return success response
    res.json({
      message: "Login successful",
      token,
      user: {
        userID: employee.userID,
        fname: employee.fname,
        lname: employee.lname,
        email: employee.email,
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  // For JWT, logout can be handled client-side by deleting the token
  res.json({ message: "Logout successful" });
};
*/