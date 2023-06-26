const express = require("express");
const bodyParser = require("body-parser");
const iconv = require("iconv-lite");
const modifyConfig = require("../utils/conf");
const path=require('path');
const dogcomPath=path.join(__dirname,'../assets/dogcom/dogcom');
const confPath=path.join(__dirname,'../assets/dogcom/d.conf');

const app = express();
const port = 3000;
let currentCookie = "";
let email = "";
let mac = "";
let fetch;
import("node-fetch").then((nodeFetch) => {
  fetch = nodeFetch.default;
});

app.use(express.static("public"));
app.use(bodyParser.json());

app.get("/get-cookie-and-captcha", async (req, res) => {
  try {
    await import("node-fetch").then((nodeFetch) => {
      fetch = nodeFetch.default;
    });
    const cookieResponse = await fetch("https://ip.jlu.edu.cn/pay/", {
      credentials: "include",
    });

    const rawHeaders = cookieResponse.headers.raw();
    const cookie = rawHeaders["set-cookie"] ? rawHeaders["set-cookie"][0] : "";
    currentCookie = cookie.match(/PHPSESSID=[^;]+/)[0];

    const captchaResponse = await fetch(
      "https://ip.jlu.edu.cn/pay/img_safecode.php",
      {
        headers: {
          Cookie: cookie,
        },
      }
    );

    const buffer = await captchaResponse.buffer();
    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .send("An error occurred while fetching cookie and captcha.");
  }
});

app.post("/submit-login", async (req, res) => {
  try {
    const { card, pwd, imgcode } = req.body;

    await import("node-fetch").then((nodeFetch) => {
      fetch = nodeFetch.default;
    });
    const loginPost = await fetch("https://ip.jlu.edu.cn/pay/index.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://ip.jlu.edu.cn",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 Edg/114.0.1823.58",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        Cookie: currentCookie,
      },
      body: `menu=chklogin&card=${card}&pwd=${pwd}&imgcode=${imgcode}`,
    });
    const loginResponse = await fetch(
      "https://ip.jlu.edu.cn/pay/index.php?menu=menu",
      {
        headers: {
          Cookie: currentCookie,
        },
      }
    );
    const loginHtml = await loginResponse.arrayBuffer();
    const decodedLoginHtml = iconv.decode(Buffer.from(loginHtml), "GBK");
    const infoResponse = await fetch("https://ip.jlu.edu.cn/pay/info.php", {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "cache-control": "max-age=0",
        "sec-ch-ua":
          '"Not.A/Brand";v="8", "Chromium";v="114", "Microsoft Edge";v="114"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1",
        cookie: currentCookie,
        Referer: "https://ip.jlu.edu.cn/pay/menu_list_mobile.php",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: null,
      method: "GET",
    });
    const infoHtml = await infoResponse.arrayBuffer();
    const decodedinfoHtml = iconv.decode(Buffer.from(infoHtml), "GBK");

    const ipRegex = /ip=(\d+\.\d+\.\d+\.\d+)/;
    const [, ip] = decodedinfoHtml.match(ipRegex) || ["", ""];

    const detailsResponse = await fetch(
      `https://ip.jlu.edu.cn/pay/info.php?menu=info&ip=${ip}`,
      {
        headers: {
          Cookie: currentCookie,
        },
      }
    );
    const detailsHtml = await detailsResponse.arrayBuffer();
    const decodedText = iconv.decode(Buffer.from(detailsHtml), "GBK");

    const macRegex = /p1>([a-zA-Z0-9]{12})/;
    const emailRegex = /([a-zA-Z0-9._%+-]+)@/;

    mac = decodedText.match(macRegex)[1] || "";
    email = decodedText.match(emailRegex)[1] || "";

    res.json({ ip, mac });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .send(
        "An error occurred while processing login and fetching information."
      );
  }
});

app.post("/login", async (req, res) => {
  try {
    const emailpwd = req.body.emailpwd;
    modifyConfig(email, emailpwd, mac);
    const childProcess = require("child_process");

    childProcess.exec(dogcomPath + " -m dhcp -c " + confPath, function (
      error,
      stdout,
      stderr
    ) {
      if (error) {
        console.log(error.stack);
        console.log("Error code: " + error.code);
        console.log("Signal received: " + error.signal);
        res.status(500).send("An error occurred while login.");
      }
      console.log("stdout: " + stdout);
      console.log("stderr: " + stderr);
      res.json({ message: "login success" });
    }
    );
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .send(
        "An error occurred while processing login and fetching information."
      );
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
