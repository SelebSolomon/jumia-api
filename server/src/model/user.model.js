// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    DOB: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
      set: (val) => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase(),
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    confirmPassword: {
      type: String,
      required: [true, "Confirm Password is required"],
      select: false, 
    },

    role: {
      type: String,
      enum: ["user",  "admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },
     status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    // Security & password management
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    // Metadata
    lastLoginAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: Date,
  },
  { timestamps: true }
);

// --- Password Hash Middleware ---
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// --- Compare Password ---
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// --- Update passwordChangedAt ---
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.createPasswordResetToken = function () {
  // create the token using crypto built in module
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};


userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // That means the token was created before the password was changed → so the token is invalid (user must log in again).
    return JWTTimestamp < changedTimestamp;
  }
  // False means nothing was changed
  return false;
};


userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.password;
    delete ret.passwordResetExpires;
    delete ret.passwordChangedAt;
    delete ret.passwordResetExpires;
    delete ret.passwordResetToken
    delete ret.phoneVerified
    delete ret.emailVerified
    

    return ret;
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
