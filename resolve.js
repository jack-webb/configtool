
/**
 * The parameters used to get different variations of your JSON. 
 * The key is the parameter name, the list are the values for the dropdown
 */
exports.getFileParameters = async function (req) {
  return {
    version: [1, 2, 3],
    environment: ["linux", "mac", "windows"],
  }
};

/**
 * Resolve the URL for the config to be edited, using the parameters from 
 * the dropdowns (or any other parameters/logic you want)
 */
exports.resolveConfigUrl = async function (params) {
  const { version, environment } = params;

  const url = `https://example.me/myFile-v${version}-${environment}.json`

  return url;
};