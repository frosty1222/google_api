const { send } = require('express/lib/response');
const User = require('../models/User');
const path = require('path');
const moment = require('moment');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { default: mongoose } = require('mongoose');
const secret = process.env.SECRET_KEY;
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const destinationPath = path.join(__dirname, '..', 'public', 'user');
      cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
      const fileName = `${file.originalname}`;
      cb(null, fileName);
    }
  });
  
const upload = multer({ storage }).single('image');
const ObjectId = mongoose.Types.ObjectId;
class UserController{
    index(req,res){
        UserHasRole.find({})
        .populate('user_id') // Populate the user reference
        .populate('role_id') // Populate the role reference
        .exec((err, userHasRole) => {
          if (err) {
            console.error(err);
          } else {
            if (userHasRole) {
              return res.json({
                success:true,
                user:userHasRole
              })
            } else {
                return res.json({
                    success:true,
                    user:{}
                })
            }
          }
        }); 
    }
    // user login 
    async login(req, res) {
      try {
        const { name, password } = req.body;
        // Validate input here (e.g., check if name and password are provided).
        const domain = "gmail.com";
        const email = `${name}@${domain}`;
        const user = await User.findOne({ email:email });
        if (!user) {
          return res.json({ success: false, message: 'User does not exist.' });
        }
        if(user.status === 'inactive'){
          return res.json({
            success:false,
            message:"Your account has been bloked . please contact the admin"
          })
        }
        const account = await Account.findOne({ userId: user._id});
        if(!account){
          const role = await UserHasRole.findOne({user_id:user._id});
          if(role){
            const roleName = await Role.findById({_id:role.role_id});
            if(roleName){
              const passwordMatch = await bcrypt.compare(password, user.password);
              if (!passwordMatch) {
                return res.json({ success: false, message: 'Invalid email or password' });
              }
        
              const token = jwt.sign(
                { user: { id: user.id, name: user.name, fullName: user.fullName, email: user.email, account,role:roleName.name } },
                secret, // Use environment variable for the secret.
                { expiresIn: '24h' }
              );
        
              return res.json({ success: true, token, message: 'Login successful',role:roleName.name });
            }
          }
        }
        if (account && account.isChangePass === false) {
          const role = await UserHasRole.findOne({user_id:user._id});
          if(role){
            const roleName = await Role.findById({_id:role.role_id});
            if(roleName){
              const passwordMatch = await bcrypt.compare(password, user.password);
              if (!passwordMatch) {
                return res.json({ success: false, message: 'Invalid email or password' });
              }
        
              const token = jwt.sign(
                { user: { id: user.id, name: user.name, fullName: user.fullName, email: user.email, account,role:roleName.name } },
                secret, // Use environment variable for the secret.
                { expiresIn: '24h' }
              );
        
              return res.json({ success: true, token, message: 'Login successful',role:roleName.name });
            }
          }
        } else {
            const role = await UserHasRole.findOne({user_id:user._id});
            if(role){
              const roleName = await Role.findById({_id:role.role_id});
              if(roleName){
                const passwordMatch = await bcrypt.compare(password, user.password);
                if(passwordMatch){
                  const token = jwt.sign(
                    { user: { id: user.id, name: user.name, fullName: user.fullName, email: user.email,account,role:roleName.name,password:user.password } },
                    secret,
                    { expiresIn: '24h' }
                   );
            
                  return res.json({ success: true, token, message: 'Login successful',role:roleName.name });
                }else{
                  return res.json({ success: false, message: 'Invalid email or password' });
                }
               }
            }
        }
      } catch (error) {
        console.error(error);
        return res.json({ success: false, message: 'Internal server error' });
      }
    }
    async signup(req, res) {
        const { name, email, password, fullName, roleId } = req.body;
        const role_id = roleId;
        try {
          // Check if the role with the specified roleId exists
          const role = await Role.findById(roleId);
          if (!role) {
            return res.status(400).json({ success: false, message: 'Role not found' });
          }
      
          // Create a new user
          const newUser = new User({ name, fullName, email, password });
          const savedUser = await newUser.save();
      
          if (!savedUser) {
            return res.status(500).json({ success: false, message: 'User creation failed' });
          }
      
          // Create a new UserHasRole
          const newUserHasRole = new UserHasRole({ role_id, user_id: savedUser._id });
          const savedUserHasRole = await newUserHasRole.save();
          const createNewAccount = new Account({isChangePass:false,isSendFirstEmail:false,blocked:false,userId:savedUser._id,avatar:""});
          await createNewAccount.save();
          if (!savedUserHasRole) {
            // Roll back user creation if UserHasRole creation fails
            await User.findByIdAndRemove(savedUser._id);
            return res.status(500).json({ success: false, message: 'UserHasRole creation failed' });
          }
      
          return res.status(201).json({ success: true, message: 'User created' });
        } catch (error) {
          console.error(error);
          res.status(500).json({ success: false, message: 'User creation failed' });
        }
      }
      
