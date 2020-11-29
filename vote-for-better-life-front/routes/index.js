const express = require('express');
const fs = require("fs");
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    fs.readFile(__dirname + "/../views/index.html", "utf8", (error, data) => {
        if(error) {
            console.log("index 파일 읽기 오류");
            console.log(error);
            res.writeHead(500);
            res.end("서버 페이지 렌더링 오류");
        } else {
            console.log(data);
            res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
            res.end(data, "utf-8");
        }
    });
});

module.exports = router;
