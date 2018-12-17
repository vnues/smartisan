
const mongoose    = require('mongoose')
const User        = require('./../models/user')
mongoose.connect('mongodb://127.0.0.1:27017/mymall', {useMongoClient: true})

function initAdmin() {
    return new Promise(resolve => {
        User.create({
            "userId": "9527",
            "name": "陈二狗",
            "avatar": "http://osc9sqdxe.bkt.clouddn.com/defaultAvatar.jpg",
            "userName": "admin",
            "userPwd": "admin",
            "orderList": [],
            "cartList": [],
            "addressList": []
        }, (err) => {
            if (err) console.log('发生错误');
            resolve()
        })
    })
}
module.exports = initAdmin