const _require = eval("require");
const axios = _require("axios");
const configData = _require("./config");
const service = axios.create({
  timeout: 30000
});
service.interceptors.request.use(e => {
  e.url = (e?.opt?.head || (e?.opt?.isFile ? configData.baseUrlFile : configData.baseUrl)) + e.url;
  return e;
}, e => Promise.reject(e));
service.interceptors.response.use(e => {
  let {
    status: _,
    message: r
  } = e.data;
  return e.data;
}, e => Promise.reject(e));
module.exports = service;