    async checkChangePassWord(req,res){
       const {id} = req.params;
      Account.findOne({userId:id},(err,account)=>{
            if(err){
            console.log(err)
            }
            if(!account){
              return res.json({
                success:true,
                status:false
            })
            }
            if(account){
                if(account.isChangePass === false){
                    return res.json({
                        success:true,
                        status:false
                    })
                }else{
                    return res.json({
                        success:true,
                        status:true
                    })
                }
            }
       })
    }
    // change password
    async changePassword(req, res) {
      const { password, userId } = req.body;
      const saltRounds = 10;
    
      // Create an update object for the password
      const afterhashPass = await bcrypt.hash(password, saltRounds);
      const newPasswordUpdate = {
        password: afterhashPass,
        updatedAt: new Date(),
      };
    
      // Create an update object for the account's isChangePass property
      const isPasswordChanged = { isChangePass: true };
    
      try {
        const newuserId = new ObjectId(userId);
        const updateUserPassword = await User.findOneAndUpdate(
          { _id: newuserId },
          newPasswordUpdate,
          { new: true }
        );
    
        if (updateUserPassword) {
          const accountCheck = await Account.findOne({ userId: updateUserPassword._id });
    
          if (accountCheck !== null) {
            const updateAccount = await Account.findOneAndUpdate(
              { userId: updateUserPassword._id },
              isPasswordChanged,
              { new: true }
            );
    
            if (updateAccount) {
              return res.json({
                success: true,
                message: "You have changed your password successfully",
              });
            } else {
              return res.json({
                success: false,
                message: "Something went wrong with updating the account",
              });
            }
          } else {
            // Create a new account if it doesn't exist
            const newAccount = new Account({
              isChangePass: true, // You can adjust this value as needed
              isSendFirstEmail: false,
              blocked: false,
              userId: updateUserPassword._id,
              avatar: "",
            });
            const saveAccount = await newAccount.save();
    
            if (saveAccount) {
              return res.json({
                success: true,
                message: "You have changed your password successfully",
              });
            } else {
              return res.json({
                success: false,
                message: "Something went wrong with creating the account",
              });
            }
          }
        } else {
          return res.json({
            success: false,
            message: "User not found or password update failed",
          });
        }
      } catch (error) {
        console.error(error);
        return res.json({
          success: false,
          message: "An error occurred while changing the password",
        });
      }
    }
    // check email
    checkEmail(req,res){
        const {email} = req.params;
        User.findOne({email:email},(err,user)=>{
           if(err){
             console.log(err)
           }
           if(user){
              return res.json({
                 success:true,
                 status:true
              })
           }else{
             return res.json({
                 success:true,
                 status:false
              })
           }
        })
     }
     async uploadAvatar(req, res) {
        upload(req, res, async function (err) {
          if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: 'Error uploading file' });
          } else if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal server error' });
          }
      
          if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
          }
      
          const imageUrl = `user/${req.file.filename}`;
          const { userId } = req.body;
          const isoDate = moment().toISOString();
          const updatedAt = { updatedAt: isoDate };
          const avatar = { avatar: imageUrl };
          try {
            // Use await to wait for the asynchronous database update operation to complete
            const updatedAccount = await Account.findOneAndUpdate({ userId: userId }, { $set: { avatar: imageUrl, ...updatedAt } }, { new: true });
      
            if (updatedAccount) {
              // Find the updated account
                Account.findOne({ userId: userId }, (err, account) => {
                if (err) {
                  console.error(err);
                }
                if (account) {
                  return res.json({
                    success: true,
                    message: 'Avatar uploaded successfully',
                    account: account,
                  });
                } else {
                  return res.json({
                    success: false,
                    message: 'Failed to retrieve updated account',
                    account: {},
                  });
                }
              });
            } else {
              return res.json({
                success: false,
                message: 'Failed to update avatar',
                account: {},
              });
            }
          } catch (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
          }
        });
    }
    // get avatar
    getAvatar(req,res){
        const {id} = req.params;
        Account.findOne({userId:id},(err,user)=>{
            if(err){
                console.log(err)
            }
            if(user){
                return res.json({
                    success:true,
                    avatar:user.avatar
                })
            }else{
                return res.json({
                    success:true,
                    avatar:null
                })
            }
        })
    }
    // block account and user 
    async blockAccount(req,res){
      const {id} = req.params;
      const newuserId = new ObjectId(id);
      const updateUser = await User.findOneAndUpdate({ _id: newuserId }, { $set: { status:'inactive' } }, { new: true });
      const checkAccount = await Account.findOne({
        where:{
          userId:id
        }
      })
      if(checkAccount !== null){
        const updateAccount = await Account.findOneAndUpdate({userId:newuserId},{$set:{blocked:true}},{new: true});
        if(updateAccount){
          return res.json({
            success:true,
            message:"user has been blocked"
          })
        }else{
          return res.json({
            success:false,
            message:"something went wrong"
          })
        }
      }else{
        if(updateUser){
          return res.json({
            success:true,
            message:"user has been blocked"
          })
        }else{
          return res.json({
            success:false,
            message:"something went wrong"
          })
        }
      }
    }
    //
    async unlockAccount(req,res){
       const {id} = req.params;
       const newuserId = new ObjectId(id);
       const updateUser = await User.findOneAndUpdate({ _id: newuserId }, { $set: { status:'active' } }, { new: true });
       const updateAccount = await Account.findOneAndUpdate({userId:newuserId},{$set:{blocked:false}},{new: true});
       if(updateUser && updateAccount){
         return res.json({
           success:true,
           message:"user has been unblocked"
         })
       }else{
         return res.json({
           success:false,
           message:"something went wrong"
         })
       }
    }
    // update profile
    async updateProfile(req, res) {
      try {
        const { id, name, email, fullName, password,role } = req.body;
        const newId = new ObjectId(id);
        const saltRounds = 10;
         let afterhashPass = "";
         if(password.length < 50){
            afterhashPass = await bcrypt.hash(password, saltRounds);
         }else{
          afterhashPass = password;
         }
    
        const update = await User.findByIdAndUpdate(
          { _id: newId },
          {
            name: name,
            email: email,
            fullName: fullName,
            password: afterhashPass,
          },
          { new: true }
        );
    
        if (update) {
           const userInfo = await User.findById({_id:newId});
           const account = await Account.findOne({userId:newId});
           if(userInfo){
            const token = jwt.sign(
              { user: { id: userInfo.id, name: userInfo.name, fullName: userInfo.fullName, email: userInfo.email,account,role:role } },
              secret,
              { expiresIn: '24h' }
             );
             return res.status(200).json({
              success: true,
              message: "You have updated your profile successfully",
              token:token
            });
           }
        } else {
          return res.status(500).json({
            success: false,
            message: "Failed to update the profile. User not found or other issues.",
          });
        }
      } catch (error) {
        console.error(error);
        return res.status(500).json({
          success: false,
          message: "Something went wrong during the update process.",
        });
      }
    }
  // asign role
  async assignRole(req,res){
    const {userId,roleId} = req.body;
    const newUserId = new ObjectId(userId);
    const newUserRole = new ObjectId(roleId);
    const add  = new UserHasRole({
         role_id:newUserRole,
         user_id:newUserId
    })
    const save = await add.save();
    if(save){
      return res.json({
        success:true,
        message:"role has been assigned successfully"
      })
    }else{
      return res.json({
        success:true,
        message:"something went wrong"
      })
    }
  }
  // add new role
  async addRole(req,res){
     const {name} = req.body;
     const addRole = new Role({
      name:name
     })
     const saveRole = await addRole.save();
     if(saveRole){
      return res.json({
        success:true,
        message:"role added"
      })
     }else{
      return res.json({
        success:true,
        message:"something went wrong"
      })
     }
  }

   getRoleById(req,res){
      const {id} = req.params;
      const newId = new ObjectId(id);
      Role.findById({_id:newId},(err,role)=>{
          if(err){
            console.log(err)
          }
          if(role){
            return res.json({
              success:true,
              data:role
            })
          }else{
            return res.json({
              success:false,
              data:[]
            })
          }
      })
  }
  // get all users
  getAllUsers(req,res){
    User.find({},(err,user)=>{
      if(err){
        console.log(err)
      }
      if(user){
        return res.json({
          success:true,
          user:user
        })
      }else{
        return res.json({
          success:true,
          user:[]
        })
      }
    })
  }
}
module.exports = new UserController();