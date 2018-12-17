const express = require('express')
const router = express.Router()
const fs = require('fs');
const qn = require('qn');

const User = require('../models/user');
const Good = require('../models/goods');
require('./../util/dateFormat')
// 空间名
const bucket = 'avatar-img-d';
// 七牛云
const client = qn.create({
    accessKey: 'n83SaVzVtzNbZvGCz0gWsWPgpERKp0oK4BtvXS-Y',
    secretKey: '1Uve9T2_gQX9pDY0BFJCa1RM_isy9rNjfC4XVliW',
    bucket: bucket,
    origin: 'http://ouibvkb9c.bkt.clouddn.com'
})

// 登陆接口
router.post('/login', async (req, res) => {

    let {userName, userPwd} = req.body;
    const doc = await User.findOne({userName, userPwd});

    try {
        if (doc) {
            const {userId, name, avatar} = doc
            res.cookie("userId", userId, {
                path: '/',
                maxAge: 1000 * 60 * 60
            });
            res.json({
                status: '0',
                msg: '登陆成功',
                result: {
                    name,
                    avatar
                }
            })
        } else {
            res.json({
                status: '1',
                msg: '账号或者密码错误',
                result: ''
            })
        }
    } catch (err) {
        res.json({
            status: '1',
            msg: err.message,
            result: ''
        })
    }

})

// 登出登陆
router.post('/loginOut', (req, res) => {
    res.cookie("userId", "", {
        path: "/",
        maxAge: -1
    });
    res.json({
        status: "0",
        msg: '',
        result: ''
    })
})

// 注册账号
router.post('/register', async (req, res) => {
    const {userName, userPwd} = req.body;
    try {
        const doc = await User.findOne({userName})
        if (doc) {
            res.json({
                status: '1',
                msg: '账号已存在!',
                result: ''
            })
        } else {
            let r1 = Math.floor(Math.random() * 10);
            let r2 = Math.floor(Math.random() * 10);
            let userId = `${r1}${(Date.parse(new Date())) / 1000}${r2}`
            // 可以注册
            User.insertMany({
                avatar: 'http://osc9sqdxe.bkt.clouddn.com/default-user-avatar.png',
                name: '皮皮虾',
                cartList: [],
                orderList: [],
                addressList: [],
                userName,
                userId,
                userPwd
            })
            res.json({
                status: '0',
                msg: '注册成功',
                result: ''
            })
        }

    } catch (err) {
        res.json({
            status: '1',
            msg: err.message,
            result: ''
        })
    }
})

// 上传图片
router.post('/upload',  (req, res, next) => {
    // 图片数据流
    var imgData = req.body.imgData;
    // 构建图片名
    var fileName = Date.now() + '.png';
    // 构建图片路径
    var filePath = './image/' + fileName;
    // 过滤data:URL
    var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
    var dataBuffer = new Buffer(base64Data, 'base64');
    try {
        fs.writeFile(filePath, dataBuffer, function (err) {
            if (err) {
                res.end(JSON.stringify({status: '102', msg: '文件写入失败'}));
            } else {
                client.uploadFile(filePath, {key: `/avatar/${fileName}`}, function (err1, result) {

                    res.json({
                        status: '0',
                        result: {
                            path: result.url
                        },
                        msg: 'suc'
                    })
                    
                    // 上传之后删除本地文件
                    fs.unlinkSync(filePath);
                });
            }
        })
    } catch (err) {
        res.json({
            status: '1',
            msg: err.message
        });
    }

})

// 修改头像
router.post('/updateheadimage', function (req, res, next) {
    var userId = req.cookies.userId;
    var imageSrc = req.body.imageSrc;
    if (userId && imageSrc) {
        User.update({"userId": userId},
            {
                "avatar": imageSrc
            }, (err, doc) => {
                if (err) {
                    res.json({
                        status: '1',
                        msg: err.message,
                        result: ''
                    })
                } else {
                    res.json({
                        status: '0',
                        msg: '',
                        result: '修改成功'
                    });
                }
            })
    } else {
        res.json({
            status: '1',
            msg: '未登录或者缺少所需参数',
            result: ''
        })
    }
});

// 获取用户信息
router.post('/userInfo', async (req, res) => {
    const {userId} = req.cookies
    if (userId) {
        let {name, avatar} = await  User.findOne({userId})
        res.json({
            status: 0,
            msg: 'suc',
            result: {
                name
            }
        })
    } else {
        res.json({
            status: 1,
            msg: '未登录',
            result: ''
        })
    }
})

