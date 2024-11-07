const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const fs = require('fs').promises;

// Create a cookie jar and a global Axios client instance
const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

// Function to load cookies from a file
async function loadCookies() {
    try {
        const data = await fs.readFile('cookies.txt', 'utf8');
        const cookies = data.split('\n').filter(Boolean);
        console.log('Cookies loaded from file:', cookies);
        return cookies;
    } catch (error) {
        console.log('No cookies file found, fetching new cookies.');
        return [];
    }
}

// Function to save cookies to a file
async function saveCookies(cookies) {
    await fs.writeFile('cookies.txt', cookies.join('\n'), 'utf8');
    console.log('Cookies saved to file:', cookies);
}

// Function to decode the obfuscated string from the JS file
function decodeObfuscatedString(obfuscatedString) {
    const sanitizedString = obfuscatedString.replace(/\s+/g, ' ').trim();
    const match = sanitizedString.match(/self\[\s*_[^=]*=\s*String\.fromCharCode,p=parseInt,(.*?)\]\s*=\s*\((.*?)\);/s);

    if (!match || match.length < 3) {
        console.error("Invalid input format");
        return null;
    }

    const keyCode = match[1];
    const valueCode = match[2];

    const evalObfuscatedCode = (code) => {
        return eval(`(function(_=String.fromCharCode, p=parseInt) { return ${code}; })();`);
    };

    const decodedKey = evalObfuscatedCode(keyCode);
    const decodedValue = evalObfuscatedCode(valueCode);

    console.log("Decoded Key:", decodedKey);
    console.log("Decoded Value:", decodedValue);

    return { key: decodedKey, value: decodedValue };
}

// Function to fetch JS file content with specified headers
async function fetchJSFileContent(url,cookie) {
  try {
       const response = await axios.get(url, {
	headers: {
	  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
	  "accept-language": "en-US,en;q=0.7",
	  "cache-control": "max-age=0",
	  "priority": "u=0, i",
	  "sec-ch-ua": "\"Brave\";v=\"129\", \"Not=A?Brand\";v=\"8\", \"Chromium\";v=\"129\"",
	  "sec-ch-ua-mobile": "?0",
	  "sec-ch-ua-platform": "\"Linux\"",
	  "sec-fetch-dest": "document",
	  "sec-fetch-mode": "navigate",
	  "sec-fetch-site": "none",
	  "sec-fetch-user": "?1",
	  "sec-gpc": "1",
	  "upgrade-insecure-requests": "1",
	  "cookie": cookie
	},
	"referrerPolicy": "strict-origin-when-cross-origin",
	"body": null,
	"method": "GET"
	});
        console.log('Fetched JS file content successfully.');
        return response.data;
    } catch (error) {
        console.error('Error fetching JS file:', error);
      return null;
    }
}

// Main function to orchestrate the flow
async function getCookiesAndExtractKey(payload) {
    const url = 'https://libretranslate.com';
    const jsUrl = 'https://libretranslate.com/js/app.js?id=G-KPKM1EP5EW';
    const translateUrl = 'https://libretranslate.com/translate';
    try {
        console.log('Loading cookies...');
        let cookies = await loadCookies();

        if (cookies.length === 0) {
            console.log('Fetching cookies from URL:', url);
            await client.get(url);
            const fetchedCookies = jar.getCookiesSync(url);
            cookies = fetchedCookies.map(cookie => String(cookie).split(";")[0]);
            await saveCookies(cookies);
        } else {
            console.log('Cookies are already available.');
        }

        const cookieHeader = cookies.join("; ");
        client.defaults.headers.Cookie = cookieHeader;
        console.log('Using cookies for requests:', cookieHeader);
        console.log('Fetching JS file from URL:', jsUrl);
        const jsContent = await fetchJSFileContent(jsUrl,cookieHeader);
        if (jsContent) {
            const REQLINES = String("self[_=String.fromCharCode," +
                jsContent.split('self[_=String.fromCharCode,')[1].split(' },\n')[0]).trim();
            console.log(REQLINES)
            const extract = decodeObfuscatedString(REQLINES);
            payload.secret = Buffer.from(extract.value, 'base64').toString('utf-8');
            console.log('Extracted secret:', {extract});
            console.log('Updated payload with secret:', payload);
        }

        console.log('Payload for translation:', payload);
        const res = await client.post(translateUrl, JSON.stringify(payload), {
	  headers: {
	    'Content-Type': 'application/json',
	    'Cookie': cookieHeader,
	    'Origin': 'https://libretranslate.com',
	    'Priority': 'u=1, i',
	    'Referer': `${translateUrl}?source=${payload.source}&target=${payload.target}&q=${encodeURIComponent(payload.q)}`,
	    'Sec-CH-UA': '"Brave";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
	    'Sec-CH-UA-Mobile': '?0',
	    'Sec-CH-UA-Platform': '"Linux"',
	    'Sec-Fetch-Dest': 'empty',
	    'Sec-Fetch-Mode': 'cors',
	    'Sec-Fetch-Site': 'same-origin',
	    'Sec-GPC': '1'
	  },
	  responseType: 'json'
        });

        const jsonResponse = res.data;
        console.log('Translation response:', jsonResponse);
       return jsonResponse;
    } catch (error) {
        console.error('Error in getCookiesAndExtractKey:', error);
    }
}


// Example Payload
//const payload = {
//    q: "Hello, how are you doing?",
//    source: "auto",
//    target: "hi",
//    format: "text",
//    alternatives: 3,
//    api_key: "",
//    secret: ""
//};

module.exports = getCookiesAndExtractKey;
