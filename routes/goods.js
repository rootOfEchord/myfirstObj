let router = require('express').Router();
//数据库链接模块
let connection = require('./sql_Conne.js');

//增加分类路由
router.post('/addSoft', (req, res) => {
    let { cg_fatherID, cg_name, cg_isLocked } = req.body;
    //执行sql语句
    let sqlStr = `insert into categorygoods(cg_fatherID,cg_name,cg_isLocked) values(?,?,?)`;
    let sqlArr = [cg_fatherID, cg_name, cg_isLocked];
    connection.query(sqlStr, sqlArr, (err, result) => {
        if (err) throw err;
        if (result.affectedRows > 0) {
            res.send({ isOk: true, msg: '添加成功' })
        } else {
            res.send({ isOk: false, msg: '添加失败' })
        }
    });
});
//获取分类路由
router.get('/getSoftList', (req, res) => {
    let sqlStr = 'select cg_id,cg_name from categorygoods order by cg_id desc';
    connection.query(sqlStr, (err, result) => {
        res.send(result);
    });
});
//获取含有父级分类的 分类列表
router.get('/getSoft', (req, res) => {
    let sqlStr = 'select t1.*,t2.cg_name as father_name from categorygoods as t1 left join categorygoods as t2 on t1.cg_fatherID=t2.cg_id'
    connection.query(sqlStr, (err, softDate) => {
        res.send(softDate);
    })
});
//通过id得到一个分类路由
router.get('/getOneSoft', (req, res) => {
    let id = req.query.id;
    connection.query('select * from categorygoods where cg_id=?', [id], (err, softDate) => {
        res.send(softDate);
    })
})
//修改分类路由
router.post('/edit_soft', (req, res) => {
    let { cg_fatherID, cg_name, cg_isLocked, cg_id } = req.body;

    //执行sql语句
    let sqlStr = `update categorygoods set cg_fatherID=?,cg_name=?,cg_isLocked=? where cg_id=? `;
    connection.query(sqlStr, [cg_fatherID, cg_name, cg_isLocked, cg_id], (err, result) => {
        if (err) throw err;
        if (result.affectedRows > 0) {
            res.send({ isOk: true, msg: '修改成功' })
        } else {
            res.send({ isOk: false, msg: '修改失败' })
        }
    });
});


//增加商品路由
router.post('/addGoods', (req, res) => {
    let { cg_id, barCode, goodsName, salePrice, marketPrice, goodsPrice, stockNum, weigth, unit, discount, promotion, goodsDetails } = req.body;
    //执行sql语句
    let sqlStr = `insert into goodstable(cg_id, barCode, goodsName, salePrice, marketPrice,  goodsPrice, stockNum, weigth,unit, discount, promotion,goodsDetails) values(?,?,?,?,?,?,?,?,?,?,?,?)`;
    let sqlArr = [cg_id, barCode, goodsName, salePrice, marketPrice, goodsPrice, stockNum, weigth, unit, discount, promotion, goodsDetails];
    connection.query(sqlStr, sqlArr, (err, result) => {
        if (err) throw err;
        if (result.affectedRows > 0) {
            res.send({ isOk: true, msg: '添加成功' })
        } else {
            res.send({ isOk: false, msg: '添加失败' })
        }
    });
});
//得到商品列表
router.get('/getGoods', (req, res) => {
    let { currentPage, pageSize } = req.query;
    let sqlStr = 'select t1.*,t2.cg_name from goodstable as t1 LEFT JOIN categorygoods as t2 on t1.cg_id=t2.cg_id  limit ?,?';
    let sqlArr = [(currentPage - 1) * pageSize, parseInt(pageSize)]
    connection.query(sqlStr, sqlArr, (err, data) => {
        if (err) throw err;
        res.send(data);
    });
});
//增加库存
router.post('/addStock', (req, res) => {
    let { barcode, stockNum, goodsPrice } = req.body;
    connection.query('update goodstable set stocknum = stocknum+? where barcode=?', [stockNum, barcode], (err, result) => {
        if (err) throw err;
        if (result.affectedRows > 0) {
            res.send({ isOk: true, msg: '添加成功' })
        } else {
            res.send({ isOk: false, msg: '添加失败' })
        }
    })
});
//得到商品总条数
router.get('/getGoodsLength', (req, res) => {
    connection.query('select good_id from goodstable', (err, result) => {
        res.send({ 'total': result.length });
    })
});
//通过条形码的到一个商品路由
router.post('/getOneGood', (req, res) => {
    let barcode = req.body.barcode;
    //同过条形码找到该条数据的名字和售价并发给前端
    connection.query('select goodsname,saleprice from goodstable where barcode=?', [barcode], (err, result) => {
        if (err) throw err;
        res.send(result);
    })
});
//购物/出库路由
router.post('/shop', (req, res) => {
    let { barcode, saelNum } = req.body;
    connection.query('update goodstable set saleNum = saleNum + ? where barcode = ?', [parseInt(saelNum), barcode], (err, result) => {
        if (result.affectedRows > 0) {
            res.send({ 'isOk': true });
        } else {
            res.send({ 'isOk': false });
        }
    });

});
//搜索商品路由
router.post('/search', (req, res) => {
    let { soft, keyWords } = req.body;
    let sqlStr = "select t1.*,t2.cg_name from goodsTable as t1 left join categorygoods as t2 on t1.cg_id=t2.cg_id where 1=1";
    //如果存在keywords 就在sqlstr后面拼接
    if (keyWords.length > 0) {
        sqlStr += ` and (t1.barcode like '%${keyWords}%' or t1.goodsname like '%${keyWords}%')`;
    }
    //如果存在soft 就在sqlstr后面拼接
    if(soft.length>0){
        sqlStr+=` and t1.cg_id=${soft}`;
    }
    //执行查询语句
    connection.query(sqlStr,(err,result)=>{
        if(err)  throw err ;
        res.send(result);
    })
});
//渲染首页的内容
router.get('/getIndexInfo',(req,res)=>{
    connection.query('select goodsname,saleNum from goodstable order by saleNum desc',(err,result)=>{
        if(err) throw err;
        let goodsList1 = result;
        connection.query('select goodsname,stockNum from goodstable order by stockNum asc',(err,result)=>{
            if(err) throw err;
            res.send({'goodsList1': goodsList1,'goodsList2': result});
        });
    });
    
})



















module.exports = router;