// 获取购物车
router.post('/cartList', async (req, res) => {
    const {userId} = req.cookies;
    if (userId) {
        // 去查用户名下的
        const userDoc = await User.findOne({userId});
        if (userDoc) {
            const {cartList} = userDoc
            res.json({
                status: '1',
                msg: "suc",
                count: cartList.length,
                result: cartList
            })
        } else {
            res.json({
                status: 0,
                msg: "用户不存在",
                result: ''
            })
        }

    } else {
        res.json({
            status: '0',
            msg: '未登录',
            result: ''
        })
    }
})
// 修改数量
router.post('/cartEdit', function (req, res) {
    let userId = req.cookies.userId,
        productId = req.body.productId,
        productNum = req.body.productNum > 10 ? 10 : req.body.productNum,
        checked = req.body.checked;
    if (userId) {
        User.update({
            "userId": userId,
            "cartList.productId": productId
        }, {
            "cartList.$.productNum": productNum,
            "cartList.$.checked": checked,
        }, (err, doc) => {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                });
            } else {
                res.json({
                    status: '0',
                    msg: '',
                    result: 'suc'
                });
            }
        })
    }

})
// 全选
router.post('/editCheckAll', function (req, res) {
    let userId = req.cookies.userId,
        checkAll = req.body.checkAll ? '1' : '0';
    User.findOne({
        userId
    }, function (err, doc) {
        if (err) {
            res.json({
                status: '0',
                msg: err.message,
                result: ''
            })
        } else {
            if (doc) {
                doc.cartList.forEach(item => {
                    item.checked = checkAll
                })
                doc.save(function (err1, doc) {
                    if (err1) {
                        res.json({
                            status: '1',
                            msg: err1,
                            message,
                            result: ''
                        });
                    } else {
                        res.json({
                            status: '0',
                            msg: '',
                            result: 'suc'
                        });
                    }
                })
            }
        }
    })
})
// 删除购物车
router.post('/cartDel', function (req, res) {
    let userId = req.cookies.userId,
        productId = req.body.productId;
    User.update({
        userId
    }, {
        $pull: {
            'cartList': {
                'productId': productId
            }
        }
    }, function (err, doc) {
        if (err) {
            res.json({
                status: '1',
                msg: err.message,
                result: ''
            });
        } else {
            res.json({
                status: '0',
                msg: '',
                result: 'suc'
            });
        }
    })
})
// 获取地址
router.post('/addressList', function (req, res) {

    let userId = req.cookies.userId,

        addressId = req.body.addressId || ''; // 地址id
    if (userId) {
        User.findOne({
            userId
        }, function (err, doc) {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                })
            } else {
                let addressList = doc.addressList;
                if (addressId) {
                    addressList.forEach(item => {
                        if (item.addressId == addressId) {
                            addressList = item
                        }
                    })
                }
                res.json({
                    status: '0',
                    msg: 'suc',
                    result: addressList
                })
            }
        })
    }
})
// 更新地址
router.post('/addressUpdate', function (req, res) {
    let userId = req.cookies.userId,
        addressId = req.body.addressId, // 地址id
        userName = req.body.userName,
        tel = req.body.tel,
        streetName = req.body.streetName,
        isDefault = req.body.isDefault || false;
    if (userId && addressId && userName && tel && streetName) {
        User.findOne({
            userId
        }, (err, userDoc) => {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                })
            } else {
                let addressList = userDoc.addressList;
                if (isDefault) { // 如果修改了默认地址
                    addressList.forEach((item, i) => {
                        if (item.addressId === addressId) {
                            item.isDefault = true;
                            item.userName = userName;
                            item.tel = tel;
                            item.streetName = streetName;
                        } else {
                            item.isDefault = false;
                        }
                    })
                    // 保存数据
                    userDoc.save((err1, doc1) => {
                        if (err1) {
                            res.json({
                                status: '1',
                                msg: err1.message,
                                result: ''
                            })
                        } else {
                            res.json({
                                status: '0',
                                msg: 'suc1',
                                result: ''
                            })
                        }
                    })
                } else {
                    User.update({
                        "addressList.addressId": addressId
                    }, {
                        "addressList.$.userName": userName,
                        "addressList.$.tel": tel,
                        "addressList.$.streetName": streetName
                    }, (err2, doc2) => {
                        if (err2) {
                            res.json({
                                status: '0',
                                msg: err2.message,
                                result: ''
                            })
                        } else {
                            res.json({
                                status: '0',
                                msg: 'suc2',
                                result: ''
                            })
                        }
                    })

                }
            }
        })
    } else {
        res.json({
            status: '1',
            msg: '缺少必须参数',
            result: ''
        })
    }
})
// 添加地址
router.post('/addressAdd', function (req, res) {
    console.log(req.body)
    let userId = req.cookies.userId,
        userName = req.body.userName,
        tel = req.body.tel,
        streetName = req.body.streetName,
        isDefault = req.body.isDefault || false;
    if (userId && userName && tel && streetName) {
        User.findOne({
            userId
        }, (err, doc) => {
            console.log(doc)
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                })
            } else {
                let addressList = doc.addressList
                if (isDefault) {
                    addressList.forEach((item, i) => {
                        item.isDefault = false;
                    })
                }
                addressList.push({
                    addressId: parseInt(Date.parse(new Date())),
                    userName,
                    tel,
                    streetName,
                    isDefault: isDefault
                })

            //少了这个
            //更新完数据库的数据（不是Model）记得保存
               doc.addressList=addressList
                doc.save((err1, doc1) => {
                   
                    if (err1) {
                        res.json({
                            status: '1',
                            msg: err1.message,
                            result: ''
                        })
                    } else {
                        res.json({
                            status: '0',
                            msg: 'suc',
                            result: ''
                        })
                    }
                })
            }
        })
    } else {
        res.json({
            status: '1',
            msg: '缺少必须参数',
            result: ''
        })
    }
})
// 地址删除
router.post('/addressDel', function (req, res) {
    let userId = req.cookies.userId,
        addressId = req.body.addressId;
    if (userId && addressId) {
        User.update({
            userId
        }, {
            $pull: {
                'addressList': {
                    'addressId': addressId
                }
            }
        }, (err, doc) => {
            if (err) {
                res.json({
                    status: '1',
                    msg: err.message,
                    result: ''
                });
            } else {
                res.json({
                    status: '0',
                    msg: '',
                    result: 'suc'
                });
            }
        })
    } else {
        res.json({
            status: '1',
            msg: '缺少必须参数',
            result: ''
        })
    }

})

