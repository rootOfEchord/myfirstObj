var express = require('express');
var router = express.Router();
//引入地区数据模块
let area = require('../public/js/area');
//加密模块
let crypto = require('crypto');
//数据库链接模块
let connection = require('./sql_Conne.js');

//验证登录
router.post('/verifyUser', (req, res) => {
	let { userName, userPwd } = req.body;
	//将密码加密
	userPwd = crypto.createHash('md5').update(userPwd).digest('hex');
	//执行sql指令
	let sqlStr = 'select id,userGroup from userInfo where userName=? and userPwd=?';
	connection.query(sqlStr, [userName, userPwd], (err, data) => {
		if (err) throw err;
		if (data.length > 0) {
			//登录成功写入cookie
			console.log(data)
			res.cookie('userName', userName);
			res.cookie('userId', data[0].id);
			res.cookie('group', data[0].userGroup);
			res.send({ isOk: true, msg: '登录成功' });
		} else {
			res.send({ isOk: false, msg: '登录失败请检查' });
		}
	});
});
//用户权限
router.get('/getHtmlText',(req,res)=>{
	let group = req.cookies.group;
	console.log(group)
	if(group === "超级管理员"){
		let htmlText = `<el-submenu index="6" ref="order">
							<template slot="title">
								<span>账号管理</span>
							</template>
							<el-menu-item index="6-1"><a href="/user_list.html" target="mainContent">账号管理</a></el-menu-item>
							<el-menu-item index="6-2"><a href="/add_manage_account.html" target="mainContent">添加账号</a></el-menu-item>
							<el-menu-item index="6-3"><a href="/edit_password.html" target="mainContent">修改密码</a></el-menu-item>
						</el-submenu>`;
		res.send({ htmlText})
	}else{
		let htmlText = `<el-submenu index="6" ref="order">
							<template slot="title">
								<span>账号管理</span>
							</template>
							<el-menu-item index="6-3"><a href="/edit_password.html" target="mainContent">修改密码</a></el-menu-item>
						</el-submenu>`;
		res.send({htmlText})
	}
})
//退出登录
router.get('/lognOut', (req, res) => {
	res.clearCookie('userName');
	res.clearCookie('userId');
	res.clearCookie('group');
	res.redirect('/lognin.html');
});
//防火墙
router.get('/checkUser', (req, res) => {
	// let a= req.cookies('userName');
	if (!req.cookies.userName) {
		res.send("alert('请登录');location.href = '/lognin.html';")
	} else {
		res.send('');
	}

});
//获取当前用户信息
router.get('/getUserInfo', (req, res) => {
	res.send(req.cookies);
});
//修改当前用户密码
router.post('/editPwd', (req, res) => {
	let { id, oldPwd, newPwd } = req.body;
	//验证原密码是否正确
	oldPwd = crypto.createHash('md5').update(oldPwd).digest('hex');
	connection.query('select * from userInfo where id=? and userPwd=?', [id, oldPwd], (err, result) => {
		if (err) throw err;
		//如果正确就该密码
		if (result.length > 0) {
			newPwd = crypto.createHash('md5').update(newPwd).digest('hex');
			let sqlStr = `update userInfo set userpwd=? where id=? `;
			connection.query(sqlStr, [newPwd, id], (err, result) => {
				if (err) throw err;
				if (result.affectedRows > 0) {
					res.clearCookie('userName');
					res.clearCookie('userId');
					res.clearCookie('group');
					res.send({ isOk: true, msg: '修改成功' });
				} else {
					res.send({ isOk: false, msg: '修改失败' });
				}
			});
		} else {//密码错误
			res.send({ isOk: false, msg: '原密码错误请检查' });
		}


	})

});

//增加管理员账号路由
router.post('/addManageAccount', (req, res) => {
	let { userName, pass, userGroup } = req.body;
	//加密密码
	pass = crypto.createHash('md5').update(pass).digest('hex');
	//执行sql语句
	let sqlStr = `insert into userinfo(username,userpwd,usergroup) values(?,?,?)`;
	let sqlArr = [userName, pass, userGroup];
	connection.query(sqlStr, sqlArr, (err, result) => {
		if (err) throw err;
		if (result.affectedRows > 0) {
			res.send({ isOk: true, msg: '添加成功' })
		} else {
			res.send({ isOk: false, msg: '添加失败' })
		}
	});
});
//获取管理员列表路由
router.get('/getUserList', (req, res) => {
	connection.query('select * from userInfo order by id desc', (err, userList) => {
		if (err) throw err;
		res.send(userList);
	});
});
//删除管理员账号路由 
router.get('/delUser/:u_id', (req, res) => {
	//获取用户id
	let u_id = req.params.u_id;
	//执行sql语句删除该用户
	connection.query('delete from userInfo where id=' + u_id, (err, result) => {
		if (err) throw err;
		if (result.affectedRows > 0) {
			res.send({ isOk: true, msg: '删除成功' })
		} else {
			res.send({ isOk: false, msg: '删除失败' })
		}
	})
});
//修改管理员账号
router.post('/editManageAccount', (req, res) => {
	let { userName, pass, userGroup, id, oldPwd } = req.body;
	if (pass !== oldPwd) {
		//加密密码
		pass = crypto.createHash('md5').update(pass).digest('hex');
	}

	//执行sql语句
	let sqlStr = `update userInfo set username=?,userpwd=?,usergroup=? where id=? `;
	connection.query(sqlStr, [userName, pass, userGroup, id], (err, result) => {
		if (err) throw err;
		if (result.affectedRows > 0) {
			res.send({ isOk: true, msg: '修改成功' })
		} else {
			res.send({ isOk: false, msg: '修改失败' })
		}
	});
});
//通过id获取该条管理员数据
router.get('/getDataById', (req, res) => {
	id = req.query.id;
	connection.query('select * from userInfo where id=?', [id], (err, data) => {
		if (err) throw err;
		res.send(data);
	})
});


//给vipadd页面发地区数据
router.post('/getArea', (req, res) => {
	res.send(area);
});
//发送vip列表给前端
router.get('/getVipList', (req, res) => {
	connection.query('select * from vipInfo order by vip_id desc', (err, userList) => {
		if (err) throw err;
		res.send(userList);
	});
});
//增加vip用户路由
router.post('/addVip', (req, res) => {
	let { realName, vipCard, userGroup, idNum, userStatus, phone, zuoPhone, email, address, postCode, diquStr } = req.body;
	console.log(000)
	let sqlStr = `insert into vipinfo(realName,vipCard,userGroup,idNum,userStatus,phone,zuoPhone,email,address,diqu) values(?,?,?,?,?,?,?,?,?,?)`;
	let sqlArr = [realName, vipCard, userGroup, idNum, userStatus, phone, zuoPhone, email, address, diquStr];
	//执行sql语句
	console.log(111)
	connection.query(sqlStr, sqlArr, (err, result) => {
		if (err) throw err;
		if (result.affectedRows > 0) {
			res.send({ isOk: true, msg: '添加成功' })
		} else {
			res.send({ isOk: false, msg: '添加失败' })
		}
	})
});
//vip页面搜索路由
router.get('/vipSerch', (req, res) => {
	let keyWords = req.query.user;
	let sqlStr = 'select * from vipinfo WHERE realName like ? OR vipCard like ? or phone like ? or zuophone like ?';
	//名字采用模糊查询 ,  卡号,电话,座机 采用全字符查询
	connection.query(sqlStr, ['%' + keyWords + '%', keyWords, keyWords, keyWords], (err, data) => {
		if (err) throw err;
		res.send(data);
	})
});


module.exports = router;
