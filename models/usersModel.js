import mongoose, { Schema } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';

const userSchema = new Schema(
   {
      firstname: {
         type: String,
         required: [true, 'User first name is required'],
         minlength: [3, 'First name must be at least 3 characters'],
      },
      lastname: {
         type: String,
         required: [true, 'User last name is required'],
         minlength: [3, 'Last name must be at least 3 characters'],
      },
      email: {
         type: String,
         required: [true, 'User email is required'],
         unique: true,
         lowercase: true,
         validate: [validator.isEmail, 'Please enter a valid email'],
      },
      password: {
         type: String,
         required: [true, 'Password is required'],
         minlength: [10, 'Password must be at least 10 characters'],
         select: false,
      },
      confirmPassword: {
         type: String,
         required: [true, 'Confirm password is required'],
         validate: {
            validator: function (val) {
               return val === this.password;
            },
            message: 'Passwords do not match',
         },
      },
      role: {
         type: String,
         enum: {
            values: ['admin', 'instructor', 'student'],
            message: 'Role must be admin, instructor or student',
         },
         default: 'student',
      },
      phone: String,
      avatar: {
         type: String,
         default:
            'https://res.cloudinary.com/dzcjymfa3/image/upload/v1764872164/5da8b2bf-3bee-4eee-b2c9-009979981263.png',
      },
      passwordUpdatedAt: Date,
      passwordResetToken: String,
      passwordResetExpires: Date,
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

userSchema.virtual('courses', {
   ref: 'Course',
   foreignField: 'instructor',
   localField: '_id',
});

userSchema.pre('save', async function () {
   if (!this.isModified('password')) return;

   this.password = await bcrypt.hash(this.password, 12);
   this.confirmPassword = undefined;
});

// INSTANCE METHODS
userSchema.methods.checkPassword = async function (
   candidatePassword,
   savedPassword
) {
   return await bcrypt.compare(candidatePassword, savedPassword);
};

const userModel = mongoose.model('User', userSchema);
export default userModel;
