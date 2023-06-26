const path = require('path');
const fs = require('fs');

const confPath=path.join(__dirname,'../assets/dogcom/d.conf');
const configFileContent = fs.readFileSync(confPath, 'utf-8');

function readConfFile(filepath) {
  //const content = fs.readFileSync(filepath, "utf8");
  const content = configFileContent;
  const lines = content.split("\n");
  const config = {};

  lines.forEach((line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      config[key.trim()] = value.trim();
    }
  });

  return config;
}

function writeConfFile(filepath, config) {
  const content = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  fs.writeFileSync(filepath, content);
}

console.log(confPath);
// 读取配置文件
const config = readConfFile(confPath);
console.log("Original config:", config);

// 修改配置
function modifyConfig(email, password, mac) {
  config["username"] = "'" + email + "'";
  config["password"] = "'" + password + "'";
  config["mac"] ="0x"+mac;
  // 保存修改后的配置
  writeConfFile(confPath, config);

  // 重新读取配置文件以验证更改已保存
  const updatedConfig = readConfFile(confPath);
  console.log("Updated config:", updatedConfig);
}
module.exports = modifyConfig;