// 生成订单
router.post('/payMent', async (req, res) => {
    try {
        let {addressId, orderTotal, productId, productNum} = req.body
        const {userId} = req.cookies
        // 是否登录
        if (userId) {
            // 需要地址id 以及 订单价格
            if (addressId && orderTotal) {
                let userDoc = await User.findOne({userId});
                let userAddress = {},
                    goodsList = [];
                const {addressList, cartList} = userDoc
                // 地址信息
                addressList.forEach(item => {
                    if (item.addressId == addressId) {
                        userAddress = item
                    }
                })

                // 生成订单号
                let platform = '618';
                let r1 = Math.floor(Math.random() * 10);
                let r2 = Math.floor(Math.random() * 10);
                let sysDate = new Date().Format('yyyyMMddhhmmss');
                let createDate = new Date().Format('yyyy-MM-dd hh:mm:ss');
                let orderId = platform + r1 + sysDate + r2;
                let order = {
                    orderId: orderId,
                    orderTotal: orderTotal,
                    addressInfo: userAddress,
                    goodsList: goodsList,
                    orderStatus: '1',
                    createDate: createDate
                };

                if (productId && productNum) {
                    let goodsDoc = await Good.findOne({productId})

                    let item = {
                        productId: goodsDoc.productId,
                        productImg: goodsDoc.productImageBig,
                        productName: goodsDoc.productName,
                        checked: '1',
                        productNum,
                        productPrice: goodsDoc.salePrice
                    }

                    goodsList.push(item)
                    cb()

                } else {
                    // 获取用户购物车的购买商品
                    cartList.forEach((item) => {
                        if (item.checked == '1') {
                            goodsList.push(item);
                        }
                    });
                    cb()
                }

                function cb() {
                    //清空购物车 但是清空完后再选购商品呢
                    userDoc.cartList = [];
                    let orderList= userDoc.orderList

                    orderList.push(order);
                    userDoc.orderList= orderList
                    userDoc.save(function (err1, doc1) {
                        if (err1) {
                            res.json({
                                status: 1,
                                msg: err.message,
                                result: ''
                            });
                        } else { // 保存
                            res.json({
                                status: 0,
                                msg: '',
                                result: {
                                    orderId: order.orderId,
                                    orderTotal: order.orderTotal
                                }
                            });
                        }
                    });
                }

            } else {
                res.json({
                    status: 0,
                    msg: '缺少必须参数',
                    result: ''
                })
            }
        } else {
            res.json({
                status: 1,
                msg: '未登录',
                result: ''
            })
        }
    } catch (err) {
        res.json({
            status: 1,
            msg: err.message,
            result: ''
        })
    }


})
// 查询订单
router.post('/orderList', async (req, res) => {
    const {userId} = req.cookies
    if (userId) {
        try {
            const doc = await User.findOne({userId})
            if (doc) {
                let orderList = doc.orderList,
                    msg = 'suc';
                if (orderList.length <= 0) {
                    msg = '该用户暂无订单'
                }
                res.json({
                    status: 0,
                    msg: msg,
                    result: orderList
                })
            } else {
                res.json({
                    status: 0,
                    msg: "用户不存在",
                    result: ''
                })
            }
        } catch (err) {
            res.json({
                status: 1,
                msg: err.message,
                result: ''
            })
        }
    }
})
// 删除订单
router.post('/delOrder', function (req, res) {
    let userId = req.cookies.userId,
        orderId = req.body.orderId;
    if (userId) {
        if (orderId) {
            User.update({userId}, {
                $pull: {
                    'orderList': {
                        'orderId': orderId
                    }
                }
            }, (err, doc) => {
                if (err) {
                    res.json({
                        status: 1,
                        msg: err.message,
                        result: ''
                    })
                } else {
                    res.json({
                        status: 0,
                        msg: '',
                        result: 'suc'
                    });
                }
            })
        } else {
            res.json({
                status: 1,
                msg: '缺少订单号',
                result: ''
            })
        }
    } else {
        res.json({
            status: 1,
            msg: '未登录',
            result: ''
        })
    }
})

module.exports = router