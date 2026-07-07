const _require = eval("require"),
  axios = _require("axios"),
  configData = _require("./config"),
  service = axios.create({ timeout: 3e4 });
(service.interceptors.request.use(
  (e) => (
    (e.url =
      (e?.opt?.head ||
        (e?.opt?.isFile ? configData.baseUrlFile : configData.baseUrl)) +
      e.url),
    e
  ),
  (e) => Promise.reject(e),
),
  service.interceptors.response.use(
    (e) => {
      let { status: _, message: r } = e.data;
      return e.data;
    },
    (e) => Promise.reject(e),
  ),
  (module.exports = service));
