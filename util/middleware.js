const secret =process.env.SECRET_KEY;
const express = require('express');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
module.exports = { 
  TokenCheckMiddleware:async (req, res, next) => {
    const authHeader = req.headers['authorization'];
     if(!req.headers['authorization']){
        return next(createError.Unauthorized());
     }else{
      const token = authHeader.split(' ')[1];
      await jwt.verify(token,secret,(err,payload)=>{
          if(err){
           return next(createError.Unauthorized());
          }
             req.payload = payload;
             next();
      })
     }
  }
}